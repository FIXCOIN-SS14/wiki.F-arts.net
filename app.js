/* =====================================================
   Логика вики. Контент лежит в pages.js, здесь его трогать не нужно.
   ===================================================== */

/* Короткие помощники для поиска элементов */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const content = $("#content");
const nav = $("#nav");
const toc = $("#toc");
let tocObserver = null;

/* ---------- 1. Меню слева ---------- */
function buildNav() {
  // Группируем страницы по полю group
  const groups = {};
  for (const [id, page] of Object.entries(PAGES)) {
    (groups[page.group] ??= []).push([id, page]);
  }

  nav.innerHTML =
    '<span class="nav-pill"></span>' +
    Object.entries(groups).map(([name, items]) =>
      `<div class="nav-group">${name}</div>` +
      items.map(([id, page]) =>
        `<a class="nav-link" href="#/${id}" data-id="${id}">${page.title}` +
        (page.soon ? '<i class="tag tag-soon">скоро</i>' : "") +
        "</a>"
      ).join("")
    ).join("");
}

// Передвигаем «бегунок» к активному пункту меню
function movePill(id) {
  const pill = $(".nav-pill");
  const link = $(`.nav-link[data-id="${id}"]`);
  $$(".nav-link").forEach(a => a.classList.toggle("active", a === link));
  if (!link) { pill.style.opacity = 0; return; }
  pill.style.opacity = 1;
  pill.style.height = link.offsetHeight + "px";
  pill.style.transform = `translateY(${link.offsetTop}px)`;
}

/* ---------- 2. Анимация букв в заголовке ---------- */
// Разбиваем текст на буквы, чтобы CSS мог анимировать каждую отдельно
function splitText(el) {
  let n = 0;
  el.setAttribute("aria-label", el.textContent);
  el.innerHTML = el.textContent.split(" ").map(word =>
    '<span class="word" aria-hidden="true">' +
    [...word].map(ch => `<span class="ch" style="--i:${n++}">${ch}</span>`).join("") +
    "</span>"
  ).join(" ");
}

/* ---------- 3. Оглавление справа ---------- */
function buildToc() {
  tocObserver?.disconnect();
  const heads = $$("h2, h3", content);
  if (!heads.length) { toc.innerHTML = ""; return; }

  toc.innerHTML =
    '<div class="toc-title">На этой странице</div>' +
    heads.map((h, i) => {
      h.id = "section-" + i;
      return `<a class="toc-link${h.tagName === "H3" ? " sub" : ""}" data-target="${h.id}">${h.textContent}</a>`;
    }).join("");

  // Подсвечиваем раздел, который сейчас на экране
  tocObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        $$(".toc-link").forEach(a => a.classList.toggle("active", a.dataset.target === e.target.id));
      }
    });
  }, { rootMargin: "-80px 0px -70% 0px" });
  heads.forEach(h => tocObserver.observe(h));
}

toc.addEventListener("click", e => {
  const link = e.target.closest(".toc-link");
  if (link) document.getElementById(link.dataset.target).scrollIntoView();
});

/* ---------- 4. Переход между страницами ---------- */
function route() {
  const id = location.hash.replace(/^#\/?/, "") || "home";
  const page = PAGES[id];

  document.title = (page && id !== "home" ? page.title + " — " : "") + SITE.name;

  if (page) {
    const crumbs = id === "home" ? "" :
      `<div class="crumbs"><a href="#/home">Главная</a> / ${page.group} / ${page.title}</div>`;
    const title = page.hero ? "" : `<h1>${page.title}</h1>`;
    content.innerHTML = crumbs + title + page.html;
  } else {
    content.innerHTML = `<h1>Страница не найдена</h1>
      <div class="callout warn">Такой страницы нет. Проверьте ссылку или
      вернитесь на <a href="#/home">главную</a>.</div>`;
  }

  // Перезапускаем анимацию появления страницы
  content.classList.remove("enter");
  void content.offsetWidth;
  content.classList.add("enter");

  $$("[data-split]", content).forEach(splitText);
  buildToc();
  movePill(page ? id : null);
  window.scrollTo(0, 0);
  document.body.classList.remove("menu-open");
}

/* ---------- 5. Поиск ---------- */
// Заранее собираем текст всех страниц
const searchIndex = Object.entries(PAGES).map(([id, page]) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = page.html;
  return { id, title: page.title, text: tmp.textContent.replace(/\s+/g, " ").trim() };
});

const searchBox = $("#search");
const results = $("#results");

function closeResults() { results.hidden = true; }

searchBox.addEventListener("input", () => {
  const q = searchBox.value.trim().toLowerCase();
  if (!q) return closeResults();

  const found = searchIndex.filter(p => (p.title + " " + p.text).toLowerCase().includes(q));
  results.innerHTML = found.length
    ? found.map(p => {
        const i = p.text.toLowerCase().indexOf(q);
        const snippet = i < 0 ? p.text.slice(0, 70) : "…" + p.text.slice(Math.max(0, i - 25), i + 60) + "…";
        return `<a href="#/${p.id}"><b>${p.title}</b><span>${snippet}</span></a>`;
      }).join("")
    : '<p class="empty">Ничего не найдено. Попробуйте другое слово.</p>';
  results.hidden = false;
});

results.addEventListener("click", () => { closeResults(); searchBox.value = ""; });
searchBox.addEventListener("keydown", e => {
  if (e.key === "Enter") results.querySelector("a")?.click();
  if (e.key === "Escape") { closeResults(); searchBox.blur(); }
});
document.addEventListener("click", e => { if (!e.target.closest(".search")) closeResults(); });

// Горячие клавиши: Ctrl+K или «/»
document.addEventListener("keydown", e => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" || (e.key === "/" && !typing)) {
    e.preventDefault();
    searchBox.focus();
  }
});

/* ---------- 6. Мелкие эффекты ---------- */
// Свечение карточек следует за курсором
content.addEventListener("pointermove", e => {
  const card = e.target.closest(".card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", e.clientX - r.left + "px");
  card.style.setProperty("--my", e.clientY - r.top + "px");
});

// Полоска прокрутки сверху
addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty("--scroll", max > 0 ? scrollY / max : 0);
}, { passive: true });

// Меню-бургер на телефоне
$(".burger").addEventListener("click", () => document.body.classList.toggle("menu-open"));
$(".overlay").addEventListener("click", () => document.body.classList.remove("menu-open"));

/* ---------- 7. Запуск ---------- */
$("#siteName").textContent = SITE.name;
$("#tgBtn").href = SITE.telegram;
$("#footer").innerHTML =
  `${SITE.name} · обновлено ${SITE.updated} · ` +
  `<a href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>`;

buildNav();
addEventListener("hashchange", route);
route();
