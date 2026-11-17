<title>Agent Office Shell</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: one screen. The office fills it; small glass panels float over the edges and all leave in TV mode. */
:root{
  color-scheme:dark;
  --bg:#05060d; --glass:rgba(10,11,26,.9); --surface-2:#11132a; --border:#262b52; --border-hi:#3a4180;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --think:#bb9af7; --ok:#9ece6a; --warn:#e0af68; --bad:#f7768e;
  --font:"JetBrains Mono","Cascadia Mono",Consolas,monospace;
  --pixel:"Press Start 2P","JetBrains Mono",monospace;
  --l:max(10px,env(safe-area-inset-left,0px)); --r:max(10px,env(safe-area-inset-right,0px));
  --t:calc(10px + env(safe-area-inset-top,0px)); --b:calc(10px + env(safe-area-inset-bottom,0px));
}
*{box-sizing:border-box}[hidden]{display:none!important}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font);font-size:12px;line-height:1.5;overflow:hidden;padding-left:max(0px,env(safe-area-inset-left,0px));padding-right:max(0px,env(safe-area-inset-right,0px))}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.app{position:relative;height:100%;min-height:420px;overflow:hidden}
.stage{position:absolute;inset:0}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none}
#cv.hit{cursor:pointer}
.tags{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.tag{position:absolute;transform:translate(-50%,-100%);padding:3px 6px 2px;font-family:var(--pixel);font-size:7px;line-height:1.4;color:var(--text-hi);background:rgba(10,11,26,.9);border:1px solid var(--border-hi);white-space:nowrap}
.tag.spot{color:#07081a;background:#39d3ff;border-color:#07081a}
.ui{transition:opacity .35s,transform .35s}
.app.tv .ui{opacity:0;pointer-events:none}
.panel{background:var(--glass);border:1px solid var(--border)}
.px{font-family:var(--pixel);letter-spacing:.04em}
.btn{background:var(--surface-2);border:1px solid var(--border);padding:6px 9px;color:var(--text);white-space:nowrap;font-size:11px;line-height:1.3}
.btn:hover{border-color:var(--border-hi);color:var(--text-hi)}
.btn[aria-pressed="true"],.btn.go{background:var(--accent);border-color:var(--accent);color:#07081a;font-weight:700}
/* top bar */
.bar{position:absolute;top:var(--t);left:var(--l);right:var(--r);display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;pointer-events:none}
.bar>*{pointer-events:auto}
.brand{display:flex;align-items:center;gap:10px;padding:7px 10px}
.brand b{font-family:var(--pixel);font-size:10px;color:var(--text-hi);font-weight:400}
.count{display:flex;gap:10px;font-size:11px;color:var(--text-dim);font-variant-numeric:tabular-nums}
.count span{display:flex;align-items:center;gap:5px}
.dot{width:7px;height:7px;background:var(--text-dim);display:inline-block;flex:none}.dot.w{background:var(--ok)}.dot.t{background:var(--think)}
.grow{flex:1 1 0;min-width:0}
.tools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
/* roster */
.roster{position:absolute;left:var(--l);top:calc(var(--t) + 46px);width:206px;max-height:calc(100% - 150px);display:none;flex-direction:column}
.app.team .roster{display:flex}
.roster h2{margin:0;padding:8px 10px 6px;font-family:var(--pixel);font-size:8px;font-weight:400;color:var(--accent);display:flex;justify-content:space-between;align-items:center}
.roster ul{list-style:none;margin:0;padding:0 4px 6px;overflow-y:auto;min-height:0}
.who{display:grid;grid-template-columns:auto 1fr;gap:0 7px;align-items:center;width:100%;text-align:left;background:none;border:1px solid transparent;padding:3px 6px}
.who:hover,.who[aria-pressed="true"]{border-color:var(--border-hi);background:var(--surface-2)}
.who b{font-weight:600;color:var(--text-hi);font-size:11px}
.who span{grid-column:2;font-size:10px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* agent card */
.card{position:absolute;right:var(--r);top:calc(var(--t) + 46px);width:min(250px,calc(100% - 20px));padding:12px;display:flex;flex-direction:column;gap:8px}
.card h3{font-family:var(--pixel);font-size:10px;font-weight:400;margin:0;color:var(--text-hi);line-height:1.6}
.card .role{font-size:11px;color:var(--think)}.card .now{color:var(--ok)}
.meter{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;font-size:10px;color:var(--text-dim)}
.meter i{height:6px;background:#1c2040;display:block}.meter i u{display:block;height:100%;background:var(--ok)}
.quote{font-size:11px;color:var(--warn);border-left:2px solid var(--warn);padding-left:8px}
.row{display:flex;gap:6px;flex-wrap:wrap}
/* minimap, ticker, toasts */
.mini{position:absolute;right:var(--r);bottom:calc(var(--b) + 34px);padding:3px;line-height:0}
.mini canvas{width:160px;height:90px;image-rendering:pixelated;cursor:crosshair;display:block}
.ticker{position:absolute;left:var(--l);right:var(--r);bottom:var(--b);padding:6px 10px;display:flex;gap:10px;align-items:center;min-height:28px;overflow:hidden}
.ticker em{font-style:normal;font-family:var(--pixel);font-size:7px;color:#07081a;background:var(--warn);padding:3px 5px 2px;flex:none}
.ticker span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .3s}
.toasts{position:absolute;left:50%;top:calc(var(--t) + 52px);transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none;width:max-content;max-width:calc(100% - 24px)}
.toast{background:var(--glass);border:1px solid var(--ok);padding:6px 10px;font-size:11px;color:var(--text-hi);animation:pop 3.2s forwards}
.toast.bad{border-color:var(--bad)}
@keyframes pop{0%{opacity:0;transform:translateY(-6px)}8%,85%{opacity:1;transform:none}100%{opacity:0}}
/* TV mode */
.tvcap{position:absolute;left:var(--l);bottom:calc(var(--b) + 6px);padding:10px 14px;border-left:4px solid var(--accent);background:var(--glass);max-width:calc(100% - 20px)}
.tvcap b{display:block;font-family:var(--pixel);font-size:clamp(13px,2vw,26px);font-weight:400;color:var(--text-hi);line-height:1.7}
.tvcap span{color:var(--text);font-size:clamp(12px,1.25vw,18px)}
.tvx{position:absolute;right:var(--r);top:var(--t);opacity:.75}
.tvclock{position:absolute;right:var(--r);bottom:calc(var(--b) + 6px);font-family:var(--pixel);font-size:clamp(10px,1.4vw,18px);color:var(--text-hi);background:var(--glass);padding:8px 10px 6px}
/* connect sheet */
.veil{position:absolute;inset:0;background:rgba(5,6,13,.7);display:flex;align-items:center;justify-content:center;padding:16px;z-index:20}
.sheet{width:min(560px,100%);max-height:100%;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:14px}
.sheet h2{font-family:var(--pixel);font-size:11px;font-weight:400;margin:0;color:var(--text-hi);line-height:1.7}
.way{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--border);padding-top:12px}
.way h3{margin:0;font-size:12px;color:var(--accent)}
.way p{margin:0;color:var(--text-dim);font-size:11px}
.code{display:flex;gap:6px;align-items:flex-start}
.code pre{flex:1;min-width:0;margin:0;background:#04060a;border:1px solid var(--border);padding:8px;font:11px/1.45 var(--font);color:#9ece6a;overflow-x:auto;white-space:pre}
.try{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.try input{font:inherit;color:var(--text-hi);background:#04060a;border:1px solid var(--border);padding:6px 8px;width:130px}
/* the note for the owner */
.hint{position:absolute;left:50%;bottom:calc(var(--b) + 40px);transform:translateX(-50%);width:min(600px,calc(100% - 20px));padding:10px 12px;display:flex;gap:10px;align-items:flex-start;border-color:var(--warn)}
.hint p{margin:0 0 4px;font-size:11px;color:var(--text-hi)}.hint ol{margin:0;padding-left:18px;font-size:11px;color:var(--text);display:flex;flex-direction:column;gap:2px}
@media (max-width:760px){
  .roster{display:none;top:auto;bottom:calc(var(--b) + 34px);width:auto;right:var(--r);max-height:46%}
  .mini{display:none}
  .card{top:auto;bottom:calc(var(--b) + 34px);left:var(--l);width:auto}
  .count span:nth-child(3){display:none}
  .grow{display:none}.tools{justify-content:flex-start;width:100%;gap:4px}.btn{padding:6px 7px}
  .toasts{top:calc(var(--t) + 86px)}
}
@media (prefers-reduced-motion:reduce){.ui,.toast{transition:none;animation-duration:.01s}}
</style>

<div class="app" id="app">
  <section class="stage" id="stage" aria-label="Office"><canvas id="cv"></canvas><div class="tags" id="tags"></div></section>

  <header class="bar ui">
    <div class="brand panel"><b>AGENT OFFICE</b>
      <div class="count" id="count"></div></div>
    <div class="grow"></div>
    <div class="tools">
      <button class="btn" id="clock" title="Time of day"></button>
      <button class="btn" id="zout" aria-label="Zoom out">&minus;</button><button class="btn" id="zin" aria-label="Zoom in">+</button>
      <button class="btn" id="teamBtn" aria-pressed="false">Team</button>
      <button class="btn" id="tvBtn">TV mode</button>
      <button class="btn go" id="connectBtn">Connect yours</button>
    </div>
  </header>

  <aside class="roster panel ui" id="roster" aria-label="Team">
    <h2><span>TEAM</span><span id="teamN"></span></h2>
    <ul id="list"></ul>
  </aside>

  <aside class="card panel ui" id="card" hidden></aside>
  <div class="mini panel ui"><canvas id="mini" width="160" height="90" aria-label="Minimap"></canvas></div>
  <div class="ticker panel ui"><em>NEWS</em><span id="news"></span></div>
  <div class="toasts ui" id="toasts"></div>

  <div class="hint panel ui" id="hint">
    <div><p><b>Это экран самого продукта (поэтому по-английски). Что тут решается:</b></p>
    <ol><li>Панели: всё по краям и почти ничего не закрывает офис. Список людей спрятан за кнопкой <b>Team</b>.</li><li>Карточка: нажми на любого человека, потом <b>Follow</b> — камера пойдёт за ним.</li><li><b>TV mode</b>: панели уходят, камера сама переключается между людьми и комнатами. Выход — Esc.</li><li><b>Connect yours</b> → кнопка <b>working</b>: из лифта выйдет новый агент и сядет за свободный стол.</li><li><b>Камера</b>: переезжает и приближается одним плавным движением, в TV mode тоже. Колеса мыши нет, масштаб на кнопках <b>+ −</b>.</li></ol></div>
    <button class="btn" id="hintX" aria-label="Закрыть подсказку">OK</button>
  </div>

  <div class="tvcap" id="tvcap" hidden><b id="tvA"></b><span id="tvB"></span></div>
  <div class="tvclock" id="tvclock" hidden></div>
  <button class="btn tvx" id="tvX" hidden>Exit TV</button>

  <div class="veil" id="veil" hidden>
    <div class="sheet panel" role="dialog" aria-labelledby="shT">
      <div class="row" style="justify-content:space-between;align-items:center"><h2 id="shT">CONNECT YOUR AGENTS</h2><button class="btn" id="shX">Close</button></div>
      <div class="way" style="border-top:0;padding-top:0">
        <h3>1 &middot; Claude Code on this machine</h3>
        <p>Reads your local session logs. Nothing about the work leaves your computer: no project names, no file paths, no message text.</p>
        <div class="code"><pre id="c1">npx agent-office</pre><button class="btn cp" data-c="c1">Copy</button></div>
        <p>The package name is not final.</p>
      </div>
      <div class="way">
        <h3>2 &middot; Any bot or script</h3>
        <p>One request per state change. States: working, thinking, idle, done, error.</p>
        <div class="code"><pre id="c2">curl -X POST http://localhost:3737/api/event \
  -H "Content-Type: application/json" \
  -d '{"agent":"my-bot","state":"working","note":"crunching"}'</pre><button class="btn cp" data-c="c2">Copy</button></div>
      </div>
      <div class="way">
        <h3>3 &middot; Try it here</h3>
        <p>This demo runs on simulated agents. Send it an event and watch who walks out of the lift.</p>
        <div class="try"><input id="tryName" value="my-bot" maxlength="14" aria-label="Agent name">
          <button class="btn go st" data-s="working">working</button><button class="btn st" data-s="thinking">thinking</button><button class="btn st" data-s="done">done</button><button class="btn st" data-s="error">error</button><button class="btn st" data-s="idle">idle</button></div>
        <p id="tryMsg"></p>
      </div>
    </div>
  </div>
</div>

<script>
(function(){
/*ENGINE*/

// ── the shell ───────────────────────────────────────────────────
const app=$('#app'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let follow=null,tv=false,chosen=null;
const moved=()=>{Office.touched=true;};
// counters and the team list
function counts(){const w=P.filter(p=>p.st==='w').length,t=P.filter(p=>p.st==='t').length;return[w,t,P.length-w-t];}
function drawTeam(){const c=counts();$('#count').innerHTML='<span><i class="dot w"></i>'+c[0]+' working</span><span><i class="dot t"></i>'+c[1]+' thinking</span><span><i class="dot"></i>'+c[2]+' on a break</span>';$('#teamN').textContent=P.length;
  const order=P.map((p,i)=>i).sort((a,b)=>('wti'.indexOf(P[a].st)-'wti'.indexOf(P[b].st))||a-b);
  $('#list').innerHTML=order.map(i=>{const p=P[i];return'<li><button class="who" data-i="'+i+'" aria-pressed="'+(p===chosen)+'"><i class="dot '+(p.st==='i'?'':p.st)+'"></i><b>'+esc(p.name)+'</b><span>'+esc(Office.act(p))+'</span></button></li>';}).join('');}
$('#list').addEventListener('click',e=>{const b=e.target.closest('.who');if(!b)return;const p=P[+b.dataset.i];pick(p,true);if(innerWidth<=760){app.classList.remove('team');$('#teamBtn').setAttribute('aria-pressed','false');}});
// the agent card
function pick(a,fly){chosen=a&&!a.kind||a===CAT?a:null;Office.picked=chosen;follow=null;const c=$('#card');
  if(a&&a.kind==='door'){toast(a.name+': a way to another view. See the next page.');a=null;}
  if(!chosen){c.hidden=true;drawTeam();return;}const p=chosen,cat=p===CAT;
  c.innerHTML='<div><h3>'+esc(p.name)+'</h3><div class="role">'+esc(p.role)+'</div></div><div class="now" id="cardNow"></div>'
    +'<div class="meter"><span>energy</span><i><u style="width:'+p.energy+'%"></u></i><span>'+p.energy+'%</span></div>'
    +'<div class="row" style="color:var(--text-dim);font-size:11px"><span>mood: <b style="color:var(--text-hi)">'+esc(p.mood)+'</b></span><span>coffees: <b style="color:var(--text-hi)">'+p.coffees+'</b></span></div>'
    +'<div class="quote">&ldquo;'+esc(p.quote)+'&rdquo;</div><div class="row"><button class="btn" id="fl" aria-pressed="false">Follow</button><button class="btn" id="cx">Close</button></div>';
  c.hidden=false;$('#cx').onclick=()=>pick(null);$('#fl').onclick=e=>{follow=follow?null:p;e.currentTarget.setAttribute('aria-pressed',!!follow);moved();};
  if(fly){moved();Office.cam.frame(p.x,p.y-12,420,250,true);}drawTeam();}
Office.onPick=a=>pick(a,false);Office.onDrag=()=>{follow=null;const f=$('#fl');if(f)f.setAttribute('aria-pressed','false');};
// toasts and the news line
function toast(msg,bad){const t=document.createElement('div');t.className='toast panel'+(bad?' bad':'');t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3300);}
const feed=['The goose was seen near the cafe again.','Coffee machine: 37 cups today, a quiet day.','Cat status: in charge.','Whiteboard gets wiped at midnight. Save your boxes and arrows.','Days without incident: 42.','Reminder: the plant by the printers likes water.'];let feedI=0,feedHot=[];
function news(){const el=$('#news'),msg=feedHot.length?feedHot.shift():feed[feedI++%feed.length];el.style.opacity=0;setTimeout(()=>{el.textContent=msg;el.style.opacity=1;},300);}
let lastEvent=null;
Office.onEvent=(type,p)=>{lastEvent={p,at:performance.now()};
  if(type==='cheer'){feedHot.push(p.name+' finished a task.');if(!tv)toast(p.name+' finished a task');}
  if(type==='palm'){feedHot.push(p.name+' hit a tool error. Again.');if(!tv)toast(p.name+' hit a tool error',true);}
  if(type==='join'){feedHot.push(p.name+' joined the office.');toast(p.name+' is at the desk');drawTeam();}};
// clock, zoom, minimap
const TIMES=[null,10,19.6,23];let timeI=1;
function clock(){$('#clock').textContent=Office.clock()+(innerWidth>760?' '+Office.phase().toUpperCase()+(timeI===0?' · LIVE':''):'');$('#tvclock').textContent=Office.clock();}
$('#clock').onclick=()=>{timeI=(timeI+1)%TIMES.length;if(TIMES[timeI]===null)Office.setAuto();else Office.setHour(TIMES[timeI]);clock();};
$('#zin').onclick=()=>{moved();Office.cam.zoom(1);};$('#zout').onclick=()=>{moved();Office.cam.zoom(-1);};
const glide=()=>Office.cam.mode==='soft';
const mini=$('#mini'),mx=mini.getContext('2d');mx.imageSmoothingEnabled=false;
function miniGo(e){const r=mini.getBoundingClientRect();moved();follow=null;Office.cam.to((e.clientX-r.left)/r.width*LW,(e.clientY-r.top)/r.height*LH,Math.max(1,Office.cam.z));}
let miniDown=false;mini.addEventListener('pointerdown',e=>{miniDown=true;mini.setPointerCapture(e.pointerId);miniGo(e);});mini.addEventListener('pointermove',e=>{if(miniDown)miniGo(e);});mini.addEventListener('pointerup',()=>{miniDown=false;});
// TV mode: no panels, a director picks what to look at
let shotAt=0,shotI=0,subject=null;
function shot(){shotI++;subject=null;const hot=lastEvent&&performance.now()-lastEvent.at<9000?lastEvent.p:null,k=shotI%4;
  if(hot&&k!==0){subject=hot;lastEvent=null;}
  else if(k===1){const m=P.filter(p=>p.roam&&p.state==='go');subject=m[shotI%Math.max(1,m.length)]||P[shotI%P.length];}
  else if(k===3){const m=P.filter(p=>p.seat);subject=m[(shotI*5)%m.length];}
  if(subject){Office.cam.frame(subject.x,subject.y-12,330,190,glide(),1.9);$('#tvA').textContent=subject.name;$('#tvB').textContent=Office.act(subject)+' · '+subject.role;return;}
  if(k===2){const r=ROOMS[(shotI>>2)%4],n=P.filter(p=>p.y>240&&p.x>=r.x0&&p.x<r.x1).length;Office.cam.frame((r.x0+r.x1)/2,284,r.x1-r.x0+12,160,glide(),1.9);$('#tvA').textContent=r.name;$('#tvB').textContent=n===1?'1 person inside':n+' people inside';return;}
  const c=counts();Office.cam.to(320,180,0,glide(),1.9);$('#tvA').textContent='AGENT OFFICE';$('#tvB').textContent=c[0]+' working · '+c[1]+' thinking · '+c[2]+' on a break';}
function setTv(on){tv=on;app.classList.toggle('tv',on);['#tvcap','#tvclock','#tvX'].forEach(s=>$(s).hidden=!on);$('#veil').hidden=true;follow=null;
  if(on){pick(null);Office.touched=true;shotI=0;shotAt=0;}else Office.home();}
$('#tvBtn').onclick=()=>setTv(true);$('#tvX').onclick=()=>setTv(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#veil').hidden)$('#veil').hidden=true;else if(tv)setTv(false);}});
// connect sheet
$('#connectBtn').onclick=()=>{$('#veil').hidden=false;};$('#shX').onclick=()=>{$('#veil').hidden=true;};$('#veil').addEventListener('pointerdown',e=>{if(e.target.id==='veil')$('#veil').hidden=true;});
$$('.cp').forEach(b=>b.onclick=()=>{const el=$('#'+b.dataset.c),txt=el.textContent,ok=()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1400);};
  const fallback=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);try{if(document.execCommand('copy'))ok();else b.textContent='Select + copy';}catch(_){b.textContent='Select + copy';}};
  try{navigator.clipboard.writeText(txt).then(ok,fallback);}catch(_){fallback();}});
const mine={};
$$('.st').forEach(b=>b.onclick=()=>{const name=($('#tryName').value.trim()||'my-bot').slice(0,14),state=b.dataset.s,msg=$('#tryMsg');let p=mine[name];
  if(!p){p=Office.join(name,state==='idle'?'idle':state);if(!p){msg.textContent='Every desk is taken. In the real office a new desk is added; this sample has two free ones.';return;}mine[name]=p;msg.textContent=name+' is walking in from the lift. Close this sheet to watch.';pick(p,false);Office.touched=true;Office.cam.frame(520,110,420,250,true);follow=p;$('#fl').setAttribute('aria-pressed','true');return;}
  Office.setState(p,state);msg.textContent=name+' is now '+state+'.';drawTeam();});
$('#teamBtn').onclick=e=>{const on=!app.classList.contains('team');app.classList.toggle('team',on);e.currentTarget.setAttribute('aria-pressed',on);};
$('#hintX').onclick=()=>{$('#hint').hidden=true;};
// per frame
let slow=0;
Office.onFrame.push((T,dt)=>{
  if(follow)Office.cam.to(follow.x,follow.y-12,Office.cam.z,true);
  if(tv){if(T-shotAt>7){shotAt=T;shot();}if(subject){Office.cam.to(subject.x,subject.y-12,Office.cam.z,true);$('#tvB').textContent=Office.act(subject)+' · '+subject.role;}}
  mx.drawImage(Office.base,0,0,160,90);const v=Office.cam.view();mx.strokeStyle='#fff';mx.lineWidth=1;mx.strokeRect(Math.max(0,v[0]/4)+.5,Math.max(0,v[1]/4)+.5,Math.min(159,v[2]/4),Math.min(89,v[3]/4));
  if(T-slow>.6){slow=T;clock();if(chosen){const n=$('#cardNow');if(n)n.textContent=chosen===CAT?'on patrol':Office.act(chosen);}$$('.who').forEach(b=>{const p=P[+b.dataset.i],s=b.lastElementChild,a=Office.act(p);if(s.textContent!==a)s.textContent=a;});}});
Office.showDoors=false;
Office.start();drawTeam();clock();news();setInterval(news,5200);
})();
</script>
