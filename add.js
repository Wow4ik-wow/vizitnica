// === КОНФИГУРАЦИЯ ===
const spreadsheetId = "1vKErM8FIGNM5if0zpsaCWutsQgscqrPo2bUWJACTcf0";
const sheetsURL = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&tq=`;
const formUrl =
  "https://script.google.com/macros/s/AKfycbw6FAWTC1ux2M3H6H8tuoZvmVEpYEfWcpihd0C0Huh-U_ErgajS6WfKOIugafn1yFTzVg/exec";

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let currentUser = null;

// СРАЗУ загружаем пользователя из localStorage
try {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.warn("Ошибка загрузки пользователя:", e);
}
const selectedValues = {
  selectedTownsContainer: [],
  selectedKindsContainer: [],
};

// === БАЗА ТЕЛЕФОНОВ ДЛЯ ПРОВЕРКИ ДУБЛЕЙ ===
let phoneDatabase = null;
let lastDataUpdate = null;
const DATA_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

// === ОСПОРЕННЫЕ ТЕЛЕФОНЫ ===
let disputedPhones = [];

// === ФЛАГ УСПЕШНОЙ ОТПРАВКИ ===
let formSubmittedSuccessfully = false;

// ОТЛАДКА - ДОБАВЬ ЭТОТ КОД ПОСЛЕ ОБЪЯВЛЕНИЯ currentUser
console.log("=== ДЕБАГ ФОРМЫ ===");
// ИНИЦИАЛИЗАЦИЯ МУРАВЬЁВ
function initAnts() {
  // Проверяем, не мобильное ли устройство (на мобильных не показываем)
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  if (isMobile) {
    console.log("Мобильное устройство - муравьи скрыты");
    return;
  }

  console.log("Запуск инициализации муравьёв...");

  // Загружаем данные муравьёв
  fetch(
    "https://raw.githubusercontent.com/Wow4ik-wow/vizitnica/master/reclama.json"
  )
    .then((response) => {
      if (!response.ok) throw new Error("Ошибка сети");
      return response.json();
    })
    .then((data) => {
      console.log(
        "Данные муравьёв загружены:",
        data.ants ? data.ants.length : 0
      );

      if (data.ants && data.ants.length >= 2) {
        const leftAnt = document.querySelector(".decoration.left");
        const rightAnt = document.querySelector(".decoration.right");

        if (!leftAnt || !rightAnt) {
          console.error("Элементы муравьёв не найдены в DOM");
          return;
        }

        // Выбираем двух случайных муравьев
        const randomAnts = [...data.ants]
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);

        // Функция для преобразования ссылки Google Drive
        const extractDirectImageLink = (link) => {
          if (!link) return "";
          const fileMatch = link.match(/\/file\/d\/([^\/]+)/);
          if (fileMatch) {
            return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
          }
          const ucMatch = link.match(/uc\?id=([^&]+)/);
          if (ucMatch) {
            return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1000`;
          }
          return link;
        };

        if (randomAnts[0] && randomAnts[0]["Костюм мураша"]) {
          const imgUrl = extractDirectImageLink(randomAnts[0]["Костюм мураша"]);
          console.log("Левый муравей:", imgUrl);
          leftAnt.style.backgroundImage = `url('${imgUrl}')`;
        }

        if (randomAnts[1] && randomAnts[1]["Костюм мураша"]) {
          const imgUrl = extractDirectImageLink(randomAnts[1]["Костюм мураша"]);
          console.log("Правый муравей:", imgUrl);
          rightAnt.style.backgroundImage = `url('${imgUrl}')`;
        }

        // Запускаем анимацию после загрузки изображений
        setTimeout(() => {
          console.log("Запуск анимации муравьёв");
          initAntsAnimation();
        }, 500);
      } else {
        console.warn("Не найдены данные о муравьях в JSON");
      }
    })
    .catch((error) => {
      console.error("Ошибка загрузки изображений муравьёв:", error);
    });
}

// Функция анимации муравьёв
function initAntsAnimation() {
  const leftAnt = document.querySelector(".decoration.left");
  const rightAnt = document.querySelector(".decoration.right");

  if (!leftAnt || !rightAnt) {
    console.error("Элементы муравьёв не найдены для анимации");
    return;
  }

  console.log("Запуск анимации муравьёв");

  // Размеры зон для движения
  const getMovementZone = (isLeft) => {
    const cardRect = document
      .querySelector(".form-container")
      .getBoundingClientRect();
    const screenWidth = window.innerWidth;

    if (isLeft) {
      return {
        minX: 20,
        maxX: cardRect.left - 150,
        minY: 20,
        maxY: window.innerHeight - 170,
      };
    } else {
      return {
        minX: cardRect.right + 20,
        maxX: screenWidth - 170,
        minY: 20,
        maxY: window.innerHeight - 170,
      };
    }
  };

  // Генерация случайной точки в зоне
  const getRandomPoint = (zone) => ({
    x: Math.random() * (zone.maxX - zone.minX) + zone.minX,
    y: Math.random() * (zone.maxY - zone.minY) + zone.minY,
  });

  // Плавное движение к точке
  const moveAnt = (ant, targetX, targetY, duration = 4000) => {
    const startX = parseInt(ant.style.left || ant.offsetLeft);
    const startY = parseInt(ant.style.top || ant.offsetTop);
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startX + (targetX - startX) * ease;
      const currentY = startY + (targetY - startY) * ease;

      ant.style.left = currentX + "px";
      ant.style.top = currentY + "px";

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const zone = ant.classList.contains("left")
          ? getMovementZone(true)
          : getMovementZone(false);
        const newTarget = getRandomPoint(zone);
        moveAnt(ant, newTarget.x, newTarget.y, 3000 + Math.random() * 3000);
      }
    }

    requestAnimationFrame(animate);
  };

  // Устанавливаем начальные позиции из CSS (они уже в центре)
  // Просто убеждаемся, что position fixed установлена
  leftAnt.style.position = "fixed";
  rightAnt.style.position = "fixed";

  // Ждём немного, чтобы пользователь увидел муравьёв в центре
  setTimeout(() => {
    // Определяем целевые зоны
    const leftZone = getMovementZone(true);
    const rightZone = getMovementZone(false);

    // Плавно перемещаем муравьёв в их зоны
    moveAnt(leftAnt, leftZone.minX + 100, leftZone.minY + 100, 2000);
    moveAnt(rightAnt, rightZone.minX + 100, rightZone.minY + 100, 2000);
  }, 500);

  // Перерасчет при изменении размера окна
  window.addEventListener("resize", () => {
    const leftZone = getMovementZone(true);
    const rightZone = getMovementZone(false);

    moveAnt(leftAnt, leftAnt.offsetLeft, leftAnt.offsetTop, 1000);
    moveAnt(rightAnt, rightAnt.offsetLeft, rightAnt.offsetTop, 1000);
  });
}

// Запускаем инициализацию муравьёв после загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM загружен, инициализируем муравьёв...");
  initAnts();
});
console.log("currentUser:", currentUser);
console.log("localStorage user:", localStorage.getItem("user"));

if (currentUser) {
  console.log("currentUser.id:", currentUser.id);
  console.log("currentUser.name:", currentUser.name);
  console.log("currentUser.role:", currentUser.role);
} else {
  console.log("currentUser is NULL!");
}

// === ОСНОВНЫЕ ФУНКЦИИ ===

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await loadPhoneDatabase(); // Загружаем базу телефонов для проверки дублей
  setupAllEventListeners();
  loadInitialData();
});

// Проверка авторизации
async function checkAuth() {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);

      // ДОБАВЛЯЕМ: Получаем ID пользователя с сервера
      if (currentUser && currentUser.email && !currentUser.id) {
        const userId = await getUserIdFromServer(currentUser.email);
        if (userId) {
          currentUser.id = userId;
          currentUser.uid = userId;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      }
    } catch (e) {
      localStorage.removeItem("user");
    }
  }

  // Разрешаем доступ для admin, user и curator
  const allowedRoles = ["admin", "user", "curator"];

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    showMessage("Доступ запрещён. Требуется авторизация.", "error");
    setTimeout(() => (window.location.href = "index.html"), 3000);
    return;
  }

  if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
  }
}

// ДОБАВИТЬ ЭТУ ФУНКЦИЮ В add.js
async function getUserIdFromServer(email) {
  try {
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec?getUserByEmail=${encodeURIComponent(
        email
      )}`
    );
    const data = await response.json();
    return data.success ? data.uid : null;
  } catch (e) {
    console.error("Ошибка при получении ID пользователя:", e);
    return null;
  }
}

// Настройка всех обработчиков событий
function setupAllEventListeners() {
  // Навигация
  document.getElementById("backToMain").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Область - взаимоисключение
  const regionSelect = document.getElementById("regionSelect");
  const regionCustom = document.getElementById("regionCustom");
  regionCustom.addEventListener("input", () => {
    regionSelect.value = "";
    clearTownSelection();
  });
  regionSelect.addEventListener("change", () => {
    regionCustom.value = "";
    loadTownsByRegion(regionSelect.value);
  });

  // Ограничения длины полей с уведомлениями
  setupFieldLengthLimit("regionCustom", 50, "Область-великан!");
  setupFieldLengthLimit("townCustom", 50, "Город-гигант!");
  setupFieldLengthLimit("cityDistrict", 50, "Район-исполин!");
  setupFieldLengthLimit(
    "kindCustom",
    75,
    "Слишком много деятелей в деятельности!"
  );
  setupFieldLengthLimit("nameInput", 50, "Ничего себе у вас имя длинное!");
  setupFieldLengthLimit(
    "companyInput",
    75,
    "Ваша компания слишком разрослась!"
  );
  setupFieldLengthLimit("addressInput", 100, "Это вам не роман писать!");

  // Города и виды деятельности
  document
    .getElementById("townSelect")
    .addEventListener("change", handleTownSelect);
  document
    .getElementById("kindSelect")
    .addEventListener("change", handleKindSelect);
  setupMultiInput("townCustom", "selectedTownsContainer", 10);
  setupMultiInput("kindCustom", "selectedKindsContainer", 10);

  // Профиль деятельности
  document
    .getElementById("profileSelect")
    .addEventListener("change", async function () {
      await loadKindsByProfile(this.value);
    });

  // Счётчики символов
  document
    .getElementById("descShort")
    .addEventListener("input", updateCharCounters);
  document.getElementById("descLong").addEventListener("input", function () {
    updateLongCharCounter();
    // Также вызываем авто-изменение высоты
    const descLong = document.getElementById("descLong");
    const lines = descLong.value.split("\n").length;
    descLong.rows = Math.max(5, Math.min(lines, 15));
  });

  // Инициализация высоты полного описания при загрузке
  setTimeout(() => {
    const descLong = document.getElementById("descLong");
    if (descLong) {
      const lines = descLong.value.split("\n").length;
      descLong.rows = Math.max(5, Math.min(lines, 15));
    }
  }, 200);

  // Телефоны
  setupPhoneHandlers();

  // Ссылки
  setupLinksHandlers();

  // Геолокация
  document.getElementById("geoLocation").addEventListener("input", function () {
    validateGeoLocation(this);
  });

  // Форма
  document
    .getElementById("serviceForm")
    .addEventListener("submit", handleSubmit);
  document.getElementById("resetBtn").addEventListener("click", handleReset);

  // Отслеживание прогресса
  document
    .querySelectorAll(
      "#serviceForm input, #serviceForm select, #serviceForm textarea"
    )
    .forEach((element) => {
      element.addEventListener("input", updateProgress);
      element.addEventListener("change", updateProgress);
    });
}

// Загрузка начальных данных
function loadInitialData() {
  loadRegionList();
  loadProfileList();
  updateProgress();
  updateCharCounters();
}

// === РАБОТА С GOOGLE SHEETS ===

// Загрузка данных из таблицы
async function fetchSheetData(sheet) {
  try {
    const query = `SELECT *`;
    const url = `${sheetsURL}${query}&sheet=${sheet}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    return json.table.rows.map((row) =>
      row.c.map((cell) => (cell ? cell.v : ""))
    );
  } catch (error) {
    console.error(`Ошибка загрузки данных из ${sheet}:`, error);
    showMessage(
      "Ошибка загрузки данных. Проверьте подключение к интернету.",
      "error"
    );
    return [];
  }
}

// Загрузка списка областей
async function loadRegionList() {
  try {
    const rows = await fetchSheetData("Населённые пункты");
    const dataRows = rows.slice(1); // пропускаем заголовки
    const all = dataRows
      .map((r) => (r[1] || "").split(","))
      .flat()
      .map(cleanText)
      .filter(Boolean);
    const list = countAndSort(all);
    const select = document.getElementById("regionSelect");

    list.forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  } catch (error) {
    showMessage("Ошибка загрузки списка областей", "error");
  }
}

// Загрузка городов по области
async function loadTownsByRegion(region) {
  if (!region) {
    document.getElementById("townSelect").disabled = true;
    return;
  }

  try {
    const rows = await fetchSheetData("Населённые пункты");
    const towns = rows
      .filter((row) => {
        const areas = (row[1] || "").split(",").map((s) => cleanText(s));
        return areas.includes(region);
      })
      .map((r) => (r[0] || "").split(","))
      .flat()
      .map(cleanText)
      .filter(Boolean);

    const uniqueTowns = [...new Set(towns)].sort();
    const select = document.getElementById("townSelect");
    select.innerHTML = '<option value="">-- Выберите город --</option>';

    uniqueTowns.forEach((town) => {
      const opt = document.createElement("option");
      opt.value = town;
      opt.textContent = town;
      select.appendChild(opt);
    });

    select.disabled = false;
  } catch (error) {
    showMessage("Ошибка загрузки списка городов", "error");
  }
}

// Загрузка профилей деятельности
async function loadProfileList() {
  try {
    const rows = await fetchSheetData("Разделы");
    const select = document.getElementById("profileSelect");

    rows.slice(7).forEach((r) => {
      const val = cleanText(r[2]);
      if (val) {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      }
    });
  } catch (error) {
    showMessage("Ошибка загрузки списка профилей", "error");
  }
}

// Загрузка видов деятельности по профилю
async function loadKindsByProfile(profile) {
  if (!profile) {
    document.getElementById("kindSelect").disabled = true;
    return;
  }

  try {
    const rows = await fetchSheetData("Категории");
    const kinds = rows
      .filter((r) => cleanText(r[0]) === profile)
      .map((r) => cleanText(r[1]))
      .filter(Boolean);

    const uniqueKinds = [...new Set(kinds)];
    const select = document.getElementById("kindSelect");
    select.innerHTML = '<option value="">-- Выберите вид --</option>';

    uniqueKinds.forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });

    select.disabled = false;
  } catch (error) {
    showMessage("Ошибка загрузки видов деятельности", "error");
  }
}

// === ФУНКЦИИ ДЛЯ ПРОВЕРКИ ТЕЛЕФОНОВ ===

// Загрузка базы телефонов из data.json
async function loadPhoneDatabase() {
  try {
    console.log("Загружаем базу телефонов...");
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);

    const allCards = await response.json();
    phoneDatabase = buildPhoneMap(allCards);
    lastDataUpdate = Date.now();
    console.log("База телефонов загружена успешно");
  } catch (error) {
    console.warn("Не удалось загрузить базу телефонов:", error);
    phoneDatabase = null;
  }
}

// Построение карты телефонов для быстрой проверки
function buildPhoneMap(cards) {
  const phoneMap = {};

  cards.forEach((card) => {
    const profile = card["Профиль деятельности"];
    const author = card["Автор"] || "Неизвестно";
    const phones = (card["Телефоны"] || "")
      .split(",")
      .map((phone) => phone.trim())
      .filter((phone) => phone);

    phones.forEach((phone) => {
      // Нормализуем номер телефона
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        if (!phoneMap[normalizedPhone]) {
          phoneMap[normalizedPhone] = [];
        }
        phoneMap[normalizedPhone].push({
          profile,
          author,
          cardInfo: card,
        });
      }
    });
  });

  return phoneMap;
}

// Проверка телефона на конфликты
function checkPhoneConflict(phone, currentProfile) {
  if (!phoneDatabase || !currentProfile) return null;

  const normalizedPhone = phone.replace(/\D/g, "");
  const conflicts = phoneDatabase[normalizedPhone];

  if (!conflicts) return null;

  // Ищем конфликты в том же профиле
  const profileConflicts = conflicts.filter(
    (conflict) => conflict.profile === currentProfile
  );

  if (profileConflicts.length === 0) return null;

  return {
    phone: normalizedPhone,
    conflicts: profileConflicts,
  };
}

// Показ уведомления о конфликте с чужим номером
function showPhoneConflictNotification(conflictData) {
  console.log("showPhoneConflictNotification ВЫЗВАНА");
  return new Promise((resolve) => {
    console.log("Promise создан");
    const conflict = conflictData.conflicts[0];
    const card = conflict.cardInfo;

    const companyName = card["Компания"] || card["Имя"] || "Не указано";
    const description = card["Описание (до 1000 симв)"] || "Нет описания";
    const shortDescription =
      description.length > 30
        ? description.substring(0, 30) + "..."
        : description;

    const modal = createModal(
      "⚠️ Конфликт номера",
      `
    <div class="conflict-card">
        <strong>${companyName}</strong><br>
        📍 ${card["Область"] || "Не указана"}, ${
        card["Населённый пункт"] || "Не указан"
      }${card["Адрес"] ? ", " + card["Адрес"] : ""}<br>
        📞 ${card["Телефоны"] || "Не указаны"}<br>
        📝 ${card["Описание (до 1000 симв)"] || "Нет описания"}<br>
        <small>ID: ${card["ID"] || "Не указан"}</small>
    </div>
    <p>Этот номер уже используется другим пользователем. Хотите оспорить эту визитку?</p>
`,
      [
        { text: "Оспорить", type: "primary", action: "dispute" },
        { text: "Отмена", type: "secondary", action: "cancel" },
      ],
      (action) => {
        if (action === "dispute") {
          disputedPhones.push({
            phone: conflictData.phone,
            cardId: card["ID"] || "без_ID",
          });
        }
        resolve(action);
      }
    );
  });
}

// Универсальная функция создания модального окна
function createModal(title, content, buttons, callback) {
  console.log("createModal ВЫЗВАНА");
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-container";

  modal.innerHTML = `
        <div class="modal-header">
            <div class="modal-icon">⚠️</div>
            <div class="modal-title">${title}</div>
        </div>
        <div class="modal-content">${content}</div>
        <div class="modal-buttons">
            ${buttons
              .map(
                (btn) =>
                  `<button class="modal-btn ${btn.type}" data-action="${btn.action}">${btn.text}</button>`
              )
              .join("")}
        </div>
    `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Обработчики кнопок
  modal.querySelectorAll(".modal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      document.body.removeChild(overlay);
      callback(action);
    });
  });

  // Закрытие по клику на подложку
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      callback("cancel");
    }
  });
}

// Проверка телефона во всех профилях (только для админа)
function checkPhoneAllProfiles(phone) {
  if (!phoneDatabase) return null;

  const normalizedPhone = phone.replace(/\D/g, "");
  const conflicts = phoneDatabase[normalizedPhone];

  if (!conflicts) return null;

  return {
    phone: normalizedPhone,
    conflicts: conflicts,
  };
}

// Показ уведомления для админа о всех дублях
function showAdminPhoneConflictNotification(conflictData) {
  return new Promise((resolve) => {
    let conflictsHTML = "";

    conflictData.conflicts.forEach((conflict, index) => {
      const card = conflict.cardInfo;
      console.log("Все поля карточки:", Object.keys(card));

      // ДЕТАЛЬНАЯ ОТЛАДКА ОПИСАНИЯ
      console.log(
        "card['Описание (до 1000 симв)']:",
        card["Описание (до 1000 симв)"]
      );
      console.log("Тип значения:", typeof card["Описание (до 1000 симв)"]);
      console.log(
        "Длина значения:",
        card["Описание (до 1000 симв)"]
          ? card["Описание (до 1000 симв)"].length
          : 0
      );

      const companyName = card["Компания"] || card["Имя"] || "Не указано";
      const description = card["Описание (до 1000 симв)"] || "Нет описания";
      console.log("Итоговое описание:", description);
      const phones = card["Телефоны"] || "Не указаны";
      const address = card["Адрес"] || "Не указан";
      const area = card["Область"] || "Не указана";
      const city = card["Населённый пункт"] || "Не указан";

      conflictsHTML += `
        <div class="conflict-card">
            <strong>${index + 1}. ${companyName}</strong><br>
            📍 ${area}, ${city}${address ? ", " + address : ""}<br>
            📞 ${phones}<br>
            📝 ${description}<br>
            🏷️ Профиль: ${conflict.profile}<br>
            <small>ID: ${card["ID"] || "Не указан"}</small>
        </div>
    `;
    });

    const modal = createModal(
      "⚠️ Дубли номера (Админ)",
      `
                <p>Этот номер уже используется в других визитках:</p>
                ${conflictsHTML}
                <p>Всё равно добавить этот номер?</p>
            `,
      [
        { text: "Добавить", type: "success", action: "continue" },
        { text: "Отмена", type: "secondary", action: "cancel" },
      ],
      (action) => {
        if (action === "continue") {
          const ignoredCards = conflictData.conflicts
            .map((conflict) => conflict.cardInfo["ID"] || "без_ID")
            .join(", ");

          disputedPhones.push({
            phone: conflictData.phone,
            cardId: `админ_проигнорировал_дубли: ${ignoredCards}`,
          });
        }
        resolve(action);
      }
    );
  });
}

// === ОБРАБОТКА ФОРМЫ ===

// Обработчик выбора города
function handleTownSelect(e) {
  const val = e.target.value;
  if (!val) return;

  const containerId = "selectedTownsContainer";

  if (selectedValues[containerId].includes(val)) {
    selectedValues[containerId] = selectedValues[containerId].filter(
      (v) => v !== val
    );
  } else {
    if (selectedValues[containerId].length >= 10) {
      showMessage("Нельзя выбрать более 10 населённых пунктов", "warning");
      e.target.value = "";
      return;
    }
    selectedValues[containerId].push(val);
  }

  updateSelectedTownsUI();
  e.target.value = "";
  updateProgress();
}

// Обработчик выбора вида деятельности
function handleKindSelect(e) {
  const val = e.target.value;
  if (!val) return;

  const containerId = "selectedKindsContainer";

  if (selectedValues[containerId].includes(val)) {
    e.target.value = "";
    return;
  }

  if (selectedValues[containerId].length >= 10) {
    showMessage("Нельзя выбрать более 10 видов деятельности", "warning");
    e.target.value = "";
    return;
  }

  addSelectedValue(val, containerId, 10);
  e.target.value = "";
  updateProgress();
}

// Настройка множественного ввода
function setupMultiInput(inputId, containerId, limit) {
  const input = document.getElementById(inputId);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = cleanText(e.target.value);
      if (!val) return;

      if (selectedValues[containerId].includes(val)) {
        showMessage("Это значение уже добавлено", "warning");
        return;
      }

      if (selectedValues[containerId].length >= limit) {
        showMessage(`Нельзя выбрать более ${limit} значений`, "warning");
        return;
      }

      addSelectedValue(val, containerId, limit);
      e.target.value = "";
      updateProgress();
    }
  });

  input.addEventListener("blur", (e) => {
    const val = cleanText(e.target.value);
    if (
      val &&
      !selectedValues[containerId].includes(val) &&
      selectedValues[containerId].length < limit
    ) {
      addSelectedValue(val, containerId, limit);
      e.target.value = "";
      updateProgress();
    }
  });
}

// Настройка телефонов
function setupPhoneHandlers() {
  const input = document.getElementById("phoneInput");
  const btn = document.getElementById("addPhoneBtn");

  // Установим новый placeholder и подсказку
  input.placeholder = "Введите номер (380XXXXXXXXX)";

  // Фокус на поле - показываем формат
  input.addEventListener("focus", () => {
    if (!input.value) {
      input.value = "380";
      // Помещаем курсор после 380
      setTimeout(() => {
        input.setSelectionRange(3, 3);
      }, 10);
    }
  });

  // Потеря фокуса - если только "380", очищаем
  input.addEventListener("blur", () => {
    if (input.value === "380") {
      input.value = "";
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPhoneNumber();
    }
  });

  btn.addEventListener("click", addPhoneNumber);

  input.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");

    // Удаляем все нецифровые символы
    e.target.value = value;

    // Подсвечиваем правильный формат
    if (value.length === 12 && value.startsWith("380")) {
      e.target.style.borderColor = "#27ae60";
      e.target.style.boxShadow = "0 0 0 2px rgba(39, 174, 96, 0.2)";
    } else if (value.length > 0) {
      e.target.style.borderColor = "#f39c12";
      e.target.style.boxShadow = "0 0 0 2px rgba(243, 156, 18, 0.2)";
    } else {
      e.target.style.borderColor = "";
      e.target.style.boxShadow = "";
    }
  });
}

// Настройка ссылок
function setupLinksHandlers() {
  document.querySelectorAll(".link-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const type = checkbox.dataset.type;
      const container = document.getElementById("linksInputsContainer");
      const existing = container.querySelector(`[data-type="${type}"]`);

      if (checkbox.checked && !existing) {
        const inputGroup = document.createElement("div");
        inputGroup.className = "link-input-group";
        inputGroup.dataset.type = type;

        const label = document.createElement("label");
        label.textContent = getLinkTypeLabel(type) + ":";
        label.className = "link-input-label";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = getLinkPlaceholder(type);
        input.className = "form-input";
        input.dataset.type = type;

        // ДОБАВЛЯЕМ ВАЛИДАЦИЮ ПРИ ВВОДЕ
        input.addEventListener("input", function () {
          validateLink(this, type);
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "×";
        removeBtn.className = "link-remove-btn";
        removeBtn.addEventListener("click", () => {
          checkbox.checked = false;
          inputGroup.remove();
        });

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputGroup.appendChild(removeBtn);
        container.appendChild(inputGroup);
      } else if (existing) {
        existing.remove();
      }
    });
  });
}

// ВАЛИДАЦИЯ ССЫЛОК
function validateLink(input, type) {
  const value = input.value.trim();

  if (!value) {
    input.style.borderColor = "";
    input.title = "";
    return true;
  }

  // ОБЩАЯ ПРОВЕРКА: В ссылках не должно быть пробелов!
  if (/\s/.test(value)) {
    input.style.borderColor = "#e74c3c";
    input.title = "Ссылка не должна содержать пробелов";
    return false;
  }

  let isValid = true;
  let errorMessage = "";

  switch (type) {
    case "email":
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      errorMessage = isValid
        ? ""
        : "Неверный формат email. Пример: example@gmail.com";
      break;
    case "instagram":
      isValid = /^https?:\/\/(www\.)?instagram\.com\/[\w.]{1,30}/.test(value); // ТОЛЬКО ССЫЛКИ
      errorMessage = isValid
        ? ""
        : "Должна быть ссылка на Instagram (https://instagram.com/...)";
      break;
    case "telegram":
      isValid = /^https?:\/\/(t\.me|telegram\.me)\/[\w]{1,32}/.test(value); // ТОЛЬКО ССЫЛКИ
      errorMessage = isValid
        ? ""
        : "Должна быть ссылка на Telegram (https://t.me/...)";
      break;
    case "site":
      isValid = /^https?:\/\/.+/.test(value);
      errorMessage = isValid
        ? ""
        : "Ссылка должна начинаться с http:// или https://";
      break;
    case "viber":
      isValid = /^https?:\/\/(invite\.)?viber\.com\//.test(value); // ТОЛЬКО HTTPS
      errorMessage = isValid
        ? ""
        : "Должна быть ссылка на Viber (https://viber.com/...)";
      break;
    case "facebook":
      isValid = /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+/.test(value);
      errorMessage = isValid ? "" : "Должна быть ссылка на Facebook";
      break;
    case "whatsapp":
      isValid = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\/.+/.test(value);
      errorMessage = isValid
        ? ""
        : "Должна быть ссылка на WhatsApp (wa.me/...)";
      break;
    case "other":
      isValid = /^https?:\/\/.+/.test(value);
      errorMessage = isValid
        ? ""
        : "Ссылка должна начинаться с http:// или https://";
      break;
    default:
      isValid = true;
  }

  input.style.borderColor = isValid ? "#27ae60" : "#e74c3c";
  input.title = errorMessage;

  return isValid;
}

// === УТИЛИТЫ ===

// Очистка текста
function cleanText(str) {
  return String(str || "")
    .replace(/[«»„“"'`]/g, "")
    .trim();
}

// Сортировка по частоте
function countAndSort(arr) {
  const map = {};
  arr.forEach((v) => (map[v] = (map[v] || 0) + 1));
  return Object.keys(map).sort((a, b) => map[b] - map[a]);
}

// Добавление выбранного значения
function addSelectedValue(val, containerId, limit) {
  if (selectedValues[containerId].includes(val)) return;

  selectedValues[containerId].push(val);
  const container = document.getElementById(containerId);

  const span = document.createElement("span");
  span.textContent = val;
  span.className = "selected-item";
  span.title = "Клик для удаления";

  span.addEventListener("click", () => {
    span.remove();
    selectedValues[containerId] = selectedValues[containerId].filter(
      (v) => v !== val
    );
    updateProgress();
  });

  container.appendChild(span);
}

// Очистка выбора городов
function clearTownSelection() {
  selectedValues.selectedTownsContainer = [];
  document.getElementById("selectedTownsContainer").innerHTML = "";
  document.getElementById("townSelect").innerHTML =
    '<option value="">-- Выберите город --</option>';
  document.getElementById("townSelect").disabled = true;
  document.getElementById("townCustom").value = "";
  updateProgress();
}

// Обновление UI выбранных городов
function updateSelectedTownsUI() {
  const container = document.getElementById("selectedTownsContainer");
  container.innerHTML = "";

  selectedValues.selectedTownsContainer.forEach((val) => {
    const span = document.createElement("span");
    span.textContent = val;
    span.className = "selected-item";
    span.title = "Клик для удаления";

    span.addEventListener("click", () => {
      selectedValues.selectedTownsContainer =
        selectedValues.selectedTownsContainer.filter((v) => v !== val);
      updateSelectedTownsUI();
      updateProgress();
    });

    container.appendChild(span);
  });
}

// Добавление телефона
async function addPhoneNumber() {
  const input = document.getElementById("phoneInput");
  const container = document.getElementById("phonesContainer");
  let val = input.value.trim();

  // Убираем все нецифровые символы
  val = val.replace(/\D/g, "");

  // Добавляем 380 если его нет в начале
  if (val && !val.startsWith("380")) {
    val = "380" + val;
  }

  // Проверяем правильность формата
  if (!/^380\d{9}$/.test(val)) {
    showMessage(
      "Неверный формат телефона. Введите номер: 380XXXXXXXXX",
      "error"
    );
    input.focus();
    return;
  }

  const existingPhones = Array.from(
    container.querySelectorAll(".phone-item")
  ).map((el) => el.textContent.replace(" ×", ""));

  if (existingPhones.includes(val)) {
    showMessage("Этот номер уже добавлен", "warning");
    input.value = "";
    input.style.borderColor = "";
    input.style.boxShadow = "";
    return;
  }

  if (existingPhones.length >= 10) {
    showMessage("Можно добавить не более 10 номеров", "warning");
    return;
  }

  // НОВАЯ ПРОВЕРКА: Проверяем конфликты телефонов
  const currentProfile = document.getElementById("profileSelect").value;

  // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА ДЛЯ АДМИНА: все дубли в базе (РАБОТАЕТ БЕЗ ПРОФИЛЯ)
  if (phoneDatabase && currentUser.role === "admin") {
    const allConflicts = checkPhoneAllProfiles(val);

    if (
      allConflicts &&
      allConflicts.conflicts &&
      allConflicts.conflicts.length > 0
    ) {
      const userChoice = await showAdminPhoneConflictNotification(allConflicts);
      if (userChoice === "cancel") {
        input.value = "";
        input.style.borderColor = "";
        input.style.boxShadow = "";
        return;
      }
    }
  }

  if (phoneDatabase && currentProfile) {
    const conflictData = checkPhoneConflict(val, currentProfile);

    if (conflictData) {
      const conflict = conflictData.conflicts[0];

      // Случай А: Свой повтор
      if (conflict.author === currentUser.id) {
        const userChoice = showOwnPhoneConflictNotification(conflictData);
        if (userChoice === "cancel") {
          input.value = "";
          input.style.borderColor = "";
          input.style.boxShadow = "";
          return;
        }
      }
      // Случай Б: Повтор админа
      else if (conflict.author === "АДМИН") {
        // Просто добавляем номер, ничего не показываем пользователю
      }
      // Случай В: Чужой номер
      else {
        const userChoice = await showPhoneConflictNotification(conflictData);
        if (userChoice === "cancel") {
          input.value = "";
          input.style.borderColor = "";
          input.style.boxShadow = "";
          return;
        }
      }
    }
  }

  const div = document.createElement("div");
  div.textContent = val;
  div.className = "phone-item";
  div.title = "Клик для удаления";

  div.addEventListener("click", () => {
    div.remove();
    updateProgress();
  });

  container.appendChild(div);
  input.value = "";
  input.style.borderColor = "";
  input.style.boxShadow = "";
  updateProgress();
}

// Получение метки для типа ссылки
function getLinkTypeLabel(type) {
  const labels = {
    site: "Сайт",
    email: "Email",
    instagram: "Instagram",
    telegram: "Telegram",
    viber: "Viber",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    other: "Другая ссылка",
  };
  return labels[type] || type;
}

// Получение плейсхолдера для ссылки
function getLinkPlaceholder(type) {
  const placeholders = {
    site: "https://example.com",
    email: "email@example.com",
    instagram: "https://instagram.com/username",
    telegram: "https://t.me/username",
    viber: "https://viber.com/...",
    facebook: "https://facebook.com/username",
    whatsapp: "https://wa.me/380XXXXXXXXX",
    other: "https://example.com",
  };
  return placeholders[type] || "https://example.com";
}

// Форматирование текста в строки
function formatTextToLines(text, maxLines = 5, charsPerLine = 25) {
  if (!text) return "";

  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let word of words) {
    if (word.length > charsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      for (let i = 0; i < word.length; i += charsPerLine) {
        if (lines.length >= maxLines) break;
        const part = word.substring(i, i + charsPerLine);
        if (part) lines.push(part);
      }
      continue;
    }

    const potentialLine = currentLine ? currentLine + " " + word : word;
    if (potentialLine.length <= charsPerLine) {
      currentLine = potentialLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (lines.length >= maxLines) break;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===

// Обновление прогресс-бара
function updateProgress() {
  const totalFields = 7;
  let filledFields = 0;

  if (
    document.getElementById("regionSelect").value ||
    document.getElementById("regionCustom").value
  )
    filledFields++;
  if (
    selectedValues.selectedTownsContainer.length > 0 ||
    document.getElementById("townCustom").value
  )
    filledFields++;
  if (
    selectedValues.selectedKindsContainer.length > 0 ||
    document.getElementById("kindCustom").value
  )
    filledFields++;
  if (
    document.getElementById("nameInput").value ||
    document.getElementById("companyInput").value
  )
    filledFields++;
  if (document.getElementById("descShort").value) filledFields++;
  if (document.getElementById("descLong").value) filledFields++;
  if (document.querySelectorAll(".phone-item").length > 0) filledFields++;

  const progress = (filledFields / totalFields) * 100;
  document.getElementById("progressFill").style.width = `${progress}%`;
  document.getElementById("progressPercent").textContent = `${Math.round(
    progress
  )}%`;
}

// ====== Обновление счётчиков символов ======
function updateCharCounters() {
  const descShort = document.getElementById("descShort");
  const shortCounter = document.getElementById("descShortCounter");
  const maxLines = 5;
  const charsPerLine = 25;
  const maxTotal = maxLines * charsPerLine; // 125

  const text = descShort.value;
  const lines = text.split("\n");

  // Сохраняем позицию курсора
  const cursorPos = descShort.selectionStart;

  let newText = text;
  let needsUpdate = false;

  // Функция для обратного переноса
  function performBackwardWrap(currentLines) {
    const updatedLines = [...currentLines];
    let changed = false;

    // Проверяем с последней строки к первой
    for (let i = updatedLines.length - 1; i > 0; i--) {
      const currentLine = updatedLines[i];
      const prevLine = updatedLines[i - 1];

      // Если предыдущая строка имеет место и текущая строка может поместиться
      const spaceLeft = charsPerLine - prevLine.length;
      if (spaceLeft > 0 && currentLine.length > 0) {
        // Проверяем, может ли первое слово текущей строки поместиться в предыдущей
        const wordsInCurrent = currentLine.split(" ");
        if (wordsInCurrent.length > 0) {
          const firstWord = wordsInCurrent[0];
          const neededSpace =
            prevLine.length === 0
              ? firstWord.length
              : spaceLeft >= firstWord.length + 1;

          if (neededSpace) {
            // Переносим слово обратно на предыдущую строку
            updatedLines[i - 1] =
              prevLine + (prevLine.length > 0 ? " " : "") + firstWord;
            updatedLines[i] = wordsInCurrent.slice(1).join(" ");

            // Если текущая строка стала пустой, удаляем ее
            if (updatedLines[i].length === 0) {
              updatedLines.splice(i, 1);
            }

            changed = true;
            // Начинаем проверку заново после изменения
            return { lines: updatedLines, changed: true };
          }
        }
      }
    }

    return { lines: updatedLines, changed: false };
  }

  // Функция для прямого переноса
  function performForwardWrap(currentLines) {
    const updatedLines = [...currentLines];
    let changed = false;

    // Обрабатываем каждую строку (кроме последней)
    for (let i = 0; i < Math.min(updatedLines.length, maxLines - 1); i++) {
      if (updatedLines[i].length > charsPerLine) {
        const line = updatedLines[i];
        // Находим последний пробел до 25 символов
        const lastSpaceIndex = line.lastIndexOf(" ", charsPerLine);

        if (lastSpaceIndex > 0) {
          // Переносим часть после пробела на следующую строку
          updatedLines[i] = line.substring(0, lastSpaceIndex);
          if (i + 1 < updatedLines.length) {
            updatedLines[i + 1] =
              line.substring(lastSpaceIndex + 1) +
              (updatedLines[i + 1] ? " " + updatedLines[i + 1] : "");
          } else if (updatedLines.length < maxLines) {
            updatedLines.push(line.substring(lastSpaceIndex + 1));
          }
        } else {
          // Если пробела нет, просто обрезаем
          updatedLines[i] = line.substring(0, charsPerLine);
        }
        changed = true;
        break; // После одного изменения начинаем заново
      }
    }

    return { lines: updatedLines, changed: changed };
  }

  let currentLines = lines;
  let iterationChanged = true;

  // Выполняем итерации пока есть изменения
  while (iterationChanged) {
    iterationChanged = false;

    // Сначала обратный перенос
    const backwardResult = performBackwardWrap(currentLines);
    if (backwardResult.changed) {
      currentLines = backwardResult.lines;
      iterationChanged = true;
      needsUpdate = true;
      continue;
    }

    // Затем прямой перенос
    const forwardResult = performForwardWrap(currentLines);
    if (forwardResult.changed) {
      currentLines = forwardResult.lines;
      iterationChanged = true;
      needsUpdate = true;
      continue;
    }
  }

  // Для последней строки просто обрезаем если превышен лимит
  if (
    currentLines.length === maxLines &&
    currentLines[maxLines - 1].length > charsPerLine
  ) {
    currentLines[maxLines - 1] = currentLines[maxLines - 1].substring(
      0,
      charsPerLine
    );
    needsUpdate = true;
  }

  // Обрезаем общее количество строк
  if (currentLines.length > maxLines) {
    currentLines.length = maxLines;
    needsUpdate = true;
  }

  if (needsUpdate) {
    newText = currentLines.join("\n");
    descShort.value = newText;

    // Восстанавливаем позицию курсора
    const newCursorPos = Math.min(cursorPos, newText.length);
    descShort.setSelectionRange(newCursorPos, newCursorPos);
  }

  // === НОВАЯ ЛОГИКА СЧЁТЧИКА ===
  const cursorPosition = descShort.selectionStart;
  const allLines = descShort.value.split("\n");

  // Определяем текущую строку с курсором
  let currentLineIndex = 0;
  let positionInCurrentLine = cursorPosition;

  for (let i = 0; i < allLines.length; i++) {
    if (positionInCurrentLine <= allLines[i].length) {
      currentLineIndex = i;
      break;
    }
    positionInCurrentLine -= allLines[i].length + 1; // +1 для \n
  }

  // Вычисляем остаток символов по новой логике
  let remainingChars = maxTotal;

  // Вычитаем по 25 символов за каждую предыдущую строку
  for (let i = 0; i < currentLineIndex; i++) {
    remainingChars -= 25;
  }

  // Вычитаем фактические символы в текущей строке
  remainingChars -= allLines[currentLineIndex].length;

  // Ограничиваем снизу нулем
  remainingChars = Math.max(0, remainingChars);

  // Обновляем счётчик
  shortCounter.textContent = `${remainingChars} символов осталось`;

  if (remainingChars === 0) {
    shortCounter.style.color = "#e74c3c";
    descShort.dataset.maxReached = "true";
  } else if (remainingChars <= 25) {
    shortCounter.style.color = "#f39c12";
    descShort.dataset.maxReached = "false";
  } else {
    shortCounter.style.color = "#27ae60";
    descShort.dataset.maxReached = "false";
  }
}

// ====== Слушатели ======
const descShortEl = document.getElementById("descShort");
if (descShortEl) {
  // Блокируем ввод только на 5й строке при 25 символах
  descShortEl.addEventListener("beforeinput", function (e) {
    const text = this.value;
    const lines = text.split("\n");
    const cursorPos = this.selectionStart;

    // Определяем текущую строку и позицию в ней
    let currentLine = 0;
    let posInLine = cursorPos;
    for (let i = 0; i < lines.length; i++) {
      if (posInLine <= lines[i].length) {
        currentLine = i;
        break;
      }
      posInLine -= lines[i].length + 1; // +1 для \n
    }

    // БЛОКИРУЕМ Enter полностью
    if (e.inputType === "insertLineBreak") {
      e.preventDefault();
      return;
    }

    // Если это 5-я строка и достигнут лимит в 25 символов - блокируем ввод
    if (
      currentLine === 4 &&
      posInLine >= 25 &&
      e.inputType.startsWith("insert")
    ) {
      e.preventDefault();
      return;
    }

    // Если общий лимит 125 символов достигнут - блокируем ввод
    const currentTotalChars = text.replace(/\n/g, "").length;
    if (currentTotalChars >= 125 && e.inputType.startsWith("insert")) {
      e.preventDefault();
      return;
    }
  });

  descShortEl.addEventListener("input", function () {
    updateCharCounters();
  });

  descShortEl.addEventListener("click", function () {
    updateCharCounters(); // Обновляем при клике (смене позиции курсора)
  });

  descShortEl.addEventListener("keyup", function () {
    updateCharCounters(); // Обновляем при перемещении курсора клавишами
  });

  descShortEl.addEventListener("paste", function (e) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text");
    const selStart = this.selectionStart;
    const selEnd = this.selectionEnd;
    const before = this.value.slice(0, selStart);
    const after = this.value.slice(selEnd);

    this.value = before + paste + after;
    const newPos = before.length + paste.length;
    this.setSelectionRange(newPos, newPos);
    updateCharCounters();
  });

  // Инициализация при загрузке
  updateCharCounters();
}

// Автоматическое изменение высоты для полного описания
const descLongEl = document.getElementById("descLong");
if (descLongEl) {
  // Обработчик для автоматического изменения высоты
  descLongEl.addEventListener("input", function () {
    // Вызываем функцию обновления высоты
    updateLongCharCounter();
  });

  // Инициализация высоты при загрузке
  setTimeout(() => {
    updateLongCharCounter();
  }, 100);
}

// === ОТПРАВКА ФОРМЫ ===

// Обработка отправки формы
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Отправка...";
  submitBtn.disabled = true;

  try {
    const payload = prepareFormData();
    await submitToSheet(payload);
  } catch (error) {
    console.error("Ошибка отправки:", error);
    showMessage("Ошибка при отправке формы", "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Валидация формы
function validateForm() {
  const errors = [];

  const region =
    document.getElementById("regionSelect").value ||
    document.getElementById("regionCustom").value;
  if (!region) errors.push("Укажите область");

  const selectedTowns = selectedValues.selectedTownsContainer
    .concat(document.getElementById("townCustom").value.trim())
    .filter(Boolean);
  if (selectedTowns.length === 0)
    errors.push("Укажите хотя бы один населённый пункт");
  else if (selectedTowns.length > 10)
    errors.push("Нельзя указать более 10 населённых пунктов");

  const kinds = selectedValues.selectedKindsContainer
    .concat(document.getElementById("kindCustom").value.trim())
    .filter(Boolean);
  if (kinds.length === 0) errors.push("Укажите хотя бы один вид деятельности");
  else if (kinds.length > 10)
    errors.push("Нельзя указать более 10 видов деятельности");

  const name = document.getElementById("nameInput").value.trim();
  const company = document.getElementById("companyInput").value.trim();
  if (!name && !company) errors.push("Укажите имя или название компании");

  const descShort = document.getElementById("descShort").value.trim();
  const descLong = document.getElementById("descLong").value.trim();
  if (!descShort) errors.push("Заполните краткое описание");
  if (!descLong) errors.push("Заполните полное описание");
  if (descShort.length > 125)
    errors.push("Краткое описание не должно превышать 125 символов");

  const phones = document.querySelectorAll(".phone-item");
  if (phones.length === 0) errors.push("Добавьте хотя бы один телефон");

  // Валидация ссылок
  document.querySelectorAll("#linksInputsContainer input").forEach((input) => {
    const type = input.dataset.type;
    const value = input.value.trim();

    if (value && !validateLink(input, type)) {
      errors.push(`Неверный формат ${getLinkTypeLabel(type)}: ${value}`);
    }
  });

  // Геолокация
  // НОВАЯ ПРОВЕРКА: Геолокация
  const geoInput = document.getElementById("geoLocation");
  const geoLocation = geoInput.value.trim();
  if (geoLocation && !validateGeoLocation(geoInput)) {
    errors.push(
      "Геолокация должна быть ссылкой (https://...) или координатами (50.4504,30.5245)"
    );
  }

  if (errors.length > 0) {
    showMessage("Исправьте ошибки:<br>" + errors.join("<br>"), "error");
    return false;
  }

  return true;
}

// Подготовка данных для отправки
function prepareFormData() {
  // ОТЛАДКА - ДОБАВЬ В НАЧАЛО
  console.log("=== ДЕБАГ prepareFormData ===");
  console.log("currentUser:", currentUser);
  console.log("Все поля currentUser:", Object.keys(currentUser || {}));

  const now = new Date();
  const date =
    now.toLocaleDateString("ru-RU") + " " + now.toLocaleTimeString("ru-RU");

  const region =
    document.getElementById("regionSelect").value ||
    document.getElementById("regionCustom").value;
  const selectedTowns = selectedValues.selectedTownsContainer
    .concat(document.getElementById("townCustom").value.trim())
    .filter(Boolean);
  const kinds = selectedValues.selectedKindsContainer
    .concat(document.getElementById("kindCustom").value.trim())
    .filter(Boolean);

  const links = {};
  document.querySelectorAll("#linksInputsContainer input").forEach((input) => {
    if (input.value.trim()) {
      links[input.dataset.type] = input.value.trim();
    }
  });

  // Определяем пометки для админа
  let adminNotes = "";
  const currentProfile = document.getElementById("profileSelect").value;
  const phones = Array.from(document.querySelectorAll(".phone-item")).map(
    (el) => el.textContent.replace(" ×", "")
  );

  // Массив для всех пометок
  const allAdminNotes = [];

  // 1. Проверяем оспоренные телефоны
  if (disputedPhones.length > 0) {
    const disputeNotes = disputedPhones.map(
      (d) => `Оспаривание: ${d.phone} (объявление ${d.cardId})`
    );
    allAdminNotes.push(...disputeNotes);
  }

  // 2. Проверяем новые кастомные значения
  const regionCustom = document.getElementById("regionCustom").value.trim();
  if (regionCustom) {
    allAdminNotes.push(`Новая область: ${regionCustom}`);
  }

  const townCustom = document.getElementById("townCustom").value.trim();
  if (townCustom) {
    allAdminNotes.push(`Новый населённый пункт: ${townCustom}`);
  }

  const kindCustom = document.getElementById("kindCustom").value.trim();
  if (kindCustom) {
    allAdminNotes.push(`Новый вид деятельности: ${kindCustom}`);
  }

  // 3. Проверяем конфликты для админа
  if (phoneDatabase && currentProfile && currentUser.role === "admin") {
    const conflictNotes = [];

    phones.forEach((phone) => {
      const conflictData = checkPhoneConflict(phone, currentProfile);
      if (conflictData) {
        const conflict = conflictData.conflicts[0];

        if (conflict.author === "АДМИН") {
          conflictNotes.push(`Повтор админа: ${phone}`);
        }
      }
    });

    if (conflictNotes.length > 0) {
      allAdminNotes.push(...conflictNotes);
    }
  }

  // Объединяем все пометки
  if (allAdminNotes.length > 0) {
    adminNotes = allAdminNotes.join("; ");
  }

  return {
    "Дата добавления": date,
    Область: region,
    "Населённый пункт": selectedTowns.join(", "),
    "Район города": document.getElementById("cityDistrict").value.trim(),
    "Вид деятельности": kinds.join(", "),
    Имя: document.getElementById("nameInput").value.trim(),
    Компания: document.getElementById("companyInput").value.trim(),
    "Описание (до 125 симв)": document.getElementById("descShort").value.trim(),
    "Описание (до 1000 симв)": document.getElementById("descLong").value.trim(),
    Адрес: document.getElementById("addressInput").value.trim(),
    Телефоны: phones.join(", "),
    Ссылки: Object.keys(links).length > 0 ? formatLinksToOldStyle(links) : "",
    Геолокация: document.getElementById("geoLocation").value.trim(),
    Статус: "черновик",
    Добавил: currentUser ? currentUser.name : "Неизвестный пользователь",
    "Пометки админу": adminNotes, // НОВОЕ ПОЛЕ
    Автор: currentUser
      ? `${currentUser.name} (${currentUser.id || currentUser.uid || "без_ID"})`
      : "Неизвестно",
  };
}

// Отправка данных на сервер
async function submitToSheet(data) {
  try {
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));

    const response = await fetch(formUrl, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showMessage("Услуга успешно добавлена!", "success");
      // Устанавливаем флаг успешной отправки
      formSubmittedSuccessfully = true;
      // Сбрасываем форму
      document.getElementById("serviceForm").reset();
      // Очищаем выбранные значения
      selectedValues.selectedTownsContainer = [];
      selectedValues.selectedKindsContainer = [];
      document.getElementById("selectedTownsContainer").innerHTML = "";
      document.getElementById("selectedKindsContainer").innerHTML = "";
      document.getElementById("phonesContainer").innerHTML = "";
      document.getElementById("linksInputsContainer").innerHTML = "";
      document
        .querySelectorAll(".link-checkbox")
        .forEach((cb) => (cb.checked = false));
      // Обновляем прогресс-бар
      updateProgress();

      setTimeout(() => (window.location.href = "index.html"), 2000);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Ошибка отправки:", error);
    throw error;
  }
}

// Сброс формы
function handleReset() {
  if (confirm("Вы уверены, что хотите сбросить все данные формы?")) {
    selectedValues.selectedTownsContainer = [];
    selectedValues.selectedKindsContainer = [];
    document.getElementById("selectedTownsContainer").innerHTML = "";
    document.getElementById("selectedKindsContainer").innerHTML = "";
    document.getElementById("phonesContainer").innerHTML = "";
    document.getElementById("linksInputsContainer").innerHTML = "";
    document
      .querySelectorAll(".link-checkbox")
      .forEach((cb) => (cb.checked = false));
    updateProgress();
    updateCharCounters();
    showMessage("Форма очищена", "success");
  }
}

// Показ сообщений
function showMessage(text, type = "info") {
  const box = document.getElementById("messageBox");
  box.innerHTML = text;
  box.className = `message-box visible ${type}`;

  setTimeout(() => {
    box.classList.remove("visible");
    setTimeout(() => (box.className = "message-box hidden"), 400);
  }, 5000);
}

// === ОБНОВЛЕНИЕ СЧЁТЧИКА ДЛЯ ПОЛНОГО ОПИСАНИЯ ===
function updateLongCharCounter() {
  const descLong = document.getElementById("descLong");
  const longCounter = document.getElementById("descLongCounter");
  const maxChars = 1000;
  const currentChars = descLong.value.length;
  const remaining = maxChars - currentChars;

  longCounter.textContent = `${remaining} символов осталось`;

  if (remaining === 0) {
    longCounter.style.color = "#e74c3c";
  } else if (remaining <= 100) {
    longCounter.style.color = "#f39c12";
  } else {
    longCounter.style.color = "#27ae60";
  }

  // Автоматическое изменение высоты textarea в зависимости от количества строк
  // Вычисляем количество строк в тексте
  const lines = descLong.value.split("\n").length;
  // Устанавливаем rows равным количеству строк, но не менее 5
  descLong.rows = Math.max(5, lines);
  // Если строк больше 15, добавляем возможность прокрутки
  if (lines > 15) {
    descLong.style.overflowY = "auto";
    descLong.rows = 15; // Ограничиваем видимые строки для очень длинных текстов
  } else {
    descLong.style.overflowY = "hidden";
  }
}

// Защита от потери данных
window.addEventListener("beforeunload", (e) => {
  // Если форма успешно отправлена - не показываем предупреждение
  if (formSubmittedSuccessfully) {
    return;
  }

  const isFormDirty =
    document.getElementById("regionSelect").value ||
    document.getElementById("regionCustom").value ||
    selectedValues.selectedTownsContainer.length > 0;

  if (isFormDirty) {
    e.preventDefault();
    e.returnValue =
      "У вас есть несохранённые изменения. Вы уверены, что хотите уйти?";
  }
});

// Функция ограничения длины полей с уведомлениями
function setupFieldLengthLimit(fieldId, maxLength, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.addEventListener("input", function () {
    if (this.value.length >= maxLength) {
      this.value = this.value.substring(0, maxLength);
      showMessage(message, "warning");
    }
  });

  field.addEventListener("beforeinput", function (e) {
    if (this.value.length >= maxLength && e.inputType.startsWith("insert")) {
      e.preventDefault();
      showMessage(message, "warning");
    }
  });
}

// Форматирование ссылок в старый стиль для совместимости с сайтом
function formatLinksToOldStyle(links) {
  const linkTypes = {
    site: "🌐",
    email: "📧",
    instagram: "🌐",
    telegram: "🌐",
    viber: "🌐",
    facebook: "🌐",
    whatsapp: "🌐",
    other: "🌐",
  };

  const formattedLinks = [];

  for (const [type, url] of Object.entries(links)) {
    if (url) {
      const emoji = linkTypes[type] || "🔗";

      // ОСОБЫЙ ФОРМАТ ДЛЯ EMAIL (не кликабельный)
      if (type === "email") {
        formattedLinks.push(`${emoji}email: ${url}`);
      }
      // ОСТАЛЬНЫЕ - обычные ссылки
      else {
        // Убираем viber:// и @ для инсты/телеги
        let displayUrl = url;
        if (url.startsWith("viber://")) {
          displayUrl = url.replace("viber://", "https://viber.com/");
        } else if (
          url.startsWith("@") &&
          (type === "instagram" || type === "telegram")
        ) {
          displayUrl = `https://${
            type === "instagram" ? "instagram.com" : "t.me"
          }/${url.substring(1)}`;
        }

        formattedLinks.push(`${emoji}[${type}](${displayUrl})`);
      }
    }
  }

  return formattedLinks.join("     ");
}

// Валидация геолокации
function validateGeoLocation(input) {
  const value = input.value.trim();

  if (!value) {
    input.style.borderColor = "";
    input.title = "";
    return true;
  }

  // ПРОВЕРКА: Не должно быть пробелов внутри значения!
  if (/\s/.test(value)) {
    input.style.borderColor = "#e74c3c";
    input.title = "Геолокация не должна содержать пробелов";
    return false;
  }

  const isLink = /^https?:\/\//.test(value);
  const isCoords = /^[-+]?\d+\.\d+,\s*[-+]?\d+\.\d+$/.test(value);
  const isValid = isLink || isCoords;

  input.style.borderColor = isValid ? "#27ae60" : "#e74c3c";
  input.title = isValid
    ? ""
    : "Должна быть ссылка (https://...) или координаты (50.4504,30.5245)";

  return isValid;
}
