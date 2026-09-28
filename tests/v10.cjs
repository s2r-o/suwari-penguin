'use strict';
require('./v09.cjs');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),root=path.join(__dirname,'..');
const E=require('../extras.js'),finals=require('../courses.js');let n=0;const ok=(v,label)=>{assert.ok(v,label);n++;};
class Store{constructor(data={}){this.data=data;}getItem(k){return this.data[k]??null;}setItem(k,v){this.data[k]=String(v);}}
const legacy=Object.fromEntries(Array.from({length:20},(_,i)=>[i,i%2+1])),store=new Store(),p=new E.Collection(store,legacy);
ok(p.balance()===60,'legacy first clears grant fish once');p.migrate(legacy);ok(p.balance()===60,'migration idempotent');ok(p.award(0)===0,'no duplicate reward');ok(!p.buy('graduate'),'final skin locked');ok(!p.buy('no-such-skin'),'unknown purchase rejected');
for(let i=20;i<30;i++){ok(p.award(i)===3,'new first clear earns three');ok(p.award(i)===0,'same clear cannot be farmed');}
ok(p.balance()===90,'total reward');
for(const s of E.SKINS){const before=p.balance(),already=p.data.owned.includes(s.id);ok(p.buy(s.id),'skin buy/equip');ok(p.balance()===before-(already?0:s.cost),'deduct only on purchase');const again=p.balance();p.buy(s.id);ok(p.balance()===again,'re-equip is free');}
ok(p.balance()===26,'all cosmetics leave correct balance');ok(p.data.owned.length===7,'all seven looks unlocked');
p.settings({openingSeen:true,music:false,sfx:true,volume:.42});const reload=new E.Collection(store,legacy);ok(reload.balance()===26,'reload wallet');ok(reload.data.equipped==='graduate','reload equipped');ok(reload.data.openingSeen,'opening stays seen');ok(!reload.data.music&&reload.data.sfx&&reload.data.volume===.42,'independent audio preferences');
const fresh=new E.Collection(new Store(),{});ok(!fresh.buy('mint'),'insufficient funds cannot purchase');ok(fresh.balance()===0,'no negative balance');ok(fresh.award(-1)===0&&fresh.award(30)===0,'invalid course cannot grant fish');
const noSave=new E.Collection({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},{});noSave.award(0);ok(noSave.balance()===3&&!noSave.ok,'blocked storage stays playable and flagged');
function mod(c){const m={exports:{}};new Function('module','exports',c)(m,m.exports);return m.exports;}
const html=fs.readFileSync(root+'/index.html','utf8'),scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const P=mod(scripts[0]),levels=mod(scripts[1]),W=require('../world.js');W.install(P);levels.push(...W.extraLevels,...finals);ok(levels.length===30,'30 actual courses');
const routes=[[0,500,0],[8.461288142571364,1000,0],[-40,1100,0],[-36,1200,0],[20,1000,0],[-44,1100,0],[-32,700,0],[-40,900,0],[6.404809150080983,550,0],[0,500,0],[6.6283574753298256,500,0],[-2,575,0],[-36,800,0],[-4,600,0],[6.610747357043885,700,0],[-5.851498551591724,600,0],[-14,650,0],[-20,1200,0],[-32,1100,0],[-10,650,0],[28,700,0],[-32,900,0],[28,800,0],[-12,900,0],[-38,1000,0],[20,900,0],[30,1000,0],[-12,1000,0],[-38,1200,4.2],[-34,1100,0]];
function simulate(l,a,v,t=0){const p=Object.assign(P.create(l),{clock:t});const angle=a*Math.PI/180;P.launch(p,Math.sin(angle)*v,-Math.cos(angle)*v);let ticks=0;while(!p.stopped&&!p.failed&&ticks++<6000)P.step(p,l);return p;}
for(let i=0;i<30;i++){ok(levels[i].shots===1,'single throw '+i);const p=simulate(levels[i],...routes[i]);ok(p.won,'one throw reaches course '+(i+1));ok(!p.failed,'no false clear on failure '+i);}
const final=levels[29],solution=routes[29];let nearby=0;for(const da of [-1.5,0,1.5])for(const scale of [.95,1,1.05])for(const dt of [-.15,0,.15])if(simulate(final,solution[0]+da,solution[1]*scale,Math.max(0,solution[2]+dt)).won)nearby++;
ok(nearby>=9,'final has an input neighbourhood, not a single exact vector');ok(final.ramps.length===2&&final.ramps.every(r=>r.w===308),'wide ramps retained in final');
console.log(JSON.stringify({status:'PASS',newAssertions:n,oneThrowRoutes:30,finalNearbySuccess:nearby,skins:7},null,2));
module.exports={routes};
