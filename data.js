/* =====================================================
   ДОСЬЕ: миры и персонажи.
   Чтобы добавить запись, скопируйте блок в списке ниже и поменяйте текст.
   Фото: положите картинку в папку img/ рядом с index.html и укажите путь,
   например  photo: "img/fixcoin.jpg"  (пустая строка — будет заглушка).
   Фото Земли лежит в photos.js, поэтому работает без папки img/.
   Подключается раньше pages.js.
   ===================================================== */

const WORLDS = [
  {
    number: 1,
    name: "Земля №2841-Р23",
    photo: PHOTOS.earth,
    fields: [
      ["Эпоха", "2017 год"]
    ],
    anomaly: "В мире происходят случаи неизвестной пропажи людей. Никто не знает, куда они деваются."
  }
];

const CHARACTERS = [
  {
    nick: "Fix!coin",
    world: 1,                       // номер мира из списка WORLDS
    photo: "",
    hidden: true,                   // true — имя «замазано»; уберите строку, чтобы показать имя
    fields: [
      ["Возраст", "17 лет"],
      ["Пол", "мужской"],
      ["Ориентация", "аромантик"],
      ["Хобби", "программирование и попытки научиться рисовать"],
      ["Чем занимается", "Самый обычный студент 2 курса"]
    ]
  }
];

/* =====================================================
   Сборка страниц «Миры» и «Персонажи» (трогать не нужно)
   ===================================================== */

const dossierPad = n => String(n).padStart(4, "0");

// Имя персонажа. Если hidden: true — оно закрашено маркером
const charName = c => c.hidden
  ? `<span class="smear" role="img" aria-label="имя скрыто">${"█".repeat(c.nick.length)}</span>`
  : c.nick;

// Фото, приклеенное скотчем; без файла — силуэт (или планета для мира)
function dossierPhoto(photo, caption, kind, alt) {
  const pic = photo
    ? `<img src="${photo}" alt="${alt}">`
    : '<span class="nophoto">фото отсутствует</span>';
  return `<figure class="photo"><div class="pic ${kind}${photo ? " has-img" : ""}">${pic}</div>
    <figcaption>${caption}</figcaption></figure>`;
}

// Строки «название — значение», как в печатной анкете; --k задаёт очередь печати
function dossierRows(fields) {
  return `<dl>` + fields.map(([key, value], i) =>
    `<div class="row" style="--k:${i}"><dt>${key}</dt><dd>${value}</dd></div>`
  ).join("") + `</dl>`;
}

// Одна папка: корешок (summary) и раскрывающееся дело на двух листах
function dossierFolder({ code, title, tag, photo, kind, stamp, body, open, alt }) {
  return `<details class="folder" data-code="${code}"${open ? " open" : ""}>
    <summary><span class="f-title"><small>Дело ${code}</small>${title}</span>${tag}</summary>
    <div class="file"><div class="sheet">
      ${dossierPhoto(photo, title, kind, alt)}
      <div class="info"><span class="stamp">${stamp}</span>${body}</div>
    </div></div></details>`;
}

function worldsPage() {
  return `<p class="lead">Известные миры. Нажмите на папку, чтобы открыть дело.</p>
    <h2>Открытые дела</h2>` +
    WORLDS.map((w, i) => dossierFolder({
      code: "М-" + dossierPad(w.number),
      title: `Мир №${w.number}: ${w.name}`,
      tag: '<i class="tag tag-ready">изучается</i>',
      photo: w.photo, alt: `Фото: ${w.name}`, kind: "world", stamp: "Аномалия", open: i === 0,
      body: dossierRows(w.fields) +
        `<div class="anomaly"><b>Аномалии</b><p>${w.anomaly}</p></div>` +
        `<p class="muted">Персонажи мира: ` +
        (CHARACTERS.filter(c => c.world === w.number)
          .map(c => `<a href="#/characters">${charName(c)}</a>`).join(", ") || "неизвестно") + `</p>`
    })).join("");
}

function charactersPage() {
  const world = n => WORLDS.find(w => w.number === n);
  const open = CHARACTERS.map((c, i) => dossierFolder({
    code: "П-" + dossierPad(i + 1),
    title: charName(c),
    tag: `<i class="tag tag-ready">Мир №${c.world}</i>`,
    photo: c.photo, alt: c.hidden ? "Фото персонажа (имя скрыто)" : `Фото: ${c.nick}`,
    kind: "person", stamp: "Секретно", open: i === 0,
    body: dossierRows([
      ["Мир", `<a href="#/worlds">Мир №${c.world}${world(c.world) ? ": " + world(c.world).name : ""}</a>`],
      ...c.fields
    ])
  })).join("");

  // Заглушки для будущих дел
  const hidden = [CHARACTERS.length + 1, CHARACTERS.length + 2].map(n => {
    const code = "П-" + dossierPad(n);
    return `<div class="folder locked" data-code="${code}"><div class="lock-row">
      <span class="f-title"><small>Дело ${code}</small>
      <span class="bars">${"\u00a0".repeat(12)}</span></span>
      <i class="tag tag-soon">засекречено</i></div></div>`;
  }).join("");

  return `<div class="callout warn"><b>Раздел не завершён.</b> Пока открыто одно досье,
    остальные появятся позже.</div>
    <h2>Открытые дела</h2>${open}
    <h2>Засекреченные дела</h2>${hidden}`;
}
