'use strict';
// Run with node tests/v12.cjs. Uses the actual shipping source, no dependencies.
require('./v10.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(root+'/index.html','utf8');
function mod(code){const m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const P=mod(scripts[0]),W=require('../world.js'),S=require('../story.js'),E=require('../extras.js');W.install(P);
const levels=[...mod(scripts[1]),...W.extraLevels,...require('../courses.js')];
let checks=0;function ok(x,m){assert.ok(x,m);checks++;}function close(a,b,t=.000001){ok(Math.abs(a-b)<=t,`${a} != ${b}`);}
const noopGoal={x:1e6,y:1e6},base={height:30000,start:{x:180,y:20000},goal:noopGoal,walls:[],snow:[]};
function flight(l,r,speed,angle=0,x=180){
 const p=Object.assign(P.create(l),{x,y:r.y+8}),a=angle*Math.PI/180;
 P.launch(p,Math.sin(a)*speed,-Math.cos(a)*speed);
 let peak=0,landing=null,jump=null;
 for(let i=0;i<3000&&!p.stopped&&!p.failed;i++){
  P.step(p,l);peak=Math.max(peak,p.z);
  for(const e of p.events.splice(0)){if(e.type==='jump')jump=e;if(e.type==='land')landing={...e,vx:p.vx,vy:p.vy};}
  if(landing)break;
 }
 return {p,peak,landing,jump};
}
const ramp={x:26,y:20000,w:308,h:70},river={x:26,y:19650,w:308,h:315},l={...base,ramps:[ramp],gaps:[river]};
let lastPeak=0,lastTravel=0;
for(const v of [600,800,1000,1200,1600,1800]){
 const f=flight(l,ramp,v);ok(!f.p.failed&&f.landing&&f.jump,'long course contains a fast vertical flight');
 const travel=ramp.y+6-f.landing.y;ok(f.peak>lastPeak&&travel>lastTravel,'stronger launch flies higher and farther');lastPeak=f.peak;lastTravel=travel;
 close(f.jump.entrySpeed*Math.cos(W.RAMP_ANGLE),Math.abs(f.landing.vy),1);ok(travel>350,'not limited to river plus 70');
}
const arc=W.rampLaunch(l,ramp,210,-1000);close(arc.vx,210);close(arc.vy,-1000*Math.cos(W.RAMP_ANGLE));close(arc.vz,1000*Math.sin(W.RAMP_ANGLE));
ok(!('limited' in arc)&&!('maxTravel' in arc),'no adaptive landing cap');ok(W.rampLaunch(l,ramp,0,100)===null,'wrong-facing entry rejected');
// Ordinary jumps still tolerate diagonal entries from either side.
let ordinary=0;
for(const lev of levels)for(const r of lev.ramps||[]){
 const bare={...lev,walls:[],snow:[],lanes:[],hooks:[],goal:noopGoal,ramps:[r]};
 for(const speed of [700,900,1100])for(const a of [-25,0,25])for(const x of [60,180,300]){
  const f=flight(bare,r,speed,a,x);ok(f.p.failed!=='out','normal fast/diagonal jumps are not out-of-bounds');ordinary++;
 }
 ok(flight(bare,r,300).p.failed==='gap','too little momentum still falls in river');
}
// Enough altitude really skips a post-river wall, without disabling collisions globally.
const skip={...l,walls:[{x:26,y:19400,w:308,h:40}]};
const soar=flight(skip,ramp,1000);ok(soar.landing&&soar.landing.y<19400&&soar.p.hits===0,'post-river wall may be flown over');
// Only crossing a real bank at extreme height fails. No failure on the launch event.
const short={...levels[8],goal:noopGoal,walls:[],snow:[],lanes:[],hooks:[]};
const fly=flight(short,short.ramps[0],1800);ok(fly.jump&&fly.p.failed==='out','extreme takeoff can leave actual course');
ok(fly.p.y<26||fly.p.x<26||fly.p.x>334||fly.p.y>short.height-26,'out must be beyond the world, not just the viewport');
ok(fly.p.flyout.z>W.OUTER_BANK_HEIGHT&&fly.p.clock>.1,'requires height and elapsed travel');
ok(fly.p.stopped&&!fly.p.won&&!P.launch(fly.p,0,-600),'failed flight cannot relaunch or clear');
const f=fly.p,before=JSON.stringify(f);W.flyoutPose(f);ok(JSON.stringify(f)===before,'animation does not mutate physics');
f.failureAge=0;const first=W.flyoutPose(f);f.failureAge=.2;const later=W.flyoutPose(f);ok(later.y<first.y,'continues departing after boundary contact');
const r0=W.flyoutPose(f,true);f.failureAge=.7;ok(JSON.stringify(W.flyoutPose(f,true))===JSON.stringify(r0),'reduced-motion escape remains static');
ok(P.create(short).flyout===null,'retry resets escape');
const ground={...base,height:2000,start:{x:180,y:800}},p=P.create(ground);P.launch(p,1800,0);
for(let i=0;i<1000&&!p.stopped;i++)P.step(p,ground);ok(!p.failed&&p.hits>0,'a hard ground swipe still reflects, not out');
// New requirement does not roll back the story or other extra screens.
ok(S.COUNT===6&&S.EDITION===2,'wordless story is preserved');
const story=fs.readFileSync(root+'/story.js','utf8'),extras=fs.readFileSync(root+'/extras.js','utf8');
ok(!/fillText\(|art\.label\(/.test(story),'story has no text');ok(extras.includes('turnPage(-1)')&&extras.includes('turnPage(1)'),'manual page navigation remains');
ok(html.includes('world.js?v=120')&&html.includes("version:'0.12.0'"),'release identifiers');
ok(html.includes('function drawFirstLesson(')&&html.includes("if(levelIndex!==0||intro||manual||overview||pointer"),'tutorial is first-course only and hides on touch');
ok(html.includes("'つかんで、スッ。'")&&html.includes("'はなすと、すべる。'")&&html.includes("'おさかなへ。'"),'three short objective cues');
const tutorial=html.slice(html.indexOf('function drawFirstLesson('),html.indexOf('function render(){'));
ok(!/P\.(launch|step|moveHeld)|takeShot\(|bird\.(x|y)\s*[+\-]?=/.test(tutorial),'demo never moves live penguin');
console.log(JSON.stringify({status:'PASS',v12Assertions:checks,ordinaryApproaches:ordinary,oneThrowCourses:levels.length,restoredNaturalFlight:true},null,2));
