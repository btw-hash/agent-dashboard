<title>Agent Office Sims Mode</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: what is being decided, the mode switches and the people who can be directed, the live office, then how it differs from v2. */
:root{
  color-scheme:dark;
  --bg:#080810; --surface:#0c0d1e; --surface-2:#11132a; --border:#1e2240; --border-hi:#2e3566;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --ok:#9ece6a; --warn:#e0af68; --sim:#7cff6b;
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
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#07081a;font-weight:700}
.chip.who{border-color:#2f7a47;color:var(--sim)}
.chip.who[aria-pressed="true"]{background:var(--sim);border-color:var(--sim);color:#07081a}
.chip.sims[aria-pressed="true"]{background:var(--sim);border-color:var(--sim)}
.now{font-size:12px;color:var(--text-hi);min-height:1.55em}
.now::before{content:"";display:inline-block;width:7px;height:9px;background:var(--sim);margin-right:8px;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.stage{position:relative;height:clamp(420px,76vh,820px);border:1px solid var(--border);background:#05060d;overflow:hidden}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none}
#cv.hit{cursor:pointer}
.tags{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.tag{position:absolute;transform:translate(-50%,-100%);padding:3px 6px 2px;font-family:var(--pixel);font-size:7px;line-height:1.4;color:var(--text-hi);background:rgba(10,11,26,.9);border:1px solid var(--border-hi);white-space:nowrap}
.cmp{width:100%;border-collapse:collapse;font-size:12px}
.cmp th,.cmp td{text-align:left;vertical-align:top;padding:6px 10px;border-bottom:1px solid var(--border)}
.cmp th{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);font-weight:600}
.cmp td:first-child{color:var(--text-hi);white-space:nowrap}
.wrap{overflow-x:auto;background:var(--surface);border:1px solid var(--border)}
.note{font-size:11px;color:var(--text-dim)}
</style>

<div class="page">
  <header>
    <h1>SIMS-режим: ты командуешь теми, кто на перерыве</h1>
    <p class="lede">Над свободными людьми висит зелёный ромб. Нажми на человека, потом на любое место в офисе: диван, автомат, кофемашину, беговую дорожку. Он пойдёт туда по коридорам и займётся делом. Тех, кто работает, отвлечь нельзя.</p>
  </header>

  <section class="decide" aria-label="Что решаем">
    <h2>Что решаем на этой странице</h2>
    <ol>
      <li><b>Механика.</b> Выбери человека с ромбом и отправь его в два-три места подряд. Так берём?</li>
      <li><b>Занятые не слушаются.</b> Нажми на любого за столом: он ответит BUSY. Это честно, настоящий агент в этот момент работает. Оставляем?</li>
      <li><b>Без приказа.</b> Переключатель «Сами / Ждут». В старом офисе в этом режиме все свободные садились и ждали приказа. Я предлагаю «Сами»: офис не замирает, а приказ просто перебивает их планы.</li>
      <li><b>Потребности.</b> Голода, энергии и прочих шкал в старом офисе не было, и здесь их нет. Добавлять не предлагаю. Нужны?</li>
    </ol>
  </section>

  <section class="controls" aria-label="Режим">
    <div class="grp"><button class="chip sims" id="simsBtn" aria-pressed="true">SIMS: включён</button></div>
    <div class="grp"><span class="lbl">Без приказа</span>
      <button class="chip auto" data-a="1" aria-pressed="true">Сами</button>
      <button class="chip auto" data-a="0" aria-pressed="false">Ждут</button></div>
    <div class="grp" id="free"><span class="lbl">Свободны</span></div>
    <div class="grp"><button class="chip" id="allBtn">Выбрать всех</button><button class="chip" id="noneBtn">Снять выбор</button></div>
  </section>

  <div class="now" id="now" role="status"></div>

  <section class="stage" id="stage" aria-label="Офис">
    <canvas id="cv"></canvas>
    <div class="tags" id="tags"></div>
  </section>

  <div class="wrap"><table class="cmp">
    <thead><tr><th>Что</th><th>В старом офисе</th><th>Здесь</th></tr></thead>
    <tbody>
      <tr><td>Кого можно выбрать</td><td>Любого, кто не работает</td><td>То же. Занятый отвечает BUSY, спящий — ZZZ</td></tr>
      <tr><td>Как видно выбор</td><td>Кольцо и стрелка над головой</td><td>Ромб над головой: зелёный у свободных, белый у выбранного, кольцо под ногами</td></tr>
      <tr><td>Куда можно отправить</td><td>В ближайшее свободное место рядом с кликом</td><td>То же. Места подсвечены кольцами, при наведении подпись</td></tr>
      <tr><td>Путь</td><td>Пунктир и круг на цели</td><td>То же, но путь идёт по коридорам, а не сквозь мебель</td></tr>
      <tr><td>На месте</td><td>Конфетти и возглас</td><td>То же: NICE! WOW! YAY!</td></tr>
      <tr><td>Очередь приказов</td><td>Рисовалась, но не выполнялась (ошибка)</td><td>Работает: второй клик, пока идёт, ставит следующее место в очередь</td></tr>
      <tr><td>Несколько человек</td><td>Можно выбрать нескольких</td><td>То же: каждый идёт в своё ближайшее свободное место</td></tr>
      <tr><td>Игры в этом режиме</td><td>Не открывались</td><td>То же: клик по предмету — это приказ, а не запуск игры</td></tr>
    </tbody>
  </table></div>
  <p class="note">Надписи внутри офиса английские: это интерфейс продукта.</p>
</div>

<script>
(function(){
/*ENGINE*/

// ── this page: point at someone on a break, then at a place ─────
Office.snap=true;Office.names='pips';
const LABEL={board:'WHITEBOARD',server:'SERVER',printer:'PRINTER',plant:'PLANT',scope:'TELESCOPE',tank:'AQUARIUM',arcA:'ARCADE',arcB:'ARCADE',sofaL:'SOFA',sofaR:'SOFA',foos:'FOOSBALL',
  tread:'TREADMILL',bag:'PUNCH BAG',lift:'WEIGHTS',juke:'JUKEBOX',slot:'SLOTS',poker:'POKER',roul:'ROULETTE',crystal:'CRYSTAL BALL',bj:'BLACKJACK',esp:'COFFEE',sipA:'CAFE TABLE',sipB:'CAFE TABLE',sipC:'CAFE TABLE',vend:'SNACKS'};
const KEYS=Object.keys(SPOT),FREE=P.filter(p=>p.roam),SEL=new Set(),SAY=[],WORDS=['NICE!','WOW!','YAY!','TOP!','COOL!'];
let on=true,own=true,TT=0,small=false;
Office.onSmall=s=>{small=s;};
const keyOf=s=>KEYS.find(k=>SPOT[k]===s);
function status(){const n=$('#now');
  if(!on)n.textContent='Режим выключен: люди живут сами, клик открывает карточку или игру.';
  else if(!SEL.size)n.textContent='Никто не выбран. Нажми на человека с зелёным ромбом или на имя выше.';
  else n.textContent='Выбран: '+[...SEL].map(p=>p.name).join(', ')+'. Теперь нажми на место в офисе.';
  $$('.who').forEach(b=>b.setAttribute('aria-pressed',SEL.has(FREE[+b.dataset.i])));}
function bubble(p,word,col){SAY.push({p,word,col:col||'#12132a',until:TT+1.5});}
// send one person to a place: straight away, or after the place they are already heading for
function order(p,k){const s=SPOT[k];if(s.busy&&s!==p.spot)return false;
  if(p.state==="go"&&p.ordered){if(p.queue&&p.queue.length)SPOT[p.queue[0]].busy=false;p.queue=[k];s.busy=true;return true;}
  go(p,k);return true;}
function go(p,k){const s=SPOT[k];p.spot.busy=false;s.busy=true;
  p.route=bfs(p.state==='stay'?p.node:nearNode(p.x,p.y),s[0]).map(n=>NODE[n]).concat([[s[1],s[2]]]);
  p.node=s[0];p.spot=s;p.state='go';p.ordered=true;p.mug=false;}
function nearestFree(x,y,taken,r){let best=null,bd=r;KEYS.forEach(k=>{const s=SPOT[k];if(s.busy||taken.has(k))return;const d=Math.hypot(s[1]-x,s[2]-10-y);if(d<bd){bd=d;best=k;}});return best;}
function pickPerson(p){if(SEL.has(p))SEL.delete(p);else SEL.add(p);status();if(small&&SEL.has(p)){Office.touched=true;Office.cam.to(p.x,p.y-12,Office.cam.z,true);}}
Office.onPick=a=>{
  if(!on)return;
  if(a&&a.roam)return pickPerson(a);
  if(a&&a.name&&a.kind!=='cat'&&!a.kind)return bubble(a,a.pose==='sleep'?'ZZZ':'BUSY','#c0392b');
  if(a&&a.kind==='cat')return;
  if(!SEL.size)return;
  const taken=new Set(),at=Office.at;let sent=0;
  [...SEL].forEach(p=>{const k=nearestFree(at[0],at[1],taken,sent?150:46);if(k&&order(p,k)){taken.add(k);sent++;}});
  if(!sent)$('#now').textContent='Рядом с этим местом нет свободной точки. Нажми ближе к кольцу.';
};
Office.extra.push((T,dt,put,FX)=>{
  TT=T;
  FREE.forEach(p=>{
    p.nopip=on;
    if(!own&&on&&p.state==='stay'&&!(p.queue&&p.queue.length))p.stay=Math.max(p.stay,1);
    if(p.ordered&&p.state==='stay'){p.ordered=false;p.stay=16;burst(p.x,headTop(p)-2);bubble(p,WORDS[(Math.random()*WORDS.length)|0]);}
    if(p.queue&&p.queue.length&&p.state==='stay'&&!p.ordered&&p.stay<13){const k=p.queue.shift();SPOT[k].busy=false;go(p,k);}
  });
  if(!on)return;
  // the way ahead of everyone who was sent somewhere
  put(49,()=>FREE.forEach(p=>{if(!p.ordered||p.state!=='go')return;let x=p.x,y=p.y,n=0;
    p.route.forEach(t=>{const d=Math.hypot(t[0]-x,t[1]-y),k=Math.max(1,Math.round(d/5));for(let i=1;i<=k;i++,n++)if((n+((T*6)|0))%2)px(Math.round(x+(t[0]-x)*i/k),Math.round(y+(t[1]-y)*i/k),2,1,'#7cff6b');x=t[0];y=t[1];});
    px(x-5,y,10,1,'#7cff6b');px(x-3,y-2,6,1,'#7cff6b');px(x-3,y+2,6,1,'#7cff6b');
    if(p.queue&&p.queue.length){const q=SPOT[p.queue[0]];px(q[1]-4,q[2],8,1,'#ff9e64');px(q[1]-2,q[2]-2,4,1,'#ff9e64');px(q[1]-2,q[2]+2,4,1,'#ff9e64');}}));
  // a ring under the chosen
  SEL.forEach(p=>put(p.y-.5,()=>{const x=Math.round(p.x),y=Math.round(p.y);px(x-7,y,14,1,'#fff');px(x-5,y-2,10,1,'#fff');px(x-5,y+2,10,1,'#fff');px(x-8,y-1,2,1,'#fff');px(x+6,y-1,2,1,'#fff');px(x-8,y+1,2,1,'#fff');px(x+6,y+1,2,1,'#fff');}));
});
Office.glow.push(T=>{
  for(let i=SAY.length-1;i>=0;i--){const s=SAY[i];if(T>s.until){SAY.splice(i,1);continue;}
    const w=s.word.length*4+3,x=Math.round(s.p.x)-(w>>1),y=Math.round(headTop(s.p))-22;px(x-1,y,w+2,9,INK);px(x,y-1,w,11,INK);px(x,y,w,9,'#fff');px(x+(w>>1)-1,y+9,2,2,'#fff');text(g,s.word,x+2,y+2,s.col);}
  if(!on)return;
  // places you can send someone to, shown while somebody is chosen
  if(SEL.size){const at=Office.at||[-99,-99];let hot=null,hd=14;
    KEYS.forEach(k=>{const s=SPOT[k],c=s.busy?'#5d6480':'#7cff6b',x=s[1],y=s[2];px(x-4,y+3,8,1,c);px(x-6,y+2,2,1,c);px(x+4,y+2,2,1,c);
      const d=Math.hypot(x-at[0],y-10-at[1]);if(d<hd){hd=d;hot=k;}});
    if(hot){const s=SPOT[hot],str=LABEL[hot]+(s.busy?' - TAKEN':''),w=str.length*4+3,x=Math.round(s[1])-(w>>1),y=s[2]-44;px(x-1,y-1,w+2,9,INK);px(x,y,w,7,s.busy?'#aab0c8':'#7cff6b');text(g,str,x+2,y+1,INK);}}
  // the plumbob
  FREE.forEach(p=>{const sel=SEL.has(p),x=Math.round(p.x),y=Math.round(headTop(p))-(sel?15:12)+(Math.sin(T*3+p.x)>0?0:1),c=sel?'#fff':'#7cff6b',d=sel?'#c5f08f':'#2f9e44';
    px(x-1,y-1,3,1,INK);px(x-2,y,5,1,INK);px(x-3,y+1,7,5,INK);px(x-2,y+6,5,1,INK);px(x-1,y+7,3,1,INK);px(x,y+8,1,1,INK);
    px(x,y,1,1,c);px(x-1,y+1,3,1,c);px(x-2,y+2,5,2,c);px(x-2,y+4,5,1,d);px(x-1,y+5,3,1,d);px(x,y+6,1,2,d);px(x-1,y+2,1,2,'#fff');});
});
$('#free').insertAdjacentHTML('beforeend',FREE.map((p,i)=>'<button class="chip who" data-i="'+i+'" aria-pressed="false">'+p.name+'</button>').join(''));
$('#free').addEventListener('click',e=>{const b=e.target.closest('.who');if(b&&on)pickPerson(FREE[+b.dataset.i]);});
$('#allBtn').onclick=()=>{if(!on)return;FREE.forEach(p=>SEL.add(p));status();};
$('#noneBtn').onclick=()=>{SEL.clear();status();};
$('#simsBtn').onclick=e=>{on=!on;if(!on)SEL.clear();e.currentTarget.setAttribute('aria-pressed',on);e.currentTarget.textContent=on?'SIMS: включён':'SIMS: выключен';status();};
$$('.auto').forEach(b=>b.onclick=()=>{own=b.dataset.a==="1";$$('.auto').forEach(o=>o.setAttribute('aria-pressed',o===b));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){SEL.clear();status();}});
status();
Office.setHour(10);
Office.start();
})();
</script>
