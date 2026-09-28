'use strict';
// Run: node tests/v08.cjs. v0.7 physics, routes and fishing-line regressions run first.
require('./v07.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function moduleOf(code){const m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const P=moduleOf(scripts[0]),levels=moduleOf(scripts[1]);
const W=moduleOf(fs.readFileSync(path.join(root,'world.js'),'utf8'));W.install(P);levels.push(...W.extraLevels);
let checks=0;function ok(v,msg){assert.ok(v,msg);checks++;}
const riverLevels=levels.filter(l=>l.gaps?.length);
// Every river and both banks: the collider stays at the real failure point.
for(const l of riverLevels)for(const side of [0,1]){
 const gap=l.gaps[0],p=Object.assign(P.create(l),{x:side?320:40,y:gap.y+2,angle:Math.PI*.9});
 P.step(p,l);ok(p.failed==='gap');ok(p.splash.gap!==gap);ok(p.splash.gap.h===gap.h);
 const x=p.x,y=p.y;
 for(const [age,stage] of [[0,'splash'],[.2,'splash'],[.45,'under'],[.8,'surface'],[1.4,'float'],[2,'float']]){
  p.failureAge=age;const before=JSON.stringify(p),pose=W.waterPose(p);
  ok(pose.stage===stage);ok(pose.visible===(stage!=='under'));
  ok([pose.x,pose.y,pose.bodyY,pose.waterY,pose.angle].every(Number.isFinite));
  ok(JSON.stringify(p)===before,'pose must not mutate physical state');
 }
 P.step(p,l,.1);ok(p.x===x&&p.y===y&&p.stopped&&!p.won);ok(!P.launch(p,0,-500));
 const fresh=P.create(l);ok(fresh.splash===null&&!fresh.failed,'retry clears water state');
 p.failureAge=0;const reduced=W.waterPose(p,true);p.failureAge=2;
 ok(JSON.stringify(reduced)===JSON.stringify(W.waterPose(p,true)),'reduced motion is static');
 ok(reduced.stage==='float'&&reduced.flap===-1&&reduced.blink);
}
const l=riverLevels[0],p=Object.assign(P.create(l),{x:180,y:l.gaps[0].y+60});P.step(p,l);
let sizes=[],shadows=[],frames=[],clips=0;
const g=new Proxy({},{get:(_,k)=>(...a)=>{if(k==='clip')clips++;},set:()=>true});
W.bindArt({rect(){},pixelEllipse(){},label(){},reduced:false,drawBird(...a){sizes.push(a[4]);shadows.push(a[7]);frames.push(a[8]);}});
for(const age of [0,.1,.2,.45,.8,1.3,2]){p.failureAge=age;const before=JSON.stringify(p);W.paintBird(g,p,'lost',0);ok(JSON.stringify(p)===before);}
ok(sizes.length===6,'underwater beat has no visible bird');ok(sizes.every(s=>s===1.25),'no shrinking');ok(shadows.every(s=>s===false),'no shadow stuck to floating bird');ok(clips>0,'waterline occludes lower body');ok(frames[0]>=0&&frames.at(-1)===-1,'panic gives way to calm');
const alive=P.create(l);ok(W.waterPose(alive)===null);alive.failed='hook';ok(W.waterPose(alive)===null);
ok(W.WATER_RESULT_DELAY>1.8&&W.WATER_RESULT_DELAY<2.5,'short complete animation');
ok(html.includes("bird.failed==='gap'?(reduced?1.05:World.WATER_RESULT_DELAY)"),'only water failure duration changes');
console.log(JSON.stringify({status:'PASS',waterChecks:checks,riverBanks:10,priorRegressionChecks:540},null,2));
