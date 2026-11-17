<title>Игры офиса: все 18</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: what is being decided, then all 18 games as cards with a live frame; a card opens the product's own cabinet. */
:root{
  color-scheme:dark;
  --bg:#080810; --surface:#0c0d1e; --surface-2:#11132a; --border:#1e2240; --border-hi:#2e3566;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --ok:#9ece6a; --warn:#e0af68; --hot:#f7768e; --mark:#ffd23f;
  --font:"JetBrains Mono","Cascadia Mono",Consolas,monospace;
  --pixel:"Press Start 2P","JetBrains Mono",monospace;
}
*{box-sizing:border-box}[hidden]{display:none!important}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:13px;line-height:1.55;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:22px 48px}
.page{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
h1{font-family:var(--pixel);font-size:15px;font-weight:400;color:var(--text-hi);margin:0 0 8px;line-height:1.7;text-wrap:balance}
h2{font-family:var(--pixel);font-size:10px;font-weight:400;color:var(--accent);margin:0;letter-spacing:.06em;line-height:1.8}
p{margin:0;max-width:78ch}
.lede{color:var(--text-dim)}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.decide{background:var(--surface);border:1px solid var(--warn);padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.decide ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.decide b{color:var(--text-hi)}
.legend{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:12px;color:var(--text-dim);align-items:center}
.legend span{display:flex;gap:6px;align-items:center}
.tag{font-family:var(--pixel);font-size:6px;font-style:normal;padding:4px 5px 3px;color:#07081a;background:var(--text-dim);white-space:nowrap;line-height:1.4}
.tag.ok{background:var(--ok)}.tag.sample{background:var(--accent)}.tag.new{background:var(--hot)}.tag.skin{background:var(--warn)}
.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
@media (max-width:940px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:520px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.g{background:var(--surface);border:1px solid var(--border);border-top:3px solid var(--c);padding:0 0 10px;display:flex;flex-direction:column;gap:6px;min-width:0;text-align:left}
.g:hover{border-color:var(--c);background:var(--surface-2)}
.g canvas{display:block;width:100%;aspect-ratio:4/3;image-rendering:pixelated;background:#04060a}
.g .row{display:flex;gap:6px;align-items:baseline;padding:0 10px}
.g .tag{align-self:flex-start;margin:0 10px}
.g .row i{font-style:normal;color:var(--text-dim);font-size:11px}
.g .row b{color:var(--text-hi);font-size:13px;flex:1;min-width:0}
.g .what{padding:0 10px;font-size:12px;flex:1}
.g .room{padding:0 10px;font-size:11px;color:var(--text-dim)}
#tools,.gamelist{display:none}
/*CABINET*/
@media (prefers-reduced-motion:reduce){.cab,.crt.on canvas,.slate .blink{animation:none}}
</style>

<div class="page">
  <header>
    <h1>Игры офиса: все 18</h1>
    <p class="lede">Пятнадцать игр переделаны в манере «Бариста», «Шара» и Snake. Нажми на карточку: откроется тот же кабинет, что в офисе. Картинка на карточке — живой кадр самой игры.</p>
  </header>

  <section class="decide" aria-label="Что решить">
    <h2>ЧТО РЕШИТЬ</h2>
    <ol>
      <li><b>Звук.</b> Звучат все игры: щелчок на нажатие, сигнал на удачу и на ошибку, в Jukebox барабан и мелодия из попаданий. Кнопка ♪ в шапке кабинета выключает звук во всех играх сразу. Скажи, где его мало или много.</li>
    </ol>
    <p><b>Решено:</b> все игры приняты; кот в крестиках-ноликах непобедим (с ним только ничья, потолок счёта 35); кнопка TAKE в слотах остаётся.</p>
  </section>

  <div class="legend">
    <span><em class="tag ok">ПРИНЯТ</em>ты уже сказал «да»</span>
    <span><em class="tag sample">ОБРАЗЕЦ</em>видел в прошлый раз</span>
    <span><em class="tag new">НОВАЯ МЕХАНИКА</em>игра придумана заново</span>
    <span><em class="tag skin">НОВЫЙ ВИД</em>правила прежние</span>
  </div>

  <section class="grid" id="grid" aria-label="Все 18 игр"></section>
</div>

<div id="app"><div id="tools"><button id="tvBtn"></button></div></div>

<script>
/*JS*/
</script>
