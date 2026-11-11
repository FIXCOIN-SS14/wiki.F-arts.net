/* =====================================================
   Глитчи — «сайт открыт в разрыве реальностей».
   Всё, что связано с помехами, лежит в этом файле.
   Кнопка «Глитчи» в шапке выключает эффекты (выбор запоминается).
   Подключается после app.js, потому что использует его $ и $$.
   ===================================================== */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fx = $("#fxLayer");                       // слой для частиц, полос и подписей
const GLYPHS = "▓▒░█▌▐#@%&§¤¥Ж∆Ω";               // символы «битых» данных
const PALETTE = ["var(--blue)", "var(--pink)", "var(--yellow)"];
const RIFT_TEXT = ["сбой реальности", "ты не должен это видеть", "0xDEAD",
                   "здесь тебя нет", "перезапись…", "разрыв стабилен"];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const onScreen = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

/* ---------- 1. Переключатель глитчей ---------- */
let enabled = !REDUCED;   // если в системе включено «уменьшить анимацию» — глитчей нет
try { if (localStorage.getItem("glitch") === "off") enabled = false; } catch {}

const glitchBtn = $("#glitchBtn");
glitchBtn.hidden = REDUCED;
function applyToggle() {
  document.body.classList.toggle("no-glitch", !enabled);
  if (!enabled) document.body.className = document.body.className.replace(/\breality-\d\b/g, "").trim();
  glitchBtn.textContent = "Глитчи: " + (enabled ? "вкл" : "выкл");
  glitchBtn.setAttribute("aria-pressed", enabled);
}
glitchBtn.addEventListener("click", () => {
  enabled = !enabled;
  try { localStorage.setItem("glitch", enabled ? "on" : "off"); } catch {}
  applyToggle();
});
applyToggle();

// Заранее загружаем запасные шрифты (с кириллицей), чтобы смена не «моргала»
if (enabled && document.fonts) {
  ["700 16px 'IBM Plex Mono'", "700 16px 'Playfair Display'", "16px 'Rubik Glitch'"]
    .forEach(f => document.fonts.load(f, "Аа"));
}

/* ---------- 2. Вспышка помех: страница дёргается, летят цветные полосы ---------- */
function burst() {
  if (!enabled) return;
  const main = $("main");
  main.classList.add("tear");
  document.body.classList.add("hot");
  for (let i = 0; i < 4; i++) {
    const bar = document.createElement("i");
    bar.className = "bar";
    bar.style.cssText = `top:${rand(0, 95)}%;height:${rand(8, 46)}px;background:${pick(PALETTE)};--dx:${rand(-60, 60)}px`;
    fx.append(bar);
    setTimeout(() => bar.remove(), 360);
  }
  setTimeout(() => { main.classList.remove("tear"); document.body.classList.remove("hot"); }, 360);
}

// Подпись-призрак: на секунду появляется в указанном (или случайном) месте
function say(text, left = rand(5, 70) + "%", top = rand(15, 80) + "%") {
  const g = document.createElement("span");
  g.className = "ghost";
  g.textContent = text;
  g.style.cssText = `left:${left};top:${top}`;
  fx.append(g);
  setTimeout(() => g.remove(), 1600);
}

/* ---------- 3. Разрыв реальности: рваная щель, через которую видно «другой мир» ---------- */
function openRift() {
  if (!enabled) return;
  const rift = $("#rift");
  // Рваные края: 12 точек слева (сверху вниз) и 12 справа (снизу вверх)
  const edge = n => Array.from({ length: n }, (_, i) => [rand(0, 40), i / (n - 1) * 100]);
  const left = edge(12).map(([x, y]) => `${x}% ${y}%`);
  const right = edge(12).map(([x, y]) => `${100 - x}% ${y}%`).reverse();
  rift.style.clipPath = `polygon(${[...left, ...right].join(",")})`;
  rift.style.left = rand(8, 85) + "vw";
  rift.classList.remove("open"); void rift.offsetWidth; rift.classList.add("open");
  burst();

  say(pick(RIFT_TEXT), `calc(${rift.style.left} + 60px)`);   // подпись рядом с разрывом
}

/* ---------- 4. Порча текста ---------- */
// «Расшифровка»: буквы заголовка проявляются из мусорных символов
async function scramble(el, steps = 14) {
  const text = el.dataset.text || el.textContent;
  for (let s = 1; s <= steps; s++) {
    if (!el.isConnected) return;
    const done = Math.floor(text.length * s / steps);
    el.textContent = [...text].map((c, i) => (i < done || c === " ") ? c : pick(GLYPHS)).join("");
    await wait(35);
  }
  el.textContent = text;
}

// На долю секунды портим несколько букв в случайном абзаце
async function corrupt() {
  const els = $$("p, li, h3", content).filter(e => !e.childElementCount && !e.classList.contains("corrupt") && onScreen(e));
  const el = pick(els);
  if (!el) return;
  const text = el.textContent, chars = [...text];
  for (let n = 0; n < 4; n++) {
    const i = Math.floor(rand(0, chars.length));
    if (chars[i] !== " ") chars[i] = pick(GLYPHS);
  }
  el.classList.add("corrupt");
  el.textContent = chars.join("");
  await wait(170);
  el.textContent = text;
  el.classList.remove("corrupt");
}

// Одна буква главного заголовка «ломается»
async function glitchLetter() {
  const ch = pick($$(".ch", content));
  if (!ch) return;
  const old = ch.textContent;
  ch.textContent = pick(GLYPHS);
  ch.classList.add("bad");
  await wait(180);
  ch.textContent = old;
  ch.classList.remove("bad");
}

// Цветное «расслоение» случайного заголовка (рисуется в style.css через .glitching)
function glitchHeading() {
  const h = pick($$(".glitchy").filter(onScreen));
  if (!h) return;
  h.classList.add("glitching");
  setTimeout(() => h.classList.remove("glitching"), 380);
}

/* ---------- 4б. Другие реальности: на пару секунд меняются шрифты и фон ---------- */
// Сами наборы (шрифты, цвета фона) описаны в style.css: .reality-1, .reality-2, .reality-3
let reality = 0;
function setReality(n) {
  document.body.classList.remove("reality-1", "reality-2", "reality-3");
  if (n) document.body.classList.add("reality-" + n);
  reality = n;
  burst();   // переключение прячется за вспышкой помех
}
async function shiftReality() {
  if (!enabled || reality) return;
  setReality(1 + Math.floor(Math.random() * 3));
  say("реальность №" + reality);
  await wait(rand(3000, 6500));
  setReality(0);
}

// На долю секунды один элемент меняет шрифт
const ALT_FONTS = ["'IBM Plex Mono', monospace", "'Playfair Display', serif",
                   "'Rubik Glitch', sans-serif", "'Unbounded', sans-serif"];
async function refont() {
  const el = pick($$("h2, h3, p, .lead, .card h3", content).filter(onScreen));
  if (!el) return;
  el.style.fontFamily = pick(ALT_FONTS);
  await wait(rand(250, 500));
  el.style.fontFamily = "";
}

/* ---------- 5. Следы от курсора ---------- */
let lastTrail = 0;
addEventListener("pointermove", e => {
  if (!enabled || e.pointerType !== "mouse" || e.timeStamp - lastTrail < 45) return;
  lastTrail = e.timeStamp;
  const dot = document.createElement("i");
  dot.className = "trail";
  dot.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:${pick(PALETTE)};--dx:${rand(-14, 14)}px;--dy:${rand(-14, 14)}px`;
  fx.append(dot);
  setTimeout(() => dot.remove(), 600);
});

/* ---------- 6. Плывущий «мусор» на фоне ---------- */
for (let i = 0; i < 16; i++) {
  const d = document.createElement("i");
  d.className = "debris";
  d.style.cssText = `left:${rand(0, 100)}%;--s:${rand(3, 9)}px;--t:${rand(14, 30)}s;--d:${rand(-30, 0)}s;background:${pick(PALETTE)}`;
  fx.append(d);
}

/* ---------- 7. Появление блоков при прокрутке ---------- */
const revealer = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  revealer.unobserve(e.target);
  if (e.target.matches("h2") && enabled) scramble(e.target, 10);
}), { threshold: 0.2 });

/* ---------- 8. Настройка каждой новой страницы ---------- */
function onPage() {
  // Заголовки получают слои для расслоения цвета
  $$("h1, h2", content).forEach(h => { h.classList.add("glitchy"); h.dataset.text = h.textContent; });

  // Блоки появляются «материализацией»
  $$("h2, .card, .callout, .progress", content).forEach((el, i) => {
    el.classList.add("reveal");
    el.style.setProperty("--n", i % 4);
    revealer.observe(el);
  });

  const title = $("h1:not(.hero-title)", content);
  if (title && enabled) scramble(title);
  burst();   // «сдвиг реальности» при каждом переходе
}

/* ---------- 9. Расписание случайных событий ---------- */
function every(fn, min, max) {
  (function tick() { if (enabled) fn(); setTimeout(tick, rand(min, max)); })();
}
every(glitchHeading, 1500, 3500);
every(glitchLetter, 900, 2200);
every(corrupt, 2500, 5000);
every(burst, 6000, 12000);
every(openRift, 11000, 20000);
every(shiftReality, 14000, 28000);
every(refont, 3500, 7000);

/* ---------- 10. Запуск ---------- */
const logoText = $(".logo span");
logoText.classList.add("glitchy");
logoText.dataset.text = logoText.textContent;
$(".logo").addEventListener("pointerenter", burst);

addEventListener("hashchange", onPage);   // app.js уже отрисовал страницу, мы дорабатываем
onPage();
