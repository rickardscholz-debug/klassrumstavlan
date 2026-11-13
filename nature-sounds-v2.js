
(()=>{
'use strict';
// Real field recordings from Wikimedia Commons, with on-screen credits.
// Crossfading two media elements avoids an abrupt restart without holding large audio buffers in RAM.
const tracks=[
{key:'leaves',emoji:'🍃',name:'Löv och skog',file:'20090610 0 ambience.ogg',artist:'nille',license:'Public domain',dur:'2:03',desc:'Skog, vind och löv'},
{key:'wind',emoji:'🌲',name:'Vind i träden',file:'20090610 0 ambience.ogg',artist:'nille',license:'Public domain',dur:'2:03',desc:'Naturlig skogsvind'},
{key:'rain',emoji:'🌧️',name:'Regn',file:'Sound of light rainfall.ogg',artist:'Mijesty',license:'CC BY-SA 4.0',dur:'1:00',desc:'Riktigt regn'},
{key:'stream',emoji:'💦',name:'Porlande bäck',file:'Brook.ogg',artist:'Onegoodtune',license:'CC BY-SA 3.0',dur:'25:52',desc:'Lång fältinspelning'},
{key:'waves',emoji:'🌊',name:'Vågskvalp',file:'Waves.ogg',artist:'Dsw4',license:'Public domain',dur:'4:47',desc:'Naturliga vågor'},
{key:'birds',emoji:'🐦',name:'Fågelkvitter',file:'Birds shouting in the Spandauer Forst (Berlin-Spandau).ogg',artist:'Leonhard Lenz',license:'CC BY-SA 4.0',dur:'2:48',desc:'Fåglar i skogen'},
{key:'thunder',emoji:'⛈️',name:'Regn och åska',file:'Rhumphries - rbh-thunder-storm.ogg',artist:'RHumphries',license:'CC BY 3.0',dur:'3:30',desc:'Äkta åskväder'},
{key:'fire',emoji:'🔥',name:'Brasa',file:'Fire burning.ogv',artist:'Zouavman Le Zouave',license:'CC BY-SA',dur:'0:11',desc:'Inspelad eld, kort klipp'},
{key:'night',emoji:'🌙',name:'Skogsatmosfär',file:'20090610 0 ambience.ogg',artist:'nille',license:'Public domain',dur:'2:03',desc:'Skogsljud med fåglar'},
{key:'breeze',emoji:'🌬️',name:'Vind',file:'Howling wind.ogg',artist:'Tvabutzku1234',license:'CC0',dur:'2:08',desc:'Vind som viner'}
];
const old=document.getElementById('natureSounds');if(old)old.remove();
const panel=document.createElement('aside');panel.id='natureSounds';
panel.innerHTML='<div class="nsHead"><h2>🎧 Sounds – naturinspelningar</h2><button type="button" id="nsClose" aria-label="Stäng">×</button></div><p style="padding:0 20px">Riktiga inspelningar i stället för konstgjort brus. Ljuden spelas länge och går över i nästa varv med mjuk övertoning.</p><div class="nsList" id="nsList"></div><div class="nsControls"><button type="button" id="nsPlay">▶ Spela</button><button type="button" id="nsStop">■ Stoppa</button><label for="nsVolume">Volym</label><input id="nsVolume" type="range" min="0" max="100" value="35"></div><div id="nsStatus" class="nsStatus" role="status">Välj ljud och klicka på Spela.</div><div id="nsCredit" style="padding:12px 20px;font-size:12px;line-height:1.6"></div><p style="padding:0 20px;color:#64748b;font-size:12px">Kräver internetuppkoppling. Under övertoningen spelas två delar av samma inspelning samtidigt. Klicka på källan för upphovsperson och licens.</p>';
document.body.appendChild(panel);
document.getElementById('nsClose').onclick=()=>panel.classList.remove('open');
const tool=[...document.querySelectorAll('#toolbar .tool')].find(el=>el.textContent.includes('Sounds'));
if(tool)tool.onclick=()=>{panel.classList.add('open');if(typeof closeBackgrounds==='function')closeBackgrounds()};
let chosen=localStorage.getItem('klassrum-nature-sound')||'waves';
if(!tracks.some(t=>t.key===chosen))chosen='waves';
let volume=Math.max(0,Math.min(1,Number(localStorage.getItem('klassrum-nature-volume')||35)/100));
let playing=false,players=[],timer=null,fade=null,primary=0,loading=false;
const list=document.getElementById('nsList'),status=document.getElementById('nsStatus'),play=document.getElementById('nsPlay'),vol=document.getElementById('nsVolume');
vol.value=String(Math.round(volume*100));
const fileURL=name=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(name);
const sourceURL=name=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name).replaceAll('%20','_');
function chosenTrack(){return tracks.find(t=>t.key===chosen)}
function credits(){
const t=chosenTrack(),href=sourceURL(t.file);
document.getElementById('nsCredit').innerHTML='Inspelning: '+t.artist+' · '+t.license+' · <a href="'+href+'" target="_blank" rel="noopener noreferrer">Källa och licens på Wikimedia Commons</a>';
}
function refresh(){list.querySelectorAll('.nsItem').forEach(el=>el.classList.toggle('active',el.dataset.key===chosen));credits()}
tracks.forEach(t=>{
const b=document.createElement('button');b.className='nsItem';b.type='button';b.dataset.key=t.key;
b.innerHTML='<span>'+t.emoji+'</span><strong>'+t.name+'</strong><small>'+t.dur+' · '+t.desc+'</small>';
b.onclick=()=>{chosen=t.key;localStorage.setItem('klassrum-nature-sound',chosen);refresh();if(playing)start();else status.textContent='Valt: '+t.name};list.appendChild(b);
});refresh();
function clearAll(){
if(timer){clearInterval(timer);timer=null}
if(fade){clearInterval(fade);fade=null}
for(const p of players){p.pause();p.removeAttribute('src');p.load()}
players=[];loading=false;playing=false;primary=0;
}
function stop(){clearAll();play.textContent='▶ Spela';status.textContent='Stoppat'}
function crossfade(){
if(players.length!==2||fade||!playing)return;
const first=players[primary],second=players[1-primary],length=6;
if(!Number.isFinite(first.duration)||first.duration<=length+2)return;
if(first.currentTime<first.duration-length-.25)return;
second.currentTime=0;second.volume=0;
const promise=second.play();
if(promise&&promise.catch)promise.catch(()=>{status.textContent='Övertoningen kunde inte starta. Kontrollera uppkopplingen.'});
let started=performance.now();
fade=setInterval(()=>{
let progress=Math.min(1,(performance.now()-started)/(length*1000));
first.volume=Math.cos(progress*Math.PI/2)*volume;
second.volume=Math.sin(progress*Math.PI/2)*volume;
if(progress>=1){clearInterval(fade);fade=null;first.pause();first.currentTime=0;primary=1-primary}
},70);
}
function start(){
clearAll();playing=true;loading=true;play.textContent='⏸ Pausa';
const track=chosenTrack();
status.textContent='Laddar inspelningen '+track.name+'…';
players=[new Audio(),new Audio()];const url=fileURL(track.file);
for(const p of players){p.preload='auto';p.src=url;p.volume=0;p.loop=false}
players[0].volume=volume;
players[0].addEventListener('playing',()=>{loading=false;if(playing)status.textContent='Spelar '+track.name+' · '+track.dur+' före övertoning'},{once:true});
players[0].addEventListener('error',()=>{if(playing)status.textContent='Kunde inte läsa ljudfilen från Wikimedia Commons. Prova ett annat ljud.'},{once:true});
players[1].addEventListener('error',()=>{if(playing)status.textContent='Kunde inte ladda nästa del av ljudet.'},{once:true});
const p=players[0].play();
if(p&&p.catch)p.catch(()=>{if(playing)status.textContent='Uppspelningen kunde inte starta. Kontrollera uppkopplingen.'});
timer=setInterval(crossfade,250);
}
play.onclick=()=>{if(playing)stop();else start()};
document.getElementById('nsStop').onclick=stop;
vol.oninput=()=>{volume=Number(vol.value)/100;localStorage.setItem('klassrum-nature-volume',vol.value);if(playing){if(fade)return;players[primary].volume=volume;}};
window.addEventListener('pagehide',stop);
})();
