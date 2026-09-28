'use strict';
// Run: node tests/v07.cjs. No dependencies. Tests use the shipped physics code.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function moduleOf(code){const m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const P=moduleOf(scripts[0]),levels=moduleOf(scripts[1]);
const W=moduleOf(fs.readFileSync(path.join(root,'world.js'),'utf8'));W.install(P);levels.push(...W.extraLevels);
let checks=0;function ok(v,msg){assert.ok(v,msg);checks++;}function close(a,b,tol=.001){ok(Math.abs(a-b)<tol,`${a} != ${b}`);}
function finish(p,l){let n=0;while(!p.stopped&&!p.failed&&n++<6000)P.step(p,l);return p;}
const field={height:22000,start:{x:180,y:20000},goal:{x:1e6,y:1e6},walls:[],snow:[]};
ok(levels.length===20);close(P.C.restitution,.8);close(P.C.snowGrip,1.4);
for(const factor of [1,3.7*1.4]){
 const l={...field,snow:factor===1?[]:[{x:26,y:1,w:308,h:21990,factor:3.7}]},p=P.create(l);P.launch(p,0,-500);finish(p,l);close(20000-p.y,500**2/(2*90*factor));
}
const wall=P.create(field);wall.vx=270;wall.vy=-500;P.reflect(wall,0,1);close(wall.vx,270);close(wall.vy,400);
ok(P.gesture([{x:0,y:0,t:0},{x:0,y:-90,t:60},{x:0,y:-90,t:200}])===null);
function cross(l,speed,angle=0,x=180,y=l.ramps[0].y+8){
 const p=Object.assign(P.create(l),{x,y}),a=angle*Math.PI/180;P.launch(p,Math.sin(a)*speed,-Math.cos(a)*speed);
 let n=0;while(!p.stopped&&!p.failed&&n++<4000){P.step(p,l);if(p.jumps&&p.y<l.gaps[0].y-12&&p.z<3)return true;}return false;
}
let samples=0;const thresholds=[];
for(const l of levels.filter(l=>l.ramps?.length)){
 const r=l.ramps[0];ok(r.w===308);ok(l.shots===1);
 const bare={...l,walls:[],snow:[],hooks:[],lanes:[],goal:field.goal};
 // Intermediate pace no longer clears the river; stronger entry still does.
 ok(!cross(bare,420),l.name+' must require more energy');ok(cross(bare,500),l.name+' adequate entry clears');
 let lo=100,hi=900;for(let i=0;i<16;i++){const mid=(lo+hi)/2;if(cross(bare,mid))hi=mid;else lo=mid;}thresholds.push(hi);
 for(const x of [60,120,180,240,300])for(const a of [-25,-15,0,15,25]){
  ok(cross(bare,600,a,x,r.y+r.h+20),`${l.name} ${x}/${a}`);samples++;
 }
}
const routes=[[[0,500]],[[8.461288142571364,1000]],[[-40,1100]],[[-36,1200]],[[20,1000]],[[-44,1100]],[[-32,700]],[[-40,900]],[[6.404809150080983,550]],[[0,500]],[[6.6283574753298256,500]],[[-10,575]],[[-36,800]],[[-4,600]],[[6.610747357043885,700]],[[-5.851498551591724,600]],[[-14,650]],[[-20,1200]],[[-32,1100]],[[-10,650]]];
for(let i=0;i<levels.length;i++){
 const l=levels[i],p=P.create(l);ok(routes[i].length<=l.shots);
 for(const [angle,speed] of routes[i]){const a=angle*Math.PI/180;P.launch(p,Math.sin(a)*speed,-Math.cos(a)*speed);finish(p,l);}ok(p.won,`stage ${i+1} route`);
}
// Every hook, both banks, captures its own rod and has no initial body teleport.
let captures=0;
for(const l of levels)for(let i=0;i<(l.hooks||[]).length;i++){
 const h=l.hooks[i];let t=0;while(!W.hookAt(h,t).active)t+=.01;
 const a=W.hookAt(h,t),p=Object.assign(P.create(l),{x:a.x,y:a.y,clock:t});P.step(p,l);
 ok(p.failed==='hook',`capture ${l.name}/${i}`);ok(p.caught.hookIndex===i);
 p.failureAge=0;let rig=W.catchRig(p);close(rig.body.x,p.x);close(rig.body.y,p.y);
 let lastY=rig.body.y;
 for(const age of [0,.1,.3,.6,.95,1.2]){
  p.failureAge=age;rig=W.catchRig(p);const tip=W.rodAt(h).tip;
  close(rig.tip.x,tip.x);close(rig.tip.y,tip.y);close(rig.grip.x,rig.body.x-2.5);close(rig.grip.y,rig.body.y-36.25);
  ok(rig.body.y<=lastY+.001);ok(rig.grip.y>=tip.y+17.999);lastY=rig.body.y;
 }
 ok(P.create(l).caught===null);captures++;
}
// The connected rig has one rod, one line and one hook, not a ghost second rig.
const h={x:180,y:900,side:-1,sway:0,period:5,offset:1},l={...field,hooks:[h]},p=Object.assign(P.create(l),{x:180,y:900});P.step(p,l);p.failureAge=.6;
let strokes=[],current=[],drawArgs;
const g=new Proxy({},{get:(_,k)=>k==='beginPath'?()=>{current=[];}:k==='stroke'?()=>strokes.push([...current]):(...a)=>current.push([k,...a]),set:()=>true});
W.bindArt({rect(){},pixelEllipse(){},label(){},drawBird(...a){drawArgs=a;},reduced:false});
W.life(g,l,p,p.clock,0,22000);W.paintBird(g,p,'lost',p.clock);
ok(strokes.length===3,'only one connected rig');
const rig=W.catchRig(p);ok(strokes.some(s=>s.some(c=>c[0]==='moveTo'&&c[1]===rig.tip.x&&c[2]===rig.tip.y)));
close(drawArgs[1],rig.body.x);close(drawArgs[2],rig.body.y);
// Air pose is visual only, loops through four states, and disappears on landing.
const flying=Object.assign(P.create(field),{z:80,vx:200,vy:-500});
for(let f=0;f<4;f++){
 flying.clock=(f+.1)/12;const before=JSON.stringify(flying);W.paintBird(g,flying,'sliding',flying.clock);
 ok(drawArgs[8]===f,'flapping frame');ok(!drawArgs[5],'no blink in air');ok(JSON.stringify(flying)===before,'drawing must not affect physics');
}
flying.z=0;ok(W.flightFrame(flying)===-1);flying.z=50;ok(W.flightFrame(flying,true)===0);flying.failed='hook';ok(W.flightFrame(flying)===-1);
console.log(JSON.stringify({status:'PASS',checks,approachSamples:samples,courseRoutes:20,hookCaptures:captures,entryThresholds:thresholds.map(x=>+x.toFixed(1))},null,2));
