/* Completion features for Suwari Penguin. No external assets, accounts or packages.
 * Music is an original oscillator score; save data stays in this browser.
 */
(function(root){'use strict';
const KEY='suwari-penguin-collection-v1',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SKINS=Object.freeze([
 {id:'classic',name:'いつもの',cost:0,detail:'今日も、座ったまま。'},
 {id:'midnight',name:'夜ふかし',cost:6,detail:'修行より、夜食。',colors:['#24324b','#475d7e','#607699','#506581','#7084a0']},
 {id:'plum',name:'ぶどうあいす',cost:10,detail:'溶けるまで、休憩。',colors:['#433651','#72627f','#927996','#7d6689','#a58cac']},
 {id:'mint',name:'ミントミルク',cost:12,detail:'ひんやり、のんびり。',colors:['#254b4a','#56867c','#78a79b','#60968c','#88b7ab']},
 {id:'scarf',name:'師匠のおさがり',cost:16,detail:'気合いだけ、借りました。',garment:'scarf'},
 {id:'pajamas',name:'おひるね係',cost:20,detail:'修行中も、就寝中。',colors:['#32445c','#637b96','#8197ae','#6d829d','#94a8bc'],garment:'cap'},
 {id:'graduate',name:'免許皆眠',cost:0,requires:29,detail:'30面クリア。よく寝ました。',garment:'gold'}
]);
class Collection{
 constructor(storage,legacy={}){this.storage=storage;this.ok=!!storage;this.data=this.read();this.migrate(legacy);}
 clean(raw){
  const ids=new Set(SKINS.map(s=>s.id)),d=raw&&typeof raw==='object'?raw:{};
  const claimed=[...new Set((Array.isArray(d.claimed)?d.claimed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<30))];
  const owned=['classic'];let budget=claimed.length*3;
  for(const id of (Array.isArray(d.owned)?d.owned:[])){
   const s=SKINS.find(s=>s.id===id);if(!s||owned.includes(id)||(s.requires!==undefined&&!claimed.includes(s.requires))||s.cost>budget)continue;
   owned.push(id);budget-=s.cost;
  }
  if(claimed.includes(29)&&!owned.includes('graduate'))owned.push('graduate');
  return {claimed,owned,equipped:ids.has(d.equipped)&&owned.includes(d.equipped)?d.equipped:'classic',openingSeen:d.openingSeen===true,music:d.music!==false,sfx:d.sfx!==false,volume:Number.isFinite(d.volume)?clamp(d.volume,0,1):.65};
 }
 read(){try{return this.clean(JSON.parse(this.storage?.getItem(KEY)||'{}'));}catch(_){this.ok=false;return this.clean({});}}
 save(){try{if(!this.storage){this.ok=false;return;}this.storage.setItem(KEY,JSON.stringify(this.data));}catch(_){this.ok=false;}}
 migrate(records){let changed=false;for(const [key,v] of Object.entries(records||{})){const i=Number(key);if(Number.isInteger(i)&&i>=0&&i<30&&Number.isInteger(v)&&v>=1&&v<=3&&!this.data.claimed.includes(i)){this.data.claimed.push(i);changed=true;}}if(changed){this.data=this.clean(this.data);this.save();}}
 refresh(){if(this.ok)this.data=this.read();}
 balance(){return this.data.claimed.length*3-SKINS.filter(s=>this.data.owned.includes(s.id)).reduce((n,s)=>n+s.cost,0);}
 award(i){this.refresh();if(!Number.isInteger(i)||i<0||i>=30||this.data.claimed.includes(i))return 0;this.data.claimed.push(i);if(i===29&&!this.data.owned.includes('graduate'))this.data.owned.push('graduate');this.save();return 3;}
 buy(id){this.refresh();const s=SKINS.find(s=>s.id===id);if(!s)return false;if(s.requires!==undefined&&!this.data.claimed.includes(s.requires))return false;if(!this.data.owned.includes(id)){if(this.balance()<s.cost)return false;this.data.owned.push(id);}this.data.equipped=id;this.save();return true;}
 settings(change){this.refresh();Object.assign(this.data,change);this.data=this.clean(this.data);this.save();}
}
class Sound{
 constructor(getSettings){this.getSettings=getSettings;this.ctx=null;this.nodes=new Set();this.mode='home';this.beat=0;this.next=0;this.notes=0;this.effects=0;this.hidden=false;this.error='';this.pending=false;}
 unlock(){
  if(this.hidden)return;
  try{
   if(!this.ctx||this.ctx.state==='closed')this.create();
   if(this.ctx.state!=='running'&&!this.pending){this.pending=true;const c=this.ctx;const promise=c.resume();Promise.resolve(promise).then(()=>{this.pending=false;this.error='';this.next=c.currentTime+.035;}).catch(()=>{this.pending=false;this.error='音ボタンでもう一度再開できます。';});}
  }catch(_){this.error='このブラウザでは音を再生できません。';}
 }
 create(){
  const C=root.AudioContext||root.webkitAudioContext;if(!C)throw Error('AudioContext unavailable');
  this.ctx=new C();const c=this.ctx;this.master=c.createGain();this.master.gain.value=.7;
  const compressor=c.createDynamicsCompressor();compressor.threshold.value=-10;compressor.ratio.value=5;
  this.musicBus=c.createGain();this.fxBus=c.createGain();this.musicBus.connect(this.master);this.fxBus.connect(this.master);this.master.connect(compressor);this.analyser=c.createAnalyser();this.analyser.fftSize=1024;compressor.connect(this.analyser);this.analyser.connect(c.destination);
  const buffer=c.createBuffer(1,c.sampleRate,c.sampleRate),a=buffer.getChannelData(0);let seed=2307;
  for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=(seed/4294967296*2-1)*.7;}
  this.noiseBuffer=buffer;this.glide=c.createBufferSource();this.glide.buffer=buffer;this.glide.loop=true;
  this.filter=c.createBiquadFilter();this.filter.type='bandpass';this.filter.frequency.value=2200;this.filter.Q.value=.65;
  this.glideGain=c.createGain();this.glideGain.gain.value=0;this.glide.connect(this.filter);this.filter.connect(this.glideGain);this.glideGain.connect(this.fxBus);this.glide.start();this.next=c.currentTime+.04;this.beat=0;
 }
 voice(freq,dur=.12,type='sine',vol=.04,end,delay=0,bus='fx'){
  const c=this.ctx,s=this.getSettings();if(!c||c.state!=='running'||this.hidden||!(bus==='music'?s.music:s.sfx))return;
  const at=c.currentTime+Math.max(0,delay),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),at);
  if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+dur);
  g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+dur);
  o.connect(g);g.connect(bus==='music'?this.musicBus:this.fxBus);o.start(at);o.stop(at+dur+.025);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};if(bus==='music')this.notes++;
 }
 noise(dur=.18,vol=.06,freq=900){
  const c=this.ctx;if(!c||c.state!=='running'||!this.getSettings().sfx||this.hidden)return;
  const o=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();o.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=freq;
  g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);o.connect(f);f.connect(g);g.connect(this.fxBus);o.start();o.stop(c.currentTime+dur);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();f.disconnect();g.disconnect();};
 }
 effect(name){
  if(!this.ctx||this.ctx.state!=='running'||!this.getSettings().sfx)return;this.effects++;
  if(name==='tap')this.voice(540,.055,'sine',.035,680);
  if(name==='slide'){this.voice(320,.1,'sine',.025,560);this.noise(.13,.04,2100);}
  if(name==='jump')this.voice(280,.26,'sine',.06,960);
  if(name==='land'){this.voice(150,.13,'triangle',.09,70);this.noise(.1,.09,850);}
  if(name==='hammer'){this.voice(230,.07,'triangle',.065,130);this.noise(.055,.065,1300);}
  if(name==='hook')for(let i=0;i<7;i++)this.voice(620+i*85,.055,'triangle',.055,undefined,i*.065);
  if(name==='water'){this.noise(.36,.22,1300);for(let i=0;i<4;i++)this.voice(190+i*110,.12,'sine',.065,450+i*90,.18+i*.14);}
  if(name==='fail')this.voice(200,.24,'triangle',.04,110);
  if(name==='win'||name==='buy'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.voice(f,.24,'triangle',.075,undefined,i*.10));}
 }
 setMode(mode){if(this.mode===mode)return;this.mode=mode;this.beat=0;if(this.ctx)this.next=this.ctx.currentTime+.12;}
 surface(speed,snow=false,air=false){const c=this.ctx;if(!c||c.state!=='running')return;this.glideGain.gain.setTargetAtTime(air?0:Math.min(.065,speed/16000)*(snow?1.45:1),c.currentTime,.05);this.filter.frequency.setTargetAtTime(snow?740:2450,c.currentTime,.06);}
 stop(){for(const n of [...this.nodes]){try{n.stop();}catch(_){}}if(this.glideGain&&this.ctx)this.glideGain.gain.value=0;}
 visibility(hidden){this.hidden=hidden;if(hidden){this.stop();if(this.ctx)this.ctx.suspend().catch(()=>{});}else{this.pending=false;if(this.ctx)this.next=this.ctx.currentTime+.1;}}
 tick(){
  const c=this.ctx,s=this.getSettings();if(!c||c.state!=='running'||this.hidden)return;
  this.master.gain.setTargetAtTime(s.volume*.8,c.currentTime,.06);this.musicBus.gain.setTargetAtTime(s.music?.58:0,c.currentTime,.05);this.fxBus.gain.setTargetAtTime(s.sfx?1:0,c.currentTime,.05);
  if(!s.music){this.next=c.currentTime+.1;return;}if(this.next<c.currentTime-.2)this.next=c.currentTime+.03;
  const late=this.mode==='late',tempo=this.mode==='movie'?106:late?108:92,step=60/tempo/2;
  // Original 16-bar, two-phrase score. Sparse melody, bass and offbeat chords.
  const melody=late?[72,0,75,79,77,75,72,0,70,72,75,0,74,70,67,0,68,0,72,75,74,72,68,0,67,70,74,0,72,0,67,0]:[76,0,79,81,79,0,76,74,72,0,74,76,79,0,76,0,77,0,81,79,77,76,74,0,72,74,76,0,74,0,72,0];
  const roots=late?[48,44,51,46,48,44,41,43]:[48,45,53,55,48,45,53,55];
  while(this.next<c.currentTime+.18){
   const b=this.beat%128,k=b%32,phrase=Math.floor(b/32),rootNote=roots[Math.floor(b/8)%8],delay=this.next-c.currentTime;
   const hz=m=>440*Math.pow(2,(m-69)/12),m=melody[k]+(phrase%2===1&&k>=24?12:0);
   if(melody[k])this.voice(hz(m),step*.76,'triangle',.073,undefined,delay,'music');
   if(b%4===0)this.voice(hz(rootNote),step*1.6,'triangle',.085,undefined,delay,'music');
   if(b%4===2)for(const note of [rootNote+12,rootNote+(late?15:16),rootNote+19])this.voice(hz(note),step*.48,'sine',.025,undefined,delay,'music');
   this.next+=step;this.beat++;
  }
 }
 state(){let rms=0;if(this.analyser){const d=new Float32Array(1024);this.analyser.getFloatTimeDomainData(d);rms=Math.sqrt(d.reduce((a,b)=>a+b*b,0)/d.length);}return {state:this.ctx?.state||'not-started',notes:this.notes,effects:this.effects,activeVoices:this.nodes.size,mode:this.mode,error:this.error,rms};}
}
let api=null,bank=null,sound=null,movie=null,lastReward=0,neutral=0,chapter=0;const spriteCache=new WeakMap();
function selected(){return neutral?'classic':bank?.data.equipped||'classic';}
function sprite(base,id=selected()){
 if(id==='classic'||!bank)return base;let cache=spriteCache.get(base);if(!cache){cache=new Map();spriteCache.set(base,cache);}if(cache.has(id))return cache.get(id);
 const skin=SKINS.find(s=>s.id===id);if(!skin)return base;const c=api.art.off(base.width,base.height),g=c.getContext('2d');g.drawImage(base,0,0);
 if(skin.colors){const from=['173749','30566a','41657a','375e70','416b7c'].map(h=>parseInt(h,16)),to=skin.colors.map(h=>parseInt(h.slice(1),16));const image=g.getImageData(0,0,c.width,c.height),d=image.data;
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const j=from.indexOf(d[i]*65536+d[i+1]*256+d[i+2]);if(j>=0){d[i]=to[j]>>16;d[i+1]=(to[j]>>8)&255;d[i+2]=to[j]&255;}}g.putImageData(image,0,0);}
 const ox=c.width===48?6:0,oy=c.width===48?5:0;g.save();g.translate(ox,oy);
 if(skin.garment==='scarf'){api.art.rect(g,9,21,18,3,'#d2876c');api.art.rect(g,23,23,4,9,'#d2876c');api.art.rect(g,24,24,2,7,'#ebb695');}
 if(skin.garment==='cap'){api.art.rect(g,8,4,21,4,'#adc1d4');api.art.rect(g,13,0,14,4,'#758fac');api.art.rect(g,24,2,6,3,'#758fac');api.art.rect(g,28,4,4,4,'#f7f4df');}
 if(skin.garment==='gold'){api.art.rect(g,9,21,18,3,'#e9bf67');api.art.rect(g,15,23,6,5,'#edd588');api.art.rect(g,17,24,2,2,'#ad7d46');api.art.rect(g,11,2,15,3,'#f0cf77');}
 g.restore();cache.set(id,c);return c;
}
function modal(){return !!api&&(['openingScreen','closetScreen','audioScreen'].some(id=>!api.$(id).hidden));}
function updateBalance(){if(!api)return;for(const e of document.querySelectorAll('[data-fish-count]'))e.textContent=String(bank.balance());const n=api.$('saveNotice');if(n)n.textContent=bank.ok?'魚・着替えはこのブラウザに保存されます。':'このブラウザでは保存できません。閉じると着替えの記録は失われます。';}
function showCloset(){bank.refresh();renderCloset();api.show('closetScreen');}
function renderCloset(){
 const grid=api.$('skinGrid');grid.replaceChildren();updateBalance();
 for(const s of SKINS){const owned=bank.data.owned.includes(s.id),equipped=bank.data.equipped===s.id,locked=s.requires!==undefined&&!bank.data.claimed.includes(s.requires);const card=document.createElement('div');card.className='skin-card'+(equipped?' equipped':'');
  const c=document.createElement('canvas');c.width=108;c.height=112;c.setAttribute('aria-label',s.name);api.art.drawBird(c.getContext('2d'),54,96,0,2.65,false,0,true,-1,s.id);
  const name=document.createElement('strong');name.textContent=s.name;const detail=document.createElement('span');detail.textContent=s.detail;
  const b=document.createElement('button');b.textContent=equipped?'着ています':owned?'着替える':locked?'30面クリアで解放':`魚 ${s.cost}匹で交換`;
  b.disabled=equipped||locked||(!owned&&bank.balance()<s.cost);b.onclick=()=>{sound.unlock();if(bank.buy(s.id)){sound.effect(owned?'tap':'buy');renderCloset();}};card.append(c,name,detail,b);grid.append(card);
 }
}
function refreshAudio(){
 const d=bank.data;api.$('musicToggle').textContent=d.music?'BGM：オン':'BGM：オフ';api.$('sfxToggle').textContent=d.sfx?'効果音：オン':'効果音：オフ';api.$('musicToggle').setAttribute('aria-pressed',d.music);api.$('sfxToggle').setAttribute('aria-pressed',d.sfx);api.$('volumeSlider').value=Math.round(d.volume*100);
 api.$('audioState').textContent=sound.error||((sound.ctx&&sound.ctx.state!=='running')?'音を再開するには下のボタンをタップ。':'氷、雪、壁、ジャンプ、釣り、着水で音が変わります。');
 api.$('sound').setAttribute('aria-label','BGMと効果音の設定');api.$('sound').setAttribute('aria-pressed',d.music||d.sfx);api.$('soundIcon').innerHTML=d.music||d.sfx?'<path d="M10 4 5 8H2v8h3l5 4zM15 7a7 7 0 0 1 0 10M19 3a12 12 0 0 1 0 18"/>':'<path d="M10 4 5 8H2v8h3l5 4zM16 9l6 6m0-6-6 6"/>';
}
function startMovie(done){movie={age:0,done,lastBeat:-1};sound.unlock();sound.setMode('movie');api.show('openingScreen');drawMovie();}
function endMovie(){if(!movie)return;const done=movie.done;movie=null;bank.settings({openingSeen:true});api.hide('openingScreen');sound.setMode('home');if(done)done();}
function drawMovie(){
 if(!movie)return;const c=api.$('openingCanvas'),g=c.getContext('2d'),t=movie.age,R=api.art.rect,E=api.art.pixelEllipse,D=api.art.drawBird,F=api.art.drawFish;
 const scene=Math.min(5,Math.floor(t/3.2)),u=clamp((t-scene*3.2)/3.2,0,1),smooth=v=>v*v*(3-2*v);const still=api.reduced;
 const captions=['師匠「まずは、腹すべりから。」','……本人は、聞いていません。','おさかなの話だけは、聞こえます。','仕方がないので、師匠がつくります。','壁も、川も。ごほうびは、いちばん奥。','さあ、ひと押し。本人は、座ったまま。'];
 api.$('movieCaption').textContent=captions[scene];api.$('movieStep').textContent=`${scene+1} / 6`;
 g.clearRect(0,0,360,320);R(g,0,0,360,320,'#9bc6d1');R(g,17,14,326,294,'#e0f2ef');R(g,17,14,326,7,'#fbfcf4');R(g,17,301,326,7,'#fbfcf4');
 for(let y=40;y<290;y+=48){R(g,31+y%45,y,14,2,'#c7e2de');R(g,275-y%35,y+15,17,2,'#c7e2de');}
 if(scene<3){
  const y=250;api.world.drawRing(g,235,y,.9);D(g,235,y,scene===2?.45:0,2.1,scene===1||Math.floor(t*2)%5===0,0);
  if(scene===0){const bx=still?115:50+220*smooth(u);E(g,bx,103,25,11,'#173749');E(g,bx+6,101,16,8,'#fffcef');R(g,bx+20,97,8,4,'#edb660');R(g,bx-27,97,10,5,'#173749');R(g,bx-27,108,8,4,'#173749');R(g,bx-7,94,24,3,'#cf886a');for(let i=0;i<3;i++)R(g,bx-43-i*11,103+i*5,9,2,'#90bcbf');}
  else api.world.master(g,82,155,1.8);
  if(scene===1){api.art.label(g,'z',268,191-(still?0:Math.sin(t*2)*3),17,'#799b9c');api.art.label(g,'…',89,76,22,'#597e87');}
  if(scene===2){const fy=151-(still?0:Math.sin(t*3)*5);F(g,127,fy,1.6);R(g,144,fy-15,2,7,'#efbc6b');R(g,142,fy-13,7,2,'#efbc6b');api.art.label(g,'！',268,183,20,'#c88a6b');}
 }else{
  const born=(scene-3)*3.2+u*3.2,progress=still?(scene===3?2:5):Math.min(5,Math.floor(born/1.05));
  api.world.drawRing(g,89,270,.73);D(g,89,268,0,1.5,scene!==5||u<.6,0);
  const works=[{x:205,y:215,w:90,h:20},{x:35,y:168,w:103,h:20},{x:165,y:106,w:150,h:24},{x:32,y:89,w:297,h:13},{x:165,y:61,w:90,h:17}];
  for(let j=0;j<Math.min(progress,works.length);j++){const r=works[j];if(j===3){R(g,r.x,r.y,r.w,r.h,'#4c91af');R(g,r.x,r.y+r.h-3,r.w,3,'#b1d8db');}else{R(g,r.x,r.y+3,r.w,r.h,'#80aebd');R(g,r.x,r.y,r.w,r.h-4,'#b6d4d6');R(g,r.x,r.y,r.w,3,'#fffcef');}}
  let mx=still?235:210+Math.sin(born*1.7)*70,my=246-Math.min(5.6,born)*29;
  if(scene===5){mx=290;my=232;}
  api.world.master(g,mx,my,1.2);
  if(scene===3||scene===4){const swing=still?0:Math.sin(t*18)*5;R(g,mx+20,my-27+swing,3,16,'#a87e57');R(g,mx+15,my-31+swing,13,6,'#678b94');
   if(!still&&movie.lastBeat!==progress){movie.lastBeat=progress;sound.effect('hammer');}}
  if(scene>=4&&born>4.4){E(g,267,45,24,8,'#fbf9e9');F(g,267,41,1.4);}
  if(scene===5){api.art.label(g,'z',115,223-(still?0:Math.sin(t*2)*3),12,'#809f9f');api.art.label(g,'準備したのは、師匠。',225,288,10,'#5a7c82');}
 }
}
function applyChapter(){if(!api||!api.$('chapterTabs'))return;[...api.$('stageGrid').children].forEach((b,i)=>b.hidden=Math.floor(i/10)!==chapter);api.$('chapterTabs').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',i===chapter);});}
function boot(a){
 api=a;let storage;try{storage=localStorage;}catch(_){}bank=new Collection(storage,a.records);sound=new Sound(()=>bank.data);
 const master=api.world.master;api.world.master=function(...args){neutral++;try{return master(...args);}finally{neutral--;}};
 const ui=`<section id="openingScreen" class="overlay extra-overlay" hidden role="dialog" aria-modal="true" aria-label="はじめのおはなし"><div class="panel movie-panel"><div class="eyebrow">師匠と、座ったままの弟子</div><canvas id="openingCanvas" width="360" height="320" aria-label="師匠が手づくりの修行場とごほうびを用意する短編"></canvas><p id="movieCaption" aria-live="polite"></p><div class="movie-bottom"><span id="movieStep"></span><button id="skipMovie" class="secondary">スキップして進む →</button></div></div></section>
 <section id="closetScreen" class="overlay extra-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="closetTitle"><div class="panel closet-panel"><button class="close" data-extra-close="closetScreen" aria-label="閉じる">×</button><div class="eyebrow">おさかなと、おきがえ</div><h2 id="closetTitle">着替えて、また休む。</h2><div class="fish-balance">おさかな <b data-fish-count>0</b> 匹</div><p>初クリアで3匹。前に集めた分も受け取り済み。<br>どの服も、滑る性能は同じです。</p><div id="skinGrid" class="skin-grid"></div><p id="saveNotice" class="save-note"></p></div></section>
 <section id="audioScreen" class="overlay extra-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="audioTitle"><div class="panel"><button class="close" data-extra-close="audioScreen" aria-label="閉じる">×</button><div class="eyebrow">SOUND SETTINGS</div><h2 id="audioTitle">のんきな音の、修行場。</h2><button id="musicToggle" class="secondary"></button><button id="sfxToggle" class="secondary"></button><label class="volume-label" for="volumeSlider">音量<input id="volumeSlider" type="range" min="0" max="100" step="1"></label><p id="audioState"></p><button id="resumeAudio" class="primary">音を再開・試聴</button></div></section>`;
 api.$('app').insertAdjacentHTML('beforeend',ui);
 const links=document.createElement('div');links.className='title-extras';links.innerHTML='<button id="openCloset">おきがえ · 魚 <span data-fish-count>0</span></button><button id="replayMovie">はじめのおはなし</button><button id="openAudio">音・設定</button>';api.$('selectFromTitle').after(links);
 const row=document.createElement('div');row.className='stage-extras';row.innerHTML='<button id="stageCloset">おきがえ · 魚 <span data-fish-count>0</span></button><button id="returnTitle">タイトルへ</button>';api.$('stageGrid').before(row);const tabs=document.createElement('div');tabs.id='chapterTabs';tabs.className='chapter-tabs';for(let i=0;i<3;i++){const b=document.createElement('button');b.textContent=`${i*10+1}〜${i*10+10}`;b.onclick=()=>{chapter=i;applyChapter();};tabs.append(b);}api.$('stageGrid').before(tabs);applyChapter();
 api.$('start').onclick=()=>{sound.unlock();const go=()=>{const next=a.levels.findIndex((_,i)=>!a.records[i]);api.load(next<0?0:next);};if(!bank.data.openingSeen)startMovie(go);else go();};
 api.$('openCloset').onclick=showCloset;api.$('stageCloset').onclick=showCloset;api.$('replayMovie').onclick=()=>startMovie(null);api.$('skipMovie').onclick=endMovie;
 const audioOpen=()=>{sound.unlock();refreshAudio();api.show('audioScreen');};api.$('sound').onclick=audioOpen;api.$('openAudio').onclick=audioOpen;
 api.$('musicToggle').onclick=()=>{bank.settings({music:!bank.data.music});sound.unlock();refreshAudio();};api.$('sfxToggle').onclick=()=>{bank.settings({sfx:!bank.data.sfx});sound.unlock();sound.effect('tap');refreshAudio();};
 api.$('volumeSlider').oninput=e=>{bank.settings({volume:Number(e.target.value)/100});sound.unlock();};api.$('resumeAudio').onclick=()=>{sound.unlock();sound.effect('tap');refreshAudio();};
 api.$('returnTitle').onclick=()=>{api.hide('stageScreen');api.show('titleScreen');sound.setMode('home');};
 document.querySelectorAll('[data-extra-close]').forEach(b=>b.onclick=()=>api.hide(b.dataset.extraClose));
 document.addEventListener('click',e=>{if(e.target.closest('button')){sound.unlock();if(e.target.id!=='skipMovie')sound.effect('tap');}},true);
 document.addEventListener('visibilitychange',()=>sound.visibility(document.hidden));
 window.addEventListener('storage',e=>{if(e.key===KEY){bank.refresh();updateBalance();if(!api.$('closetScreen').hidden)renderCloset();refreshAudio();}});
 updateBalance();refreshAudio();
}
const apiExport={Collection,SKINS,Sound,boot,sprite,selected,modal,
 frame(dt){if(!api)return;if(movie&&!document.hidden){movie.age+=dt;drawMovie();if(movie.age>=19.2)endMovie();}sound.tick();},
 stages:applyChapter,loaded(i){chapter=Math.floor(i/10);lastReward=0;if(sound){sound.surface(0);sound.setMode(i>=20?'late':'course');}},
 cleared(i){if(!bank)return 0;lastReward=bank.award(i);updateBalance();sound.effect('win');return lastReward;},
 result(i,won){if(!api)return;const e=api.$('resultText');if(won){e.textContent=i===29?'最終試験を一投で突破。師匠のお墨付き「免許皆眠」を解放。':`一投で到着。${lastReward?'おさかな +3匹！':'このコースのごほうびは受け取り済み。'}`;if(i===29)api.$('resultTitle').textContent='修行、おしまい。お昼寝です。';}},
 effect(name){sound?.effect(name);},tone(...args){sound?.voice(...args);},unlock(){sound?.unlock();},
 surface(speed,snow,air){sound?.surface(speed,snow,air);},
 state(){return {collection:bank?JSON.parse(JSON.stringify(bank.data)):null,balance:bank?.balance()||0,saving:bank?.ok,movie:movie?{age:movie.age}:null,audio:sound?.state()};},
 replay:()=>startMovie(null),closet:showCloset
};
if(typeof module!=='undefined'&&module.exports)module.exports=apiExport;else root.SuwariExtras=apiExport;
})(typeof window!=='undefined'?window:globalThis);