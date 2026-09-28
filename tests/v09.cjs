'use strict';
// Run: node tests/v09.cjs. No extra dependencies.
require('./v08.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function moduleOf(code){const m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const levels=moduleOf(scripts[1]);
const W=moduleOf(fs.readFileSync(path.join(root,'world.js'),'utf8'));levels.push(...W.extraLevels);
assert.equal(levels.length,20);
for(const [i,l] of levels.entries()){
 assert.equal(l.shots,1,`course ${i+1} must allow one throw only`);
 assert.ok(!/2打|２打|もう一打|次の一打|1打目/.test(l.hint));
}
assert.ok(html.includes('const SHOT_LIMIT=1;'));
assert.ok(html.includes('shots>=SHOT_LIMIT)return false;'));
assert.ok(!html.includes('次の一打'));
console.log(JSON.stringify({status:'PASS',singleThrowCourses:levels.length,physicalRoutes:'one launch per course (v07 shared regression)'}));
