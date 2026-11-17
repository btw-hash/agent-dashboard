<title>Agent Office Events</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: what is being decided, then the buttons that start each event, then the live office, then one card per event. */
:root{
  color-scheme:dark;
  --bg:#080810; --surface:#0c0d1e; --surface-2:#11132a; --border:#1e2240; --border-hi:#2e3566;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --ok:#9ece6a; --warn:#e0af68; --bad:#f7768e; --guest:#39d3ff;
  --glass:rgba(10,11,26,.9);
  --font:"JetBrains Mono","Cascadia Mono",Consolas,monospace;
  --pixel:"Press Start 2P","JetBrains Mono",monospace;
}
*{box-sizing:border-box}[hidden]{display:none!important}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:13px;line-height:1.55;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 48px}
.page{max-width:1312px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
h1{font-weight:700;font-size:20px;color:var(--text-hi);margin:0 0 6px;line-height:1.3;text-wrap:balance}
h2{font-weight:700;font-size:12px;color:var(--accent);margin:0;letter-spacing:.1em;text-transform:uppercase;line-height:1.5}
p{margin:0;max-width:78ch}.lede{color:var(--text-dim)}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.decide{background:var(--surface);border:1px solid var(--warn);padding:12px 14px;display:flex;flex-direction:column;gap:6px}
.decide h2{color:var(--warn)}
.decide ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px}
.decide b{color:var(--text-hi)}
.controls{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;background:var(--surface);border:1px solid var(--border);padding:10px 12px}
.grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-right:2px}
.chip{background:var(--surface-2);border:1px solid var(--border);padding:5px 10px;font-size:12px;color:var(--text);border-radius:2px;white-space:nowrap}
.chip:hover{border-color:var(--border-hi);color:var(--text-hi)}
.chip:disabled{opacity:.4;cursor:default}
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#07081a;font-weight:700}
.chip.g{border-color:#1f6f86;color:var(--guest)}
.chip.e{border-color:#7a5a2a;color:var(--warn)}
.now{font-size:12px;color:var(--text-hi);min-height:1.55em}
.now::before{content:"";display:inline-block;width:7px;height:7px;background:var(--ok);margin-right:8px}
.now.on::before{background:var(--warn)}
.stage{position:relative;height:clamp(420px,76vh,820px);border:1px solid var(--border);background:#05060d;overflow:hidden}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none}
#cv.hit{cursor:pointer}
.tags{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.tag{position:absolute;transform:translate(-50%,-100%);padding:3px 6px 2px;font-family:var(--pixel);font-size:7px;line-height:1.4;color:var(--text-hi);background:rgba(10,11,26,.9);border:1px solid var(--border-hi);white-space:nowrap}
.toasts{position:absolute;left:50%;top:10px;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none;width:max-content;max-width:calc(100% - 24px);z-index:5}
.toast{background:var(--glass);border:1px solid var(--ok);padding:6px 10px;font-size:11px;color:var(--text-hi);animation:pop 4.2s forwards}
.toast.bad{border-color:var(--bad)}
@keyframes pop{0%{opacity:0;transform:translateY(-6px)}6%,88%{opacity:1;transform:none}100%{opacity:0}}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.box{background:var(--surface);border:1px solid var(--border);border-top:3px solid var(--guest);padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.box.e{border-top-color:var(--warn)}
.box dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:12px}
.box dt{color:var(--text-dim);white-space:nowrap}.box dd{margin:0}
.tagn{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:1px 6px;border:1px solid var(--border-hi);color:var(--text-dim);margin-left:6px;white-space:nowrap}
.tagn.new{border-color:#1f6f86;color:var(--guest)}
.note{font-size:11px;color:var(--text-dim)}
@media (prefers-reduced-motion:reduce){.toast{animation-duration:.01s}}
</style>

<div class="page">
  <header>
    <h1>События и гости</h1>
    <p class="lede">Офис живёт не только агентами. Гости выходят из лифта, а события меняют весь этаж на полминуты. Каждое можно запустить кнопкой и посмотреть целиком. В старом офисе были только вечеринка, пожарная тревога и отключение света (по клавишам G, F, O); курьеры, уборка и праздники — новые.</p>
  </header>

  <section class="decide" aria-label="Что решаем">
    <h2>Что решаем на этой странице</h2>
    <ol>
      <li><b>Правки внесены.</b> Гости держат вещи в руках, на вечеринке танцуют, при тревоге все выходят через окно и возвращаются на лифте. Курьер разносит пиццу по трём столикам и открывает коробки, к каждой подходит человек и ест, куски пропадают по одному. Запусти «Пицца», «Уборка», «Вечеринка», «Пожарная тревога». Так годится?</li>
      <li><b>Повод решён.</b> События привязаны к настоящим сигналам из карточек ниже, а в публичной демке ещё и случаются сами раз в несколько минут.</li>
    </ol>
  </section>

  <section class="controls" aria-label="Запуск событий">
    <div class="grp"><span class="lbl">Гости</span>
      <button class="chip g ev" data-e="pizza">Пицца</button>
      <button class="chip g ev" data-e="mail">Почта</button>
      <button class="chip g ev" data-e="clean">Уборка</button></div>
    <div class="grp"><span class="lbl">События</span>
      <button class="chip e ev" data-e="party">Вечеринка</button>
      <button class="chip e ev" data-e="drill">Пожарная тревога</button>
      <button class="chip e ev" data-e="dark">Нет света</button></div>
    <div class="grp"><span class="lbl">Праздник</span>
      <button class="chip hol" data-h="" aria-pressed="true">Нет</button>
      <button class="chip hol" data-h="ny" aria-pressed="false">Новый год</button>
      <button class="chip hol" data-h="hw" aria-pressed="false">Хэллоуин</button></div>
    <div class="grp"><span class="lbl">Время</span>
      <button class="chip hr" data-t="10" aria-pressed="true">День</button>
      <button class="chip hr" data-t="23" aria-pressed="false">Ночь</button></div>
  </section>

  <div class="now" id="now" role="status">Тихо. Запусти что-нибудь.</div>

  <section class="stage" id="stage" aria-label="Офис">
    <canvas id="cv"></canvas>
    <div class="tags" id="tags"></div>
    <div class="toasts" id="toasts"></div>
  </section>

  <section class="cols">
    <div class="box"><h2>Пицца <span class="tagn new">новое</span></h2>
      <dl><dt>Видно</dt><dd>Курьер со стопкой коробок обходит три столика в кафе, на каждый ставит коробку и открывает. Внутри круглая пицца, разрезанная на шесть. К каждой подходит кто-то из работающих, встаёт сбоку и ест: куски пропадают по одному.</dd>
      <dt>Повод</dt><dd>Пятница, 13:00. Или когда пятеро работают два часа без перерыва.</dd>
      <dt>Мелочь</dt><dd>Гусь кричит HONK, когда курьер проходит рядом.</dd></dl></div>
    <div class="box"><h2>Почта <span class="tagn new">новое</span></h2>
      <dl><dt>Видно</dt><dd>Курьер несёт посылку к столу конкретного агента, ставит рядом, тот машет рукой. Посылка остаётся лежать.</dd>
      <dt>Повод</dt><dd>Агент закончил длинную задачу: посылка ему как награда.</dd>
      <dt>Мелочь</dt><dd>Что внутри — в подсказке, каждый раз другое.</dd></dl></div>
    <div class="box"><h2>Уборка <span class="tagn new">новое</span></h2>
      <dl><dt>Видно</dt><dd>Уборщик с шваброй и ведром проходит нижний коридор туда и обратно. За ним блестит мокрый пол, стоит жёлтая табличка.</dd>
      <dt>Повод</dt><dd>Каждый вечер в 19:00. Или когда корзина переполнилась (она растёт от ошибок).</dd>
      <dt>Мелочь</dt><dd>Блеск гаснет сам за десять секунд.</dd></dl></div>
    <div class="box e"><h2>Вечеринка <span class="tagn">было</span></h2>
      <dl><dt>Видно</dt><dd>Свет приглушается, диско-шар и цветные пятна по полу, шары и торт у стола героя. Четверо гостей танцуют рядом, остальные, кто не за столом, пританцовывают на месте.</dd>
      <dt>Повод</dt><dd>Офис закрыл сотую задачу. Герой — тот, кто закрыл.</dd>
      <dt>Мелочь</dt><dd>Из музыкального автомата летят ноты.</dd></dl></div>
    <div class="box e"><h2>Пожарная тревога <span class="tagn">было</span></h2>
      <dl><dt>Видно</dt><dd>Красный свет и звонок. Все сбегаются к окну, Merge пересчитывает и выбивает стекло. Все выходят через окно, а возвращаются на лифте. Около 25 секунд.</dd>
      <dt>Повод</dt><dd>Три ошибки инструментов за минуту: «в проде горит».</dd>
      <dt>Мелочь</dt><dd>Snooze всё проспал. Окно потом заколочено досками, осколки убирает уборщик.</dd></dl></div>
    <div class="box e"><h2>Нет света <span class="tagn">было</span></h2>
      <dl><dt>Видно</dt><dd>Свет мигает и гаснет. Остаются фонарики телефонов, красные аварийные лампы и зелёный EXIT. Через десять секунд свет возвращается.</dd>
      <dt>Повод</dt><dd>Страница потеряла связь с сервером. Вернулась связь — вернулся свет.</dd>
      <dt>Мелочь</dt><dd>В темноте светятся глаза кота.</dd></dl></div>
    <div class="box"><h2>Праздники <span class="tagn new">новое</span></h2>
      <dl><dt>Видно</dt><dd>Новый год: гирлянда, ёлка, снег за окнами, колпаки. Хэллоуин: тыквы, летучие мыши, привидение в коридоре, шляпа на коте.</dd>
      <dt>Повод</dt><dd>По календарю, включается само на неделю.</dd>
      <dt>Мелочь</dt><dd>Ночью гирлянда и тыквы светятся: переключи «Время».</dd></dl></div>
  </section>
  <p class="note">Надписи внутри офиса английские: это интерфейс продукта. Агенты на этой странице сценарные, как и на прошлых.</p>
</div>

<script>
(function(){
/*ENGINE*/

// ── this page: guests through the lift and office-wide events ───
Office.snap=true;Office.lift=0;
let TT=0,small=false,FOLLOW=null,busy=null,vid=0,liftO=0;
Office.onSmall=s=>{small=s;};
const LATER=[],later=(s,fn)=>LATER.push([TT+s,fn]);
const rnd=a=>a[(Math.random()*a.length)|0];
function toast(msg,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),4300);}
function begin(name,label,follow){if(busy)return false;busy=name;FOLLOW=follow||null;const n=$('#now');n.textContent=label;n.classList.add('on');$$('.ev').forEach(b=>b.disabled=true);
  if(small)$('#stage').scrollIntoView({block:'nearest',behavior:'smooth'});return true;}
function end(){busy=null;FOLLOW=null;const n=$('#now');n.textContent='Тихо. Запусти что-нибудь.';n.classList.remove('on');$$('.ev').forEach(b=>b.disabled=false);}
const lanes=(a,b)=>bfs(a,b).map(n=>NODE[n]);
const pool=(x,y,c,r,a)=>{const gr=lg.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,hexA(c,a));gr.addColorStop(1,hexA(c,0));lg.fillStyle=gr;lg.fillRect(x-r,y-r,r*2,r*2);};

// people who are not agents: they step out of the lift, do one job and leave the same way
const VIS=[],DOORWAY=[557,58],MAT=[557,84];
function visitor(look,prop,steps){const v={L:Object.assign({id:'v'+vid++,skin:SK[vid%5],hair:'#3b2a1e',shirt:'#e03131',pants:'#23263a',style:'short',acc:'cap',fit:'tee',carry:1},look),
  prop,x:DOORWAY[0],y:DOORWAY[1],dir:0,dist:0,wait:0,pose:'idle',steps:[{wait:.6},MAT].concat(steps,[MAT,DOORWAY,{wait:.5}])};VIS.push(v);return v;}
// hands empty again: a new look id, so sprites cached with bent arms are not reused
const drop=v=>{v.prop=null;v.L=Object.assign({},v.L,{carry:0,id:v.L.id+'e'});};
function walk(v,dt){
  if(v.wait>0){v.wait-=dt;return;}
  let left=28*dt,moved=false;
  while(left>0&&v.steps.length){const s=v.steps[0];
    if(!Array.isArray(s)){v.steps.shift();if(s.dir!=null)v.dir=s.dir;if(s.do)s.do(v);if(s.wait){v.wait=s.wait;v.pose=s.pose||'idle';return;}continue;}
    const dx=s[0]-v.x,dy=s[1]-v.y,d=Math.hypot(dx,dy);if(d>.01)v.dir=facing(dx,dy);
    if(d<=left){v.x=s[0];v.y=s[1];v.dist+=d;left-=d;v.steps.shift();}else{v.x+=dx/d*left;v.y+=dy/d*left;v.dist+=left;left=0;}
    moved=true;}
  v.pose=moved?'walk':'idle';if(!v.steps.length)v.gone=true;}
const box=(x,y,w,h,c)=>{px(x-1,y-1,w+2,h+2,INK);px(x,y,w,h,c);};
const stack=(x,y,n)=>{for(let i=0;i<n;i++){px(x-1,y-i*2-1,14,3,INK);px(x,y-i*2,12,1,'#e3c9a0');px(x+4,y-i*2,4,1,'#c0392b');}};
const crate=(x,y)=>{box(x,y,9,6,'#b98450');px(x+4,y,1,6,'#e3c9a0');px(x,y+2,9,1,'#e3c9a0');};
const pail=(x,y)=>{box(x,y,7,6,'#ffd23f');px(x,y,7,2,'#8fd6ff');px(x,y+6,2,1,INK);px(x+5,y+6,2,1,INK);};
// what a guest carries rests on the hands of the sprite (waist height): 'back' is drawn before the body, 'front' after it
const PROP={
  pizza:{back(v){if(v.dir===1)stack(v.x-6,v.y-14,v.n);},front(v){if(v.dir===0)stack(v.x-6,v.y-14,v.n);else if(v.dir===2)stack(v.x+1,v.y-15,v.n);else if(v.dir===3)stack(v.x-13,v.y-15,v.n);}},
  parcel:{back(v){if(v.dir===1)crate(v.x-4,v.y-19);},front(v){if(v.dir===0)crate(v.x-4,v.y-19);else if(v.dir===2)crate(v.x+2,v.y-20);else if(v.dir===3)crate(v.x-11,v.y-20);}},
  // a bucket on wheels, pushed along by the mop that stands in it
  mop:{back(){},
    front(v){if(v.dir>1){const k=v.dir===3?-1:1,X=i=>Math.round(v.x+k*(3+i*.8));for(let i=0;i<=11;i++)px(X(i)-1,v.y-18+i,3,1,INK);for(let i=0;i<=11;i++)px(X(i),v.y-18+i,1,1,'#c9a36a');pail(v.x+k*11-3,v.y-7);}
      else if(v.dir===0){px(v.x-1,v.y-14,3,9,INK);px(v.x,v.y-14,1,9,'#c9a36a');pail(v.x-3,v.y-5);}}}
};

// ── guests ──────────────────────────────────────────────────────
const PARCELS=[],SHINE=[],HONK={until:0};let SIGN=null;
const GIFTS=['a rubber duck. Again','a mechanical keyboard','stickers','a plant that needs no water','socks with semicolons','a mug that says LGTM'];
// the three cafe tables and the seat behind each; PIE[i] is the box on table i: { n slices left, open }
// the last number is the side an eater stands on: 1 right of the table, -1 left of it
const TABLES=[[446,298,'sipA',1],[500,320,'sipB',1],[590,302,'sipC',-1]],PIE=[null,null,null];
function pizza(){
  PIE.fill(null);
  const hungry=SEATS.filter(s=>s.who&&!s.who.home&&s.who.st==='w').sort(()=>Math.random()-.5).map(s=>s.who);
  let eating=0,courierGone=false;
  const finish=()=>{if(courierGone&&!eating)end();};
  // a box goes on the table and opens; whoever is called over eats it one slice at a time
  const serve=i=>({do(v){v.n--;if(!v.n)drop(v);const pie=PIE[i]={n:6,open:false};later(.5,()=>{pie.open=true;});
    if(i===0)toast("Pizza's here. One box per table.");
    const p=hungry.pop();if(!p)return;eating++;const t=TABLES[i];
    Office.send(p,t[0]+12+t[3]*28,t[1]+14,{dir:t[3]>0?3:2,pose:'eat',speed:46,then(){p.eat=true;
      const bite=k=>later(1.2,()=>{pie.n=Math.max(0,pie.n-1);if(k>1)return bite(k-1);p.eat=false;Office.back(p,()=>{if(PIE[i]===pie)PIE[i]=null;eating--;finish();});});bite(6);}});}});
  const at=i=>[TABLES[i][0]+12-(SPOT[TABLES[i][2]].busy?13:0),TABLES[i][1]-2];
  const v=visitor({shirt:'#e03131'},'pizza',[].concat(
    lanes('uL','cV'),[at(0),{dir:0,wait:.7},serve(0),{wait:.5},NODE.cV],
    lanes('cV','cC'),[at(1),{dir:0,wait:.7},serve(1),{wait:.5},NODE.cC],
    lanes('cC','cE'),[at(2),{dir:0,wait:.7},serve(2),{wait:.5},NODE.cE],
    lanes('cE','uL')));
  v.n=3;v.onGone=()=>{courierGone=true;finish();};
  if(!begin('pizza','Pizza: курьер разносит коробки по столикам, к каждой подходят есть',v))VIS.pop();
}
function mail(){
  const s=rnd(SEATS.filter(s=>s.who&&!s.who.home)),p=s.who,up=s.seat==='F',sx=p.x+16,sy=up?86:190;
  const v=visitor({shirt:'#3b5bdb',pants:'#2e3350'},'parcel',lanes('uL',nearNode(sx,sy)).concat([[sx,sy],{dir:up?0:1,wait:.9},{do(v){drop(v);
    PARCELS.push({x:sx-5,y:up?sy+7:sy-9});if(PARCELS.length>5)PARCELS.shift();p.once={pose:'wave',until:TT+2.4};toast('Parcel for '+p.name+': '+rnd(GIFTS)+'.');}},{wait:.5}],lanes(nearNode(sx,sy),'uL')));
  v.onGone=end;if(!begin('mail','Mail: посылка для '+p.name,v))VIS.pop();
}
function clean(){
  const v=visitor({shirt:'#39c5cf',pants:'#2e3350',style:'bun',acc:'',hair:'#8a5a34',fit:''},'mop',lanes('uL','l4').concat([{do(){SHARDS=false;SIGN={x:476,y:200};toast('Wet floor. The cat has been warned.');}}],
    lanes('l4','l0'),[{dir:0,wait:1.2}],lanes('l0','l4'),[{do(){SIGN=null;}}],lanes('l4','uL')));
  v.mop=0;v.onGone=end;if(!begin('clean','Cleaners: моет нижний коридор и уходит',v))VIS.pop();
}

// ── events ──────────────────────────────────────────────────────
let PARTY=null,DRILL=null,DARK=null,HOL='';
function party(){
  const s=rnd(SEATS.filter(s=>s.who&&!s.who.home)),hero=s.who,up=s.seat==='F';
  if(!begin('party','Party: '+hero.name+' закрыл сотую задачу офиса, все танцуют',hero))return;
  const guests=P.filter(p=>p.roam&&p!==LEAD&&!p.home).slice(0,4);let n=guests.length;
  // everyone else who is not at a desk dances where they stand
  const others=P.filter(p=>!p.seat&&p.pose!=='sleep'&&!guests.includes(p));
  PARTY={hero,s,up,t0:TT,pop:0,guests,others};
  toast(hero.name+' just closed task #100. The dance floor is open.');
  guests.forEach((p,i)=>Office.send(p,hero.x-27+i*18,up?86:191,{dir:up?0:1,pose:'cheer',speed:64,then(q){burst(q.x,headTop(q)-2);q.errand.bx=q.x;q.errand.face=q.dir;}}));
  later(17,()=>{PARTY.over=true;if(!n){PARTY=null;return end();}guests.forEach(p=>Office.back(p,()=>{if(!--n){PARTY=null;end();}}));});
}
// four beats: arms up with a hop, a turn to the right, a wave, a turn to the left
function dance(T){
  const beat=T*2.6;
  PARTY.guests.forEach((p,i)=>{const e=p.errand;if(!e||e.home||e.route.length||e.bx==null)return;const b=((beat+i*.5)|0)%4;
    e.pose=b===0?'cheer':b===2?'wave':'idle';p.dir=b===1?2:b===3?3:e.face;p.x=e.bx+[0,1,0,-1][b];});
  [PARTY.hero].concat(PARTY.others).forEach((p,i)=>{if((p.roam&&p.state==='go')||p.moving||p.errand)return;const b=((beat+i*.7)|0)%4;p.once={pose:b%2?'wave':'cheer',until:T+.25};});
}
// fire drill: gather under a window, the warden counts and breaks it, everyone climbs out, the lift brings them back
let GLASS=0,SHARDS=false; // GLASS: 0 whole, 1 broken, 2 boarded up
function drill(){
  if(!begin('drill','Fire drill: сбор у окна, выход через окно, обратно на лифте',{x:240,y:110}))return;
  const warden=P.find(p=>p.name==='Merge'),crowd=P.filter(p=>p.pose!=='sleep'&&!p.home&&p!==warden).sort((a,b)=>Math.abs(a.x-240)-Math.abs(b.x-240));
  DRILL={t0:TT,n:crowd.length,in:0,warden,all:crowd.concat(warden),phase:'gather'};
  toast('FIRE DRILL. Leave the coffee.',true);Office.names='pips';
  Office.send(warden,290,78,{dir:3,speed:72});
  crowd.forEach((p,i)=>Office.send(p,204+(i%7)*12,64+((i/7)|0)*10,{dir:1,speed:72,then(){DRILL.in++;}}));
}
function smash(){
  if(!DRILL)return;const w=DRILL.warden;DRILL.phase='smash';
  w.errand={route:[[252,56]],speed:72,dir:1,pose:'board',then(){later(.7,()=>{GLASS=1;SHARDS=true;
    for(let i=0;i<18;i++)BITS.push({x:232+Math.random()*16,y:24+Math.random()*8,vx:(Math.random()-.5)*70,vy:-20-Math.random()*40,t:0,c:i%3?'#bfe3f2':'#fff'});
    toast('Emergency exit: the window. Facilities will love this.',true);later(.5,leave);});}};
}
function leave(){
  DRILL.phase='leave';let out=0;const all=DRILL.all;
  all.forEach((p,i)=>later(i*.15,()=>{p.errand={route:[[236+(i%3)*4,50]],speed:90,then(q){q.gone=true;if(++out===all.length)later(1.3,comeBack);}};}));
}
function comeBack(){
  DRILL.over=true;DRILL.phase='return';GLASS=2;
  toast('All '+DRILL.n+' out in '+Math.round(TT-DRILL.t0)+'s. Back by lift. Snooze slept through it.');
  const all=DRILL.all;let n=all.length;
  all.forEach((p,i)=>later(i*.16,()=>{p.gone=false;p.x=DOORWAY[0];p.y=DOORWAY[1];const h=p.home,w0=h.way[0]||[h.x,h.y];
    p.errand={route:Office.tidy([MAT].concat(bfs('uL',nearNode(w0[0],w0[1])).map(k=>NODE[k]),[w0,[h.x,h.y]])),home:true,speed:78,then(){if(!--n){DRILL=null;Office.names='working';end();}}};}));
}
function dark(){
  if(!begin('dark','Blackout: связь с сервером пропала, свет вернётся через 10 секунд'))return;
  DARK={t0:TT,len:10};toast('Connection lost. Backup power in 10s.',true);
  P.forEach((p,i)=>{if(p.seat&&p.pose==='type')p.once={pose:i%3?'idle':'palm',until:TT+10};});
  later(10,()=>{DARK=null;toast("Power's back. Unsaved work: all of it.");end();});
}
const lightsOut=()=>{if(!DARK)return false;const a=TT-DARK.t0;return a<1.1||a>DARK.len-1.3?Math.sin(a*37)+Math.sin(a*13)>0:true;};

// ── drawing ─────────────────────────────────────────────────────
function hat(x,top){px(x-6,top-1,12,3,INK);px(x-5,top-5,10,4,INK);px(x+1,top-8,6,4,INK);px(x-4,top-4,8,3,'#e03131');px(x+2,top-7,3,3,'#e03131');px(x-5,top,10,1,'#fff');px(x+5,top-7,2,2,'#fff');}
function pumpkin(x,y,lit){box(x,y,9,7,'#ff8a3d');px(x+1,y,1,7,'#e0661f');px(x+7,y,1,7,'#e0661f');px(x+4,y-2,2,2,'#3f9b5b');const c=lit?'#ffe066':INK;px(x+2,y+2,2,2,c);px(x+5,y+2,2,2,c);px(x+2,y+5,5,1,c);}
const PUMPKINS=[[524,60],[232,196],[96,196],[468,76],[38,150]];
Office.extra.push((T,dt,put,FX)=>{
  TT=T;
  for(let i=LATER.length-1;i>=0;i--)if(T>=LATER[i][0])LATER.splice(i,1)[0][1]();
  // the lift opens for whoever stands in its doorway
  const inDoor=VIS.some(v=>v.y<78)||P.some(p=>p.errand&&!p.gone&&p.y<78&&Math.abs(p.x-557)<22);liftO+=((inDoor?1:0)-liftO)*Math.min(1,dt*6);Office.lift=liftO<.03?0:liftO;
  for(let i=VIS.length-1;i>=0;i--){const v=VIS[i];walk(v,dt);
    if(v.mop!=null&&v.pose==='walk'&&Math.abs(v.y-188)<1&&v.dist-v.mop>5){v.mop=v.dist;SHINE.push({x:v.x,y:v.y+2+Math.random()*7,t:T});}
    if(Math.hypot(v.x-GOOSE.x,v.y-GOOSE.y)<44)HONK.until=T+1;
    if(v.gone){VIS.splice(i,1);if(v.onGone)v.onGone();continue;}
    put(v.y,()=>{shadow(v.x,v.y+1,6);const f=v.pose==='walk'?Math.floor(v.dist/2.6)%6:frameOf(v.pose,T);
      const pr=v.prop&&PROP[v.prop];if(pr)pr.back(v,T);
      blit(sprite(v.L,D,v.pose,v.dir,f,false,false),v.x-13,v.y-(D.foot+1));
      if(pr)pr.front(v,T);});}
  if(DRILL&&DRILL.phase==='gather'&&(DRILL.in>=DRILL.n||T-DRILL.t0>15)){DRILL.phase='count';later(1.2,smash);}
  if(GLASS)put(0,()=>{const X=222;px(X+7,12,24,18,'#1c2036');px(X+4,11,7,5,'#bfe3f2');px(X+27,11,7,4,'#bfe3f2');px(X+4,26,6,5,'#bfe3f2');px(X+26,25,8,6,'#bfe3f2');px(X+11,13,3,3,'#1c2036');px(X+24,27,3,2,'#1c2036');
    if(GLASS===2){box(X+2,14,34,3,'#8a5a34');box(X+2,23,34,3,'#6e4526');[16,25].forEach(y=>{px(X+4,y-1,1,1,'#c9ccd8');px(X+33,y-1,1,1,'#c9ccd8');});}
    if(SHARDS)for(let i=0;i<8;i++)px(X+4+i*4,48+(i%3),2,1,i%2?'#bfe3f2':'#fff');});
  // things left on the floor
  put(48,()=>{for(let i=SHINE.length-1;i>=0;i--){const s=SHINE[i],a=(T-s.t)/10;if(a>=1){SHINE.splice(i,1);continue;}
    g.globalAlpha=(1-a)*.55;px(Math.round(s.x)-5,Math.round(s.y),9,1,'#fff');px(Math.round(s.x)-2,Math.round(s.y)+2,6,1,'#cfe8ff');}g.globalAlpha=1;});
  if(SIGN)put(SIGN.y,()=>{const x=SIGN.x,y=SIGN.y;px(x-1,y-13,9,14,INK);px(x,y-12,7,11,'#ffd23f');px(x+3,y-10,1,5,INK);px(x+3,y-4,1,1,INK);px(x,y-1,2,2,'#ffd23f');px(x+5,y-1,2,2,'#ffd23f');});
  PARCELS.forEach(b=>put(b.y+8,()=>crate(b.x,b.y)));
  PIE.forEach((b,i)=>{if(!b)return;const t=TABLES[i];put(t[1]+18.5,()=>{const x=t[0]+3,y=t[1]-1;
    if(!b.open){box(x+1,y+2,16,8,'#e3c9a0');px(x+6,y+5,6,2,'#c0392b');return;}
    box(x,y-4,18,3,'#f2e6cf');px(x+8,y-3,2,1,'#c0392b');box(x,y,18,11,'#e3c9a0');px(x,y,18,1,'#cdb287');
    // round, seen at the angle of the table top; slice k is the k-th sixth of the circle
    for(let yy=0;yy<9;yy++)for(let xx=0;xx<16;xx++){const nx=(xx-7.5)/8,ny=(yy-4)/4.5,r=nx*nx+ny*ny;if(r>1)continue;
      const a=(Math.atan2(ny,nx)/6.2832+.75)%1*6,k=a|0;
      if(k>=b.n){if(((xx*7+yy*3)%11)===0)px(x+1+xx,y+1+yy,1,1,'#c98a3d');continue;}
      px(x+1+xx,y+1+yy,1,1,r>.7?'#c98a3d':a-k<.14?'#e0a020':((xx*5+yy*7)%9===0&&r<.55)?'#c0392b':'#ffd23f');}});});
  // a slice in the hand of whoever eats: point to the mouth, crust out; it follows the arm of the 'eat' pose
  FX.push(()=>P.forEach(p=>{if(!p.eat||!p.errand||p.errand.route.length)return;const up=((T*3)|0)%8<3,k=p.dir===3?-1:1,x=Math.round(p.x),y=Math.round(p.y)-(up?22:17);
    const col=(dx,dy,h,c)=>px(x+k*dx-(k<0?1:0),y+dy,1,h,c),o=up?4:5;
    col(o,1,3,INK);col(o+1,0,5,INK);col(o+2,0,5,INK);col(o+3,-1,7,INK);col(o+4,-1,7,INK);
    col(o,2,1,'#ffd23f');col(o+1,1,3,'#ffd23f');col(o+2,1,3,'#ffd23f');col(o+3,0,5,'#c98a3d');col(o+2,2,1,'#c0392b');}));
  if(T<HONK.until)FX.push(()=>{const x=Math.round(GOOSE.x)-10,y=Math.round(GOOSE.y)-30;px(x-1,y,23,9,INK);px(x,y-1,21,11,INK);px(x,y,21,9,'#fff');px(x+8,y+9,2,2,'#fff');text(g,'HONK!',x+1,y+2,'#c0392b');});
  if(PARTY){const h=PARTY.hero,s=PARTY.s,a=T-PARTY.t0;
    if(!PARTY.over)dance(T);
    if(!PARTY.over&&a-PARTY.pop>1.4){PARTY.pop=a;burst(h.x-30+Math.random()*60,(PARTY.up?70:150)+Math.random()*20);}
    put(PARTY.up?119.5:154.5,()=>{const x=s.dx+3,y=PARTY.up?101:136;box(x,y,9,5,'#f7c9d8');px(x,y+2,9,1,'#c0392b');px(x+4,y-3,1,3,'#fff');px(x+4,y-4,1,1,((T*8)|0)%2?'#ffd23f':'#ff8a3d');});
    FX.push(()=>{for(let i=0;i<3;i++){const x=Math.round(h.x-12+i*11),y=Math.round(headTop(h)-20+Math.sin(T*2+i*2)*2-(i===1?4:0)),c=['#f7768e','#7aa2f7','#ffd23f'][i];
        px(x+2,y+8,1,10,'#c8d3f5');px(x-1,y+1,7,6,INK);px(x,y,5,8,INK);px(x,y+1,5,6,c);px(x+1,y,3,8,c);px(x+1,y+2,1,2,'#fff');}
      // the ball hangs over the middle of the hall, the jukebox plays
      px(319,46,1,9,'#8b90a8');px(315,54,9,9,INK);for(let i=0;i<9;i++)px(316+(i%3)*2+(i%3),55+((i/3)|0)*2+((i/3)|0),2,2,(((T*5)|0)+i)%3?'#aab0c8':'#fff');
      for(let i=0;i<3;i++){const q=(T*.5+i/3)%1,x=Math.round(288+i*6+Math.sin(T*3+i)*2),y=Math.round(222-q*22);g.globalAlpha=1-q;px(x,y,1,5,'#ffd23f');px(x-2,y+4,3,2,'#ffd23f');px(x+1,y,2,1,'#ffd23f');g.globalAlpha=1;}});}
  if(DRILL)FX.push(()=>{const w=DRILL.warden;if(!w.errand||w.errand.route.length||(DRILL.phase!=='gather'&&DRILL.phase!=='count'))return;
    const x=Math.round(w.x)-18,y=Math.round(headTop(w))-13,s=String(DRILL.in).padStart(2,'0')+'-'+DRILL.n;
    px(x-1,y,25,9,INK);px(x,y-1,23,11,INK);px(x,y,23,9,'#fff');px(x+15,y+9,2,2,'#fff');text(g,s,x+2,y+2,INK);});
  if(HOL==='ny'){
    put(0,()=>WINS.forEach((X,w)=>{for(let i=0;i<7;i++){const q=(T*.22+i*.37+w*.21)%1;px(X+5+((i*11+w*5)%28)+Math.round(Math.sin(T+i)*1),12+((q*18)|0),1,1,'#fff');}}));
    put(78,()=>{const X=133,Y=40;shadow(X+11,78,9);px(X+8,Y+30,6,7,INK);px(X+9,Y+31,4,5,'#6e4526');
      [[6,4,10,9],[3,11,16,10],[0,19,22,12]].forEach(t=>{px(X+t[0]-1,Y+t[1]-1,t[2]+2,t[3]+2,INK);});
      [[6,4,10,9],[3,11,16,10],[0,19,22,12]].forEach(t=>{px(X+t[0],Y+t[1],t[2],t[3],'#2f7a47');px(X+t[0],Y+t[1],t[2],2,'#3f9b5b');});
      px(X+8,Y-2,6,6,INK);px(X+9,Y-1,4,4,'#ffd23f');
      [[8,8],[13,14],[5,16],[16,23],[3,26],[10,27]].forEach((o,i)=>px(X+o[0],Y+o[1],2,2,(((T*2)|0)+i)%3?['#e03131','#39d3ff','#ffd23f'][i%3]:'#fff'));});
    FX.push(()=>{P.forEach(p=>{if(p.pose!=='sleep')hat(Math.round(p.x),Math.round(headTop(p)));});VIS.forEach(v=>hat(Math.round(v.x),Math.round(v.y-D.foot+HY)));});}
  if(HOL==='hw'){
    PUMPKINS.forEach(o=>put(o[1]+7,()=>pumpkin(o[0],o[1],false)));
    FX.push(()=>{const x=Math.round(CAT.x)+(CAT.flip?-8:3),y=Math.round(CAT.y)-(CAT.sit?13:12);px(x-2,y-2,9,3,INK);px(x,y-7,5,6,INK);px(x-1,y-1,7,1,'#5c4a8a');px(x+1,y-6,3,5,'#5c4a8a');px(x+1,y-3,3,1,'#e0af68');
      for(let i=0;i<3;i++){const bx=Math.round(120+i*190+Math.sin(T*.7+i*2)*40),by=Math.round(16+Math.sin(T*1.9+i)*6),f=((T*7+i)|0)%2;px(bx,by,3,2,INK);px(bx-3,by-(f?2:0),3,2,INK);px(bx+3,by-(f?2:0),3,2,INK);}});}
});
Office.onLight=(lg,T,night)=>{
  if(PARTY&&!PARTY.over){lg.globalCompositeOperation='multiply';lg.fillStyle='rgb(120,112,170)';lg.fillRect(0,0,LW,LH);lg.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++)pool(320+Math.cos(T*.9+i*1.05)*250,128+Math.sin(T*1.4+i*2.1)*58,['#ff4fd8','#39d3ff','#ffd23f','#7cff6b','#bb9af7','#ff8a3d'][i],54,.75);}
  if(DRILL&&!DRILL.over){const s=.5+.5*Math.sin(T*9);lg.globalCompositeOperation='multiply';lg.fillStyle='rgb(255,'+((130+110*s)|0)+','+((130+110*s)|0)+')';lg.fillRect(0,0,LW,LH);}
  if(lightsOut()){lg.globalCompositeOperation='source-over';lg.fillStyle='rgb(12,14,36)';lg.fillRect(0,0,LW,LH);lg.globalCompositeOperation='lighter';
    const pulse=.55+.45*Math.sin(T*5);pool(10,54,'#ff3030',90,.6*pulse);pool(630,54,'#ff3030',90,.6*pulse);pool(557,34,'#3cff7a',46,.7);
    P.forEach((p,i)=>{if(i%3===0&&p.pose!=='sleep')pool(p.x,p.y-16,'#dfe9ff',30,.85);});}
  if(HOL==='hw'){lg.globalCompositeOperation='multiply';lg.fillStyle='rgb(255,222,196)';lg.fillRect(0,0,LW,LH);if(night>.2){lg.globalCompositeOperation='lighter';PUMPKINS.forEach(o=>pool(o[0]+4,o[1]+3,'#ff9a3d',26,.7*night));}}
  if(HOL==='ny'&&night>.2){lg.globalCompositeOperation='lighter';pool(144,58,'#ffe9b8',40,.55*night);}
  lg.globalCompositeOperation='source-over';
};
Office.glow.push(T=>{
  if(DRILL&&!DRILL.over){const on=((T*6)|0)%2;px(593,12,9,9,INK);px(594,13,7,7,on?'#ff4b4b':'#8f2a20');px(597,20,1,2,'#ffd23f');if(on){px(590,15,2,1,'#ff4b4b');px(603,15,2,1,'#ff4b4b');px(597,9,1,2,'#ff4b4b');}}
  if(lightsOut()){text(g,'EXIT',550,0,'#3cff7a');const x=Math.round(CAT.x)+(CAT.flip?-7:4),y=Math.round(CAT.y)-9;px(x,y,1,1,'#7cff6b');px(x+2,y,1,1,'#7cff6b');}
  if(HOL==='ny')for(let x=5,i=0;x<636;x+=9,i++)px(x,48+Math.round(Math.sin(i*.9)*1.5),2,2,(((T*2.5)|0)+i)%4===0?'#fff':['#ff4b4b','#ffd23f','#7cff6b','#39d3ff'][i%4]);
  if(HOL==='hw'){PUMPKINS.forEach(o=>{if(Math.sin(T*6+o[0])>-.6){px(o[0]+2,o[1]+2,2,2,'#ffe066');px(o[0]+5,o[1]+2,2,2,'#ffe066');px(o[0]+2,o[1]+5,5,1,'#ffe066');}});
    const gx=Math.round((T*13)%740)-50,gy=Math.round(138+Math.sin(T*1.3)*16);g.globalAlpha=.5+.15*Math.sin(T*3);px(gx+1,gy,10,12,'#eef3ff');px(gx,gy+3,12,9,'#eef3ff');for(let i=0;i<3;i++)px(gx+i*4+(((T*3)|0)%2),gy+12,3,2,'#eef3ff');g.globalAlpha=.9;px(gx+3,gy+4,2,2,INK);px(gx+7,gy+4,2,2,INK);g.globalAlpha=1;}
});
Office.onFrame.push(()=>{if(FOLLOW&&small)Office.cam.to(FOLLOW.x,FOLLOW.y-12,Office.cam.z,true);});

const RUN={pizza,mail,clean,party,drill,dark};
$$('.ev').forEach(b=>b.onclick=()=>RUN[b.dataset.e]());
$$('.hol').forEach(b=>b.onclick=()=>{HOL=b.dataset.h;$$('.hol').forEach(o=>o.setAttribute('aria-pressed',o===b));});
$$('.hr').forEach(b=>b.onclick=()=>{Office.setHour(+b.dataset.t);$$('.hr').forEach(o=>o.setAttribute('aria-pressed',o===b));});
Office.setHour(10);
Office.start();
})();
</script>
