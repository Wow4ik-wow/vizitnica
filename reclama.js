// reclаma.js — финальная версия для работы с GAS (заменить файл целиком)
const GITHUB_JSON_URL =
  "https://raw.githubusercontent.com/Wow4ik-wow/vizitnica/master/reclama.json";

// HTML-блоки
const SIDE_BLOCK_IDS = ["sideBlockLeft", "sideBlockRight"];
const BOTTOM_BLOCK_IDS = [
  "bottomBlock1",
  "bottomBlock2",
  "bottomBlock3",
  "bottomBlock4",
];
const ALL_BLOCK_IDS = [...SIDE_BLOCK_IDS, ...BOTTOM_BLOCK_IDS];

// Глобальные данные
let GLOBAL = {
  orders: [],
  fallbacks: [],
  schedule: {},
};

// трекинг состояния
let lastDisplayedHourKyiv = null;
let lastJsonReloadDateKyiv = null; // 'YYYY-MM-DD' когда последний раз обновляли JSON в окне 00:00-00:30
let kyivHourCheckerInterval = null;
let kyivJsonReloadCheckerInterval = null;

// --- Утилиты ---
// получаем сейчас по Kyiv как объект {dateKey: 'DD.MM.YYYY', year, month, day, hour, minute, isoDate:'YYYY-MM-DD'}
function getKyivNowParts() {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const day = map.day;
  const month = map.month;
  const year = map.year;
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  return {
    dateKey: `${day}.${month}.${year}`,
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour,
    minute,
    isoDate: `${year}-${month}-${day}`,
  };
}

// парсим id из строки расписания "10000012 Описание..."
function extractIdFromScheduleString(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^\s*(\d+)\b/);
  return m ? m[1] : null;
}

// безопасный доступ к полю (если ключи всегда стабильны, это просто удобство)
function field(obj, key) {
  if (!obj) return undefined;
  return obj[key];
}

// 3. ОБЩАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ (чтоб не дублировать код)
function forceAdUpdate() {
  const u = getUserFiltersFromPage();
  buildAndRenderAll({ region: u.region, city: u.city });
  lastDisplayedHourKyiv = getKyivNowParts().hour; // Запоминаем новый час
}

// 2. ФУНКЦИЯ ДЛЯ ПРОВЕРОЧНОГО ИНТЕРВАЛА (КАЖДЫЕ 20 СЕКУНД)
function checkHourInterval() {
  const now = getKyivNowParts();
  // Если час сменился с момента последнего обновления...
  if (lastDisplayedHourKyiv !== null && now.hour !== lastDisplayedHourKyiv) {
    // ...немедленно обновляем!
    forceAdUpdate();
  }
}

// 1. ФУНКЦИЯ ДЛЯ ТОЧНОГО ОБНОВЛЕНИЯ ПО БУДИЛЬНИКУ
function scheduleNextHourUpdate() {
  const nowKyiv = getKyivNowParts();

  // Вычисляем, сколько миллисекунд осталось до следующего часа
  const minutesPassed = nowKyiv.minute;
  const secondsPassed = 0; // Если в getKyivNowParts нет секунд, считаем 0

  // Миллисекунды до следующего часа:
  // (оставшиеся минуты * 60 * 1000) + (оставшиеся секунды * 1000) + 1000мс (гарантия перехода часа)
  const msUntilNextHourFinal =
    (59 - minutesPassed) * 60 * 1000 + (60 - secondsPassed) * 1000 + 1000;

  // Ставим будильник
  setTimeout(() => {
    // Вызываем функцию обновления
    forceAdUpdate();
    // Планируем следующий будильник
    scheduleNextHourUpdate();
  }, msUntilNextHourFinal);
}

// --- Фильтрация по ГЕО (упрощенная и четкая версия) ---
function matchesGeoByFilters(order, userGeo) {
  // пользовательский фильтр всегда должен быть заполнен
  if (!userGeo || !userGeo.region || !userGeo.city) return false;

  // Получаем значение таргета. В вашей таблице поле называется "Гео таргет"
  const target = (field(order, "Гео таргет") || "")
    .toString()
    .trim()
    .toLowerCase();

  if (target === "страна") {
    // показ для всех регионов/городов
    return true;
  }

  // Для таргета "Город" - проверяем строку городов из поля "ГЕО Города"
  if (target.includes("город")) {
    // Получаем строку с городами через запятую: "Одесса, Черноморск, Южный, Киев"
    const citiesString = (field(order, "ГЕО Города") || "").toString();

    // Разбиваем строку на массив городов, убираем пробелы
    const cityList = citiesString
      .split(",")
      .map((city) => city.trim())
      .filter((city) => city); // Убираем пустые строки

    // Проверяем, есть ли город пользователя в этом списке
    return cityList.some(
      (city) =>
        city &&
        userGeo.city &&
        city.toLowerCase() === userGeo.city.trim().toLowerCase()
    );
  }

  // Для таргета "Область" - сравниваем область
  if (target.includes("область") || target.includes("обл")) {
    const orderRegion = (field(order, "ГЕО Область") || "").toString().trim();
    return orderRegion.toLowerCase() === userGeo.region.trim().toLowerCase();
  }

  // на всякий случай: если таргет непонятный — не показываем
  return false;
}

// --- Извлечение id(ов) из расписания для текущего часа (используем Kyiv время) ---
function getScheduledIdsForNow(schedule) {
  if (!schedule) return [];

  const now = getKyivNowParts();
  const dayKey = now.dateKey; // 'DD.MM.YYYY'
  const hour = now.hour; // 0..23

  const daySchedule = schedule[dayKey];
  if (!daySchedule) return [];

  // daySchedule — объект с ключами как "00-01", "02-03" и т.д.
  // находим ключ, диапазон которого содержит текущий час
  let found = null;
  for (const rangeKey of Object.keys(daySchedule)) {
    const m = rangeKey.match(/(\d{1,2})-(\d{1,2})/);
    if (!m) continue;
    let start = Number(m[1]);
    let end = Number(m[2]);
    // корректируем на цикличность (например 23-00)
    let adjHour = hour;
    let adjEnd = end;
    if (end <= start) adjEnd = end + 24;
    if (adjHour < start) adjHour += 24;
    if (adjHour >= start && adjHour < adjEnd) {
      found = daySchedule[rangeKey];
      break;
    }
  }

  if (!found) return [];

  // found — массив строк типа "10000012 Описание..."
  const ids = [];
  if (Array.isArray(found)) {
    for (const v of found) {
      const id = extractIdFromScheduleString(v);
      if (id) ids.push(id);
    }
  }
  return ids;
}

// --- Рендер блока (отдельная карточка) ---
function renderBlockById(blockId, item) {
  const el = document.getElementById(blockId);
  if (!el) return;
  if (!item) {
    el.innerHTML = '<div class="info-card empty">Блок постов</div>';
    el.onclick = null;
    el.style.cursor = "default";
    return;
  }
  const title = field(item, "Название") || field(item, "title") || "";
  const desc = field(item, "Описание") || field(item, "description") || "";
  const imgRaw =
    field(item, "Ссылки на картинки") ||
    field(item, "Ссылка на картинку") ||
    field(item, "image") ||
    "";
  const imgUrl = imgRaw ? convertDriveLink(imgRaw) : "";
  const externalLink =
    field(item, "Ссылка на сайт") ||
    field(item, "link") ||
    field(item, "url") ||
    "";
  const id =
    field(item, "ID заказа") ||
    field(item, "ID") ||
    field(item, "orderId") ||
    "";

  const imgHtml = imgUrl
    ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(
        title
      )}" onerror="this.style.display='none'">`
    : "";

  el.innerHTML = `
    <div class="info-card">
      ${imgHtml}
      <div class="info-text">
        <div class="info-title">${escapeHtml(title)}</div>
        <div class="info-desc">${escapeHtml(desc)}</div>
      </div>
    </div>
  `;
  if (externalLink) {
    el.onclick = () => window.open(externalLink, "_blank");
    el.style.cursor = "pointer";
  } else if (id) {
    el.onclick = () =>
      window.open(`reclama.html?id=${encodeURIComponent(id)}`, "_blank");
    el.style.cursor = "pointer";
  } else {
    el.onclick = null;
    el.style.cursor = "default";
  }
}

// экранирование для безопасности вывода
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Построение итоговой выборки и отрисовка ---
// userGeo: {region, city}; если пуст — считаем пользователь не указал GEO и показываем только заглушки
function buildAndRenderAll(userGeo) {
  // берем id(ы) из расписания для текущего часа по Kyiv
  const scheduledIds = getScheduledIdsForNow(GLOBAL.schedule); // массив строк id
  // если расписания нет или пусто — покажем заглушки
  if (!scheduledIds || scheduledIds.length === 0) {
    // просто заполнить все 6 блоков заглушками (уникальными если возможно)
    fillAllWithFallbacks();
    return;
  }

  // Найдём все заказы с ID из scheduledIds
  const scheduledSet = new Set(scheduledIds.map(String));
  const matchedOrders = GLOBAL.orders.filter((o) => {
    const oid = String(field(o, "ID заказа") || field(o, "ID") || "");
    return oid && scheduledSet.has(oid);
  });

  // Разделим на боковые и нижние, затем отфильтруем по GEO (строго)
  const sideOrders = matchedOrders
    .filter((o) => {
      const t = (field(o, "Тип блока") || "").toString().toLowerCase();
      return t.includes("бок"); // "боковой"
    })
    .filter((o) => matchesGeoByFilters(o, userGeo));

  const bottomOrders = matchedOrders
    .filter((o) => {
      const t = (field(o, "Тип блока") || "").toString().toLowerCase();
      return t.includes("ниж"); // "нижний"
    })
    .filter((o) => matchesGeoByFilters(o, userGeo));

  // формируем итоговые массивы
  const sidesToShow = []; // length 2
  const bottomsToShow = []; // length 4

  // Сторонам: если 0 — 2 заглушки; если 1 — 1 заказ + 1 заглушка; если 2 — оба заказа.
  if (sideOrders.length === 0) {
    // будут заполнены заглушками ниже
  } else if (sideOrders.length === 1) {
    sidesToShow.push(sideOrders[0]);
  } else {
    // 2 или >2, но по таблице гарантировано <=2
    sidesToShow.push(...sideOrders.slice(0, 2));
  }

  // Низ: просто берём все подходящие (по таблице их <=4)
  if (bottomOrders.length > 0) bottomsToShow.push(...bottomOrders.slice(0, 4));

  // теперь подготовим пул заглушек (уникальные, не повторяем одновременно)
  const fallbackPool = Array.isArray(GLOBAL.fallbacks)
    ? GLOBAL.fallbacks.slice()
    : [];
  shuffleArray(fallbackPool);
  const usedFallbackIds = new Set();

  function takeFallback() {
    while (fallbackPool.length) {
      const cand = fallbackPool.shift();
      const fid = String(field(cand, "ID заказа") || field(cand, "ID") || "");
      if (!fid || !usedFallbackIds.has(fid)) {
        if (fid) usedFallbackIds.add(fid);
        return cand;
      }
    }
    return null;
  }

  // Заполняем боковые слоты (нужно 2)
  while (sidesToShow.length < 2) {
    const fb = takeFallback();
    sidesToShow.push(fb || null);
  }

  // Заполняем нижние слоты (нужно 4)
  while (bottomsToShow.length < 4) {
    const fb = takeFallback();
    bottomsToShow.push(fb || null);
    if (fb === null) break; // если закончились заглушки — выйдем, оставшиеся — null
  }

  // Если всё ещё какие-то слоты null — оставляем пустыми
  for (let i = 0; i < SIDE_BLOCK_IDS.length; i++) {
    renderBlockById(SIDE_BLOCK_IDS[i], sidesToShow[i] || null);
  }
  for (let i = 0; i < BOTTOM_BLOCK_IDS.length; i++) {
    renderBlockById(BOTTOM_BLOCK_IDS[i], bottomsToShow[i] || null);
  }
}

// заполняем все блоки заглушками (когда пользователь не указал GEO или расписание пустой)
function fillAllWithFallbacks() {
  const pool = Array.isArray(GLOBAL.fallbacks) ? GLOBAL.fallbacks.slice() : [];
  shuffleArray(pool);
  // берем по очереди 6 уникальных заглушек
  const chosen = [];
  const used = new Set();
  while (chosen.length < ALL_BLOCK_IDS.length && pool.length) {
    const cand = pool.shift();
    const fid = String(field(cand, "ID заказа") || field(cand, "ID") || "");
    if (!fid || !used.has(fid)) {
      if (fid) used.add(fid);
      chosen.push(cand);
    }
  }
  // заполняем оставшиеся null
  while (chosen.length < ALL_BLOCK_IDS.length) chosen.push(null);
  for (let i = 0; i < ALL_BLOCK_IDS.length; i++) {
    renderBlockById(ALL_BLOCK_IDS[i], chosen[i]);
  }
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// --- Получение значений фильтрации пользователя (Область и Город) ---
// Попытка найти элементы в DOM — проверяем несколько распространённых селекторов.
// Если элементы найдены — возвращаем {region, city} (строки — возможно пустые).
function findFilterElements() {
  const regionSelectors = ["#filterRegion"];
  const citySelectors = ["#filterCity"];

  let regionEl = null,
    cityEl = null;
  for (const s of regionSelectors) {
    const e = document.querySelector(s);
    if (e) {
      regionEl = e;
      break;
    }
  }
  for (const s of citySelectors) {
    const e = document.querySelector(s);
    if (e) {
      cityEl = e;
      break;
    }
  }
  return { regionEl, cityEl };
}

function getUserFiltersFromPage() {
  const { regionEl, cityEl } = findFilterElements();
  const region = regionEl
    ? (regionEl.value || regionEl.textContent || "").toString().trim()
    : "";
  const city = cityEl
    ? (cityEl.value || cityEl.textContent || "").toString().trim()
    : "";
  return { region, city, _els: { regionEl, cityEl } };
}

// --- Загрузка JSON ---
async function loadJsonFromGitHub(force = false) {
  try {
    const resp = await fetch(GITHUB_JSON_URL + "?_=" + Date.now(), {
      cache: "no-store",
    });
    if (!resp.ok) throw new Error("Fetch error " + resp.status);
    const payload = await resp.json();

    GLOBAL.orders = payload.orders || payload.Заказы || payload.ads || [];
    GLOBAL.fallbacks =
      payload.fallback || payload.fallbacks || payload.Заглушки || [];
    GLOBAL.schedule =
      payload.schedule || payload.расписание || payload.calendar || {};

    const uf = getUserFiltersFromPage();
    buildAndRenderAll({ region: uf.region, city: uf.city });

    return true;
  } catch (e) {
    console.error("Ошибка загрузки JSON с GitHub:", e);
    return false;
  }
}

// --- Инициализация и интервалы ---
// Инициализируем: загружаем JSON, ставим слушатели на поля фильтрации, запускаем чекеры
async function initReclama() {
  // начальная загрузка JSON
  await loadJsonFromGitHub();

  // подписываемся на изменения фильтрации пользователя (если элементы найдены)
  const { regionEl, cityEl } = findFilterElements();
  if (regionEl) {
    regionEl.addEventListener("change", onFiltersChanged);
    regionEl.addEventListener("input", onFiltersChanged); // <-- мгновенно
  }
  if (cityEl) {
    cityEl.addEventListener("change", onFiltersChanged);
    cityEl.addEventListener("input", onFiltersChanged); // <-- мгновенно
  }

  // Запускаем точный будильник
  scheduleNextHourUpdate();

  // Запускаем страховочный интервал (каждые 20 секунд)
  setInterval(checkHourInterval, 20000);

  // Делаем первоначальную установку часа
  lastDisplayedHourKyiv = getKyivNowParts().hour;

  // интервал для ежедневного обновления JSON в окне 00:00-00:30 Kyiv
  if (kyivJsonReloadCheckerInterval)
    clearInterval(kyivJsonReloadCheckerInterval);
  kyivJsonReloadCheckerInterval = setInterval(async () => {
    const now = getKyivNowParts();
    // ключ для дня, чтобы не перезагружать несколько раз в ту же ночь
    const ym = `${now.year}-${String(now.month).padStart(2, "0")}-${String(
      now.day
    ).padStart(2, "0")}`; // YYYY-MM-DD
    if (now.hour === 0 && now.minute >= 0 && now.minute <= 30) {
      if (lastJsonReloadDateKyiv !== ym) {
        const ok = await loadJsonFromGitHub(true);
        if (ok) lastJsonReloadDateKyiv = ym;
      }
    } else {
      // если вышли из окна — дадим возможность следующей ночи
    }
  }, 60 * 1000); // каждую минуту проверяем окно
  setupMobileAdLayout();
}

// при изменении фильтров — пересобрать выборку немедленно
function onFiltersChanged() {
  const u = getUserFiltersFromPage();
  buildAndRenderAll({ region: u.region, city: u.city });
}

// --- convertDriveLink (сохранена, простая и надёжная) ---
function convertDriveLink(url) {
  if (!url) return "";
  const s = String(url).trim();
  try {
    // уже прямая картинка?
    if (
      /^https?:\/\//i.test(s) &&
      /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(s)
    )
      return s;
    // layout: https://drive.google.com/uc?id=FILE_ID or /file/d/FILE_ID/view
    let m = s.match(/uc\?id=([-\w]{20,})/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
    m = s.match(/\/d\/([-\w]{20,})/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
    m = s.match(/id=([-\w]{20,})/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
    // иначе возвращаем как есть
    return s;
  } catch (e) {
    return s;
  }
}

// --- Мобильная адаптация рекламы ---
function setupMobileAdLayout() {
  if (!document.documentElement.classList.contains("mobile-device")) return;

  const header = document.querySelector(".header");
  if (!header) return;

  // Создаем контейнеры для рекламы
  const adContainer = document.createElement("div");
  adContainer.className = "mobile-ad-container";
  adContainer.style.gridColumn = "1 / 3";
  adContainer.style.gridRow = "9";
  adContainer.style.display = "grid";
  adContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
  adContainer.style.gap = "8px";
  adContainer.style.width = "100%";
  adContainer.style.marginTop = "2vh";

  const adContainer2 = document.createElement("div");
  adContainer2.className = "mobile-ad-container-second";
  adContainer2.style.gridColumn = "1 / 3";
  adContainer2.style.gridRow = "10";
  adContainer2.style.display = "grid";
  adContainer2.style.gridTemplateColumns = "repeat(3, 1fr)";
  adContainer2.style.gap = "8px";
  adContainer2.style.width = "100%";
  adContainer2.style.marginTop = "1vh";

  // Перемещаем блоки в контейнеры
  const moveBlock = (id, container) => {
    const block = document.getElementById(id);
    if (block) {
      block.style.width = "100%";
      block.style.aspectRatio = "1 / 1";
      block.style.margin = "0";
      container.appendChild(block);
    }
  };

  moveBlock("sideBlockLeft", adContainer);
  moveBlock("bottomBlock1", adContainer);
  moveBlock("sideBlockRight", adContainer);

  moveBlock("bottomBlock2", adContainer2);
  moveBlock("bottomBlock3", adContainer2);
  moveBlock("bottomBlock4", adContainer2);

  header.appendChild(adContainer);
  header.appendChild(adContainer2);
}

// --- старт при готовности DOM ---
document.addEventListener("DOMContentLoaded", () => {
  initReclama().catch((e) => console.error(e));
});
