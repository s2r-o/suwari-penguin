'use strict';
// Run: node tests/v06.cjs. No packages or browser required.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function moduleOf(code){const m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const P=moduleOf(scripts[0]),levels=moduleOf(scripts[1]);
const W=moduleOf(fs.readFileSync(path.join(root,'world.js'),'utf8'));W.install(P);levels.push(...W.extraLevels);
function close(a,b,tol=.001){assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);}
function finish(p,l){let n=0;while(!p.stopped&&!p.failed&&n++<5000)P.step(p,l);return p;}
const field={height:22000,start:{x:180,y:20000},goal:{x:1e6,y:1e6},walls:[],snow:[]};
assert.equal(levels.length,20);assert.equal(P.C.restitution,.8);assert.equal(P.C.snowGrip,1.4);
for(const factor of [1,3.7*1.4]){
 const l={...field,snow:factor===1?[]:[{x:26,y:1,w:308,h:21990,factor:3.7}]};const p=P.create(l);P.launch(p,0,-500);finish(p,l);close(20000-p.y,500**2/(2*90*factor));
}
const wall=P.create(field);wall.vx=270;wall.vy=-500;P.reflect(wall,0,1);close(wall.vx,270);close(wall.vy,400);
assert.equal(P.gesture([{x:0,y:0,t:0},{x:0,y:-90,t:60},{x:0,y:-90,t:200}]),null);
let samples=0;
for(const l of levels.filter(l=>l.ramps?.length)){
 const r=l.ramps[0],g=l.gaps[0];assert.ok(r.w>=280);assert.equal(l.shots,2);
 const bare={...l,walls:[],snow:[],hooks:[],lanes:[],goal:field.goal};
 const weak=Object.assign(P.create(bare),{x:180,y:r.y+r.h+20});P.launch(weak,0,-280);finish(weak,bare);assert.equal(weak.failed,'gap');
 for(const x of [60,120,180,240,300])for(const angle of [-25,-15,0,15,25]){
  const p=Object.assign(P.create(bare),{x,y:r.y+r.h+20}),a=angle*Math.PI/180;P.launch(p,Math.sin(a)*600,-Math.cos(a)*600);
  let crossed=false,n=0;while(!p.stopped&&!p.failed&&n++<2000){P.step(p,bare);if(p.jumps&&p.y<g.y-16&&p.z<3){crossed=true;break;}}
  assert.ok(crossed,`${l.name}: x=${x}, angle=${angle}`);samples++;
 }
}
const routes=[[{"angle":0,"speed":500,"wait":0}],[{"angle":8.461288142571364,"speed":1000,"wait":0}],[{"angle":-40,"speed":1100,"wait":0}],[{"angle":-36,"speed":1200,"wait":0}],[{"angle":20,"speed":1000,"wait":0}],[{"angle":-44,"speed":1100,"wait":0}],[{"angle":-32,"speed":700,"wait":0}],[{"angle":-40,"speed":900,"wait":0}],[{"angle":6.404809150080983,"speed":500,"wait":0}],[{"angle":0,"speed":500,"wait":0}],[{"angle":6.6283574753298256,"speed":500,"wait":0}],[{"angle":4.721016856807603,"speed":700,"wait":0}],[{"angle":-36,"speed":800,"wait":0}],[{"angle":-4.238537418238616,"speed":900,"wait":0}],[{"angle":6.610747357043885,"speed":700,"wait":0}],[{"angle":-5.851498551591724,"speed":600,"wait":0}],[{"angle":2.801229157749907,"speed":1000,"wait":0}],[{"angle":-20,"speed":1200,"wait":0}],[{"angle":-32,"speed":1100,"wait":0}],[{"angle":1.8502416108259476,"speed":700,"wait":0}]];

for(let i=0;i<levels.length;i++){
 const l=levels[i],p=P.create(l);assert.ok(routes[i].length<=l.shots);
 for(const shot of routes[i]){for(let n=0;n<Math.round(shot.wait/P.C.step);n++)P.step(p,l);const a=shot.angle*Math.PI/180;P.launch(p,Math.sin(a)*shot.speed,-Math.cos(a)*shot.speed);finish(p,l);}
 assert.ok(p.won,`stage ${i+1} route failed`);
}
// Identical release, but the snow route loses too much energy before the river.
for(const [i,xs,speed,startY] of [[11,[80,180],600,1920],[16,[273,87],500,1450]]){
 const outcomes=xs.map(x=>{
  const l=levels[i],p=Object.assign(P.create(l),{x,y:startY});P.launch(p,0,-speed);
  let crossed=false,n=0;while(!p.stopped&&!p.failed&&n++<5000){P.step(p,l);if(p.jumps&&p.y<l.gaps[0].y-15&&p.z<3){crossed=true;break;}}return crossed;
 });assert.deepEqual(outcomes,[true,false]);
}
console.log(`PASS: damping, ${samples} ramp approach samples, 20 routes and 2 snow/ice route comparisons`);
