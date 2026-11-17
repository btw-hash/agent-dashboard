<title>Agent Office Bonus Views</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: the office on top with three marked objects; each opens its view over the same stage. Under it, one card per view. */
:root{
  color-scheme:dark;
  --bg:#080810; --surface:#0c0d1e; --surface-2:#11132a; --border:#1e2240; --border-hi:#2e3566;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --think:#bb9af7; --ok:#9ece6a; --warn:#e0af68; --door:#39d3ff;
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
.controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--surface);border:1px solid var(--border);padding:10px 12px}
.lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-right:2px}
.chip{background:var(--surface-2);border:1px solid var(--border);padding:5px 10px;font-size:12px;color:var(--text);border-radius:2px;white-space:nowrap}
.chip:hover{border-color:var(--border-hi);color:var(--text-hi)}
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#07081a;font-weight:700}
.chip.d{border-color:#1f6f86;color:var(--door)}
.stage{position:relative;height:clamp(420px,76vh,820px);border:1px solid var(--border);background:#05060d;overflow:hidden}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none}
#cv.hit{cursor:pointer}
.tags{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.tag{position:absolute;transform:translate(-50%,-100%);padding:3px 6px 2px;font-family:var(--pixel);font-size:7px;line-height:1.4;color:var(--text-hi);background:rgba(10,11,26,.9);border:1px solid var(--border-hi);white-space:nowrap}
.tag.spot{color:#07081a;background:var(--door);border-color:#07081a}
/* the three views share the stage */
.view{position:absolute;inset:0;z-index:6;animation:iris .7s ease-out both}
@keyframes iris{from{clip-path:circle(0% at var(--ox,50%) var(--oy,50%))}to{clip-path:circle(150% at var(--ox,50%) var(--oy,50%))}}
.top{position:absolute;z-index:8;left:10px;top:10px;right:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;pointer-events:none}
.top>*{pointer-events:auto}
.btn{background:var(--glass);border:1px solid var(--border-hi);padding:6px 10px;font-size:11px;color:var(--text-hi);white-space:nowrap}
.btn:hover{border-color:var(--accent)}.btn[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#07081a;font-weight:700}
.cap{font-family:var(--pixel);font-size:9px;color:var(--text-hi);background:var(--glass);padding:8px 10px 6px;border:1px solid var(--border)}
#vTerm{background:#04060a;display:flex;align-items:center;justify-content:center;overflow:auto}
#term{margin:0;color:#6fae5a;font:12px/1.25 var(--font);white-space:pre;padding:44px 12px 12px;text-shadow:0 0 6px rgba(111,174,90,.5)}
#vTerm{background:radial-gradient(ellipse at center,#07110b 0%,#04060a 70%,#020304 100%)}
#vTerm::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px,rgba(0,0,0,.2) 2px 3px)}
#term b{font-weight:700}#term .w{color:#c5f08f}#term .t{color:#d8c2ff}#term .i{color:#8b90a8}#term .d{color:#2f5a3a;font-weight:400}#term .k{color:#9ece6a;font-weight:400}#term .c{color:#ffb347}#term .h{color:#e4ecff}
#vNight{background:#0b1030}
#nightCv{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;display:block}
#vMini{background:linear-gradient(#bfe0f7,#f3e7d3 70%)}
#miniHost{position:absolute;inset:0}#miniHost canvas{display:block}
.printing{position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:#0b0d1e;color:var(--text-hi);z-index:7}
.printing b{font-family:var(--pixel);font-size:11px;font-weight:400}
.bar{width:min(320px,70%);height:12px;border:2px solid var(--door);padding:2px}.bar i{display:block;height:100%;width:0;background:var(--door)}
.box{background:var(--surface);border:1px solid var(--border);padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.box ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px}.box li::marker{color:var(--accent)}
.way{border-top:3px solid var(--door)}
.note{font-size:11px;color:var(--text-dim)}
kbd{font:inherit;border:1px solid var(--border-hi);padding:0 5px;background:var(--surface-2)}
@media (prefers-reduced-motion:reduce){.view{animation:none}}
</style>

<div class="page">
  <header>
    <h1>Три выхода из офиса</h1>
    <p class="lede">Основной режим один — пиксельный офис. Три других взгляда спрятаны в предметах: нажми на серверную стойку, телескоп или 3D-принтер (над ними голубые метки). Все три показывают тот же живой офис, а не запись.</p>
  </header>

  <section class="controls" aria-label="Быстрый вход">
    <span class="lbl">Открыть сразу</span>
    <button class="chip d go" data-v="terminal">Терминал</button>
    <button class="chip d go" data-v="night">Окна ночью</button>
    <button class="chip d go" data-v="mini">3D-миниатюра</button>
    <button class="chip" id="idleNow">Заставка через 3 секунды</button>
    <span class="note" id="idleNote"></span>
  </section>

  <section class="stage" id="stage" aria-label="Офис и бонус-виды">
    <canvas id="cv"></canvas>
    <div class="tags" id="tags"></div>
    <div class="view" id="vTerm" hidden><pre id="term"></pre></div>
    <div class="view" id="vNight" hidden><canvas id="nightCv" width="320" height="180"></canvas><div class="tags"><div class="tag" id="nTag" hidden></div></div></div>
    <div class="view" id="vMini" hidden><div id="miniHost"></div><div class="printing" id="printing"><b id="printMsg">PRINTING THE OFFICE</b><div class="bar"><i id="printBar"></i></div></div></div>
    <div class="top" id="top" hidden>
      <button class="btn" id="back">&larr; Back to the office</button>
      <span class="cap" id="vcap"></span>
      <span id="cams" hidden><button class="btn cam" data-c="corner" aria-pressed="true">Corner</button> <button class="btn cam" data-c="front" aria-pressed="false">Front cut-away</button> <button class="btn cam" data-c="walk" aria-pressed="false">Walk-in</button></span>
    </div>
  </section>

  <section class="cols">
    <div class="box way"><h2>Терминал</h2>
      <ul>
        <li>Вход: серверная стойка в левом углу холла или клавиша <kbd>`</kbd>.</li>
        <li>Тот же офис буквами: карта этажа, люди первой буквой имени, ниже таблица состояний. Справа: кто в какой комнате, лента событий, чем заняты кот и гусь.</li>
        <li>Тот же экран можно отдать и в настоящую консоль: <kbd>npx agent-office --tui</kbd>.</li>
        <li>Ничего не весит: это текст, обновляется три раза в секунду.</li>
      </ul>
    </div>
    <div class="box way"><h2>Окна ночью</h2>
      <ul>
        <li>Вход: телескоп у правого окна.</li>
        <li>Каждый агент — окно. Работает: тёплый свет и силуэт за монитором. Думает: сиреневый. На перерыве: мерцает телевизор. Спит: темно.</li>
        <li>Вокруг живой город: облака, самолёт, дым из трубы, вывеска, фонари, машина.</li>
        <li>Наведи на окно, покажется имя.</li>
        <li>Он же заставка: включается сам, если страницу не трогать 45 секунд, и уходит от первого движения мыши.</li>
      </ul>
    </div>
    <div class="box way"><h2>3D-миниатюра</h2>
      <ul>
        <li>Вход: 3D-принтер на тумбе слева. Он «печатает» модель офиса.</li>
        <li>Модель собирается из того же плана: стены, столы, мебель, а люди ходят по ней там же, где в пикселях.</li>
        <li>Три камеры, которые ты выбрал: Corner, Front cut-away, Walk-in (идёт за Commit-D).</li>
        <li>three.js грузится только по клику на принтер, основной офис его не тянет.</li>
        <li>Модель бумажная: пол и стены несут тот же рисунок, что в пикселях, а у каждой вещи её спрайт на лицевой грани. Люди собраны из блоков, с руками и ногами, и шагают.</li>
      </ul>
    </div>
    <div class="box"><h2>Что отложено</h2>
      <ul>
        <li>«Башня» (вид сбоку) — это вторая полная планировка, а не пасхалка.</li>
        <li>«Полка» (полоска внизу экрана) — отдельное приложение-виджет со своей упаковкой.</li>
      </ul>
    </div>
  </section>
</div>

<script>
(function(){
/*ENGINE*/

// ── this page: three views over the same live office ────────────
Office.snap=true;Office.showDoors=true;
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const CAPS={terminal:'TERMINAL',night:'WINDOWS AT NIGHT',mini:'3D MINIATURE'},VIEW={terminal:'#vTerm',night:'#vNight',mini:'#vMini'};
let view=null,byIdle=false,lastAct=performance.now()/1000,pending=0;
function openView(id,idle){closeView(true);view=id;byIdle=!!idle;const d=DOORS.find(x=>x.id===id),el=$(VIEW[id]),s=Office.toScreen(d.x,d.y);
  el.style.setProperty('--ox',s[0]+'px');el.style.setProperty('--oy',s[1]+'px');el.hidden=false;$('#top').hidden=false;$('#vcap').textContent=CAPS[id]+(idle?' · SCREENSAVER':'');$('#cams').hidden=id!=='mini';
  if(id==='terminal')drawTerm();if(id==='mini')startMini();}
function closeView(quiet){if(!view)return;$(VIEW[view]).hidden=true;$('#top').hidden=true;view=null;byIdle=false;if(!quiet)lastAct=performance.now()/1000;}
// walk the camera to the object first, then open what it leads to
function go(id){clearTimeout(pending);closeView(true);const d=DOORS.find(x=>x.id===id);Office.touched=true;Office.cam.frame(d.x,d.y+14,300,170,true);stage.scrollIntoView({block:'nearest',behavior:'smooth'});pending=setTimeout(()=>{pending=0;openView(id);},850);}
Office.onPick=a=>{if(a&&a.kind==='door')go(a.id);};
$$('.go').forEach(b=>b.onclick=()=>go(b.dataset.v));$('#back').onclick=()=>closeView();
document.addEventListener('keydown',e=>{if(e.key==='`'||e.code==='Backquote'){e.preventDefault();view==='terminal'?closeView():openView('terminal');}else if(e.key==='Escape')closeView();});
['pointermove','pointerdown','keydown','wheel'].forEach(t=>window.addEventListener(t,()=>{lastAct=performance.now()/1000;if(view&&byIdle)closeView();},{passive:true}));
$('#idleNow').onclick=()=>{closeView(true);setTimeout(()=>{lastAct=performance.now()/1000-42;},50);$('#idleNote').textContent='Не двигай мышь.';setTimeout(()=>{$('#idleNote').textContent='';},6000);};

// ── terminal ────────────────────────────────────────────────────
const TC=78,TR=20,tcol=x=>Math.max(0,Math.min(TC-1,Math.floor(x/LW*TC))),trow=y=>Math.max(0,Math.min(TR-1,Math.floor(y/LH*TR)));
const tlog=[];function tnote(msg){tlog.push([Office.clock(),msg]);if(tlog.length>8)tlog.shift();}
Office.onEvent=(type,p)=>tnote(type==='cheer'?p.name+' finished a task':type==='palm'?p.name+' hit a tool error':p.name+' joined');
['agent-office --tui','watching '+P.length+' agents','goose located: cafe'].forEach(tnote);
function drawTerm(){const gr=[];for(let r=0;r<TR;r++)gr.push(Array.from({length:TC},()=>[' ','']));
  const say=(c,r,s,k)=>{for(let i=0;i<s.length;i++)if(c+i<TC&&c+i>=0)gr[r][c+i]=[s[i],k||''];},WR=trow(215),B=(k,s)=>'<b class="'+k+'">'+esc(s)+'</b>';
  for(let c=0;c<TC;c++){gr[2][c]=['-','d'];gr[WR][c]=['=','d'];}
  ROOMS.forEach(rm=>{const dc=tcol(rm.door);for(let i=-1;i<=1;i++)gr[WR][dc+i]=[' ',''];say(tcol(rm.x0)+2,WR+1,rm.name,'d');});
  ROOMS.slice(1).forEach(rm=>{for(let r=WR+1;r<TR;r++)gr[r][tcol(rm.x0)]=['|','d'];gr[WR][tcol(rm.x0)]=['+','d'];});
  say(tcol(54),1,'[SRV]','d');say(tcol(84)+2,1,'[FISH]','d');say(tcol(150)+3,1,'[BOARD]','d');say(tcol(272)+1,1,'[STATUS]','d');say(tcol(538),1,'[LIFT]','d');say(tcol(606),1,'[o<]','d');
  ITEMS.forEach(it=>{if(it.b>240&&it.s.width>20)say(tcol(it.x+it.s.width/2)-1,trow(it.b-6),'::','d');});
  SEATS.forEach(s=>say(tcol(s.dx+8),trow(s.seat==='F'?124:138),'###',s.who?'k':'d'));
  P.forEach(p=>say(tcol(p.x),trow(p.y-10),p.now==='sleep'?'z':p.name[0],p.st));
  say(tcol(CAT.x),trow(CAT.y-4),'^','c');say(tcol(GOOSE.x),trow(GOOSE.y-4),'g','c');
  const w=P.filter(p=>p.st==='w').length,t=P.filter(p=>p.st==='t').length,line='-'.repeat(TC),left=[];
  // every left line is exactly 80 characters wide on screen, so a second column can sit beside it
  const L=(html,len)=>left.push(html+' '.repeat(Math.max(0,80-len)));
  const h1=' AGENT OFFICE   '+w+' working   '+t+' thinking   '+(P.length-w-t)+' on a break',ck=Office.clock();
  L(' '+B('h','AGENT OFFICE')+'   '+B('w',w+' working')+'   '+B('t',t+' thinking')+'   '+B('i',(P.length-w-t)+' on a break')+' '.repeat(Math.max(1,80-h1.length-ck.length-1))+ck,80);
  L(B('d','+'+line+'+'),80);gr.forEach(r=>L(B('d','|')+r.map(c=>c[1]?B(c[1],c[0]):esc(c[0])).join('')+B('d','|'),80));L(B('d','+'+line+'+'),80);
  L(' '+B('d','NAME          STATE      DOING                  ENERGY'),53);
  P.slice().sort((a,b)=>'wti'.indexOf(a.st)-'wti'.indexOf(b.st)).slice(0,9).forEach(p=>{const e=Math.round(p.energy/10);L(' '+B(p.st,p.name.padEnd(13))+' '+({w:'working ',t:'thinking',i:'break   '}[p.st])+'   '+esc(Office.act(p).padEnd(22))+' '+B('k','#'.repeat(e))+B('d','.'.repeat(10-e)),59);});
  L(' '+B('d','letters are people · ^ cat · g goose · # desks · backtick or Esc to leave'),74);L(' &gt; agent-office --tui '+((performance.now()/500|0)%2?'_':' '),24);
  // the second column: who is where, what just happened
  const wide=stage.clientWidth>=760,right=[];
  if(wide){const inRoom=rm=>P.filter(p=>p.y>240&&p.x>=rm.x0&&p.x<rm.x1).length,bar=n=>B('k','#'.repeat(Math.min(12,n)))+' '+n;
    right.push('',B('h','ROOMS'),'HALL    '+bar(P.filter(p=>p.y<=240).length));ROOMS.forEach(rm=>right.push(rm.name.padEnd(8)+bar(inRoom(rm))));
    right.push('',B('h','EVENTS'));tlog.forEach(e=>right.push(B('d',e[0])+' '+esc(e[1].slice(0,22))));for(let i=tlog.length;i<8;i++)right.push('');
    right.push('',B('h','PETS'),'cat     '+(CAT.sit?'sitting':'on patrol'),'goose   '+(GOOSE.y>240?'raiding the cafe':'loose in the hall'),'',B('h','LIGHT'),Office.clock()+' '+Office.phase(),'',B('h','UP NEXT'),B('d','lift arrives in '+Math.max(0,Math.ceil(19-(performance.now()/1000)%24))+'s'));}
  const el=$('#term');el.style.fontSize=Math.max(5.5,Math.min(15,(stage.clientWidth-28)/((wide?112:80)*.602)))+'px';
  el.innerHTML=left.map((l,i)=>l+(wide&&right[i]!==undefined?'   '+right[i]:'')).join('\n');}

// ── windows at night ────────────────────────────────────────────
const NW=320,NH=180,nCv=$('#nightCv'),nx=nCv.getContext('2d'),WINS2=[];for(let r=0;r<4;r++)for(let c=0;c<6;c++)WINS2.push({x:78+c*28,y:42+r*30});
let nHover=-1;const tenants=()=>P.concat([CAT]);
function drawNight(T){const R=(x,y,w,h,c)=>{nx.fillStyle=c;nx.fillRect(x|0,y|0,w|0,h|0);};nx.imageSmoothingEnabled=false;nx.globalAlpha=1;
  // sky: stars, a shooting star now and then, the moon with a halo, drifting clouds, a plane
  const sk=nx.createLinearGradient(0,0,0,NH);sk.addColorStop(0,'#070b24');sk.addColorStop(.6,'#1b1f52');sk.addColorStop(1,'#4a3570');nx.fillStyle=sk;nx.fillRect(0,0,NW,NH);
  for(let i=0;i<60;i++)if(((T*1.4|0)+i)%6)R((i*73+11)%NW,(i*37+5)%104,1,1,i%7?'#c8d3f5':'#fff');
  const sh=(T*.07)%1;if(sh<.06){const q=sh/.06;R(40+q*120,20+q*40,6,1,'#fff');R(34+q*120,18+q*40,6,1,'rgba(255,255,255,.4)');}
  R(262,6,34,34,'rgba(246,241,208,.05)');R(266,10,26,26,'rgba(246,241,208,.07)');R(272,16,14,14,'#f6f1d0');R(277,13,12,12,'#0c1030');
  for(let i=0;i<3;i++){const x=((T*(2.5+i)+i*140)%(NW+90))-70,y=26+i*20;R(x,y,48,5,'rgba(70,80,150,.45)');R(x+9,y-3,26,4,'rgba(70,80,150,.45)');R(x+16,y+5,24,2,'rgba(70,80,150,.3)');}
  const pl=(T*13)%(NW+60)-30;R(pl,14,3,1,'#c8d3f5');R(pl-2,13,2,1,'#8b90a8');if((T*3|0)%2)R(pl+3,14,1,1,'#ff4b4b');
  // far skyline, then the neighbours
  for(let i=0;i<15;i++){const x=i*23-6,h=34+((i*37)%44);R(x,NH-h-8,21,h,'#1a1f4a');for(let k=0;k<5;k++)if((i*3+k*7)%5<2)R(x+3+(k%3)*6,NH-h-2+((k*5)%(h-12)),2,3,(Math.sin(T*.5+i+k)>.2)?'#5a66b8':'#2a3170');}
  [[0,104,46,'#11142e'],[40,88,28,'#151838'],[256,96,38,'#151838'],[290,114,30,'#11142e']].forEach((b,i)=>{R(b[0],b[1],b[2],NH-b[1],b[3]);R(b[0],b[1],b[2],2,'#232847');
    for(let k=0;k<9;k++){const on=(k*5+i*3)%4===0||((T*.2+k+i)|0)%9===0;R(b[0]+4+(k%3)*9,b[1]+8+((k/3)|0)*14,4,5,on?'#ffd39a':'#1c2148');}});
  R(46,78,3,10,'#151838');for(let i=0;i<3;i++){const q=(T*.3+i/3)%1;nx.globalAlpha=.5*(1-q);R(45+Math.sin(T+i)*2+q*6,74-q*22,4+q*4,3,'#8b90a8');}nx.globalAlpha=1;
  R(8,92,14,12,'#1c2148');R(10,104,2,4,'#1c2148');R(18,104,2,4,'#1c2148');R(8,92,14,2,'#2a2f5c');
  R(258,80,34,14,'#0b0d22');R(260,82,30,10,'#11142e');text(nx,'OPEN',267,85,Math.sin(T*2.1)>-.85?'#39d3ff':'#1f4a5a');R(272,94,2,4,'#0b0d22');R(280,94,2,4,'#0b0d22');
  // the office building
  R(66,28,188,152,'#1c2040');R(66,28,3,152,'#262b55');R(251,28,3,152,'#151833');R(62,24,196,5,'#2a2f5c');R(62,24,196,1,'#3d4480');
  for(let r=1;r<4;r++)R(66,36+r*30,188,1,'#232847');for(let i=0;i<40;i++)R(70+(i*47)%180,32+(i*29)%140,2,1,'#20244a');
  R(78,10,18,12,'#232847');R(78,10,18,2,'#3d4480');R(80,22,2,3,'#151833');R(92,22,2,3,'#151833');R(196,18,12,6,'#2a2f5c');R(198,20,3,2,'#151833');R(212,19,9,5,'#2a2f5c');
  R(240,6,2,18,'#11142b');R(240,4,2,2,(T*1.5|0)%2?'#ff4b4b':'#5a1a1a');R(108,8,56,14,'#0b0d22');R(110,10,52,11,'#0f1126');text(nx,'AGENT OFFICE',113,13,Math.sin(T*1.3+7)>.96?'#7a2a6c':'#ff4fd8');
  const L=tenants();WINS2.forEach((w,i)=>{const p=L[i],x=w.x,y=w.y;R(x-1,y-1,24,18,'#0f1126');
    if(!p){R(x,y,22,16,'#171a36');R(x+2,y+10,6,6,'#11142b');}
    else if(p===CAT){R(x,y,22,16,'#1d2147');R(x+8,y+9,8,7,'#11142b');R(x+8,y+6,2,3,'#11142b');R(x+14,y+6,2,3,'#11142b');if((T*.7|0)%5){R(x+10,y+11,1,1,'#ffe066');R(x+13,y+11,1,1,'#ffe066');}}
    else if(p.now==='sleep'){R(x,y,22,16,'#141733');const q=(T*.4)%1;nx.globalAlpha=Math.sin(q*Math.PI);R(x+9+q*6,y+10-q*7,3,1,'#c8d3f5');R(x+10+q*6,y+11-q*7,1,1,'#c8d3f5');R(x+9+q*6,y+12-q*7,3,1,'#c8d3f5');nx.globalAlpha=1;}
    else if(p.st==='i'){R(x,y,22,16,(Math.sin(T*9+i)+Math.sin(T*3.7+i*2))>.4?'#5c8dff':'#33407a');R(x+5,y+11,12,5,'#1c2040');R(x+9,y+7,5,5,'#1c2040');}
    else{const think=p.st==='t',bob=think?0:(T*(7+i%3)|0)%2,sway=think?Math.round(Math.sin(T*.9+i)*4):0;R(x,y,22,16,think?'#d8c2ff':'#ffd39a');R(x,y,22,3,think?'#ece0ff':'#fff0cf');
      if(i%3===0){R(x,y,3,16,think?'#a98fe0':'#e09a5c');R(x+19,y,3,16,think?'#a98fe0':'#e09a5c');}if(i%4===1){R(x+2,y+11,3,5,'#3f9b5b');R(x+1,y+9,5,3,'#57b86c');}
      R(x+8+sway,y+5+bob,6,5,tone(p.hair,-.3));R(x+6+sway,y+10+bob,10,6,tone(p.shirt,-.25));
      if(!think){R(x+16,y+8,5,6,'#1c2036');R(x+17,y+10,3,1,['#7aa2f7','#9ece6a'][(T*6+i|0)%2]);}if(p.emoOn||p.once){R(x+2,y+2,2,2,'#fff');R(x+18,y+3,2,2,'#ffd23f');R(x+5,y+4,1,1,'#f7768e');}}
    R(x+10,y,2,16,'#2a2f5c');R(x-1,y+16,24,2,'#2a2f5c');R(x-1,y+16,24,1,'#3d4480');if(i===nHover&&p){nx.strokeStyle='#fff';nx.lineWidth=1;nx.strokeRect(x-1.5,y-1.5,25,19);}});
  // the street: entrance with an awning, lamps with their light, trees, a bench, a car
  R(142,152,36,4,'#7a2f3f');for(let i=0;i<6;i++)R(142+i*6,152,3,4,'#a85050');R(152,158,16,16,'#11142b');R(154,160,12,14,'#ffd39a');R(159,160,2,14,'#11142b');R(148,174,24,2,'#2a2f5c');
  R(0,174,NW,2,'#232847');R(0,176,NW,4,'#0b0d22');for(let i=0;i<NW;i+=18)R(i+((T*0)|0),178,8,1,'#232847');
  [26,118,206,300].forEach((x,i)=>{nx.fillStyle='rgba(255,211,154,.10)';nx.beginPath();nx.moveTo(x+1,150);nx.lineTo(x-12,174);nx.lineTo(x+14,174);nx.fill();R(x,148,2,26,'#3a3f5c');R(x-2,146,6,3,'#ffd39a');R(x-2,146,6,1,'#fff0cf');});
  [[56,150],[276,152]].forEach(t=>{R(t[0]+5,t[1]+12,2,12,'#3b2a1e');R(t[0],t[1],12,10,'#1f4a36');R(t[0]+2,t[1]-3,8,5,'#255a40');R(t[0]+3,t[1]+2,3,2,'#2f7a52');});
  R(88,168,14,2,'#3b2a1e');R(89,170,2,4,'#3b2a1e');R(99,170,2,4,'#3b2a1e');R(88,164,14,1,'#3b2a1e');
  const car=(T*26)%(NW+80)-40;R(car,171,16,5,'#23263a');R(car+3,168,9,3,'#2e3350');R(car+15,173,2,1,'#fff6c8');nx.fillStyle='rgba(255,246,200,.12)';nx.fillRect(car+17,172,12,3);R(car-1,173,1,1,'#ff4b4b');}
nCv.addEventListener('pointermove',e=>{const r=nCv.getBoundingClientRect(),s=Math.min(r.width/NW,r.height/NH),x=(e.clientX-r.left-(r.width-NW*s)/2)/s,y=(e.clientY-r.top-(r.height-NH*s)/2)/s,L=tenants();
  nHover=WINS2.findIndex((w,i)=>L[i]&&x>=w.x&&x<w.x+22&&y>=w.y&&y<w.y+16);const tg=$('#nTag');if(nHover<0){tg.hidden=true;return;}const p=L[nHover],w=WINS2[nHover];
  tg.hidden=false;tg.textContent=p.name+' · '+(p===CAT?'on patrol':Office.act(p));tg.style.left=((r.width-NW*s)/2+(w.x+11)*s)+'px';tg.style.top=((r.height-NH*s)/2+(w.y-3)*s)+'px';});
nCv.addEventListener('pointerleave',()=>{nHover=-1;$('#nTag').hidden=true;});

// ── 3D miniature: three.js arrives only when the printer is used ──
let M=null,camMode='corner',printT=0,lib=null;
const fz=y=>y<206?(y-46)/10:y<240?16+(y-206)/85:16.4+(y-240)/10;
function loadThree(){return lib||(lib=new Promise((ok,bad)=>{if(window.THREE)return ok();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=()=>ok();s.onerror=()=>{lib=null;bad();};document.head.appendChild(s);}));}
function startMini(){const pr=$('#printing');if(M){pr.hidden=true;sizeMini();return;}pr.hidden=false;$('#printMsg').textContent='PRINTING THE OFFICE';printT=performance.now();
  loadThree().then(()=>{const left=Math.max(0,1500-(performance.now()-printT));setTimeout(()=>{if(!M)buildMini();pr.hidden=true;sizeMini();},left);},()=>{$('#printMsg').textContent='THE 3D ENGINE DID NOT LOAD';});}
function avgColor(s){const d=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let r=0,gg=0,b=0,n=0;for(let i=0;i<d.length;i+=12)if(d[i+3]>200&&d[i]+d[i+1]+d[i+2]>150){r+=d[i];gg+=d[i+1];b+=d[i+2];n++;}return n?[r/n|0,gg/n|0,b/n|0]:[115,120,150];}
// The model is papercraft: floors and walls carry the painted 2D floor, every piece of furniture is a block with its own sprite on the face.
function buildMini(){const host=$('#miniHost'),big=host.clientWidth>700,rn=new THREE.WebGLRenderer({antialias:true,alpha:true});rn.setPixelRatio(Math.min(window.devicePixelRatio||1,2));rn.shadowMap.enabled=true;rn.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(rn.domElement);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(34,1,.5,500),C=h=>new THREE.Color(h),lam=o=>new THREE.MeshLambertMaterial(o);
  sc.add(new THREE.HemisphereLight(0xffffff,0xc8b8a0,.9));const sun=new THREE.DirectionalLight(0xfff1d6,.75);sun.position.set(14,48,34);sun.castShadow=true;sun.shadow.mapSize.set(big?2048:1024,big?2048:1024);sun.shadow.bias=-.0006;Object.assign(sun.shadow.camera,{left:-44,right:44,top:38,bottom:-38,near:1,far:150});sun.target.position.set(32,0,14);sc.add(sun,sun.target);
  const tex=c=>{const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;};
  const crop=(src,x,y,w,h,k)=>{const c=mk(w*k,h*k),q=c.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(src,x,y,w,h,0,0,w*k,h*k);return c;};
  const box=(w,h,d,mat,x,y,z,cast)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat.isMaterial||Array.isArray(mat)?mat:lam({color:mat}));m.position.set(x,y,z);m.castShadow=cast!==false;m.receiveShadow=true;sc.add(m);return m;};
  const flat=(w,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),lam({map:tex(c)}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;sc.add(m);return m;};
  // a wall picture: a plane showing columns a..b of a canvas strip
  const face=(t,a,b,total,h,x,y,z)=>{const gm=new THREE.PlaneGeometry((b-a)/10,h),uv=gm.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(a+uv.getX(i)*(b-a))/total);const m=new THREE.Mesh(gm,lam({map:t}));m.position.set(x,y,z);m.receiveShadow=true;sc.add(m);};
  // ground, slab, floors painted from the 2D background
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(260,200),new THREE.ShadowMaterial({opacity:.16}));gnd.rotation.x=-Math.PI/2;gnd.position.set(32,-1.22,14);gnd.receiveShadow=true;sc.add(gnd);
  box(66,1.2,30.6,C('#e9dcc6'),32,-.61,14);
  flat(64,16.4,crop(bgc,0,46,640,164,4),32,.02,8.2);flat(64,11.6,crop(bgc,0,240,640,116,4),32,.02,22.2);
  // the back wall with its windows, board, status screen and lift
  const wc=mk(640,46),wq=wc.getContext('2d');wq.drawImage(bgc,0,0,640,46,0,0,640,46);WINS.forEach(X=>{wq.drawImage(F.win,X,8);wq.fillStyle='#a4d6ff';wq.fillRect(X+3,11,32,20);wq.fillStyle='#e8e2d4';wq.fillRect(X+18,11,2,20);wq.fillRect(X+3,20,32,1);});
  WALLS.forEach(w=>{if(w.y<46)wq.drawImage(w.s,w.x,w.y);});text(wq,'DAYS OK',495,16,'#8b90a8');text(wq,'042',503,22,'#9ece6a');
  box(64,4.6,.5,C('#343b6b'),32,2.3,-.25);face(tex(crop(wc,0,0,640,46,4)),0,640,640,4.6,32,2.3,.01);
  box(.4,1.5,28.6,C('#2a2f5c'),.2,.75,14.1);box(.4,1.5,28.6,C('#2a2f5c'),63.8,.75,14.1);
  // the wall between the hall and the rooms, cut by four doors, with what hangs on it
  const mc=mk(640,34),mq=mc.getContext('2d');mq.drawImage(bgc,0,206,640,34,0,0,640,34);WALLS.forEach(w=>{if(w.y>200)mq.drawImage(w.s,w.x,w.y-206);});const mt=tex(crop(mc,0,0,640,34,4));
  ROOMS.forEach(rm=>{[[rm.x0,rm.door-13],[rm.door+13,rm.x1]].forEach(g=>{const w=(g[1]-g[0])/10,cx=(g[0]+g[1])/20;box(w,3.4,.4,C(rm.wall),cx,1.7,16.2);face(mt,g[0],g[1],640,3.4,cx,1.7,16.41);});});
  ROOMS.slice(1).forEach(rm=>box(.3,3.4,11.8,C('#232847'),rm.x0/10-.15,1.7,22.3));
  // furniture: the sprite on the front, its average colour on the other faces
  const block=(s,x,base,depth)=>{const w=s.width/10,h=s.height/10,d=depth||Math.min(1.8,Math.max(.6,w*.5)),a=avgColor(s),c=mk(s.width,s.height),q=c.getContext('2d');q.fillStyle='rgb('+a.join(',')+')';q.fillRect(0,0,s.width,s.height);q.drawImage(s,0,0);
    const side=lam({color:new THREE.Color(a[0]/255*.82,a[1]/255*.82,a[2]/255*.82)}),top=lam({color:new THREE.Color(a[0]/255,a[1]/255,a[2]/255)});return box(w,h,d,[side,side,top,side,lam({map:tex(crop(c,0,0,s.width,s.height,4))}),side],x/10,h/2,fz(base)-d/2);};
  ITEMS.forEach(it=>block(it.s,it.x+it.s.width/2,it.b));
  SEATS.forEach(s=>block(s.seat==='F'?F.deskBack:F.deskScreen,s.dx+20,s.seat==='F'?119:154,1.5));
  [[550,88,chairTop('#5fae8f'),100],[518,120,chairBack('#5fae8f'),136],[550,120,chairBack('#5fae8f'),136]].forEach(c=>block(c[2],c[0]+8,c[3],.8));
  // a name plate on the front of the slab
  const nc=mk(60,9),nq=nc.getContext('2d');nq.fillStyle='#11132a';nq.fillRect(0,0,60,9);text(nq,'AGENT OFFICE',7,2,'#ff4fd8');face(tex(crop(nc,0,0,60,9,8)),0,60,60,.9,32,-.6,29.31);
  const ppl=new Map(),mkP=p=>{const gp=new THREE.Group(),m=(w,h,d,c,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam({color:C(c)}));b.position.set(x,y,z||0);b.castShadow=true;gp.add(b);return b;};
    const legs=new THREE.Group();gp.add(legs);[-.2,.2].forEach(x=>{const l=new THREE.Mesh(new THREE.BoxGeometry(.32,.95,.4),lam({color:C(p.skirt?p.skin:p.pants)}));l.position.set(x,.58,0);l.castShadow=true;legs.add(l);const sh=new THREE.Mesh(new THREE.BoxGeometry(.34,.16,.5),lam({color:C('#23263a')}));sh.position.set(x,.08,.05);legs.add(sh);});
    gp.userData.legs=legs;m(.86,1,.5,p.shirt,0,1.55);gp.userData.arms=[m(.2,.85,.26,p.shirt,-.53,1.6),m(.2,.85,.26,p.shirt,.53,1.6)];m(.2,.2,.26,p.skin,-.53,1.1);m(.2,.2,.26,p.skin,.53,1.1);
    m(.82,.78,.72,p.skin,0,2.45);m(.9,.34,.8,p.hair,0,2.94);m(.9,.5,.2,p.hair,0,2.6,-.36);m(.12,.14,.04,'#12132a',-.18,2.5,.37);m(.12,.14,.04,'#12132a',.18,2.5,.37);if(p.intern)gp.scale.setScalar(.8);sc.add(gp);ppl.set(p,gp);return gp;};
  const cat=box(1,.5,.45,C('#f08a3c'),0,.25,0),goose=box(.6,.9,.5,C('#f4f4f0'),0,.45,0);
  M={rn,sc,cam,ppl,mkP,cat,goose,pos:null,look:null};}
function sizeMini(){if(!M)return;const h=$('#miniHost');M.rn.setSize(h.clientWidth,h.clientHeight);M.cam.aspect=h.clientWidth/h.clientHeight;M.cam.updateProjectionMatrix();M.pos=null;}
function renderMini(T){if(!M)return;const TURN=[0,Math.PI,Math.PI/2,-Math.PI/2];
  P.forEach(p=>{const gp=M.ppl.get(p)||M.mkP(p),sit=!!p.seat||(p.roam&&p.state==='stay'&&p.spot&&!!p.spot[5]),lying=p.pose==='sleep';gp.userData.legs.visible=!sit;const walking=p.now==='walk',sw=walking?Math.sin(p.dist*.55):0;gp.position.set(p.x/10,(lying?.5:sit?-.5:0)+(walking?Math.abs(sw)*.1:0),fz(p.y));gp.userData.arms[0].rotation.x=sw*.7;gp.userData.arms[1].rotation.x=-sw*.7;gp.rotation.set(0,TURN[p.dir||0],lying?Math.PI/2:0);});
  M.cat.position.set(CAT.x/10,.25,fz(CAT.y));M.goose.position.set(GOOSE.x/10,.45,fz(GOOSE.y));
  const far=Math.max(1,1.55/M.cam.aspect);let pos,look;
  if(camMode==='corner'){const a=-.6+Math.sin(T*.14)*.28;pos=[32+Math.sin(a)*66*far,34*far,13+Math.cos(a)*66*far];look=[32,0,13];}
  else if(camMode==='front'){pos=[32,24*far,13+62*far];look=[32,0,12];}
  else{const d=[[0,1],[0,-1],[1,0],[-1,0]][LEAD.dir||0];pos=[LEAD.x/10-d[0]*7,3.6,fz(LEAD.y)-d[1]*7];look=[LEAD.x/10+d[0]*5,1.6,fz(LEAD.y)+d[1]*5];}
  if(!M.pos){M.pos=pos;M.look=look;}else{const k=camMode==='walk'?.045:.07;for(let i=0;i<3;i++){M.pos[i]+=(pos[i]-M.pos[i])*k;M.look[i]+=(look[i]-M.look[i])*k;}}
  M.cam.position.set(M.pos[0],M.pos[1],M.pos[2]);M.cam.lookAt(M.look[0],M.look[1],M.look[2]);M.rn.render(M.sc,M.cam);}
$$('.cam').forEach(b=>b.onclick=()=>{camMode=b.dataset.c;$$('.cam').forEach(o=>o.setAttribute('aria-pressed',o===b));});
new ResizeObserver(()=>{if(view==='mini')sizeMini();}).observe(stage);

// per frame: draw whichever view is open; start the screensaver after 45 idle seconds
let termAt=0;
Office.onFrame.push(T=>{
  if(view==='night')drawNight(T);else if(view==='mini'){renderMini(T);const b=$('#printBar');if(b&&!$('#printing').hidden)b.style.width=Math.min(100,(performance.now()-printT)/15)+'%';}
  else if(view==='terminal'&&T-termAt>.33){termAt=T;drawTerm();}
  if(!view&&T-lastAct>45&&!pending)openView('night',true);});
Office.start();
})();
</script>
