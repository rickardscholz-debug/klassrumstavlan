
(() => {
'use strict';
const CSS=`
#natureMotion{position:fixed;inset:0;z-index:-1;width:100%;height:100%;pointer-events:none;display:none}
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
const motions=[['Vågor uppifrån','#146178','#64bdc3'],['Lugnt hav','#286492','#91d1dd'],['Regn','#435e79','#a0b7cd'],['Moln','#7fa9ce','#ecf0f5'],['Löv som faller','#31624f','#a8bf75'],['Snöfall','#6683af','#e7efff'],['Porlande bäck','#3a8091','#9ed4d6'],['Solglitter','#337e96','#e2ca85'],['Dimma över sjö','#7c9ca5','#dbe6e5'],['Stjärnhimmel','#091731','#425b80']];
const sec=document.createElement('section');sec.className='bgSection';sec.innerHTML='<div class="bgSectionTitle">Rörliga bakgrunder – natur och vatten</div><div class="bgGrid" id="motionGrid"></div><p class="bgHint">Animationerna rör sig automatiskt, även i helskärmsläge.</p>';
bgPanel.insertBefore(sec,bgPanel.querySelector('.bgSection'));
const imageSection=document.createElement('section');imageSection.className='bgSection';
imageSection.innerHTML='<div class="bgSectionTitle">Fler naturfotografier</div><div class="bgGrid" id="photoPlusGrid"></div>';
bgPanel.insertBefore(imageSection,sec.nextSibling);
const photoIds=['1507525428034-b723cf961d3e','1518837695005-2083093ee35b','1470770841072-f978cf4d019e','1500534623283-312aade485b7','1464822759023-fed622ff2c3b','1475924156734-496f6cac6ec1','1448375240586-882707db888b','1473448912268-2022ce9509d8','1497436072909-60f362e1d4b1','1483664852095-d6cc6870702d','1500375592092-40eb2168fd21','1470071459604-3b5ec3a7fe05','1441974231531-c6227db76b6e','1534088568595-a066f410bcda','1433086966358-54859d0ed716','1454496522488-7a8e488e860e','1514282401047-d79a71a590e8','1426604966848-d7adac402bff','1501854140801-50d01698950b','1439853949212-09789ba454d5'];
const names=['Tropiskt hav','Ocean','Sjö','Solnedgång','Berg','Kust','Skog','Grönska','Skymning','Vinter','Havsvågor','Dalgång','Skogsljus','Moln','Vattenfall','Fjäll','Turkost hav','Lövverk','Landskap','Havsutsikt'];
photoIds.forEach((id,i)=>{const img='https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=2200&q=85';
const b=document.createElement('button');b.className='bgCard';b.type='button';b.style.backgroundImage='url("https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=400&q=65")';b.innerHTML='<span class="bgLabel">'+names[i]+'</span>';b.onclick=()=>{stopMotion();setBackground(img)};document.querySelector('#photoPlusGrid').appendChild(b)});
const canvas=document.createElement('canvas');canvas.id='natureMotion';document.body.insertBefore(canvas,document.body.firstChild);
const g=canvas.getContext('2d');
let scene=-1,raf=0,phase=0;
const dots=Array.from({length:130},(_,i)=>({x:(i*.6180339)%1,y:(i*.75487766)%1,s:.3+(i%9)/10}));
function stopMotion(){scene=-1;cancelAnimationFrame(raf);canvas.style.display='none'}
function resize(){const pixel=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*pixel);canvas.height=Math.round(innerHeight*pixel);g.setTransform(pixel,0,0,pixel,0,0)}
window.addEventListener('resize',resize);
function draw(){
if(scene<0)return;const w=innerWidth,h=innerHeight;phase+=.016;
const item=motions[scene],gradient=g.createLinearGradient(0,0,w,h);
gradient.addColorStop(0,item[1]);gradient.addColorStop(1,item[2]);g.fillStyle=gradient;g.fillRect(0,0,w,h);
if([0,1,2,6,7,8].includes(scene)){
for(let j=0;j<35;j++){
g.beginPath();const y=j*h/34;g.moveTo(0,y);
for(let x=0;x<=w+18;x+=18)g.lineTo(x,y+Math.sin(x*.012+j*.7+phase*(scene===1?.25:1.2))*6+Math.sin(x*.026+phase*.6+j)*3);
g.strokeStyle=scene===7?'rgba(255,246,197,.26)':'rgba(235,255,255,.2)';g.lineWidth=scene===0?2.7:1.4;g.stroke();
}}
if([3,8].includes(scene))for(let j=0;j<18;j++){const p=dots[j],x=((p.x*w+phase*(6+j%4)*15)%(w+400))-200,y=p.y*h;
const cloud=g.createRadialGradient(x,y,0,x,y,100+p.s*130);cloud.addColorStop(0,'rgba(255,255,255,.23)');cloud.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=cloud;g.fillRect(x-250,y-250,500,500)}
if([2,4,5,6,7,9].includes(scene))dots.forEach((p,j)=>{
let x=(p.x*w+phase*(scene===4?130:25)*p.s)%w,y=(p.y*h+phase*(scene===5?60:35)*p.s)%h;
if(scene===9){x=p.x*w;y=p.y*h}
g.globalAlpha=scene===9?.35+.6*Math.abs(Math.sin(phase*p.s+j)):.65;
g.fillStyle=scene===4?'#d9e5a2':scene===7?'#fff1aa':'#fff';
if(scene===4){g.beginPath();g.ellipse(x,y,5*p.s,2*p.s,Math.sin(phase+j),0,7);g.fill()}
else{g.beginPath();g.arc(x,y,scene===5?2*p.s:1.4*p.s,0,7);g.fill()}
});g.globalAlpha=1;
raf=requestAnimationFrame(draw);
}
function startMotion(i){stopMotion();scene=i;resize();canvas.style.display='block';document.body.style.backgroundImage='none';
state.backgrounds={type:'animatedNature',value:i};saveState();closeBackgrounds();raf=requestAnimationFrame(draw)}
motions.forEach((m,i)=>{const b=document.createElement('button');b.className='bgCard';b.type='button';b.style.backgroundImage='linear-gradient(130deg,'+m[1]+','+m[2]+')';
b.innerHTML='<span class="bgLabel">◉ '+m[0]+'</span>';b.onclick=()=>startMotion(i);document.querySelector('#motionGrid').appendChild(b)});
const saved=state.backgrounds;
if(saved?.type==='animatedNature'&&Number.isInteger(saved.value)&&saved.value>=0&&saved.value<motions.length)startMotion(saved.value);
document.querySelectorAll('#backgroundPanel .bgCard').forEach(b=>{
if(b.closest('#motionGrid'))return;
b.addEventListener('click',()=>{if(scene>=0){stopMotion();setTimeout(()=>{if(state.backgrounds?.type!=='animatedNature')canvas.style.display='none'},0)}});
});
})();
