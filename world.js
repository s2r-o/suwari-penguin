/* Suwari Penguin 0.5: the master's handmade training grounds.
 * No network, packages, analytics or random gameplay. Existing input/ice physics stay in index.html.
 */
(function(root){
'use strict';
const TAU=Math.PI*2, GRAVITY=640, RAMP_ANGLE=26*Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inside=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const extraLevels=[
 {name:'師匠、橋は？',hint:'台に乗れば、座ったままジャンプ。',height:1500,shots:1,start:{x:180,y:1380},goal:{x:180,y:145},walls:[],snow:[],ramps:[{x:122,y:970,w:116,h:66}],gaps:[{x:26,y:690,w:308,h:160}],lesson:'ジャンプ台'},
 {name:'先輩、お先に。',hint:'先輩が通り過ぎてから、スッ。',height:1550,shots:1,start:{x:180,y:1430},goal:{x:180,y:140},walls:[],snow:[],lanes:[{y:980,speed:370,period:3.8,offset:1.1,dir:1},{y:565,speed:420,period:4.6,offset:2.7,dir:-1}],lesson:'腹すべりの先輩'},
 {name:'おさかな、じゃない。',hint:'針が上がっている間に、通り抜けよう。',height:1530,shots:1,start:{x:105,y:1410},goal:{x:252,y:145},walls:[],snow:[],hooks:[{x:148,y:955,sway:76,period:4.8,offset:.3,side:-1},{x:218,y:535,sway:65,period:5.2,offset:2.4,side:1}],lesson:'釣り人'},
 {name:'空中でも、座ったまま。',hint:'飛び越えた先にも、先輩がいる。',height:2090,shots:2,start:{x:180,y:1970},goal:{x:180,y:140},walls:[],snow:[],ramps:[{x:126,y:1510,w:108,h:66}],gaps:[{x:26,y:1240,w:308,h:150}],lanes:[{y:930,speed:400,period:4.1,offset:2,dir:1},{y:535,speed:380,period:4.6,offset:.5,dir:-1}],lesson:'ジャンプとタイミング'},
 {name:'雪で、ひとやすみ。',hint:'雪でひと休み。針の動きを見て、もう一打。',height:2110,shots:2,start:{x:95,y:1990},goal:{x:264,y:145},walls:[{x:26,y:1400,w:173,h:42},{x:215,y:510,w:119,h:42}],snow:[{x:207,y:1050,w:111,h:150,factor:3.7},{x:38,y:600,w:88,h:135,factor:3.7}],hooks:[{x:190,y:815,sway:86,period:5.2,offset:1.4,side:-1}],lesson:'止まる場所も作戦'},
 {name:'師匠の力作。',hint:'師匠は頑張った。あとは、お魚まで。',height:2460,shots:2,start:{x:180,y:2340},goal:{x:180,y:140},walls:[{x:26,y:520,w:116,h:42}],snow:[{x:242,y:1080,w:80,h:135,factor:3.7}],ramps:[{x:124,y:1860,w:112,h:66}],gaps:[{x:26,y:1570,w:308,h:180}],lanes:[{y:1210,speed:395,period:4.2,offset:2.2,dir:1},{y:915,speed:365,period:4.8,offset:.6,dir:-1}],hooks:[{x:187,y:660,sway:82,period:5.4,offset:1.7,side:1}],lesson:'ごほうび総仕上げ'}
];
function laneAt(l,t){
 const u=t+(l.offset||0),cycle=Math.floor(u/l.period),q=((u%l.period)+l.period)%l.period;
 const duration=440/l.speed,dir=l.dir||1;
 return {x:dir>0?-40+q*l.speed:400-q*l.speed,y:l.y,vx:dir*l.speed,vy:0,active:q<duration,warning:q>l.period-.65,cycle,dir};
}
function hookAt(h,t){
 const u=t+(h.offset||0),q=((u%h.period)+h.period)%h.period/h.period;
 const lift=q<.18?72*(1-q/.18):q<.60?0:q<.80?72*(q-.60)/.20:72;
 return {x:clamp(h.x+Math.sin(u*TAU/h.period)*(h.sway||0),48,312),y:h.y,z:lift,active:lift<12,warning:q<.18};
}
function init(p){
 if(!Number.isFinite(p.clock))Object.assign(p,{clock:0,z:0,vz:0,failed:null,failureAge:0,jumps:0,landings:0,bumps:0,events:[],lastRamp:-1,rampCooldown:0,bumpUntil:{}});
}
function event(p,type,more={}){p.events.push({type,x:p.x,y:p.y,...more});if(p.events.length>32)p.events.shift();}
function fail(p,reason){if(p.failed||p.won)return; p.failed=reason;p.failureAge=0;p.vx=p.vy=p.vz=0;p.stopped=true;event(p,'fail',{reason});}
function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
function install(P){
 if(P.worldInstalled)return;
 P.worldInstalled=true;
 const baseStep=P.step,baseHeld=P.moveHeld,baseLaunch=P.launch,baseCreate=P.create;
 P.create=l=>{const p=baseCreate(l);init(p);return p;};
 P.launch=(p,vx,vy)=>{init(p);if(p.failed||p.z>0)return false;return baseLaunch(p,vx,vy);};
 function checkHazards(p,l,ox,oy,oldT,held=false){
  if(p.won||p.failed)return;
  if(p.z<=3 && (l.gaps||[]).some(r=>inside(p,r))){fail(p,'gap');return;}
  for(const h of l.hooks||[]){
   const a=hookAt(h,oldT),b=hookAt(h,p.clock);
   if(b.active&&Math.abs(p.z-b.z)<27&&segmentDistance(0,0,ox-a.x,oy-a.y,p.x-b.x,p.y-b.y)<21){fail(p,'hook');return;}
  }
  if(p.z>27)return;
  (l.lanes||[]).forEach((lane,i)=>{
   const a=laneAt(lane,oldT),b=laneAt(lane,p.clock);
   if(!b.active||p.clock<(p.bumpUntil[i]||-1))return;
   const d=a.active?segmentDistance(0,0,ox-a.x,oy-a.y,p.x-b.x,p.y-b.y):Math.hypot(p.x-b.x,p.y-b.y);
   if(d>=26)return;
   let dx=p.x-b.x,dy=p.y-b.y,n=Math.hypot(dx,dy);
   if(n<.001){dx=-b.dir;dy=-.3;n=Math.hypot(dx,dy);}
   const nx=dx/n,ny=dy/n,vn=(p.vx-b.vx)*nx+p.vy*ny;
   if(vn<0){const impulse=-vn*1.4;p.vx+=impulse*nx;p.vy+=impulse*ny;}
   p.x=b.x+nx*26.1;p.y=b.y+ny*26.1;
   p.x=clamp(p.x,P.C.left+P.C.radius,P.C.right-P.C.radius);
   const s=Math.hypot(p.vx,p.vy);if(s>P.C.maxSpeed){p.vx*=P.C.maxSpeed/s;p.vy*=P.C.maxSpeed/s;}
   p.stopped=false;p.spin=clamp(p.spin+b.dir*10,-19,19);p.squash=.13;p.bumps++;p.bumpUntil[i]=p.clock+.35;
   event(p,'bump',{held});
  });
 }
 P.step=function(p,l,dt=P.C.step,onHit){
  init(p);if(!(dt>0)||!Number.isFinite(dt))return;
  if(p.failed){p.failureAge+=dt;return;}if(p.won)return;
  const n=Math.max(1,Math.ceil((Math.hypot(p.vx,p.vy)+500)*dt/4)),h=dt/n;
  for(let k=0;k<n;k++){
   const oldT=p.clock,ox=p.x,oy=p.y;p.clock+=h;p.rampCooldown=Math.max(0,p.rampCooldown-h);
   if(!p.held){
    if(p.z>0){
     p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h-.5*GRAVITY*h*h;p.vz-=GRAVITY*h;
     p.angle+=p.spin*h;p.spin*=Math.exp(-1.25*h);p.squash*=Math.exp(-12*h);
     if(p.x<P.C.left+P.C.radius){p.x=P.C.left+P.C.radius;P.reflect(p,1,0,onHit);}
     if(p.x>P.C.right-P.C.radius){p.x=P.C.right-P.C.radius;P.reflect(p,-1,0,onHit);}
     if(p.y<26+P.C.radius){p.y=26+P.C.radius;P.reflect(p,0,1,onHit);}
     if(p.y>l.height-26-P.C.radius){p.y=l.height-26-P.C.radius;P.reflect(p,0,-1,onHit);}
     if(p.z<28)for(const w of l.walls)P.rectCollision(p,w,onHit);
     if(p.z<=0){p.z=0;p.vz=0;p.landings++;p.squash=.12;event(p,'land');}
     if(p.z<18&&segmentDistance(l.goal.x,l.goal.y,ox,oy,p.x,p.y)<=P.C.radius+(l.goal.r||15)){p.won=true;p.stopped=true;p.vx=p.vy=0;}
    }else{
     baseStep(p,l,h,onHit);
     if(!p.won&&!p.stopped&&p.rampCooldown<=0){
      (l.ramps||[]).some((r,i)=>{
       if(oy>r.y+6&&p.y<=r.y+6&&p.x>r.x+10&&p.x<r.x+r.w-10&&p.vy<-55){
        p.vz=-p.vy*Math.sin(RAMP_ANGLE);p.vy*=Math.cos(RAMP_ANGLE);p.z=1;p.jumps++;p.rampCooldown=.6;p.lastRamp=i;event(p,'jump');return true;
       }return false;
      });
     }
    }
   }
   checkHazards(p,l,ox,oy,oldT,!!p.held);
   if(p.failed||p.won)break;
  }
 };
 P.moveHeld=function(p,l,x,y){
  init(p);if(p.failed||!Number.isFinite(x)||!Number.isFinite(y))return;
  const dx=x-p.x,dy=y-p.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
  for(let i=0;i<n;i++){
   const ox=p.x,oy=p.y;baseHeld(p,l,p.x+dx/n,p.y+dy/n);
   checkHazards(p,l,ox,oy,p.clock,true);
   if(p.failed||!p.stopped)break;
  }
 };
 P.simulate=function(l,start,vx,vy){
  const p=Object.assign(P.create(l),start||{});p.stopped=true;P.launch(p,vx,vy);
  let ticks=0;while(!p.stopped&&!p.failed&&ticks++<7000)P.step(p,l);return p;
 };
}
let art=null,ring=null;const snowCache=new Map();
function bindArt(a){art=a;snowCache.clear();}
function ellipse(g,x,y,rx,ry,c){art.pixelEllipse(g,x,y,rx,ry,c);}
function rect(g,x,y,w,h,c){art.rect(g,x,y,w,h,c);}
function fish(g,x,y,s=1){art.drawFish(g,x,y,s);}
function ringSprite(){
 if(ring)return ring;ring=art.off(76,45);const g=ring.getContext('2d');
 ellipse(g,38,27,35,15,'#628c9738');
 for(let y=4;y<40;y++)for(let x=3;x<73;x++){
  const dx=x-38,dy=y-21,outer=dx*dx/(34*34)+dy*dy/(15*15),inner=dx*dx/(23*23)+dy*dy/(8*8);
  if(outer>1||inner<1)continue;
  const edge=outer>.87||inner<1.30,band=Math.floor((Math.atan2(dy/15,dx/34)+Math.PI)/(.25*Math.PI))%2;
  rect(g,x,y,1,1,edge?(dy>4?'#ba7965':'#dbad91'):band?'#eea08a':'#fff3d5');
 }
 rect(g,6,22,6,3,'#eee0bc');rect(g,64,22,6,3,'#eee0bc');return ring;
}
function drawRing(g,x,y,s=1){g.imageSmoothingEnabled=false;g.drawImage(ringSprite(),x-38*s,y-21*s,76*s,45*s);}
function sign(g,x,y,text,small=false){
 rect(g,x-2,y,4,24,'#937656');rect(g,x-25,y-17,50,24,'#967252');rect(g,x-26,y-18,50,22,'#dfc99e');rect(g,x-23,y-16,44,3,'#eee0bb');
 rect(g,x-23,y-13,2,2,'#937656');rect(g,x+18,y-1,2,2,'#937656');art.label(g,text,x-1,y-3,small?7:8,'#685947');
}
function master(g,x,y,s=1){
 art.drawBird(g,x,y,0,s,false,0);
 rect(g,x-11*s,y-21*s,22*s,5*s,'#c78165');rect(g,x+5*s,y-18*s,5*s,13*s,'#e3a17c');
 rect(g,x-9*s,y-25*s,5*s,2*s,'#adc8c1');rect(g,x+4*s,y-25*s,5*s,2*s,'#adc8c1');
 rect(g,x-21*s,y-16*s,12*s,17*s,'#a98055');rect(g,x-20*s,y-15*s,10*s,13*s,'#f6e6c3');rect(g,x-17*s,y-18*s,4*s,3*s,'#729399');
 rect(g,x-18*s,y-10*s,5*s,1*s,'#ba9d78');rect(g,x-18*s,y-6*s,5*s,1*s,'#ba9d78');
}
function drawSnow(g,z,time){
 const key=[z.w,z.h].join(':');let c=snowCache.get(key);
 if(!c){
  c=art.off(Math.ceil(z.w),Math.ceil(z.h));const a=c.getContext('2d');
  rect(a,1,3,z.w-2,z.h-5,'#b9d2cf');rect(a,0,0,z.w,z.h-4,'#edf1e2');
  for(let y=7;y<z.h-5;y+=15)for(let x=5;x<z.w-4;x+=20){
   const n=((x*71+y*133)%19),cx=x+n*.28,cy=y+n*.2;
   ellipse(a,cx,cy+3,12,5,'#d8e4d9');ellipse(a,cx,cy,12,5,'#ffffef');
   rect(a,cx-7,cy+1,6,1,'#edf2e5');
  }
  for(let y=6;y<z.h-8;y+=21){ellipse(a,5,y,6,7,'#fffdef');ellipse(a,z.w-5,y+7,6,7,'#fffdef');}
  for(let x=8;x<z.w-7;x+=19){ellipse(a,x,6,11,6,'#fffdef');ellipse(a,x,z.h-8,10,5,'#fffdef');}
  snowCache.set(key,c);
 }
 g.drawImage(c,z.x,z.y);
 if(!art.reduced){for(let i=0;i<3;i++){const u=(time*.6+i*.33)%1;if(u>.45&&u<.67){const x=z.x+12+((i*37+29)%(Math.max(1,z.w-24))),y=z.y+16+((i*61+17)%(Math.max(1,z.h-32)));rect(g,x-2,y,5,1,'#fffef5');rect(g,x,y-2,1,5,'#fffef5');}}}
}
function drawGap(g,r,t){
 rect(g,r.x,r.y,r.w,r.h,'#38657c');rect(g,r.x+2,r.y+5,r.w-4,r.h-9,'#568b9f');
 for(let y=r.y+18;y<r.y+r.h-8;y+=20){const shift=art.reduced?0:Math.sin(t*.65+y)*3;for(let x=r.x+9;x<r.x+r.w-12;x+=47){rect(g,x+shift,y,17,2,'#8bb7c3');rect(g,x+11+shift,y+3,10,1,'#72a3b3');}}
 for(let x=r.x;x<r.x+r.w;x+=19){const a=((x*7)%13);rect(g,x,r.y-4,19,6+a*.2,'#fbfcf1');rect(g,x+2,r.y+2,15,5+a*.3,'#abcdd2');rect(g,x,r.y+r.h-4-a*.3,19,7+a*.3,'#b7d6d8');rect(g,x,r.y+r.h,19,5,'#fbfcf1');}
 // White ice shards distinguish a real opening from faint decorative cracks.
 rect(g,r.x+27,r.y+22,14,5,'#c6e3e1');rect(g,r.x+r.w-49,r.y+r.h-30,18,6,'#aecfd5');
}
function drawRamp(g,r){
 rect(g,r.x-3,r.y+8,r.w+6,r.h,'#628c963b');rect(g,r.x,r.y,r.w,r.h,'#916e55');
 rect(g,r.x+5,r.y+4,r.w-10,r.h-8,'#d6b98a');
 for(let y=r.y+6;y<r.y+r.h-5;y+=10){rect(g,r.x+6,y,r.w-12,5,'#eed4a4');rect(g,r.x+6,y+7,r.w-12,1,'#b79269');}
 rect(g,r.x,r.y,6,r.h,'#a77853');rect(g,r.x+r.w-6,r.y,6,r.h,'#a77853');rect(g,r.x-3,r.y-4,r.w+6,7,'#f6e9c7');rect(g,r.x+1,r.y-3,r.w-2,2,'#fff8dd');
 const x=r.x+r.w/2,y=r.y+r.h/2;rect(g,x-3,y-4,6,18,'#b88665');rect(g,x-8,y-1,16,4,'#b88665');rect(g,x-6,y-5,12,4,'#b88665');rect(g,x-3,y-8,6,3,'#b88665');
 for(const xx of [r.x-7,r.x+r.w+5]){rect(g,xx,r.y-26,2,27,'#927351');rect(g,xx+2,r.y-25,13,7,'#d88970');rect(g,xx+2,r.y-18,9,4,'#ebb198');}
}
function drawGoal(g,l,p,t){
 const x=l.goal.x,y=l.goal.y;
 ellipse(g,x,y+8,34,11,'#abcac33d');ellipse(g,x,y+2,28,11,'#b38464');ellipse(g,x,y,28,11,'#f2d8aa');ellipse(g,x,y-1,23,8,'#fff4d6');
 // A little picnic cloth, placed by the master. The contact target is still the fish.
 rect(g,x-19,y-6,38,12,'#f8e9cd');for(let i=0;i<6;i++)for(let j=0;j<2;j++)if((i+j)%2===0)rect(g,x-18+i*6,y-6+j*6,6,6,'#dda28a');
 const side=x>220?-1:1,bx=x+side*53;
 rect(g,bx-9,y+1,18,17,'#86a8ab');rect(g,bx-11,y-1,22,4,'#d3e1d6');rect(g,bx-6,y+5,3,9,'#bed1c7');fish(g,bx,y-2,.7);
 if(!p.won){fish(g,x,y-4+(art.reduced?0:Math.sin(t*2)*1.2),1.55);const v=Math.sin(t*2.8);if(v>.3){rect(g,x-24,y-22,5,1,'#d3a35d');rect(g,x-22,y-24,1,5,'#d3a35d');}art.label(g,'ごほうび',x,y-33,9,'#9b795a');}
}
function terrain(g,l,p,t,minY,maxY){
 const visible=r=>r.y<maxY&&r.y+(r.h||60)>minY;
 for(const r of l.gaps||[])if(visible(r))drawGap(g,r,t);
 for(const r of l.snow||[])if(visible(r))drawSnow(g,r,t);
 for(const r of l.ramps||[])if(visible(r))drawRamp(g,r);
 if(l.start.y>minY-50&&l.start.y<maxY+50){
  drawRing(g,l.start.x,l.start.y+1,.92);
  const side=l.start.x<180?1:-1,sx=clamp(l.start.x+side*82,63,296);
  sign(g,sx,l.start.y+45,'れんしゅう');
  for(let i=0;i<4;i++){ellipse(g,sx-5+(i%2)*9,l.start.y+3-i*16,2,3,'#b6d2cd');}
  master(g,sx,l.start.y-24,1.18);
 }
 if(l.goal.y>minY-70&&l.goal.y<maxY+70)drawGoal(g,l,p,t);
 // Handmade course boundary: repairs, rope lashings and small flags stay off the path.
 for(let y=Math.max(170,Math.floor(minY/340)*340+170);y<Math.min(l.height-170,maxY);y+=340){
  const right=(Math.floor(y/340)%2)===1,x=right?338:16;
  rect(g,x-1,y-29,3,34,'#967652');rect(g,x-2,y-31,5,3,'#e9d9b5');rect(g,right?x-14:x+3,y-27,12,7,'#e2a084');rect(g,right?x-10:x+3,y-20,8,3,'#f3c3a4');
  rect(g,x-4,y,9,3,'#d6c1a0');rect(g,x-4,y+4,9,2,'#d6c1a0');
 }
}
function belly(g,a){
 const x=a.x,y=a.y;g.save();g.translate(x,y);g.scale(a.dir,1);
 ellipse(g,-2,3,21,8,'#53899b2e');ellipse(g,-2,-3,21,10,'#214658');ellipse(g,-4,0,17,7,'#f5efdb');ellipse(g,14,-5,9,8,'#30576b');ellipse(g,16,-3,6,5,'#fff1d6');
 rect(g,16,-8,2,2,'#173749');rect(g,22,-5,7,3,'#eab265');rect(g,-23,-1,6,3,'#d29b62');rect(g,-24,3,6,3,'#d29b62');rect(g,-5,-12,12,4,'#3d6578');
 for(let i=0;i<3;i++)rect(g,-32-i*11,4+(i%2)*4,6,1,'#abcac8');g.restore();
}
function fisher(g,h,a){
 const x=h.side<0?10:350,y=h.y-65;
 rect(g,x-11,y+3,22,6,'#987854');rect(g,x-8,y-4,3,9,'#bd9b70');rect(g,x+6,y-4,3,9,'#bd9b70');
 ellipse(g,x,y-12,9,13,'#76979c');ellipse(g,x,y-28,8,8,'#f1d1aa');rect(g,x-9,y-37,18,7,'#b97e68');rect(g,x-11,y-31,21,4,'#e3a087');rect(g,x+(h.side<0?3:-5),y-28,2,2,'#355467');rect(g,x-8,y+1,18,3,'#416573');
 const tipX=x+(h.side<0?38:-38),tipY=y-63;
 g.strokeStyle='#927650';g.lineWidth=2;g.beginPath();g.moveTo(x,y-17);g.lineTo(tipX,tipY);g.stroke();
 g.strokeStyle='#93adb0';g.lineWidth=1;g.beginPath();g.moveTo(tipX,tipY);g.quadraticCurveTo(a.x,tipY-7,a.x,a.y-a.z-10);g.stroke();
 const hy=a.y-a.z;
 if(a.active||a.warning){g.fillStyle=a.active?'#c7836724':'#bcd1c522';g.beginPath();g.ellipse(a.x,a.y,20,8,0,0,TAU);g.fill();}
 ellipse(g,a.x,hy-11,4,6,'#d8977d');rect(g,a.x-3,hy-10,6,2,'#ffead0');
 g.strokeStyle='#527180';g.lineWidth=2;g.beginPath();g.moveTo(a.x,hy-5);g.lineTo(a.x,hy+5);g.arc(a.x-4,hy+5,4,0,Math.PI);g.lineTo(a.x-8,hy+1);g.stroke();
}
function life(g,l,p,t,minY,maxY){
 for(const lane of l.lanes||[]){
  if(lane.y<minY-40||lane.y>maxY+40)continue;
  const a=laneAt(lane,t),x=lane.dir>0?34:326;
  rect(g,x-2,lane.y-30,3,22,'#a17f58');rect(g,x-9,lane.y-36,19,10,a.warning?'#d68a72':'#e5d3af');
  art.label(g,lane.dir>0?'›':'‹',x,lane.y-28,12,a.warning?'#fff1d4':'#937553');
  if(a.active)belly(g,a);
 }
 for(const h of l.hooks||[])if(h.y>minY-110&&h.y<maxY+140)fisher(g,h,hookAt(h,t));
}
function paintBird(g,p,phase,t){
 const lift=p.failed==='hook'?Math.min(90,p.failureAge*110):Math.min(150,p.z||0);
 let s=1.25,dy=0,alpha=1;
 if(p.failed==='gap'){s*=Math.max(.32,1-p.failureAge*1.15);dy=Math.min(26,p.failureAge*38);alpha=Math.max(.15,1-p.failureAge);}
 if(lift>1){ellipse(g,p.x,p.y+2,16/(1+lift*.012),5/(1+lift*.012),'#34657a38');}
 g.save();g.globalAlpha=alpha;art.drawBird(g,p.x,p.y-lift+dy,p.angle,s,Math.floor(t*4)%19===0,p.squash,lift<=1&&!p.failed);g.restore();
 if(p.failed==='hook'){g.strokeStyle='#759799';g.lineWidth=1;g.beginPath();g.moveTo(p.x,p.y-lift-26);g.lineTo(p.x+4,p.y-125);g.stroke();}
 if(p.failed==='gap'&&p.failureAge>.18){ellipse(g,p.x,p.y+7,21,7,'#8cbbc350');drawRing(g,p.x,p.y+9,.65);}
 if(p.won)fish(g,p.x+3,p.y-15,1.05);
 if(phase==='ready'&&!p.failed&&p.stopped&&(t%4.8)>2.7){art.label(g,'z',p.x+24,p.y-38-(t%1)*4,10,'#809f9f');}
}
const api={install,extraLevels,laneAt,hookAt,bindArt,terrain,life,paintBird,master,drawRing,GRAVITY,RAMP_ANGLE};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SuwariWorld=api;
})(typeof window!=='undefined'?window:globalThis);
