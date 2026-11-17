<title>Игры офиса</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: what is being decided, then one cabinet with three playable samples, then all 18 games as cards. */
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
.page{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:22px}
h1{font-family:var(--pixel);font-size:15px;font-weight:400;color:var(--text-hi);margin:0 0 8px;line-height:1.7;text-wrap:balance}
h2{font-family:var(--pixel);font-size:10px;font-weight:400;color:var(--accent);margin:0;letter-spacing:.06em;line-height:1.8}
p{margin:0;max-width:74ch}
.lede{color:var(--text-dim)}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.decide{background:var(--surface);border:1px solid var(--warn);padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.decide ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.decide b{color:var(--text-hi)}
.sample{display:flex;flex-direction:column;gap:12px;align-items:center}
.picks{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.pick{background:var(--surface-2);border:1px solid var(--border);border-bottom:3px solid var(--c);padding:8px 12px;text-align:left;min-width:0}
.pick b{display:block;color:var(--text-hi);font-size:12px}
.pick span{font-size:11px;color:var(--text-dim)}
.pick[aria-pressed="true"]{background:var(--c);border-color:var(--c)}
.pick[aria-pressed="true"] b,.pick[aria-pressed="true"] span{color:#07081a}
.keys{font-size:11px;color:var(--text-dim);text-align:center}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.g{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--c,var(--border-hi));padding:12px;display:flex;flex-direction:column;gap:6px;min-width:0}
.g header{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:baseline;justify-content:space-between}
.g h3{margin:0;font-size:13px;color:var(--text-hi)}
.g h3 i{font-style:normal;color:var(--text-dim);font-weight:400;margin-right:6px}
.tag{font-family:var(--pixel);font-size:7px;padding:4px 5px 3px;color:#07081a;background:var(--text-dim);white-space:nowrap}
.tag.new{background:var(--hot)}.tag.skin{background:var(--accent)}.tag.done{background:var(--ok)}
.g p{font-size:12px}
.g .was{color:var(--text-dim)}
.g .kind{font-size:11px;color:var(--text-dim)}
.legend{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:12px;color:var(--text-dim);align-items:center}
.legend span{display:flex;gap:6px;align-items:center}
/*CABINET*/
.cab{animation:none}
</style>

<div class="page">
  <header>
    <h1>Игры офиса: новый лад</h1>
    <p class="lede">Ты выбрал: переделываем и механики, вид «по предмету». Ниже три готовых образца, в них можно играть прямо здесь, и план по всем 18 играм. Остальные 15 делаю после твоего ответа.</p>
  </header>

  <section class="decide" aria-label="Что решить">
    <h2>ЧТО РЕШИТЬ</h2>
    <ol>
      <li><b>Вид.</b> «Бариста» и «Шар» нарисованы как крупный план места в офисе с нашими человечками, «Snake» как яркая аркада. Берём такой вид для остальных?</li>
      <li><b>Новые механики образцов.</b> Кофемашина стала очередью заказов, хрустальный шар стал «повтори знаки». Годятся или придумать другое?</li>
      <li><b>План по 18.</b> В карточках ниже: что остаётся по правилам, а что придумываю заново. Скажи, с чем не согласен.</li>
    </ol>
  </section>

  <section class="sample" aria-label="Образцы">
    <div class="picks">
      <button class="pick" data-g="barista" style="--c:#39c5cf" aria-pressed="true"><b>Бариста</b><span>предмет, механика новая</span></button>
      <button class="pick" data-g="snake" style="--c:#ff4fd8" aria-pressed="false"><b>Snake</b><span>экран автомата, аркада</span></button>
      <button class="pick" data-g="crystal" style="--c:#e0af68" aria-pressed="false"><b>Шар</b><span>предмет, механика новая</span></button>
    </div>
    <div class="cab" id="cab" role="group" aria-labelledby="cabT">
      <div class="mq"><b id="cabT"></b><span id="cabR"></span></div>
      <div class="crtw"><div class="crt on" id="crt"><canvas id="screen" width="240" height="180"></canvas><div class="slate" id="slate"></div></div></div>
      <div class="deck">
        <div class="dpad" id="dpad"><button data-k="up" aria-label="Вверх">&#9650;</button><button data-k="left" aria-label="Влево">&#9664;</button><button data-k="right" aria-label="Вправо">&#9654;</button><button data-k="down" aria-label="Вниз">&#9660;</button></div>
        <div class="how"><span id="cabHow"></span><b id="cabS">0</b>SCORE</div>
        <div class="ab"><button id="btnA" data-k="a">A</button></div>
      </div>
      <aside class="hi"><h3>HI-SCORES</h3><ol id="hi"></ol><div class="coin">1 CREDIT</div></aside>
    </div>
    <p class="keys">Тач: нажимай прямо по экрану. Клавиатура: стрелки или WASD, пробел или Enter вместо кнопки.</p>
  </section>

  <section aria-label="Все 18 игр" style="display:flex;flex-direction:column;gap:12px">
    <h2>ВСЕ 18 ИГР</h2>
    <div class="legend">
      <span><b class="tag done">ГОТОВ</b>образец выше</span>
      <span><b class="tag new">ЗАНОВО</b>новая механика</span>
      <span><b class="tag skin">ВИД</b>правила те же, новая графика и жизнь</span>
    </div>
    <div class="grid">
      <article class="g" style="--c:#7aa2f7"><header><h3><i>1</i>Memory match</h3><b class="tag skin">ВИД</b></header><span class="kind">Холл, белая доска · предмет</span>
        <p class="was">Сейчас: 12 карточек с абстрактными значками.</p>
        <p>Будет: стикеры на доске крупным планом, на них вещи офиса (кружка, кот, гусь, пицца, утка, кактус). Найденная пара улетает в корзину; если долго думаешь, кот сбивает стикер лапой.</p></article>
      <article class="g" style="--c:#7aa2f7"><header><h3><i>2</i>Typing test</h3><b class="tag skin">ВИД</b></header><span class="kind">Холл, ноутбук · предмет</span>
        <p class="was">Сейчас: набрать предложение на тёмном фоне.</p>
        <p>Будет: монитор крупным планом, печатаешь сообщение коммита, пока идёт сборка. Ошибка красит строку терминала, человечек за столом печатает вместе с тобой. На телефоне открывается экранная клавиатура.</p></article>
      <article class="g" style="--c:#7aa2f7"><header><h3><i>3</i>Plant care</h3><b class="tag new">ЗАНОВО</b></header><span class="kind">Холл, растение · предмет</span>
        <p class="was">Сейчас: пять раз попасть каплей в зону.</p>
        <p>Будет: подоконник с пятью растениями, каждое сохнет со своей скоростью. Носишь лейку к самому сухому, перелил — лужа. 45 секунд, счёт: сколько дожило зелёными.</p></article>
      <article class="g" style="--c:#39c5cf"><header><h3><i>4</i>Coffee machine → Бариста</h3><b class="tag done">ГОТОВ</b></header><span class="kind">Кафе, стойка · предмет</span>
        <p class="was">Было: три раза остановить полоску.</p>
        <p>Стало: очередь наших человечков, у каждого заказ. Собираешь напиток по слоям в нужном порядке, пока не кончилось терпение. Три ушедших клиента — конец смены.</p></article>
      <article class="g" style="--c:#e0af68"><header><h3><i>5</i>Jukebox rhythm</h3><b class="tag skin">ВИД</b></header><span class="kind">Лаунж, джукбокс · предмет</span>
        <p class="was">Сейчас: четыре дорожки нот на чёрном.</p>
        <p>Будет: джукбокс крупным планом. За серию попаданий человечки рядом начинают танцевать, за промах игла скрипит и они оборачиваются.</p></article>
      <article class="g" style="--c:#e0af68"><header><h3><i>6</i>Crystal ball → Шар</h3><b class="tag done">ГОТОВ</b></header><span class="kind">Лаунж, столик · предмет</span>
        <p class="was">Было: «верю / не верю», исход решала монетка.</p>
        <p>Стало: шар показывает ряд знаков, каждый раунд на один длиннее. Повтори по порядку. Одна ошибка — видение гаснет.</p></article>
      <article class="g" style="--c:#e0af68"><header><h3><i>7</i>Poker</h3><b class="tag skin">ВИД</b></header><span class="kind">Лаунж, карточный стол · предмет</span>
        <p class="was">Сейчас: холдем против CPU, которому в 70% раздач достаются карты лучше.</p>
        <p>Будет: стол сверху, напротив сидит наш человечек и выдаёт себя позами: думает, хватается за голову, радуется. Подтасовку убираю, колода честная.</p></article>
      <article class="g" style="--c:#e0af68"><header><h3><i>8</i>Roulette</h3><b class="tag skin">ВИД</b></header><span class="kind">Лаунж, стол рулетки · предмет</span>
        <p class="was">Сейчас: плоское поле и колесо.</p>
        <p>Будет: стол крупным планом, крупье-человечек, фишки стопками, шарик с отскоком. Ставки и выплаты те же.</p></article>
      <article class="g" style="--c:#e0af68"><header><h3><i>9</i>Blackjack</h3><b class="tag skin">ВИД</b></header><span class="kind">Лаунж, стол · предмет</span>
        <p class="was">Сейчас: ряды карт и кнопки.</p>
        <p>Будет: дилер-человечек, карты ложатся на сукно по одной, фишки на столе. Правила те же.</p></article>
      <article class="g" style="--c:#e0af68"><header><h3><i>10</i>Slot machine</h3><b class="tag new">ЗАНОВО</b></header><span class="kind">Лаунж, автомат · предмет</span>
        <p class="was">Сейчас: одна кнопка, чистая удача.</p>
        <p>Будет: автомат крупным планом со значками офиса. После первого вращения можно удержать до двух барабанов и крутить ещё раз, так появляется решение.</p></article>
      <article class="g" style="--c:#ff4fd8"><header><h3><i>11</i>Foosball</h3><b class="tag skin">ВИД</b></header><span class="kind">Игровая, кикер · предмет</span>
        <p class="was">Сейчас: цветные прямоугольники на зелёном.</p>
        <p>Будет: деревянный стол сверху, на штангах маленькие человечки в наших рубашках, мяч с тенью, зрители по краям. Правила те же.</p></article>
      <article class="g" style="--c:#ff4fd8"><header><h3><i>12</i>Minesweeper → Bug sweeper</h3><b class="tag skin">ВИД</b></header><span class="kind">Игровая, автомат · экран</span>
        <p class="was">Сейчас: серое поле.</p>
        <p>Будет: яркая аркада, вместо мин жуки. Первый тап всегда безопасный (сейчас можно взорваться сразу).</p></article>
      <article class="g" style="--c:#ff4fd8"><header><h3><i>13</i>Tic-tac-toe</h3><b class="tag new">ЗАНОВО</b></header><span class="kind">Игровая, автомат · экран</span>
        <p class="was">Сейчас: соперник не ошибается, выиграть нельзя.</p>
        <p>Будет: лестница из трёх соперников. Стажёр ошибается часто, разработчик редко, кот не ошибается никогда. Счёт: кого прошёл.</p></article>
      <article class="g" style="--c:#ff4fd8"><header><h3><i>14</i>Connect 4</h3><b class="tag skin">ВИД</b></header><span class="kind">Игровая, столик · предмет</span>
        <p class="was">Сейчас: синее поле с кружками.</p>
        <p>Будет: настоящая стойка на столике, фишки падают со стуком, напротив сидит человечек. Соперник начинает думать на ход вперёд.</p></article>
      <article class="g" style="--c:#ff4fd8"><header><h3><i>15</i>Darts</h3><b class="tag new">ЗАНОВО</b></header><span class="kind">Игровая, мишень · предмет</span>
        <p class="was">Сейчас: прицел бродит сам, три дротика по кольцам.</p>
        <p>Будет: настоящая мишень с секторами, удвоениями и утроениями, девять дротиков. Рука дрожит сильнее, когда счёт высокий.</p></article>
      <article class="g" style="--c:#9ece6a"><header><h3><i>16</i>Reaction test</h3><b class="tag new">ЗАНОВО</b></header><span class="kind">Спортзал, табло · экран</span>
        <p class="was">Сейчас: один замер и конец.</p>
        <p>Будет: аркадный светофор, пять попыток, счёт по среднему. Фальстарт штрафуется.</p></article>
      <article class="g" style="--c:#ff4fd8"><header><h3><i>17</i>Snake</h3><b class="tag done">ГОТОВ</b></header><span class="kind">Игровая, телевизор · экран</span>
        <p class="was">Было: квадратики на тёмном.</p>
        <p>Стало: яркая аркада. Жуки вместо точек, кофе даёт ускорение и очки, звезда появляется ненадолго. Правила те же.</p></article>
      <article class="g" style="--c:#9ece6a"><header><h3><i>18</i>Ping-pong</h3><b class="tag skin">ВИД</b></header><span class="kind">Спортзал, стол · предмет</span>
        <p class="was">Сейчас: две палочки и квадрат.</p>
        <p>Будет: стол сверху, по краям два человечка с ракетками, мяч с тенью и отскоком. Правила те же.</p></article>
    </div>
  </section>
</div>

<script>
/*JS*/
</script>
