
(() => {
'use strict';
const CSS=`

#natureSounds{display:none;position:fixed;top:0;right:0;height:100vh;width:min(440px,100vw);overflow:auto;background:#fff;box-shadow:-6px 0 35px #0003;z-index:21000;color:#172033}
#natureSounds.open{display:block}
.nsHead{position:sticky;top:0;background:white;padding:20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;z-index:2}
.nsHead h2{margin:0}.nsHead button{border:1px solid #ddd;border-radius:50%;width:38px;height:38px;background:white;font-size:24px;cursor:pointer}
.nsList{padding:15px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.nsItem{padding:14px 10px;background:#f5f7fa;border:1px solid #ddd;border-radius:14px;cursor:pointer;text-align:left;color:#172033}
.nsItem.active{border:2px solid #3485c5;background:#eaf5ff}.nsItem span{display:block;font-size:26px;margin-bottom:7px}.nsItem small{display:block;margin-top:5px;color:#657184}
.nsControls{display:flex;align-items:center;gap:12px;padding:10px 20px;flex-wrap:wrap}
.nsControls button{border:0;border-radius:10px;padding:12px;background:#235581;color:#fff;cursor:pointer}
.nsControls input{width:120px}.nsStatus{padding:12px 20px;color:#64748b}
#motionGrid .bgCard{background-size:100% 100%;animation:nsPreview 6s ease-in-out infinite alternate}
#motionGrid .bgCard:nth-child(2n){animation-direction:alternate-reverse}
@keyframes nsPreview{to{background-size:120% 120%;filter:saturate(1.15)}}
`;
const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
const toolbar=document.querySelector('#toolbar');
const soundTool=document.createElement('button');soundTool.className='tool';soundTool.type='button';
soundTool.innerHTML='<span class="toolIcon">🎧</span><span class="toolText">Sounds</span>';
soundTool.onclick=()=>{document.querySelector('#natureSounds').classList.add('open');if(typeof closeBackgrounds==='function')closeBackgrounds()};
toolbar.insertBefore(soundTool,toolbar.lastElementChild);
const sounds=document.createElement('aside');sounds.id='natureSounds';
sounds.innerHTML='<div class="nsHead"><h2>🎧 Sounds</h2><button type="button" id="nsClose" aria-label="Stäng">×</button></div><p style="padding:0 20px">Loopade naturljud för lugn och arbetsro. Ljud startar först när du klickar Spela.</p><div class="nsList" id="nsList"></div><div class="nsControls"><button id="nsPlay">▶ Spela</button><button id="nsStop">■ Stoppa</button><label for="nsVolume">Volym</label><input id="nsVolume" type="range" min="0" max="100" value="35"></div><div class="nsStatus" id="nsStatus">Välj ett ljud.</div>';
document.body.appendChild(sounds);
document.querySelector('#nsClose').onclick=()=>sounds.classList.remove('open');
const choices=[
['🍃','Rasslande löv','leaves'],['🌲','Vind i träden','wind'],['🌧️','Regn','rain'],['💦','Porlande bäck','stream'],['🌊','Vågskvalp','waves'],
['🐦','Fågelkvitter','birds'],['⛈️','Åska långt bort','thunder'],['🔥','Brasa','fire'],['🌙','Nattljud','night'],['🌬️','Mjuk bris','breeze']
];
let chosen=localStorage.getItem('klassrum-nature-sound')||'waves';
let volume=Number(localStorage.getItem('klassrum-nature-volume')||35)/100;
const volInput=document.querySelector('#nsVolume');volInput.value=String(Math.round(volume*100));
let ctx=null,source=null,filter=null,gain=null,lfo=null,lfoGain=null,interval=null,playing=false;
const choiceList=document.querySelector('#nsList');
function refresh(){choiceList.querySelectorAll('.nsItem').forEach(b=>b.classList.toggle('active',b.dataset.key===chosen))}
choices.forEach(([emoji,name,key])=>{
const b=document.createElement('button');b.className='nsItem';b.type='button';b.dataset.key=key;
b.innerHTML='<span>'+emoji+'</span><strong>'+name+'</strong><small>Loopat naturljud</small>';choiceList.appendChild(b);
b.onclick=()=>{chosen=key;localStorage.setItem('klassrum-nature-sound',key);refresh();if(playing)start();else document.querySelector('#nsStatus').textContent='Valt: '+name};
});refresh();
function stopNodes(){
if(interval){clearInterval(interval);interval=null}
for(const n of [source,lfo]){try{n?.stop()}catch(e){}try{n?.disconnect()}catch(e){}}
for(const n of [filter,gain,lfoGain]){try{n?.disconnect()}catch(e){}}
source=filter=gain=lfo=lfoGain=null;
}
function chirp(){
if(!ctx||!gain)return;
const osc=ctx.createOscillator(),env=ctx.createGain(),now=ctx.currentTime;
osc.type='sine';osc.frequency.setValueAtTime(1000+Math.random()*900,now);osc.frequency.exponentialRampToValueAtTime(550+Math.random()*700,now+.14);
env.gain.setValueAtTime(0.0001,now);env.gain.exponentialRampToValueAtTime(.11,now+.015);env.gain.exponentialRampToValueAtTime(.0001,now+.26);
osc.connect(env);env.connect(gain);osc.start(now);osc.stop(now+.28);
}
function start(){
stopNodes();
const AC=window.AudioContext||window.webkitAudioContext;
if(!AC){document.querySelector('#nsStatus').textContent='Ljud stöds inte i den här webbläsaren.';return}
ctx=ctx||new AC();ctx.resume();
const length=ctx.sampleRate*4,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
let v=0;for(let i=0;i<length;i++){const white=Math.random()*2-1;v=(v+white*.035)/1.035;data[i]=.75*white+.6*v}
source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
filter=ctx.createBiquadFilter();filter.type=['waves','wind','leaves','breeze'].includes(chosen)?'lowpass':'bandpass';
const hz={leaves:2100,wind:530,rain:4100,stream:1500,waves:900,birds:1000,thunder:130,fire:2500,night:750,breeze:320};
filter.frequency.value=hz[chosen];filter.Q.value=.38;
gain=ctx.createGain();gain.gain.value=volume*.28;
source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
lfo=ctx.createOscillator();lfo.type='sine';lfo.frequency.value={waves:.11,wind:.08,leaves:.38,rain:.03,stream:.22,birds:.07,thunder:.045,fire:1.2,night:.09,breeze:.06}[chosen];
lfoGain=ctx.createGain();lfoGain.gain.value=chosen==='waves'?.12:chosen==='wind'?.08:.035;
lfo.connect(lfoGain);lfoGain.connect(gain.gain);lfo.start();source.start();
if(chosen==='birds'||chosen==='night'){interval=setInterval(()=>{if(Math.random()>.25)chirp()},chosen==='birds'?950:4200)}
playing=true;document.querySelector('#nsPlay').textContent='⏸ Pausa';
document.querySelector('#nsStatus').textContent='Spelar: '+choices.find(x=>x[2]===chosen)[1]+' · loop';
}
function stop(){stopNodes();playing=false;document.querySelector('#nsPlay').textContent='▶ Spela';document.querySelector('#nsStatus').textContent='Stoppat'}
document.querySelector('#nsPlay').onclick=()=>playing?stop():start();
document.querySelector('#nsStop').onclick=stop;
volInput.oninput=()=>{volume=Number(volInput.value)/100;localStorage.setItem('klassrum-nature-volume',volInput.value);if(gain)gain.gain.value=volume*.28};
window.addEventListener('pagehide',stop);

const bgPanel=document.querySelector('#backgroundPanel');

const sec=document.createElement('section');
sec.className='bgSection';
sec.id='realVideoBackgroundSection';
sec.innerHTML='<div class="bgSectionTitle">Riktiga rörliga naturfilmer</div><p class="bgHint">Film från verkliga miljöer · ljudlös video · upprepas automatiskt. Internet krävs.</p><div class="bgGrid" id="realVideoGrid"></div>';
bgPanel.insertBefore(sec,bgPanel.querySelector('.bgSection'));
const imageSection=document.createElement('section');imageSection.className='bgSection';
imageSection.innerHTML='<div class="bgSectionTitle">Fler naturfotografier</div><div class="bgGrid" id="photoPlusGrid"></div>';
bgPanel.insertBefore(imageSection,sec.nextSibling);
const photoIds=['1507525428034-b723cf961d3e','1518837695005-2083093ee35b','1470770841072-f978cf4d019e','1500534623283-312aade485b7','1464822759023-fed622ff2c3b','1475924156734-496f6cac6ec1','1448375240586-882707db888b','1473448912268-2022ce9509d8','1497436072909-60f362e1d4b1','1483664852095-d6cc6870702d','1500375592092-40eb2168fd21','1470071459604-3b5ec3a7fe05','1441974231531-c6227db76b6e','1534088568595-a066f410bcda','1433086966358-54859d0ed716','1454496522488-7a8e488e860e','1514282401047-d79a71a590e8','1426604966848-d7adac402bff','1501854140801-50d01698950b','1439853949212-09789ba454d5'];
const names=['Tropiskt hav','Ocean','Sjö','Solnedgång','Berg','Kust','Skog','Grönska','Skymning','Vinter','Havsvågor','Dalgång','Skogsljus','Moln','Vattenfall','Fjäll','Turkost hav','Lövverk','Landskap','Havsutsikt'];
photoIds.forEach((id,i)=>{const img='https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=2200&q=85';
const b=document.createElement('button');b.className='bgCard';b.type='button';b.style.backgroundImage='url("https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=400&q=65")';b.innerHTML='<span class="bgLabel">'+names[i]+'</span>';b.onclick=()=>{stopVideo();setBackground(img)};document.querySelector('#photoPlusGrid').appendChild(b)});

const videoStyle=document.createElement('style');
videoStyle.textContent='#realNatureVideo{position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;object-position:center;z-index:0;pointer-events:none;display:none;background:#14242b}#realVideoGrid .bgCard{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;border:1px solid #d8e2e9;background-size:cover}.realVideoThumb{font-size:28px;filter:drop-shadow(0 2px 3px #0005)}#realVideoGrid .bgCard .bgLabel{position:static;font-size:12px;background:#0008}.realVideoNote{padding:0 25px 10px;color:#657184;font-size:12px;line-height:1.5}.realVideoNote a{color:#235d8b}';
document.head.appendChild(videoStyle);
const realVideos=[
 {id:'snow-lamp',name:'Snöfall vid gatlykta',symbol:'❄️',gradient:'linear-gradient(150deg,#12263c,#4d6574)',file:'Snow under LED street light in Tuntorp, Brastad.webm',author:'W.carter',license:'CC BY 4.0'},
 {id:'campfire',name:'Levande lägereld',symbol:'🔥',gradient:'linear-gradient(150deg,#2b1a17,#bb5b21)',file:'Fire burning.webm',author:'Gpkp',license:'CC BY-SA 4.0'},
 {id:'ocean-overhead',name:'Havsvågor uppifrån',symbol:'🌊',gradient:'linear-gradient(150deg,#145069,#76c2c5)',file:'Aerial view of sand beach. Top view sea waves. Drone footage.webm',author:'Nature video, HD - 4K',license:'CC BY 3.0'}
];
const fileUrl=file=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(file);
const sourceUrl=file=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(file.replaceAll(' ','_'));
const bgVideo=document.createElement('video');
bgVideo.id='realNatureVideo';bgVideo.autoplay=true;bgVideo.loop=true;bgVideo.muted=true;bgVideo.defaultMuted=true;bgVideo.playsInline=true;bgVideo.preload='auto';bgVideo.setAttribute('aria-hidden','true');
document.body.insertBefore(bgVideo,document.body.firstChild);
const videoSection=document.querySelector('#realVideoBackgroundSection');
const credit=document.createElement('div');credit.className='realVideoNote';credit.id='realVideoCredit';videoSection.appendChild(credit);
function stopVideo(){bgVideo.pause();bgVideo.removeAttribute('src');bgVideo.load();bgVideo.style.display='none';credit.textContent=''}
function selectVideo(id){
const scene=realVideos.find(v=>v.id===id);if(!scene)return;
bgVideo.pause();bgVideo.style.display='block';bgVideo.src=fileUrl(scene.file);
bgVideo.muted=true;bgVideo.play().catch(()=>{credit.textContent='Videon kunde inte starta automatiskt. Kontrollera internetuppkopplingen.'});
document.body.style.backgroundImage='none';
state.backgrounds={type:'natureVideo',value:id};saveState();
credit.innerHTML='Film: '+scene.author+' · '+scene.license+' · <a target="_blank" rel="noopener noreferrer" href="'+sourceUrl(scene.file)+'">Källa och licens</a>';
closeBackgrounds();
}
bgVideo.addEventListener('error',()=>{
if(state.backgrounds?.type==='natureVideo') {
credit.textContent='Kunde inte ladda videon. Kontrollera anslutningen eller välj en annan bakgrund.';
bgVideo.style.display='none';
}
});
realVideos.forEach((scene)=>{
const button=document.createElement('button');
button.type='button';button.className='bgCard';button.style.backgroundImage=scene.gradient;
button.innerHTML='<span class="realVideoThumb">'+scene.symbol+'</span><span class="bgLabel">'+scene.name+'</span>';
button.onclick=()=>selectVideo(scene.id);
document.getElementById('realVideoGrid').appendChild(button);
});
document.getElementById('backgroundPanel').addEventListener('click',e=>{
if(!e.target.closest('.bgCard'))return;
if(e.target.closest('#realVideoGrid'))return;
stopVideo();
},true);
const prior=state.backgrounds;
if(prior?.type==='natureVideo')selectVideo(prior.value);
else if(prior?.type==='animatedNature'){
state.backgrounds={type:'gradient',value:calmBackgrounds[0]};
document.body.style.backgroundImage=calmBackgrounds[0];saveState();
}
})();
