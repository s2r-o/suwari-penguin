/* Suwari Penguin 0.8: the master's handmade training grounds.
 * No network, packages, analytics or random gameplay. Existing input/ice physics stay in index.html.
 */
(function(root){
'use strict';
const TAU=Math.PI*2, GRAVITY=640, RAMP_ANGLE=26*Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inside=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const extraLevels=[
 // Broad take-off banks and open landings: approach speed, not a narrow aim test.
 {name:'師匠、橋は？',hint:'幅の広い台へ、勢いを残して。斜めでも飛べます。',height:1520,shots:2,start:{x:110,y:1400},goal:{x:252,y:135},walls:[],snow:[],ramps:[{x:26,y:930,w:308,h:70}],gaps:[{x:26,y:705,w:308,h:200}],lesson:'勢いで川を越える'},
 {name:'先輩、お先に。',hint:'先輩が通り過ぎてから、スッ。',height:1550,shots:1,start:{x:180,y:1430},goal:{x:180,y:140},walls:[],snow:[],lanes:[{y:980,speed:370,period:3.8,offset:1.1,dir:1},{y:565,speed:420,period:4.6,offset:2.7,dir:-1}],lesson:'腹すべりの先輩'},
 {name:'おさかな、じゃない。',hint:'針が上がっている間に、通り抜けよう。',height:1530,shots:1,start:{x:105,y:1410},goal:{x:252,y:145},walls:[],snow:[],hooks:[{x:148,y:955,sway:76,period:4.8,offset:.3,side:-1},{x:218,y:535,sway:65,period:5.2,offset:2.4,side:1}],lesson:'釣り人'},
 {name:'雪より、まわり道。',hint:'雪を抜けるか、横から勢いを残すか。',height:2040,shots:2,start:{x:105,y:1920},goal:{x:252,y:140},walls:[],snow:[{x:132,y:1420,w:96,h:170,factor:3.7}],ramps:[{x:26,y:1200,w:308,h:70}],gaps:[{x:26,y:965,w:308,h:200}],lanes:[{y:740,speed:390,period:4.4,offset:2,dir:1}],lesson:'川までのルート選び'},
 {name:'雪で、ひとやすみ。',hint:'雪でひと休み。針の動きを見て、もう一打。',height:2110,shots:2,start:{x:95,y:1990},goal:{x:264,y:145},walls:[{x:26,y:1400,w:173,h:42},{x:215,y:510,w:119,h:42}],snow:[{x:207,y:1050,w:111,h:150,factor:3.7},{x:38,y:600,w:88,h:135,factor:3.7}],hooks:[{x:190,y:815,sway:86,period:5.2,offset:1.4,side:-1}],lesson:'止まる場所も作戦'},
 {name:'師匠の力作。',hint:'川を越えたら、着地した場所からもう一打。',height:2230,shots:2,start:{x:258,y:2110},goal:{x:112,y:140},walls:[{x:26,y:740,w:115,h:42}],snow:[{x:118,y:1760,w:100,h:145,factor:3.7}],ramps:[{x:26,y:1500,w:308,h:70}],gaps:[{x:26,y:1260,w:308,h:210}],lanes:[{y:1020,speed:375,period:4.5,offset:2.2,dir:1}],hooks:[{x:215,y:490,sway:62,period:5.4,offset:1.7,side:1}],lesson:'着地後にも余裕を'},
 {name:'近道は、ふかふか。',hint:'雪を横切る近道と、氷をすべるまわり道。',height:1770,shots:2,start:{x:90,y:1650},goal:{x:265,y:140},walls:[{x:26,y:700,w:155,h:42}],snow:[{x:128,y:970,w:115,h:205,factor:3.7},{x:245,y:380,w: 70,h:120,factor:3.7}],lesson:'距離と減速の選択'},
 {name:'先輩、今はだめ。',hint:'雪で止まる場所を決めて、先輩を待とう。',height:1870,shots:2,start:{x:260,y:1750},goal:{x:95,y:140},walls:[{x:225,y:510,w:109,h:42}],snow:[{x:207,y:1040,w:115,h:130,factor:3.7}],lanes:[{y:1330,speed:350,period:4.6,offset:.8,dir:-1},{y:780,speed:410,period:4.3,offset:2.3,dir:1}],lesson:'止まる場所と出発の時刻'},
 {name:'左右、どちらから？',hint:'壁を避けて、川まで勢いを残そう。',height:1900,shots:2,start:{x:180,y:1780},goal:{x:260,y:145},walls:[{x:145,y:1500,w:70,h:55}],snow:[{x:40,y:1350,w:94,h:115,factor:3.7}],ramps:[{x:26,y:1250,w:308,h:70}],gaps:[{x:26,y:1000,w:308,h:220}],lesson:'左右で違う助走'},
 {name:'釣られない、昼ごはん。',hint:'左右に余白。針を待つか、よけて進むか。',height:1940,shots:2,start:{x:100,y:1820},goal:{x:263,y:145},walls:[{x:148,y:1110,w:64,h:42}],snow:[{x:240,y:630,w:82,h:140,factor:3.7}],hooks:[{x:155,y:1430,sway:62,period:5.2,offset:.6,side:-1},{x:210,y:835,sway:70,period:5.8,offset:2.8,side:1},{x:125,y:380,sway:46,period:5.4,offset:1.4,side:-1}],lesson:'安全な場所で待つ'},
 {name:'ぶつかるほど、のんびり。',hint:'反射は便利。でも、ぶつかるたびに勢いが減る。',height:2240,shots:2,start:{x:255,y:2120},goal:{x:108,y:140},walls:[{x:198,y:1580,w:136,h:42},{x:26,y:1110,w:140,h:42},{x:210,y:565,w:124,h:42}],snow:[{x:40,y:1640,w:85,h:125,factor:3.7}],lanes:[{y:825,speed:380,period:4.8,offset:1.9,dir:-1}],lesson:'反射の回数を考える'},
 {name:'今日も、魚だけ。',hint:'雪、川、先輩、釣り人。頑張るのは、指のほう。',height:2370,shots:2,start:{x:180,y:2250},goal:{x:248,y:145},walls:[{x:26,y:450,w:90,h:42}],snow:[{x:131,y:1810,w:98,h:145,factor:3.7},{x:240,y:820,w:82,h:105,factor:3.7}],ramps:[{x:26,y:1500,w:308,h:70}],gaps:[{x:26,y:1235,w:308,h:230}],lanes:[{y:1050,speed:390,period:4.6,offset:1.6,dir:1}],hooks:[{x:157,y:635,sway:72,period:5.5,offset:2.1,side:-1}],lesson:'師匠の追加修行・総仕上げ'}
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
// A single shared rig owns the rod tip, hook contact and caught bird pose.
function rodAt(h){
 const x=h.side<0?10:350,y=h.y-65;
 return {x,y,tip:{x:x+(h.side<0?38:-38),y:y-63}};
}
const GRIP={x:-2.5,y:-36.25}; // Top of the existing 1.25x seated sprite.
function catchRig(p){
 if(p.failed!=='hook'||!p.caught)return null;
 const c=p.caught,u=clamp(p.failureAge/.95,0,1),ease=u*u*(3-2*u);
 const targetY=Math.min(c.y,c.tip.y+18-GRIP.y);
 const x=c.x+(c.tip.x-GRIP.x-c.x)*.22*ease;
 const y=c.y+(targetY-c.y)*ease;
 return {hookIndex:c.hookIndex,tip:c.tip,body:{x,y},grip:{x:x+GRIP.x,y:y+GRIP.y},progress:ease};
}
function flightFrame(p,reduced=false){
 return !p.failed&&(p.z||0)>1?(reduced?0:Math.floor((p.clock||0)*12)%4):-1;
}
function init(p){
 if(!Number.isFinite(p.clock))Object.assign(p,{clock:0,z:0,vz:0,failed:null,failureAge:0,caught:null,splash:null,jumps:0,landings:0,bumps:0,events:[],lastRamp:-1,rampCooldown:0,bumpUntil:{}});
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
  const gap=p.z<=3&&(l.gaps||[]).find(r=>inside(p,r));
  if(gap){
   p.splash={x:p.x,y:p.y,angle:p.angle,lift:Math.max(0,p.z||0),gap:{x:gap.x,y:gap.y,w:gap.w,h:gap.h}};
   fail(p,'gap');return;
  }
  for(let i=0;i<(l.hooks||[]).length;i++){
   const h=l.hooks[i],a=hookAt(h,oldT),b=hookAt(h,p.clock);
   if(b.active&&Math.abs(p.z-b.z)<27&&segmentDistance(0,0,ox-a.x,oy-a.y,p.x-b.x,p.y-b.y)<21){
    p.caught={hookIndex:i,x:p.x,y:p.y-Math.min(150,p.z||0),tip:{...rodAt(h).tip}};
    fail(p,'hook');return;
   }
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
       // The whole broad wooden lip works; no centre target, aim snapping or speed boost.
       const lip=r.y+6,dy=oy-p.y;
       const atLip=dy>0?ox+(p.x-ox)*(oy-lip)/dy:p.x;
       if(oy>lip&&p.y<=lip&&atLip>=r.x+4&&atLip<=r.x+r.w-4&&p.vy<-40){
        const entrySpeed=Math.hypot(p.vx,p.vy),entryAngle=Math.atan2(p.vx,-p.vy);
        p.vz=-p.vy*Math.sin(RAMP_ANGLE);p.vy*=Math.cos(RAMP_ANGLE);p.z=1;p.jumps++;p.rampCooldown=.6;p.lastRamp=i;
        event(p,'jump',{entrySpeed,entryAngle});return true;
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
 for(const f of [.18,.5,.82]){const x=r.x+r.w*f,y=r.y+r.h/2;rect(g,x-3,y-4,6,18,'#b88665');rect(g,x-8,y-1,16,4,'#b88665');rect(g,x-6,y-5,12,4,'#b88665');rect(g,x-3,y-8,6,3,'#b88665');}
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
function tether(g,tip,grip,caught=false){
 // The line ends at the hook eye; the hook point ends at the sprite grip.
 const eye={x:grip.x+5,y:grip.y-12};
 g.strokeStyle='#759799';g.lineWidth=1;g.beginPath();g.moveTo(tip.x,tip.y);
 if(caught)g.quadraticCurveTo((tip.x+eye.x)/2,(tip.y+eye.y)/2+2,eye.x,eye.y);
 else g.quadraticCurveTo(eye.x,tip.y-7,eye.x,eye.y);
 g.stroke();
 ellipse(g,eye.x,eye.y,3,5,'#d8977d');rect(g,eye.x-2,eye.y-1,4,2,'#ffead0');
 g.strokeStyle='#527180';g.lineWidth=2;g.beginPath();g.moveTo(eye.x,eye.y+2);
 g.lineTo(eye.x,grip.y-3);g.quadraticCurveTo(eye.x,grip.y+4,grip.x,grip.y);
 g.lineTo(grip.x,grip.y-2);g.stroke();
}
function fisher(g,h,a,attached=false){
 const rod=rodAt(h),{x,y}=rod;
 rect(g,x-11,y+3,22,6,'#987854');rect(g,x-8,y-4,3,9,'#bd9b70');rect(g,x+6,y-4,3,9,'#bd9b70');
 ellipse(g,x,y-12,9,13,'#76979c');ellipse(g,x,y-28,8,8,'#f1d1aa');rect(g,x-9,y-37,18,7,'#b97e68');rect(g,x-11,y-31,21,4,'#e3a087');rect(g,x+(h.side<0?3:-5),y-28,2,2,'#355467');rect(g,x-8,y+1,18,3,'#416573');
 g.strokeStyle='#927650';g.lineWidth=2;g.beginPath();g.moveTo(x,y-17);g.lineTo(rod.tip.x,rod.tip.y);g.stroke();
 // A caught hook is painted with the bird, never as another dangling hook.
 if(attached)return;
 if(a.active||a.warning){g.fillStyle=a.active?'#c7836724':'#bcd1c522';g.beginPath();g.ellipse(a.x,a.y,20,8,0,0,TAU);g.fill();}
 tether(g,rod.tip,{x:a.x,y:a.y-a.z});
}
function life(g,l,p,t,minY,maxY){
 for(const lane of l.lanes||[]){
  if(lane.y<minY-40||lane.y>maxY+40)continue;
  const a=laneAt(lane,t),x=lane.dir>0?34:326;
  rect(g,x-2,lane.y-30,3,22,'#a17f58');rect(g,x-9,lane.y-36,19,10,a.warning?'#d68a72':'#e5d3af');
  art.label(g,lane.dir>0?'›':'‹',x,lane.y-28,12,a.warning?'#fff1d4':'#937553');
  if(a.active)belly(g,a);
 }
 const rig=catchRig(p);
 (l.hooks||[]).forEach((h,i)=>{
  const attached=rig?.hookIndex===i;
  if(attached||(h.y>minY-110&&h.y<maxY+140))fisher(g,h,hookAt(h,t),attached);
 });
}
// Presentation only. The fall has already failed; this never moves the collider.
const WATER_RESULT_DELAY=2.15;
const smooth=v=>{const u=clamp(v,0,1);return u*u*(3-2*u);};
function waterPose(p,reduced=false){
 if(p.failed!=='gap')return null;
 const c=p.splash||{x:p.x,y:p.y,angle:p.angle||0,lift:0},gap=c.gap;
 const age=reduced?1.3:Math.max(0,p.failureAge||0);
 const stage=age<.34?'splash':age<.62?'under':age<1.0?'surface':'float';
 // Nudge the visual bob into the opening so a bank cannot hide the returning face.
 const tx=gap?clamp(c.x,gap.x+27,gap.x+gap.w-27):c.x;
 const ty=gap?clamp(c.y,gap.y+35,gap.y+gap.h-18):c.y;
 const drift=smooth(age/.62),x=c.x+(tx-c.x)*drift,y=c.y+(ty-c.y)*drift;
 let depth;
 if(age<.34)depth=-(c.lift||0)+(48+(c.lift||0))*smooth(age/.34);
 else if(age<.62)depth=48;
 else if(age<1.0){const u=(age-.62)/.38;depth=48-30*smooth(u)-3*Math.sin(Math.PI*u);}
 else depth=18+(reduced?0:1.25*Math.sin((age-1)*5));
 const a=Math.atan2(Math.sin(c.angle||0),Math.cos(c.angle||0));
 return {age,stage,x,y,bodyY:y+depth,waterY:y+3,angle:a*(1-smooth((age-.28)/.55)),
  visible:stage!=='under',flap:!reduced&&age<.2?Math.floor(age*15)%4:-1,
  blink:stage==='float'&&(reduced||(age>1.3&&age<1.55)),gap};
}
function waterRipple(g,x,y,rx,ry,opacity){
 if(opacity<=0)return;
 g.save();g.globalAlpha*=opacity;
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++){
  const f=1-(yy/ry)**2;if(f<0)continue;
  const xx=Math.sqrt(f)*rx;
  rect(g,x-xx,y+yy,2,1,'#bddfe2');rect(g,x+xx-1,y+yy,2,1,'#bddfe2');
 }
 g.restore();
}
function paintWaterFall(g,p){
 const q=waterPose(p,art.reduced);if(!q)return;
 const {x,y,age}=q;
 // Ripples live on the water plane and cannot paint over the snowy banks.
 g.save();if(q.gap){g.beginPath();g.rect(q.gap.x+2,q.gap.y+8,q.gap.w-4,q.gap.h-15);g.clip();}
 if(!art.reduced){
  for(let i=0;i<2;i++){
   const u=(age-i*.16)/.8;
   if(u>=0&&u<1)waterRipple(g,x,q.waterY+2,14+32*u,4+8*u,(1-u)*.8);
  }
 }
 if(age>.68){
  waterRipple(g,x,q.waterY+1,19+(art.reduced?0:Math.sin(age*3)),5,.72);
  waterRipple(g,x,q.waterY+3,27,7,.25);
 }
 g.restore();
 // Keep the original sitting silhouette and size; occlusion, not shrinking, submerges it.
 if(q.visible){
  g.save();g.beginPath();g.rect(x-65,q.waterY-110,130,110);g.clip();
  art.drawBird(g,x,q.bodyY,q.angle,1.25,q.blink,0,false,q.flap);
  g.restore();
 }
 // A small, lopsided splash. Fixed trajectories keep replay and screenshots reproducible.
 if(!art.reduced&&age<.58){
  const u=age/.58;
  g.save();g.globalAlpha*=1-smooth((u-.65)/.35);
  for(let i=0;i<7;i++){
   const dir=i-3,dx=dir*(5+14*u),dy=-Math.sin(Math.PI*u)*(17+(i%3)*7);
   rect(g,x+dx,q.waterY+dy,3,4,'#c5e7e9');rect(g,x+dx+1,q.waterY+dy-2,2,2,'#f5fbef');
  }
  g.restore();
 }
 // A beat of silence: only two bubbles before the face returns.
 if(!art.reduced&&age>.36&&age<.73){
  for(let i=0;i<2;i++){
   const u=clamp((age-.37-i*.08)/.22,0,1);
   if(u>0&&u<1)waterRipple(g,x+(i?7:-5),q.waterY-2-u*8,2+u,2+u,.9*(1-u*.6));
  }
 }
 if(age>.68){
  rect(g,x-15,q.waterY,11,1,'#badce0');rect(g,x+6,q.waterY+1,10,1,'#d2e8e5');
 }
}
function paintBird(g,p,phase,t){
 if(p.failed==='gap'){paintWaterFall(g,p);return;}
 const rig=catchRig(p),lift=Math.min(150,p.z||0);
 const pose=rig?rig.body:{x:p.x,y:p.y-lift};
 let s=1.25,dy=0,alpha=1;
 const height=Math.max(lift,p.y-pose.y);
 if(height>1)ellipse(g,p.x,p.y+2,16/(1+height*.012),5/(1+height*.012),'#34657a38');
 const flap=flightFrame(p,art.reduced);
 g.save();g.globalAlpha=alpha;
 art.drawBird(g,pose.x,pose.y+dy,p.angle,s,flap<0&&Math.floor(t*4)%19===0,p.squash,height<=1&&!p.failed,flap);
 g.restore();
 // This is the only captured line, connected to the same rod tip as the fisherman.
 if(rig)tether(g,rig.tip,rig.grip,true);
 if(flap>=0){
  const yy=pose.y-33+(art.reduced?0:[0,3,6,2][flap]);
  rect(g,pose.x+23,yy,2,3,'#6cabc0');rect(g,pose.x+22,yy+3,4,2,'#a5d4df');
 }
 if(p.won)fish(g,p.x+3,p.y-15,1.05);
 if(phase==='ready'&&!p.failed&&p.stopped&&(t%4.8)>2.7)art.label(g,'z',p.x+24,p.y-38-(t%1)*4,10,'#809f9f');
}
const api={install,extraLevels,laneAt,hookAt,rodAt,catchRig,flightFrame,waterPose,WATER_RESULT_DELAY,bindArt,terrain,life,paintBird,master,drawRing,GRAVITY,RAMP_ANGLE};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SuwariWorld=api;
})(typeof window!=='undefined'?window:globalThis);
