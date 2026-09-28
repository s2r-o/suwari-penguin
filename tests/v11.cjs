'use strict';
// Shipped-code regression; no dependencies. Earlier tests continue to run.
require('./v10.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(root+'/index.html','utf8');
function mod(c){const m={exports:{}};new Function('module','exports',c)(m,m.exports);return m.exports;}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const P=mod(scripts[0]),W=require('../world.js'),S=require('../story.js'),E=require('../extras.js');W.install(P);
const levels=[...mod(scripts[1]),...W.extraLevels,...require('../courses.js')];let checks=0,flights=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const noopGoal={x:1e6,y:1e6};
function jumpOnce(l,r,speed,a=0,x=180){
 const p=Object.assign(P.create(l),{x,y:r.y+8}),theta=a*Math.PI/180;
 P.launch(p,Math.sin(theta)*speed,-Math.cos(theta)*speed);
 let peak=0,landing=null,jump=null;
 for(let i=0;i<2500&&!p.failed&&!p.stopped;i++){
  const before={x:p.x,y:p.y};P.step(p,l);peak=Math.max(peak,p.z);
  // No positional warp on takeoff or landing.
  ok(Math.hypot(p.x-before.x,p.y-before.y)<P.C.maxSpeed*P.C.step+1,'no midair position snap');
  for(const e of p.events.splice(0)){if(e.type==='jump')jump=e;if(e.type==='land')landing={...e,vx:p.vx,vy:p.vy};}
  if(landing)break;
 }
 return {p,peak,jump,landing};
}
for(const level of levels)for(const ramp of level.ramps||[]){
 const base={...level,walls:[],snow:[],hooks:[],lanes:[],goal:noopGoal,ramps:[ramp]};
 const shape=W.rampLaunch(base,ramp,0,-1200);
 for(const speed of [800,1000,1200,1800])for(const angle of [-25,0,25]){
  const {p,landing,jump}=jumpOnce(base,ramp,speed,angle);flights++;
  ok(!p.failed&&landing&&jump,'strong broad entry crosses its river');
  ok(landing.y>=shape.farBank-W.LANDING_RUNOUT-4,'grounded within 70 world px after bank');
  ok(landing.y<shape.farBank-10,'clear landing bank');
  ok(Math.abs(landing.vy)>200,'landing retains usable horizontal momentum');
 }
 const weak=jumpOnce(base,ramp,300);ok(weak.p.failed==='gap','weak entry is not boosted into a clear');
 const wall={x:26,y:shape.farBank-115,w:308,h:24},l={...base,walls:[wall]};
 const p=Object.assign(P.create(l),{x:180,y:ramp.y+8});P.launch(p,0,-1200);
 let hit=false;for(let i=0;i<1300&&!p.stopped&&!p.failed;i++){P.step(p,l,undefined,()=>{if(p.y<shape.farBank-70)hit=true;});if(hit)break;}
 ok(hit,'a post-river ice wall can no longer be flown over');
}
const l=levels[8],r=l.ramps[0],a=W.rampLaunch(l,r,210,-900),b=W.rampLaunch(l,r,0,-900);
ok(a.vx===210&&a.vy===b.vy,'lateral momentum not auto-aimed');
ok(a.vy===-900*Math.cos(W.RAMP_ANGLE),'horizontal speed rule unchanged');
ok(a.limited&&a.vz<900*Math.sin(W.RAMP_ANGLE),'fast entry has a shallower, not longer arc');
ok(S.COUNT===6&&S.EDITION===2,'six new wordless story cards');
ok(S.descriptions.length===6,'accessible descriptions for every card');
const source=fs.readFileSync(root+'/story.js','utf8'),extras=fs.readFileSync(root+'/extras.js','utf8');
ok(!/fillText\(|art\.label\(/.test(source),'no dialogue or captions drawn into story');
ok(!extras.includes('movie.age')&&!extras.includes('19.2)endMovie'),'no timer-driven automatic page turns');
ok(extras.includes('turnPage(-1)')&&extras.includes('turnPage(1)'),'back and next controls');
ok(html.includes('story.js?v=110')&&html.includes('extras.js?v=110')&&html.includes('world.js?v=110'),'cache versions match release');
class Store{constructor(){this.d={}}getItem(k){return this.d[k]??null}setItem(k,v){this.d[k]=v}}
const store=new Store(),bank=new E.Collection(store,{0:1,2:1});bank.settings({openingSeen:true});
const old=new E.Collection(store,{});ok(old.data.openingEdition===0,'old movie completion does not hide the new story');
old.buy('midnight');old.settings({openingSeen:true,openingEdition:S.EDITION,music:false});
const restored=new E.Collection(store,{});ok(restored.data.openingEdition===2&&restored.data.openingSeen,'story completion persists');
ok(restored.data.equipped==='midnight'&&restored.balance()===0&&!restored.data.music,'wardrobe, fish and audio are preserved');
console.log(JSON.stringify({status:'PASS',newAssertions:checks,fastRiverFlights:flights,allCourses:levels.length,storyPages:S.COUNT},null,2));
