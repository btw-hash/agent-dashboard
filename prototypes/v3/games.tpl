<title>Agent Office Arcade Frame</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Press+Start+2P&display=swap">
<style>
/* Layout: what is being decided, the office with 18 numbered markers, the list of games as cards. Any of them opens the one cabinet over the page. */
:root{
  color-scheme:dark;
  --bg:#080810; --surface:#0c0d1e; --surface-2:#11132a; --border:#1e2240; --border-hi:#2e3566;
  --text:#c8d3f5; --text-hi:#e4ecff; --text-dim:#7a84ad;
  --accent:#7aa2f7; --ok:#9ece6a; --warn:#e0af68; --mark:#ffd23f;
  --font:"JetBrains Mono","Cascadia Mono",Consolas,monospace;
  --pixel:"Press Start 2P","JetBrains Mono",monospace;
}
*{box-sizing:border-box}[hidden]{display:none!important}
html,body{height:100%}
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
.stage{position:relative;height:clamp(420px,76vh,820px);border:1px solid var(--border);background:#05060d;overflow:hidden}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none}
#cv.hit{cursor:pointer}
.tags{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.tag{position:absolute;transform:translate(-50%,-100%);padding:3px 6px 2px;font-family:var(--pixel);font-size:7px;line-height:1.4;color:var(--text-hi);background:rgba(10,11,26,.9);border:1px solid var(--border-hi);white-space:nowrap}
.tag.spot{color:#07081a;background:var(--mark);border-color:#07081a}
.list{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:8px}
.gm{display:grid;grid-template-columns:auto 1fr;gap:2px 9px;align-items:center;text-align:left;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--c,var(--border-hi));padding:8px 10px;min-width:0}
.gm:hover{border-color:var(--border-hi);border-left-color:var(--c)}
.gm i{grid-row:span 2;font-style:normal;font-family:var(--pixel);font-size:8px;color:#07081a;background:var(--mark);padding:4px 5px 3px;min-width:24px;text-align:center}
.gm b{color:var(--text-hi);font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gm span{font-size:10px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gm.live b::after{content:"играется";margin-left:7px;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ok);font-weight:400}
.box{background:var(--surface);border:1px solid var(--border);padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.box ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}.box li::marker{color:var(--accent)}
.note{font-size:11px;color:var(--text-dim)}

/* the cabinet: one frame for every game, tinted by the room it stands in */
.veil{position:fixed;inset:0;z-index:30;background:rgba(5,6,13,.84);display:flex;align-items:center;justify-content:center;
  padding:max(10px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) max(10px,env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px))}
.cab{--c:#ff4fd8;width:min(780px,100%,calc((100dvh - 230px)*4/3 + 190px));display:grid;grid-template-columns:minmax(0,1fr) 160px;grid-template-areas:"mq mq" "crt hi" "deck hi";
  background:#161a2c;border:3px solid #05060d;outline:3px solid var(--c);box-shadow:0 0 46px -6px var(--c);animation:cabin .3s ease-out}
@keyframes cabin{from{transform:scale(.86);opacity:0}to{transform:none;opacity:1}}
.mq{grid-area:mq;background:var(--c);color:#07081a;padding:9px 10px 8px 12px;display:flex;gap:10px;align-items:center;font-family:var(--pixel)}
.mq b{font-size:13px;font-weight:400;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5}
.mq span{font-size:7px;white-space:nowrap}
.mq button{background:#07081a;color:var(--c);border:0;font-family:var(--pixel);font-size:9px;padding:7px 8px 5px}
.crtw{grid-area:crt;padding:12px 12px 8px;background:#0b0d1e;min-width:0}
.crt{position:relative;aspect-ratio:4/3;background:#000;border:6px solid #23263a;border-radius:12px;overflow:hidden}
.crt canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;touch-action:none}
.crt.on canvas{animation:crt .45s ease-out}
@keyframes crt{0%{transform:scaleY(.01) scaleX(.6);filter:brightness(6)}55%{transform:scaleY(.01) scaleX(1);filter:brightness(6)}100%{transform:none;filter:none}}
.crt::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px,rgba(0,0,0,.22) 2px 3px);box-shadow:inset 0 0 40px rgba(0,0,0,.6)}
.card{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;text-align:center;background:rgba(4,6,10,.9);padding:14px;font-family:var(--pixel);color:var(--text-hi)}
.card b{font-size:clamp(13px,3.2vw,22px);font-weight:400;color:var(--c);line-height:1.5}
.card span{font-size:8px;color:var(--text);line-height:1.8}
.card em{font-style:normal;font-size:9px;color:var(--mark)}
.card button{font-family:var(--pixel);font-size:10px;background:var(--c);color:#07081a;border:0;padding:11px 14px 9px}
.card .blink{animation:blink 1s steps(2) infinite}
@keyframes blink{50%{opacity:.35}}
.card p{font-family:var(--font);font-size:12px;color:var(--text);border:1px solid var(--warn);padding:8px 10px;max-width:44ch;line-height:1.5}
.deck{grid-area:deck;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 16px 14px;background:linear-gradient(#0b0d1e,#23263a 30%,#161a2c);min-height:118px}
.dpad{display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(3,34px);gap:2px}
.dpad button{background:#05060d;border:1px solid var(--border-hi);color:var(--text-hi);font-size:12px;padding:0}
.dpad button:active,.ab button:active{transform:translateY(2px)}
.dpad [data-k=up]{grid-area:1/2}.dpad [data-k=left]{grid-area:2/1}.dpad [data-k=right]{grid-area:2/3}.dpad [data-k=down]{grid-area:3/2}
.dpad::after{content:"";grid-area:2/2;background:#05060d;border-radius:50%;margin:6px}
.how{flex:1;min-width:0;text-align:center;font-family:var(--pixel);font-size:7px;line-height:1.9;color:var(--text-dim)}
.how b{display:block;font-size:14px;font-weight:400;color:var(--text-hi);font-variant-numeric:tabular-nums}
.ab button{width:62px;height:62px;border-radius:50%;background:var(--c);border:4px solid #05060d;color:#07081a;font-family:var(--pixel);font-size:8px;box-shadow:0 4px 0 #05060d}
.hi{grid-area:hi;border-left:3px solid #05060d;padding:12px 10px;font-family:var(--pixel);font-size:7px;line-height:2;color:var(--text-dim);display:flex;flex-direction:column;gap:6px;min-width:0}
.hi h3{margin:0;font-size:8px;font-weight:400;color:var(--c)}
.hi ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:2px;font-variant-numeric:tabular-nums}
.hi li{display:flex;justify-content:space-between;gap:6px}.hi li b{font-weight:400;color:var(--text-hi)}
.coin{margin-top:auto;border:2px solid #05060d;background:#0b0d1e;padding:6px;text-align:center;color:var(--mark)}
@media (max-width:640px){
  .cab{grid-template-columns:minmax(0,1fr);grid-template-areas:"mq" "crt" "deck" "hi";width:min(100%,calc((100dvh - 330px)*4/3 + 30px))}
  .hi{border-left:0;border-top:3px solid #05060d;flex-direction:row;flex-wrap:wrap;align-items:flex-start;gap:4px 14px}.hi ol{flex:1;min-width:120px}.coin{margin:0}
  .deck{padding-inline:10px}
}
@media (prefers-reduced-motion:reduce){.cab,.crt.on canvas,.card .blink{animation:none}}
</style>

<div class="page">
  <header>
    <h1>Один автомат для всех 18 игр</h1>
    <p class="lede">Сейчас у каждой игры своё окно, своя кнопка выхода, и ни одна не работает с тачем. Здесь игра открывается из своего предмета в офисе в одной общей рамке: вывеска, экран, пульт, таблица рекордов. Нажми на любой жёлтый номер в офисе или на карточку ниже.</p>
  </header>

  <section class="decide" aria-label="Что решаем">
    <h2>Что решаем на этой странице</h2>
    <ol>
      <li><b>Рамка.</b> Открой Snake (17), Reaction test (16) и Slot machine (10): они играются. Такой автомат берём?</li>
      <li><b>Цвет по комнате.</b> Автомат красится в цвет комнаты, где стоит предмет: игровая розовая, зал зелёный, лаунж золотой, кафе бирюзовое. Оставить или один цвет на все?</li>
      <li><b>Кнопки на экране.</b> Крестовина и кнопка A работают пальцем, так игры впервые идут на телефоне. Нужны ли они на компьютере, или прятать и показывать только на тач-экране?</li>
      <li><b>Список.</b> В старом офисе 18-й игрой был Snake, а не Hoops (моя ошибка в плане этажа). Snake поставлен на телевизор в игровой, корзина в зале осталась декором. Так годится?</li>
    </ol>
  </section>

  <section class="stage" id="stage" aria-label="Офис с метками игр">
    <canvas id="cv"></canvas>
    <div class="tags" id="tags"></div>
  </section>

  <section class="list" id="list" aria-label="18 игр"></section>

  <section class="two">
    <div class="box"><h2>Что даёт общая рамка</h2>
      <ul>
        <li>Один выход (кнопка и Esc), одна таблица рекордов, один экран «Game over».</li>
        <li>Экран любой формы: от 248×248 до 640×220 точек, игра вписывается целиком.</li>
        <li>Пульт показывает только то, что нужно игре: крестовину, кнопку, или ничего.</li>
        <li>Фишки в казино общие и не сгорают между запусками (сейчас каждый раз снова 100).</li>
      </ul></div>
    <div class="box"><h2>Что в образце настоящее</h2>
      <ul>
        <li>Три игры написаны под новую рамку и играются: по одной на каждый вид управления.</li>
        <li>Остальные 15 показывают свою заставку: название, размер экрана и управление взяты из старого кода.</li>
        <li>Рекорды сохраняются в браузере и переживают перезагрузку страницы.</li>
      </ul></div>
  </section>
  <p class="note">Надписи в автомате английские: это интерфейс продукта.</p>
</div>

<div class="veil" id="veil" hidden>
  <div class="cab" id="cab" role="dialog" aria-labelledby="cabT">
    <div class="mq"><b id="cabT"></b><span id="cabR"></span><button id="cabX" aria-label="Exit">EXIT</button></div>
    <div class="crtw"><div class="crt" id="crt"><canvas id="screen" width="384" height="288"></canvas><div class="card" id="card"></div></div></div>
    <div class="deck">
      <div class="dpad" id="dpad"><button data-k="up" aria-label="Up">&#9650;</button><button data-k="left" aria-label="Left">&#9664;</button><button data-k="right" aria-label="Right">&#9654;</button><button data-k="down" aria-label="Down">&#9660;</button></div>
      <div class="how"><span id="cabHow"></span><b id="cabS">0</b>SCORE</div>
      <div class="ab"><button id="btnA" data-k="a">A</button></div>
    </div>
    <aside class="hi"><h3>HI-SCORES</h3><ol id="hi"></ol><div class="coin" id="coin">1 CREDIT</div></aside>
  </div>
</div>

<script>
(function(){
/*ENGINE*/

// ── this page: one cabinet, eighteen games ──────────────────────
Office.snap=true;Office.showGames=true;Office.names='pips';
const TINT={'Hall':'#7aa2f7','Games room':'#ff4fd8','Gym':'#9ece6a','Lounge':'#e0af68','Cafe':'#39c5cf'};
// what each v2 game needs: how it is played, and the size of its own screen
const NEED={'Memory match':['TAP',248,248],'Typing test':['KEYBOARD',640,220],'Plant care':['TAP',260,300],'Coffee machine':['TAP',320,200],
  'Jukebox rhythm':['KEYS A S D F',320,340],'Crystal ball':['TAP',280,320],'Poker':['BUTTONS',520,320],'Roulette':['TAP',620,420],'Blackjack':['BUTTONS',480,320],
  'Slot machine':['ONE BUTTON',320,170],'Foosball':['POINTER',500,300],'Minesweeper':['TAP AND HOLD',320,320],'Tic-tac-toe':['TAP',320,320],'Connect 4':['TAP',420,380],
  'Darts':['TAP',400,400],'Reaction test':['TAP',420,280],'Snake':['D-PAD',384,288],'Ping-pong':['POINTER',580,280]};
const FONT='"Press Start 2P",monospace';
// a game for the new frame: start(api) returns { key, tap, tick, draw }; the frame owns the loop, the exit and the scores
const DEMO={
  'Snake':{pad:true,a:'',start(api){
    let s=[[12,9],[11,9],[10,9]],d=[1,0],nd=d,food=[18,9],acc=0;
    const drop=()=>{do food=[(Math.random()*24)|0,(Math.random()*18)|0];while(s.some(c=>c[0]===food[0]&&c[1]===food[1]));};
    return{key(k){const m={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[k];if(m&&(m[0]!==-d[0]||m[1]!==-d[1]))nd=m;},
      tap(x,y){const h=s[0],dx=x/16-h[0],dy=y/16-h[1];this.key(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):dy>0?'down':'up');},
      tick(dt){acc+=dt;const step=Math.max(.07,.15-s.length*.002);
        while(acc>step){acc-=step;d=nd;const h=[s[0][0]+d[0],s[0][1]+d[1]];
          if(h[0]<0||h[1]<0||h[0]>23||h[1]>17||s.some(c=>c[0]===h[0]&&c[1]===h[1]))return api.over(s.length-3);
          s.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){api.score(s.length-3);drop();}else s.pop();}},
      draw(c){c.fillStyle='#07122a';c.fillRect(0,0,384,288);c.fillStyle='#0f1d3f';for(let x=0;x<24;x++)for(let y=0;y<18;y++)c.fillRect(x*16+7,y*16+7,2,2);
        c.fillStyle='#ff4b4b';c.fillRect(food[0]*16+3,food[1]*16+3,10,10);c.fillStyle='#ffb3b3';c.fillRect(food[0]*16+4,food[1]*16+4,3,3);
        s.forEach((q,i)=>{c.fillStyle=i?'#7cff6b':'#d6ffb8';c.fillRect(q[0]*16+1,q[1]*16+1,14,14);});}};}},
  'Reaction test':{a:'TAP',low:true,unit:' MS',start(api){
    let st='wait',t=0,go=1.5+Math.random()*2.5;
    const hit=()=>{if(st==='wait'){st='early';t=0;}else if(st==='go'){st='done';api.over(Math.round(t*1000));}};
    return{key(k){if(k==='a')hit();},tap:hit,
      tick(dt){t+=dt;if(st==='wait'&&t>=go){st='go';t=0;}if(st==='early'&&t>1.2){st='wait';t=0;go=1.5+Math.random()*2.5;}},
      draw(c){c.fillStyle=st==='go'||st==='done'?'#1f7a3a':st==='early'?'#6b4a12':'#7a1f2a';c.fillRect(0,0,420,280);c.fillStyle='#fff';c.textAlign='center';c.font='20px '+FONT;
        c.fillText(st==='go'||st==='done'?'TAP!':st==='early'?'TOO SOON':'WAIT...',210,150);}};}},
  'Slot machine':{a:'SPIN',start(api){
    const COL=['#ff4b4b','#ffd23f','#7cff6b','#39d3ff','#bb9af7'],GL=['7','$','*','#','@'];let r=[0,1,2],spin=0,left=10,cr=0,msg='10 SPINS',fin=0;
    const go=()=>{if(spin>0||left<=0)return;left--;spin=1.3;msg='';};
    return{key(k){if(k==='a')go();},tap:go,
      tick(dt){if(fin>0){fin-=dt;if(fin<=0)api.over(cr);return;}if(spin<=0)return;spin-=dt;
        for(let i=0;i<3;i++)if(spin>.9-i*.35)r[i]=(Math.random()*5)|0;
        if(spin<=0){const w=r[0]===r[1]&&r[1]===r[2]?(r[0]===0?50:20):r[0]===r[1]||r[1]===r[2]?3:0;cr+=w;msg=w?'WIN '+w:'NO LUCK';api.score(cr);if(left<=0)fin=1.4;}},
      draw(c){c.fillStyle='#4a1f33';c.fillRect(0,0,320,170);c.fillStyle='#e0af68';c.fillRect(18,12,284,112);c.textAlign='center';
        for(let i=0;i<3;i++){c.fillStyle='#0b0d1e';c.fillRect(28+i*92,20,80,96);c.fillStyle=COL[r[i]];c.fillRect(36+i*92,28,64,80);c.fillStyle='#07081a';c.font='32px '+FONT;c.fillText(GL[r[i]],68+i*92,86);}
        c.fillStyle='#fff';c.font='8px '+FONT;c.fillText('SPINS '+left+'   CREDITS '+cr,160,142);c.fillStyle='#ffd23f';c.fillText(msg,160,160);}};}}
};

// ── the cabinet ─────────────────────────────────────────────────
const scr=$('#screen'),sx=scr.getContext('2d'),CAB={m:null,run:null,state:'off',last:0};
const fmt=(n,d)=>n+(d&&d.unit||'');
function scores(){try{return JSON.parse(localStorage.getItem('agent_office_scores')||'{}');}catch(_){return{};}}
function keep(name,n,low){const all=scores(),l=(all[name]||[]).concat(n).sort((a,b)=>low?a-b:b-a).slice(0,5);all[name]=l;try{localStorage.setItem('agent_office_scores',JSON.stringify(all));}catch(_){}return l[0]===n;}
function board(){const m=CAB.m,d=DEMO[m.name],l=scores()[m.name]||[];$('#hi').innerHTML=[0,1,2,3,4].map(i=>'<li><span>'+(i+1)+'.</span><b>'+(l[i]!=null?fmt(l[i],d):'---')+'</b></li>').join('');}
function slate(kind,score,record){const m=CAB.m,d=DEMO[m.name],need=NEED[m.name],c=$('#card');c.hidden=false;
  if(kind==='over')c.innerHTML='<b>GAME OVER</b><span>SCORE '+fmt(score,d)+'</span>'+(record?'<em>NEW RECORD</em>':'')+'<button id="go">PLAY AGAIN</button>';
  else c.innerHTML='<b>'+m.name.toUpperCase()+'</b><span>'+need[0]+' &middot; SCREEN '+need[1]+'&times;'+need[2]+'</span>'
    +(d?'<button id="go" class="blink">PRESS START</button>':'<p>В образце играются три игры: Snake, Reaction test и Slot machine. Эта переезжает из старого офиса как есть, со своим экраном и управлением.</p>');
  const b=$('#go');if(b)b.onclick=play;}
function openGame(m){CAB.m=m;CAB.state='title';CAB.run=null;const d=DEMO[m.name],need=NEED[m.name];
  $('#cab').style.setProperty('--c',TINT[m.room]);$('#cabT').textContent=m.name.toUpperCase();$('#cabR').textContent=m.room.toUpperCase()+' · '+m.n+'/18';
  scr.width=need[1];scr.height=need[2];sx.fillStyle='#04060a';sx.fillRect(0,0,need[1],need[2]);
  $('#dpad').style.visibility=d&&d.pad?'visible':'hidden';const a=$('#btnA');a.style.visibility=d&&d.a?'visible':'hidden';a.textContent=d&&d.a||'A';
  $('#cabHow').textContent=need[0];$('#cabS').textContent='0';$('#coin').textContent=d?'1 CREDIT':'COMING IN THE BUILD';
  $('#veil').hidden=false;const crt=$('#crt');crt.classList.remove('on');void crt.offsetWidth;crt.classList.add('on');
  slate('title');board();Office.picked=m;Office.touched=true;Office.cam.frame(m.x,m.y+10,300,170,true);}
function play(){const d=DEMO[CAB.m.name];if(!d)return;$('#card').hidden=true;$('#cabS').textContent='0';CAB.state='play';
  CAB.run=d.start({score(n){$('#cabS').textContent=fmt(n,d);},over(n){CAB.state='over';$('#cabS').textContent=fmt(n,d);const rec=keep(CAB.m.name,n,d.low)&&(d.low||n>0);board();slate('over',n,rec);}});
  CAB.last=performance.now();requestAnimationFrame(loop);}
function loop(t){if(CAB.state!=='play'||!CAB.run)return;const dt=Math.min(.05,(t-CAB.last)/1000);CAB.last=t;CAB.run.tick(dt);if(CAB.run)CAB.run.draw(sx);requestAnimationFrame(loop);}
function closeGame(){CAB.state='off';CAB.run=null;$('#veil').hidden=true;Office.picked=null;}
function press(k){if(CAB.state==='play')CAB.run.key(k);else if(k==="a")play();}
$('#cabX').onclick=closeGame;
$('#veil').addEventListener('pointerdown',e=>{if(e.target.id==='veil')closeGame();});
$$('#dpad button, #btnA').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();press(b.dataset.k);}));
scr.addEventListener('pointerdown',e=>{if(CAB.state!=='play')return;const r=scr.getBoundingClientRect(),k=Math.min(r.width/scr.width,r.height/scr.height);
  CAB.run.tap((e.clientX-r.left-(r.width-scr.width*k)/2)/k,(e.clientY-r.top-(r.height-scr.height*k)/2)/k);});
const KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',' ':'a',Enter:'a'};
document.addEventListener('keydown',e=>{if(CAB.state==='off')return;if(e.key==='Escape')return closeGame();const k=KEYS[e.key]||KEYS[e.key.toLowerCase()];if(k){e.preventDefault();press(k);}});

// the list under the office, in marker order
$('#list').innerHTML=GAMES.map(m=>'<button class="gm'+(DEMO[m.name]?' live':'')+'" data-n="'+m.n+'" style="--c:'+TINT[m.room]+'"><i>'+m.n+'</i><b>'+m.name+'</b><span>'+m.room+' · '+NEED[m.name][0].toLowerCase()+'</span></button>').join('');
$('#list').addEventListener('click',e=>{const b=e.target.closest('.gm');if(b)openGame(GAMES[+b.dataset.n-1]);});
Office.onPick=a=>{if(a&&a.kind==='game')openGame(a);};
Office.start();
})();
</script>
