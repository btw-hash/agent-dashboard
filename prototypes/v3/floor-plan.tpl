<title>Agent Office Floor Plan</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: the whole floor on top at a whole-number zoom, then the 18 games as a numbered index that matches the markers, then the rooms one by one. */
:root{
  color-scheme:dark;
  --bg:#080810; --surface:#0c0d1e; --surface-2:#11132a; --border:#1e2240; --border-hi:#2e3566;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --think:#bb9af7; --ok:#9ece6a; --warn:#e0af68; --mark:#ffd23f;
  --glass:rgba(10,11,26,.88);
  --font:"JetBrains Mono","Cascadia Mono",Consolas,monospace;
  --pixel:"Press Start 2P","JetBrains Mono",monospace;
}
*{box-sizing:border-box}[hidden]{display:none!important}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:13px;line-height:1.55;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 48px}
.page{max-width:1312px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
h1{font-family:var(--font);font-weight:700;font-size:20px;color:var(--text-hi);margin:0 0 6px;line-height:1.3;text-wrap:balance}
h2{font-family:var(--font);font-weight:700;font-size:12px;color:var(--accent);margin:0;letter-spacing:.1em;text-transform:uppercase;line-height:1.5}
h3{font-size:12px;color:var(--text-hi);margin:0;font-weight:700}
p{margin:0;max-width:78ch}.lede{color:var(--text-dim)}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.controls{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;background:var(--surface);border:1px solid var(--border);padding:10px 12px}
.grp{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0}
.lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-right:2px}
.chip{background:var(--surface-2);border:1px solid var(--border);padding:5px 10px;font-size:12px;color:var(--text);border-radius:2px;white-space:nowrap}
.chip:hover{border-color:var(--border-hi);color:var(--text-hi)}
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#07081a;font-weight:700}
input[type=range]{accent-color:var(--accent);width:150px;max-width:40vw}
.phase{font-variant-numeric:tabular-nums;color:var(--warn);min-width:11ch}
.stage{position:relative;height:clamp(420px,76vh,820px);border:1px solid var(--border);background:#05060d;overflow:hidden}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;cursor:default;touch-action:none}
#cv.hit{cursor:pointer}
.tags{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.tag{position:absolute;transform:translate(-50%,-100%);padding:3px 6px 2px;font-family:var(--pixel);font-size:7px;line-height:1.4;color:var(--text-hi);background:rgba(10,11,26,.9);border:1px solid var(--border-hi);white-space:nowrap}
.tag.spot{color:#07081a;background:var(--mark);border-color:#07081a}
.card{position:absolute;z-index:5;right:12px;top:12px;width:min(270px,calc(100% - 24px));padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--glass);border:1px solid var(--border-hi)}
.card h4{font-family:var(--pixel);font-size:10px;margin:0;color:var(--text-hi);line-height:1.6}
.card .role{font-size:11px;color:var(--think)}.card .now{font-size:12px;color:var(--ok)}
.card .facts{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text-dim)}.card .facts b{color:var(--text-hi);font-weight:600}
.quote{font-size:11px;color:var(--warn);border-left:2px solid var(--warn);padding-left:8px}
.box{background:var(--surface);border:1px solid var(--border);padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}
.head{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline;justify-content:space-between}
.note{font-size:11px;color:var(--text-dim)}
.games{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px 18px}
.games ol{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:3px}
.g{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:1px solid transparent;padding:2px 4px;font-size:12px;color:var(--text)}
.g:hover{border-color:var(--border-hi);color:var(--text-hi)}
.g[aria-pressed="true"]{border-color:var(--mark);color:var(--text-hi)}
.g i{font-style:normal;font-family:var(--pixel);font-size:7px;line-height:1;min-width:20px;padding:4px 3px 3px;text-align:center;color:#07081a;background:var(--mark)}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.room{border-top:3px solid var(--rc,var(--accent))}
.box ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px}.box li::marker{color:var(--accent)}
@media (max-width:720px){.card{top:auto;bottom:12px;left:12px;width:auto}}
</style>

<div class="page">
  <header>
    <h1>Один этаж, пять комнат</h1>
    <p class="lede">Весь офис на одном экране: сверху холл на двенадцать столов, снизу четыре комнаты разной ширины, у каждой своя дверь. Кто на перерыве, ходит по коридорам из комнаты в комнату. Нажми на человека, на жёлтый номер или на комнату ниже.</p>
  </header>

  <section class="controls" aria-label="Управление сценой">
    <div class="grp"><span class="lbl">Время</span>
      <button class="chip" id="now" aria-pressed="false">По часам</button>
      <input type="range" id="hour" min="0" max="24" step="0.25" value="10" aria-label="Час дня">
      <span class="phase" id="phase"></span>
    </div>
    <div class="grp"><span class="lbl">Показать</span>
      <button class="chip view" data-v="all" aria-pressed="true">Весь этаж</button>
      <button class="chip view" data-v="hall" aria-pressed="false">Холл</button>
      <button class="chip view" data-v="games" aria-pressed="false">Игровая</button>
      <button class="chip view" data-v="gym" aria-pressed="false">Зал</button>
      <button class="chip view" data-v="lounge" aria-pressed="false">Лаунж</button>
      <button class="chip view" data-v="cafe" aria-pressed="false">Кафе</button>
    </div>
    <div class="grp"><span class="lbl">Поверх</span>
      <button class="chip" id="marks" aria-pressed="true">Номера игр</button>
      <button class="chip" id="names" aria-pressed="false">Имена у всех</button>
    </div>
  </section>

  <section class="stage" id="stage" aria-label="План офиса">
    <canvas id="cv"></canvas>
    <div class="tags" id="tags"></div>
    <div class="card" id="card" hidden></div>
  </section>

  <section class="box" aria-label="Где живут игры">
    <div class="head"><h2>Где живут 18 игр</h2><span class="note">Номера совпадают с жёлтыми метками. Нажми на игру, камера перелетит к ней.</span></div>
    <div class="games" id="games"></div>
    <p class="note">15 игр в v2 лежат отдельными модулями и переезжают как есть. Дартс, корзина и пинг-понг — моя догадка о трёх играх, зашитых в старый app.js; список сверю с v2 перед сборкой.</p>
  </section>

  <section class="cols" id="rooms"></section>

  <section class="cols">
    <div class="box"><h2>Что изменилось после первого прохода</h2>
      <ul>
        <li>Появился вход: лифт в стене холла с ковриком и вешалкой. Раз в полминуты двери открываются. Отсюда будут приходить пицца, почта, уборщики и гости.</li>
        <li>Вернулся аквариум. У стены холла висит табло: сколько агентов работает и думает прямо сейчас, число живое.</li>
        <li>Комнаты разной ширины: кафе самое большое, зал самый маленький.</li>
        <li>Лаунж — казино, как ты решил: рулетка, покер, блэкджек, два слота и музыкальный автомат, бордовый ковёр с золотой каймой.</li>
        <li>Имена видны только у тех, кто сейчас работает. У остальных одна точка-статус; имя покажется, если навести.</li>
        <li>Мебель перерисована в одной манере, с лицевой стороной и тенью. Столы в лаунже теперь стоят на ножках, а не лежат плашмя.</li>
        <li>В зале зоны на полу: синий мат под дорожкой, помост под штангу. Рамка-«площадка» и мяч убраны, груша висит на стойке.</li>
        <li>Ковры в холле приглушены и у каждого свой узор. На столах разные личные вещи.</li>
        <li>Ночной свет без колец, и под каждым пятном есть лампа, экран или вывеска.</li>
      </ul>
    </div>
    <div class="box"><h2>Против v2</h2>
      <ul>
        <li>v2 был 1460 на 2136 пикселей: два экрана прокрутки и полупустой холл. Этот этаж 640 на 360 и встаёт на экран 16:9 в целое число раз.</li>
        <li>Ходят по коридорам, которые не пересекают мебель. Никто не идёт сквозь стол.</li>
        <li>У каждой комнаты свой пол и цвет стен: на телефоне в приближении понятно, где ты.</li>
        <li>Пустой стол видно сразу: тёмный экран и задвинутый стул.</li>
      </ul>
    </div>
  </section>
</div>

<script>
(function(){
/*ENGINE*/

// ── this page ───────────────────────────────────────────────────
Office.snap=true;Office.showGames=true;
const VIEWS={hall:[300,122,330,170],games:[76,284,152,156],gym:[212,284,122,156],lounge:[352,284,162,156],cafe:[535,284,210,156]};
function setView(v,smooth){Office.touched=true;$$('.view').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===v));const c=VIEWS[v];if(!c)Office.cam.to(320,180,0,false);else Office.cam.frame(c[0],c[1],c[2],c[3],smooth);}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const LEADS={terminal:'Ведёт в вид «Терминал».',night:'Ведёт в вид «Окна ночью».',mini:'Ведёт в 3D-миниатюру офиса.'};
const RU={Hall:'Холл','Games room':'Игровая',Gym:'Зал',Lounge:'Лаунж',Cafe:'Кафе'};
function card(a){const c=$('#card');$$('.g').forEach(b=>b.setAttribute('aria-pressed',!!a&&a.kind==='game'&&+b.dataset.n===a.n));if(!a){c.hidden=true;return;}let h;
  if(a.kind==='game')h='<h4>'+a.n+' &middot; '+esc(a.name)+'</h4><div class="role">'+RU[a.room]+'</div><div>Игра открывается с этого предмета, в общей рамке-автомате для всех 18 игр.</div>';
  else if(a.kind==='door')h='<h4>'+esc(a.name)+'</h4><div class="role">выход из офиса</div><div>'+LEADS[a.id]+' Это третья страница раунда.</div>';
  else h='<div><h4>'+esc(a.name)+'</h4><div class="role">'+esc(a.role)+'</div></div><div class="now">'+esc(a.kind==='cat'?'on patrol':Office.act(a))+'</div><div class="facts"><span>mood <b>'+esc(a.mood)+'</b></span><span>energy <b>'+a.energy+'%</b></span><span>coffees <b>'+a.coffees+'</b></span></div><div class="quote">&ldquo;'+esc(a.quote)+'&rdquo;</div>';
  c.innerHTML=h+'<div><button class="chip" id="cc">Закрыть</button></div>';c.hidden=false;$('#cc').onclick=()=>{Office.picked=null;card(null);};}
Office.onPick=card;
// the index of games, grouped by room
const groups={};Office.GAMES.forEach(m=>(groups[m.room]=groups[m.room]||[]).push(m));
$('#games').innerHTML=Object.entries(groups).map(([room,list])=>'<div><h3>'+RU[room]+'</h3><ol>'+list.map(m=>'<li><button class="g" data-n="'+m.n+'" aria-pressed="false"><i>'+m.n+'</i>'+esc(m.name)+'</button></li>').join('')+'</ol></div>').join('');
$$('.g').forEach(b=>b.onclick=()=>{const m=Office.GAMES[+b.dataset.n-1];Office.showGames=true;$('#marks').setAttribute('aria-pressed','true');Office.picked=m;card(m);$$('.view').forEach(x=>x.setAttribute('aria-pressed','false'));Office.touched=true;Office.cam.frame(m.x,m.y,170,120,true);stage.scrollIntoView({block:'nearest',behavior:'smooth'});});
const INSIDE={hall:['Холл','#7aa2f7','Двенадцать столов тремя группами, у каждой свой ковёр. Серверная стойка, аквариум, принтеры, доска, табло, переговорный стол, лифт, телескоп, лежанка кота.'],
  games:['Игровая','#ff4fd8','Два разных аркадных автомата, диван перед телевизором, настольный футбол, дартс-автомат, пуф, на котором кто-то спит.'],
  gym:['Зал','#9ece6a','Беговая дорожка на синем мате, груша на стойке, помост со штангой и гантелями, пинг-понг, корзина, зеркало.'],
  lounge:['Лаунж','#e0af68','Казино: рулеточный стол, покерный стол, блэкджек, два слота, музыкальный автомат, хрустальный шар.'],
  cafe:['Кафе','#39c5cf','Длинная стойка с кофемашиной и микроволновкой, меню на стене, холодильник, автомат с едой, кулер, три столика.']};
$('#rooms').innerHTML=Object.entries(INSIDE).map(([id,r])=>'<div class="box room" style="--rc:'+r[1]+'"><div class="head"><h2>'+r[0]+'</h2><button class="chip go" data-v="'+id+'">Показать</button></div><p>'+r[2]+'</p></div>').join('');
$$('.go').forEach(b=>b.onclick=()=>{setView(b.dataset.v,true);stage.scrollIntoView({block:'nearest',behavior:'smooth'});});
$$('.view').forEach(b=>b.onclick=()=>setView(b.dataset.v,true));
$('#names').onclick=e=>{const on=Office.names!=='always';Office.names=on?'always':'working';e.currentTarget.setAttribute('aria-pressed',on);};
$('#marks').onclick=e=>{Office.showGames=!Office.showGames;e.currentTarget.setAttribute('aria-pressed',Office.showGames);};
const PHASE_RU={night:'ночь',dawn:'рассвет',day:'день',dusk:'закат'};
const phase=()=>{$('#phase').textContent=Office.clock()+' '+PHASE_RU[Office.phase()];};
$('#hour').oninput=e=>{$('#now').setAttribute('aria-pressed','false');Office.setHour(+e.target.value);phase();};
$('#now').onclick=()=>{$('#now').setAttribute('aria-pressed','true');Office.setAuto();$('#hour').value=Office.hour();phase();};
Office.onSmall=small=>$$('.view').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===(small?'hall':'all')));
Office.start();phase();
})();
</script>
