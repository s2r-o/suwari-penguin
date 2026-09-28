/* Wordless, hand-composed picture cards. Static Canvas illustration, one page per tap.
 * Characters use the approved in-game sprites. No remote fonts or art services.
 */
(function(root){'use strict';
const COUNT=6,EDITION=2,SIZE=360,HEIGHT=390;
const descriptions=[
 '海辺の練習場。師匠は腹すべりのお手本を見せるが、弟子は浮き輪に座っている。',
 '教える師匠の隣で、弟子は目を閉じて居眠りしている。',
 '師匠がお魚を取り出すと、座ったままの弟子の目が開く。',
 '師匠は魚へ続く練習コースの設計図を広げる。弟子は休んでいる。',
 '師匠だけが氷壁やジャンプ台をせっせと建設する。弟子は浮き輪で休んでいる。',
 '立派なコースと遠くのお魚が完成。疲れた師匠の隣で、弟子は座ったまま出発を待つ。'
];
function make(art,world){
 const pages=[];const C={ink:'#173749',body:'#30566a',paper:'#fff9e9',snow:'#f8fbf0',ice:'#d8ebe2',shade:'#b7d4ce',sea:'#77abba',deep:'#4f8297',wood:'#b68b64',scarf:'#d89378'};
 const R=(g,x,y,w,h,c)=>art.rect(g,x,y,w,h,c);
 const E=(g,x,y,rx,ry,c)=>art.pixelEllipse(g,x,y,rx,ry,c);
 function poly(g,pts,c){g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}
 function line(g,pts,c,w=2){g.strokeStyle=c;g.lineWidth=w;g.lineJoin='round';g.lineCap='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();}
 function bird(g,x,y,s=2,a=0,blink=false){art.drawBird(g,x,y,a,s,blink,0,true,-1,'classic');}
 function master(g,x,y,s=2){world.master(g,x,y,s);}
 function fish(g,x,y,s=1){art.drawFish(g,x,y,s);}
 function sparkle(g,x,y,s=1){poly(g,[[x,y-7*s],[x+2*s,y-2*s],[x+7*s,y],[x+2*s,y+2*s],[x,y+7*s],[x-2*s,y+2*s],[x-7*s,y],[x-2*s,y-2*s]],'#e9b670');}
 function drops(g,x,y){poly(g,[[x,y],[x-3,y+8],[x+1,y+12],[x+5,y+8]],'#76aeba');}
 function flag(g,x,y,s=1){R(g,x,y,2*s,35*s,'#9c795a');poly(g,[[x+2*s,y],[x+23*s,y+2*s],[x+18*s,y+9*s],[x+2*s,y+10*s]],C.scarf);}
 function footprints(g,x,y,dx,dy,n=7){for(let i=0;i<n;i++){E(g,x+i*dx+(i%2?3:-3),y+i*dy,2.5,1.5,'#a5c4bd');}}
 function ice(g,x,y,w,h){R(g,x+3,y+7,w,h,'#93b6b83b');poly(g,[[x,y+4],[x+w-7,y],[x+w,y+h-5],[x+8,y+h+3]],'#8fb9c4');poly(g,[[x,y+4],[x+6,y-4],[x+w,y-4],[x+w-7,y+6],[x+8,y+12]],C.snow);R(g,x+9,y+12,w-20,3,'#c9e3e1');line(g,[[x+w*.6,y+12],[x+w*.6-4,y+22],[x+w*.6+3,y+28]],'#b9d6d6',1);}
 function crate(g,x,y,w=48,h=37){R(g,x+3,y+4,w,h,'#43697920');R(g,x,y,w,h,'#986f50');R(g,x+3,y+3,w-6,h-6,'#d2b48a');for(let a=6;a<h-4;a+=9)R(g,x+3,y+a,w-6,1,'#b18b66');R(g,x+2,y+1,5,h-2,'#bf966b');R(g,x+w-7,y+1,5,h-2,'#bf966b');R(g,x+6,y+4,2,2,C.ink);R(g,x+w-10,y+h-7,2,2,C.ink);}
 function sky(g,close=false){
  R(g,0,0,SIZE,HEIGHT,C.paper);R(g,9,9,342,372,'#dceae1');
  E(g,288,60,28,28,'#efdbb8');E(g,286,57,23,23,'#f6e6c6');
  for(const [x,y,s] of [[50,49,1],[179,35,.65]]){E(g,x,y,25*s,6*s,'#f7f6e9');E(g,x-9*s,y-6*s,12*s,7*s,'#f7f6e9');E(g,x+9*s,y-3*s,14*s,6*s,'#f7f6e9');}
  poly(g,[[9,147],[59,91],[102,130],[151,82],[222,149]],'#b6d0cf');poly(g,[[33,120],[59,91],[78,111],[62,107],[53,120]],C.snow);
  poly(g,[[118,122],[151,82],[180,117],[156,102],[145,113],[135,109]],C.snow);
  poly(g,[[169,153],[233,115],[266,138],[300,100],[351,153]],'#c4d9d4');poly(g,[[278,126],[300,100],[324,127],[305,115],[296,121]],C.snow);
  R(g,9,146,342,81,C.sea);for(let i=0;i<22;i++){const x=18+(i*71)%319,y=152+(i*19)%71;R(g,x,y,9+(i%4)*6,1,'#b1d0cf');}
  poly(g,[[9,210],[69,200],[107,211],[165,201],[234,208],[290,193],[351,207],[351,381],[9,381]],C.shade);
  poly(g,[[9,203],[69,192],[107,202],[165,193],[234,199],[290,185],[351,199],[351,372],[9,372]],C.snow);
  for(let i=0;i<17;i++){const x=20+(i*47)%318,y=224+(i*29)%131;R(g,x,y,7+(i%3)*4,1,'#dce9dc');}
  if(!close){
   R(g,20,152,53,35,'#afc5bb');poly(g,[[15,154],[45,130],[79,154]],'#f9fbef');R(g,37,162,13,25,'#7c9992');R(g,57,160,9,9,'#f5dcab');
   R(g,26,178,7,3,'#c9dace');
  }
 }
 function edge(g){g.strokeStyle=C.ink;g.lineWidth=2;g.strokeRect(9,9,342,372);R(g,11,11,338,2,'#ffffff88');}
 function bellyMaster(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);E(g,0,8,33,7,'#64919a28');E(g,0,-2,28,12,C.ink);E(g,2,-5,23,8,C.body);E(g,10,2,20,6,'#fffcef');E(g,24,-10,12,12,C.ink);E(g,28,-9,9,8,'#fffcef');R(g,29,-13,2,3,C.ink);R(g,33,-6,8,3,'#edb660');poly(g,[[-5,-7],[-25,-25],[-30,-19],[-15,-1]],C.ink);R(g,14,-2,7,5,C.scarf);poly(g,[[14,0],[-7,7],[-13,5],[12,-4]],C.scarf);R(g,-35,-1,11,4,'#edb660');R(g,-35,6,9,3,'#edb660');g.restore();}
 function path(g,pts,w=45){line(g,pts,'#adcfc9',w+6);line(g,pts,'#d9ece4',w);line(g,pts,'#eff8ed',2);}
 function scene(g,n){
  sky(g,n===2);
  if(n===0){
   path(g,[[24,305],[78,267],[172,240],[283,215]],47);flag(g,38,264,.8);flag(g,290,194,.8);
   footprints(g,116,323,8,-3,9);
   bellyMaster(g,157,252,1.7);line(g,[[50,263],[80,255]],'#92bcb7');line(g,[[60,275],[93,265]],'#92bcb7');line(g,[[55,250],[83,244]],'#92bcb7');
   world.drawRing(g,277,348,1);bird(g,277,344,2.1,Math.PI,true);
   crate(g,30,337,38,26);
  }else if(n===1){
   E(g,225,338,70,16,'#dae9dc');world.drawRing(g,240,334,1.25);bird(g,240,330,2.9,0,true);
   master(g,105,284,2.5);
   R(g,56,290,4,37,'#a07d5b');R(g,94,290,4,37,'#a07d5b');R(g,37,238,78,55,'#b78e66');R(g,41,242,70,47,'#f7eed8');
   bellyMaster(g,74,266,.65);line(g,[[45,283],[96,283]],'#b7ccc0');
   E(g,168,182,4,4,'#afc8bd');E(g,178,174,3,3,'#afc8bd');
   drops(g,145,224);footprints(g,61,343,10,-2,7);
  }else if(n===2){
   E(g,253,275,102,85,'#f1edcf');
   world.drawRing(g,252,346,1.6);bird(g,252,344,4.3,-Math.PI/8,false);
   // Teacher enters from the left; the fish, not the lesson, gets attention.
   g.save();g.beginPath();g.rect(10,160,126,211);g.clip();master(g,40,339,4.1);g.restore();
   poly(g,[[54,263],[111,225],[119,233],[79,282]],C.ink);fish(g,134,228,2.5);
   sparkle(g,157,199,1.25);sparkle(g,101,211,.8);sparkle(g,155,252,.65);
   line(g,[[234,204],[230,189]],'#d4a477',2);line(g,[[248,200],[252,184]],'#d4a477',2);
  }else if(n===3){
   // A real work table and pictorial plan, instead of explanatory captions.
   crate(g,25,180,62,42);ice(g,265,179,58,29);ice(g,280,164,45,22);
   R(g,34,309,9,43,'#9c7c5e');R(g,206,298,9,52,'#9c7c5e');
   poly(g,[[24,227],[210,205],[235,310],[42,335]],'#aa815d');poly(g,[[28,221],[208,199],[232,303],[42,329]],'#e1c6a0');
   poly(g,[[48,234],[188,218],[206,288],[64,309]],'#79a7b4');line(g,[[81,285],[102,256],[158,272],[172,237]],'#e8f3df',4);
   R(g,111,245,33,6,'#b3d2d0');R(g,128,277,32,5,'#b3d2d0');fish(g,172,233,.65);
   E(g,79,287,6,3,'#eaa78a');R(g,183,297,24,3,'#a57d59');
   master(g,282,316,2.4);poly(g,[[253,264],[223,251],[220,257],[250,276]],C.ink);line(g,[[223,254],[206,274]],'#8c7056',3);
   world.drawRing(g,291,102,.55);bird(g,291,101,1.05,0,true);
   footprints(g,232,346,5,-6,7);sparkle(g,282,223,.7);
  }else if(n===4){
   path(g,[[33,352],[155,310],[235,250],[178,198]],55);
   ice(g,34,235,67,37);ice(g,40,217,61,24);ice(g,259,318,57,25);
   // An unfinished bank, lumber, tools and the master's oversized building block.
   R(g,245,211,78,14,'#85b1bf');R(g,245,210,78,3,C.snow);R(g,250,193,4,18,'#a48564');R(g,311,193,4,18,'#a48564');
   for(let i=0;i<4;i++)R(g,238+i*13,266,8,45,'#d8b88c');line(g,[[236,279],[286,279]],'#b48b68');
   master(g,155,290,2.7);ice(g,164,230,83,37);
   drops(g,121,211);drops(g,140,200);footprints(g,95,330,8,-3,7);
   R(g,308,288,4,30,'#aa8058');R(g,299,286,23,9,'#799aa3');
   flag(g,284,155,.9);
   world.drawRing(g,67,363,.7);bird(g,67,361,1.2,0,true);
  }else{
   path(g,[[227,331],[237,276],[124,228],[230,178],[199,147]],43);
   // Completed course in forced perspective, with a reward at its far end.
   ice(g,42,260,83,23);ice(g,246,228,82,20);ice(g,77,192,79,17);
   poly(g,[[177,206],[215,216],[253,195],[230,182]],'#638f9f');line(g,[[178,204],[215,213],[230,203]],'#e6f4e9',3);
   poly(g,[[177,223],[193,229],[219,217],[204,209]],'#d8b98d');line(g,[[180,218],[209,220]],'#ad8965',2);
   E(g,199,147,18,6,'#cfb082');E(g,199,144,17,5,'#fff1d3');fish(g,199,141,1.05);sparkle(g,214,126,.55);
   flag(g,148,131,.65);flag(g,254,275,1);
   crate(g,23,344,41,30);master(g,94,329,2.5);drops(g,56,244);
   world.drawRing(g,235,347,1.25);bird(g,235,343,2.9,-Math.PI/8,false);
   footprints(g,146,335,6,-6,7);
   // The discarded tools tell who did the work. The pupil still hasn't stood up.
   R(g,133,359,29,3,'#aa8058');R(g,153,350,10,14,'#71919a');
  }
  edge(g);
 }
 return {draw(g,index){const i=Math.max(0,Math.min(COUNT-1,index|0));if(!pages[i]){const c=art.off(SIZE,HEIGHT);scene(c.getContext('2d'),i);pages[i]=c;}g.clearRect(0,0,SIZE,HEIGHT);g.imageSmoothingEnabled=false;g.drawImage(pages[i],0,0);},clear(){pages.length=0;}};
}
const api={COUNT,EDITION,SIZE,HEIGHT,descriptions,make};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SuwariStory=api;
})(typeof window!=='undefined'?window:globalThis);
