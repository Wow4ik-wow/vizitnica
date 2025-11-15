const apiUrl =
  "https://raw.githubusercontent.com/Wow4ik-wow/vizitnica/master/data.json";
const API_USER_URL = "https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec";
const API_TG_URL = "https://script.google.com/macros/s/AKfycbxjECFiBLd5Y2X760SVngkL5vPDAlQ8-5SJofbdKWofhmAD3zxzwSrw_Lm01Z4wDmA/exec";
let currentUser = null;

// TG логика
let isTelegramWebApp = false;
let tgUser = null;

function isReallyTelegramWebApp() {
  return (
    typeof window.Telegram !== "undefined" &&
    window.Telegram.WebApp &&
    window.Telegram.WebApp.initData &&
    window.Telegram.WebApp.platform &&
    window.Telegram.WebApp.platform !== "unknown"
  );
}

if (isReallyTelegramWebApp()) {
  isTelegramWebApp = true;
  try {
    tgUser = Telegram.WebApp.initDataUnsafe?.user || null;
    if (tgUser) {
  currentUser = {
    id: "tg_" + tgUser.id,
    name: tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : ""),
    username: tgUser.username || "",
    role: "user",
    source: "telegram",
  };
  localStorage.setItem("user", JSON.stringify(currentUser));
  console.log("Авторизация через Telegram:", currentUser);
  
  handleTelegramUser(tgUser).then(tgUserData => {
    if (tgUserData && tgUserData.role && tgUserData.role !== currentUser.role) {
      currentUser.role = tgUserData.role;
      localStorage.setItem("user", JSON.stringify(currentUser));
      updateAuthUI();
      updateRolesVisibility();
    }
  });
} else {
      console.warn("Telegram WebApp не вернул данных пользователя");
    }
  } catch (e) {
    console.warn("Ошибка чтения Telegram WebApp данных:", e);
  }
  updateAuthUI();
  setupTelegramNavigation();
} else {
  console.log("Открыт не в Telegram, обычный браузер");
}

let allServices = [];

function updateAuthUI() {
  // Если сайт открыт в Telegram — скрываем элементы входа/выхода
  if (typeof isTelegramWebApp !== "undefined" && isTelegramWebApp) {
    const googleAuthBtn = document.getElementById("googleAuthBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const authLoginWrapper = document.querySelector(".auth-login-wrapper");
    const roleInfo = document.getElementById("roleInfo");
    
    if (googleAuthBtn) googleAuthBtn.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "none";
      logoutBtn.style.visibility = "hidden";
      logoutBtn.style.opacity = "0";
      logoutBtn.style.position = "absolute";
      logoutBtn.style.left = "-9999px";
    }
    if (authLoginWrapper) authLoginWrapper.style.display = "none";
    
    // НЕ скрываем информацию о роли в Telegram
    if (roleInfo && currentUser) {
      if (currentUser.role === "admin") {
        roleInfo.innerText = "Вы сейчас админ";
      } else {
        roleInfo.innerText = "Вы сегодня молодец!";
      }
    }

    return;
  }

  const googleAuthBtn = document.getElementById("googleAuthBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const roleInfo = document.getElementById("roleInfo");
  const authLoginWrapper = document.querySelector(".auth-login-wrapper");

  if (currentUser && currentUser.role) {
    // Авторизованный пользователь
    if (authLoginWrapper) authLoginWrapper.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";

    // Обновляем информацию о роли
    if (roleInfo) {
      if (currentUser.role === "admin") {
        roleInfo.innerText = "Вы сейчас админ";
      } else {
        roleInfo.innerText = "Вы сегодня молодец!";
      }
    }
  } else {
    // Неавторизованный
    if (authLoginWrapper) authLoginWrapper.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (roleInfo) roleInfo.innerText = "Вы не авторизованы";
  }

  // Управляем ВСЕМИ элементами с ролями
  updateRolesVisibility();
}

function updateRolesVisibility() {
  const elements = document.querySelectorAll("[data-role]");
  const userRole = currentUser?.role || "guest"; // Если пользователя нет, роль 'guest'

  elements.forEach((element) => {
    const allowedRoles = element.getAttribute("data-role").split(",");
    // Скрываем элемент, если роль пользователя не входит в разрешенные
    element.style.display = allowedRoles.includes(userRole) ? "block" : "none";
  });
}

// Умная навигация для TG
function setupTelegramNavigation() {
  if (!isTelegramWebApp) return;

  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      // Страницы нашего сайта
      const isInternalPage =
        href.includes(".html") ||
        href === "/" ||
        href.includes("add.html") ||
        href.includes("favorites.html") ||
        href.includes("cabinet.html");

      // Рекламные ссылки
      const isAdLink = href.includes("reclama") || href.includes("ad=");

      if (isInternalPage) {
        // Страницы сайта - внутри WebApp
        e.preventDefault();
        Telegram.WebApp.openLink(window.location.origin + href);
      }
      // Рекламные ссылки откроются в браузере (ничего не делаем)
    });
  });
}

async function loadServices() {
  const CACHE_KEY = "services_cache";
  const CACHE_TIME = 3600000;

  document.getElementById("cards").innerText = "Сайт загружается...";

  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_TIME) {
        allServices = data;
        populateAllLists();
        document.getElementById("cards").innerText =
          "Сайт готов к работе (данные из кэша)";
        return;
      }
    }

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Ошибка загрузки");

    allServices = await response.json();

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: allServices,
        timestamp: Date.now(),
      })
    );

    populateAllLists();
    document.getElementById("cards").innerText = "Сайт готов к работе";
  } catch (e) {
    console.error("Ошибка загрузки данных:", e);
    document.getElementById("cards").innerText =
      "Сайт готов к работе (используются последние сохранённые данные)";
  }
}

function renderCards(services) {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  if (services.length === 0) {
    container.innerText = "Нет результатов по заданным фильтрам.";
    return;
  }

  let openedCard = null;

  services.forEach((service) => {
    let imageUrl = (service["Ссылка на картинку"] || "").trim();

    if (imageUrl.includes("drive.google.com")) {
      const match = imageUrl.match(/id=([^&]+)/);
      if (match && match[1]) {
        const imageId = match[1];
        imageUrl = `https://drive.google.com/thumbnail?id=${imageId}&sz=w1000`;
      } else {
        imageUrl = "";
      }
    } else if (imageUrl.length === 33) {
      imageUrl = `https://drive.google.com/thumbnail?id=${imageUrl}&sz=w1000`;
    } else {
      imageUrl = "";
    }

    const card = document.createElement("div");
    card.className = "card";

    const id = service["ID"] || "";

    const name = (service["Имя"] || "").trim();
    const company = (service["Компания"] || "").trim();
    const profile = (service["Профиль деятельности"] || "").trim();
    const description = (service["Описание (до 700 симв)"] || "").trim();
    const phones = ("" + (service["Телефоны"] ?? "")).trim();
    const city = (service["Населённый пункт"] || "").trim();
    const district = (service["Район города"] || "").trim();
    const type = (service["Вид деятельности"] || "").trim();
    const geo = (service["Геолокация"] || "").trim();

    const nameCompanyLine =
      name && company ? `${name} ⏩⏩⏩ ${company}` : name || company || "";

    const socials = [
      { name: "Facebook", url: service["facebook"] },
      { name: "Instagram", url: service["instagram"] },
      { name: "Telegram", url: service["telegram"] },
      { name: "Viber", url: service["viber"] },
      { name: "WhatsApp", url: service["whatsapp"] },
      { name: "Другое", url: service["Другое"] },
    ].filter((s) => s.url);

    const socialButtonsHTML =
      socials.length > 0
        ? `<div style="margin: 10px 0;">` +
          socials
            .map(
              (
                s
              ) => `<a href="${s.url}" target="_blank" style="margin: 4px; display: inline-block;">
                  <button style="background: #3498db; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                    ${s.name}
                  </button>
                </a>`
            )
            .join("") +
          `</div>`
        : "";

    const geoHTML = geo
      ? `<div><strong>Геолокация:</strong> <a href="${geo}" target="_blank" style="color: #2c3e50;">Открыть на карте</a></div>`
      : "";

    let contentHTML = `
      <img src="${imageUrl}" alt="Превью" style="width: 95%; margin: 8px auto; display: block; cursor: pointer; border-radius: 6px; object-fit: contain;" />

      <div class="card-text" style="display:none; font-size: 16px; text-align: left; padding: 0 12px; margin: 0 auto; width: 100%; box-sizing: border-box;">
`;

    if (type) {
      contentHTML += `<div style="font-weight: bold; font-size: 18px; margin-bottom: 6px;">${type}</div>`;
    }

    if (nameCompanyLine) {
      contentHTML += `<div style="font-size: 13px; margin-bottom: 6px;">${nameCompanyLine}</div>`;
    }

    if (type || nameCompanyLine) {
      contentHTML += `<hr style="margin: 8px 0;" />`;
    }

    if (profile)
      contentHTML += `<div><strong>Профиль деятельности:</strong> ${profile}</div>`;
    if (description)
      contentHTML += `<div><strong>Описание:</strong><br>${description.replace(
        /\n/g,
        "<br>"
      )}</div>`;

    if (profile || description) {
      contentHTML += `<hr style="margin: 8px 0;" />`;
    }

    if (phones) {
      const phoneLinks = phones
        .split(",")
        .map((phone) => {
          const clean = phone.trim();
          return `<a href="tel:${clean}" style="color: #2563eb;">${clean}</a>`;
        })
        .join(", ");
      contentHTML += `<div><strong>Телефон:</strong> ${phoneLinks}</div>`;
    }

    if (city)
      contentHTML += `<div><strong>Населённый пункт:</strong> ${city}</div>`;
    if (district)
      contentHTML += `<div><strong>Район:</strong> ${district}</div>`;

    const address = (service["Адрес"] || "").trim();
    if (address) {
      contentHTML += `<div><strong>Адрес:</strong> ${address.replace(
        /\n/g,
        "<br>"
      )}</div>`;
    }

    // 1. Парсим соцсети из столбца "Ссылки"
    const socialLinksText = service["Ссылки"] || "";
    const parsedSocialLinks = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(socialLinksText)) !== null) {
      parsedSocialLinks.push({
        name: match[1].trim(),
        url: match[2].trim(),
      });
    }

    // 2. Объединяем с существующими соцсетями (socialButtonsHTML)
    const allSocialLinks = [
      ...socials.filter((s) => s.url),
      ...parsedSocialLinks,
    ];

    // 3. Генерируем HTML для всех соцсетей
    if (allSocialLinks.length > 0) {
      contentHTML += `
    <div style="margin: 10px 0; display: flex; flex-wrap: wrap; gap: 6px;">
      ${allSocialLinks
        .map(
          (link) => `
        <a href="${link.url}" target="_blank" style="text-decoration: none;">
          <button style="
            background: #4a6fa5;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            cursor: pointer;
          ">
            ${link.name}
          </button>
        </a>
      `
        )
        .join("")}
    </div>
  `;
    }

    // 4. Добавляем геолокацию (geoHTML)
    contentHTML += geoHTML;

    // 5. Добавляем ТЕГИ только для админов
    const tags = (service["Теги"] || "").trim();
    if (tags) {
      contentHTML += `
    <div data-role="admin" style="margin-top: 10px;">
      <strong>Теги:</strong> ${tags}
    </div>
  `;
    }

    // 6. Добавляем кнопки
    contentHTML += `
<div class="card-buttons">
  <button class="btn small back-to-search" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">НАЗАД К ПОИСКУ</button>
  ${
    currentUser?.role === "admin"
      ? '<button class="btn small add-to-favorites">В ИЗБРАННОЕ</button>'
      : ""
  }
</div>

${
  currentUser?.role === "admin"
    ? `
<div class="card-rating-block">
  <div class="rating-container">
    <div class="rating-text">
      ОЦЕНИ &nbsp;
      <span class="rating-stars">☆ ☆ ☆ ☆ ☆</span>
    </div>
    <button class="btn small reviews-btn">ОТЗЫВЫ</button>
  </div>
</div>

<div class="card-buttons">
  <button class="btn small edit-btn">РЕДАКТИРОВАТЬ</button>
  <button class="btn small publish-btn">ОПУБЛИКОВАТЬ</button>
</div>
`
    : ""
}

<div class="card-id">ID: ${id}</div>
</div>`;

    card.innerHTML = contentHTML;

    const img = card.querySelector("img");
    const textDiv = card.querySelector(".card-text");

    img.addEventListener("click", () => {
      if (openedCard && openedCard !== textDiv) {
        openedCard.style.display = "none";
      }

      const isOpening = textDiv.style.display === "none";

      if (isOpening) {
        textDiv.style.display = "block";
        openedCard = textDiv;

        // Прокрутка к карточке
        setTimeout(() => {
          card.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        textDiv.style.display = "none";
        openedCard = null;
      }
    });

    container.appendChild(card);
    setTimeout(updateRolesVisibility, 100);
  });
  // Добавляем кнопку "ВЕРНУТЬСЯ НАВЕРХ" после всех карточек
  const backToTopContainer = document.getElementById("backToTopContainer");
  backToTopContainer.innerHTML = "";

  const backToTopBtn = document.createElement("button");
  backToTopBtn.className = "btn back-to-top";
  backToTopBtn.textContent = "ВЕРНУТЬСЯ НАВЕРХ";
  backToTopBtn.onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  backToTopContainer.appendChild(backToTopBtn);
}

function applyFilters() {
  
  const region = document
    .getElementById("filterRegion")
    .value.trim()
    .toLowerCase();
  const city = document.getElementById("filterCity").value.trim().toLowerCase();
  const profile = document
    .getElementById("filterProfile")
    .value.trim()
    .toLowerCase();
  const type = document.getElementById("filterType").value.trim().toLowerCase();
  const district = document
    .getElementById("filterDistrict")
    .value.trim()
    .toLowerCase();
  const name = document.getElementById("filterName").value.trim().toLowerCase();

  if (!region || !city) {
    showNotification("Пожалуйста, заполните поля Область и Город.");
    return;
  }

  if (!profile && !type && !district && !name) {
    showNotification(
      "Заполните хотя бы одно из полей: Профиль, Вид, Район, Имя."
    );
    return;
  }

  const filtered = allServices.filter((service) => {
    const области = (service["Область"] || "")
      .toLowerCase()
      .split(",")
      .map((x) => x.trim());
    const города = (service["Населённый пункт"] || "")
      .toLowerCase()
      .split(",")
      .map((x) => x.trim());
    const профиль = (service["Профиль деятельности"] || "").toLowerCase();
    const вид = (service["Вид деятельности"] || "").toLowerCase();
    const район = (service["Район"] || "").toLowerCase();
    const имя = (service["Имя"] || "").toLowerCase();
    const компания = (service["Компания"] || "").toLowerCase();

    const regionMatch = области.some((r) => r.includes(region));
    const cityMatch = города.some((c) => c.includes(city));
    const profileMatch = !profile || профиль.includes(profile);
    const typeMatch = !type || вид.includes(type);
    const districtMatch = !district || район.includes(district);
    const nameMatch = !name || (имя + " " + компания).includes(name);

    return (
      regionMatch &&
      cityMatch &&
      profileMatch &&
      typeMatch &&
      districtMatch &&
      nameMatch
    );
  });

  renderCards(filtered);
  populateDependentLists(allServices);

  const countElem = document.getElementById("searchCount");
  countElem.innerText = `Найдено совпадений: ${filtered.length}`;

  populateList("listProfile", filtered, "Профиль деятельности");
  populateList("listDistrict", filtered, "Район");
  populateList("listName", filtered, "Имя", true);

  // Обновляем позиционирование после изменения контента
  setTimeout(adjustCardsOffset, 100);

  // Прокрутка к результатам - к надписи с количеством
  setTimeout(() => {
    const searchCount = document.getElementById("searchCount");
    if (searchCount && searchCount.innerText) {
      searchCount.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 100);
}

function populateAllLists() {
  populateList("listProfile", allServices, "Профиль деятельности");
  populateDatalist("listRegion", getUniqueValues(allServices, "Область"));
  populateDatalist("listDistrict", getUniqueValues(allServices, "Район"));
  populateList("listName", allServices, "Имя", true);
  populateDependentLists(allServices);
}
populateAllLists();

function populateList(
  listId,
  services,
  fieldName,
  useLowerCase = true,
  filterFields = {}
) {
  const datalist = document.getElementById(listId);
  datalist.innerHTML = "";
  const valuesSet = new Set();

  const filterValues = {};
  for (const key in filterFields) {
    const val = filterFields[key];
    filterValues[key] = useLowerCase ? val.trim().toLowerCase() : val.trim();
  }

  services.forEach((service) => {
    const matchesFilters = Object.entries(filterValues).every(
      ([filterField, filterVal]) => {
        if (!filterVal) return true;

        const serviceFieldVal = service[filterField] || "";
        const serviceFieldArr = serviceFieldVal
          .split(",")
          .map((s) => (useLowerCase ? s.trim().toLowerCase() : s.trim()));

        return serviceFieldArr.includes(filterVal);
      }
    );

    if (!matchesFilters) return;

    let valueToAdd = service[fieldName];

    if (!valueToAdd) return;

    if (fieldName === "Вид деятельности") {
      valueToAdd
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)
        .forEach((v) => valuesSet.add(useLowerCase ? v.toLowerCase() : v));
    } else if (fieldName === "Имя" || fieldName === "Компания") {
    } else {
      valuesSet.add(
        useLowerCase ? valueToAdd.trim().toLowerCase() : valueToAdd.trim()
      );
    }
  });

  if (listId === "listName") {
    services.forEach((service) => {
      const matchesFilters = Object.entries(filterValues).every(
        ([filterField, filterVal]) => {
          if (!filterVal) return true;

          const serviceFieldVal = service[filterField] || "";
          const serviceFieldArr = serviceFieldVal
            .split(",")
            .map((s) => (useLowerCase ? s.trim().toLowerCase() : s.trim()));

          return serviceFieldArr.includes(filterVal);
        }
      );

      if (!matchesFilters) return;

      const name = (service["Имя"] || "").trim();
      const company = (service["Компания"] || "").trim();

      if (name) valuesSet.add(name);
      if (company) valuesSet.add(company);
    });
  }

  const sortedValues = Array.from(valuesSet).sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  sortedValues.forEach((val) => {
    if (val) {
      const option = document.createElement("option");
      option.value = val;
      datalist.appendChild(option);
    }
  });
}

function populateDatalist(listId, values) {
  const datalist = document.getElementById(listId);
  datalist.innerHTML = "";
  values.forEach((val) => {
    if (val) {
      const option = document.createElement("option");
      option.value = val;
      datalist.appendChild(option);
    }
  });
}

function getUniqueValues(arr, field) {
  const set = new Set();
  arr.forEach((item) => {
    const val = (item[field] || "").trim();
    if (val) {
      val.split(",").forEach((subVal) => {
        const trimmed = subVal.trim();
        if (trimmed) set.add(trimmed);
      });
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}

function getUniqueNames(arr) {
  const set = new Set();
  arr.forEach((item) => {
    const name = (item["Имя"] || "").trim();
    const company = (item["Компания"] || "").trim();
    if (name) set.add(name);
    if (company) set.add(company);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}
// 🔹 Заполнение <select> для поля Профиль
function populateSelectOptions(selectId, values) {
  const select = document.getElementById(selectId);
  const prev = select.value;
  select.innerHTML = '<option value="">Выберите профиль</option>';
  values.forEach((val) => {
    if (val) {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      select.appendChild(option);
    }
  });
  select.value = prev;
}

function populateDependentLists(filteredServices) {
  const regionValue = document.getElementById("filterRegion").value.trim();

  let citySet = new Set();

  if (regionValue) {
    filteredServices
      .filter((s) => {
        const areas = (s["Область"] || "").split(",").map((x) => x.trim());
        return areas.includes(regionValue);
      })
      .forEach((s) => {
        const cities = (s["Населённый пункт"] || "")
          .split(",")
          .map((x) => x.trim());
        cities.forEach((city) => {
          if (city) citySet.add(city);
        });
      });
  }

  if (citySet.size === 0) {
    allServices.forEach((s) => {
      const cities = (s["Населённый пункт"] || "")
        .split(",")
        .map((x) => x.trim());
      cities.forEach((city) => {
        if (city) citySet.add(city);
      });
    });
  }

  const citiesArray = Array.from(citySet).sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  populateDatalist("listCity", citiesArray);
}

function setupInputAutobehavior(id, onFocusCallback) {
  const input = document.getElementById(id);
  input.addEventListener("focus", () => {
    if (typeof onFocusCallback === "function") onFocusCallback();
  });
  input.addEventListener("blur", () => {});
}

// Поведение поля ОБЛАСТЬ
setupInputAutobehavior("filterRegion", () => {
  populateDependentLists(allServices);
});

// Поведение поля ГОРОД
setupInputAutobehavior("filterCity", () => {
  populateDependentLists(allServices);
});

document.getElementById("filterRegion").addEventListener("input", () => {
  const regionInput = document.getElementById("filterRegion");
  const regionVal = regionInput.value.trim();
  localStorage.setItem("selectedRegion", regionVal);

  // Очищаем поле Город
  const cityEl = document.getElementById("filterCity");
  cityEl.value = "";

  // Очищаем поля Профиль, Вид, Район, Имя
  ["filterProfile", "filterType", "filterDistrict", "filterName"].forEach(
    (id) => {
      const el = document.getElementById(id);
      el.value = "";
    }
  );

  // Очищаем результаты и уведомления
  document.getElementById("cards").innerHTML =
    "Пожалуйста, выберите город и профиль для поиска.";
  document.getElementById("searchCount").innerText = "";

  checkFilterAccess();
});

document.getElementById("filterCity").addEventListener("input", () => {
  const cityVal = document.getElementById("filterCity").value.trim();
  localStorage.setItem("selectedCity", cityVal);

  // Очищаем поля Профиль, Вид, Район, Имя
  ["filterProfile", "filterType", "filterDistrict", "filterName"].forEach(
    (id) => {
      const el = document.getElementById(id);
      el.value = "";
    }
  );

  // Очищаем результаты и уведомления
  document.getElementById("cards").innerHTML =
    "Пожалуйста, выберите профиль для поиска.";
  document.getElementById("searchCount").innerText = "";

  checkFilterAccess();
});

function checkFilterAccess() {
  const region = document.getElementById("filterRegion").value.trim();
  const city = document.getElementById("filterCity").value.trim();

  const allow = region !== "" && city !== "";

  ["filterProfile", "filterType", "filterDistrict", "filterName"].forEach(
    (id) => {
      const el = document.getElementById(id);
      el.disabled = !allow;

      if (!allow) {
        el.addEventListener("focus", showWarningOnce);
      } else {
        el.removeEventListener("focus", showWarningOnce);
      }
    }
  );
}

function showWarningOnce(e) {
  alert("Пожалуйста, сначала выберите Область и Город");
  e.target.blur();
}

function restoreRegionCity() {
  const region = localStorage.getItem("selectedRegion");
  const city = localStorage.getItem("selectedCity");

  if (region) {
    document.getElementById("filterRegion").value = region;
  }
  if (city) {
    document.getElementById("filterCity").value = city;
  }

  // После установки значений, обновляем списки и доступность фильтров
  populateDependentLists(allServices);
  checkFilterAccess();
}

restoreRegionCity();
loadServices();

const filterFields = [
  "filterRegion",
  "filterCity",
  "filterProfile",
  "filterType",
  "filterDistrict",
  "filterName",
];

filterFields.forEach((id) => {
  const el = document.getElementById(id);

  el.addEventListener("focus", () => {
    el.value = "";

    requestAnimationFrame(() => {
      el.setSelectionRange(0, 0);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    if (id === "filterCity") {
      populateDependentLists(allServices);
    } else if (id === "filterRegion") {
      populateAllLists();
    } else if (
      id === "filterProfile" ||
      id === "filterType" ||
      id === "filterDistrict" ||
      id === "filterName"
    ) {
      const regionVal = document
        .getElementById("filterRegion")
        .value.trim()
        .toLowerCase();
      const cityVal = document
        .getElementById("filterCity")
        .value.trim()
        .toLowerCase();
      const profileVal = document
        .getElementById("filterProfile")
        .value.trim()
        .toLowerCase();
      const typeVal = document
        .getElementById("filterType")
        .value.trim()
        .toLowerCase();
      const districtVal = document
        .getElementById("filterDistrict")
        .value.trim()
        .toLowerCase();
      const nameVal = document
        .getElementById("filterName")
        .value.trim()
        .toLowerCase();

      const filtered = allServices.filter((service) => {
        const regions = (service["Область"] || "")
          .split(",")
          .map((s) => s.trim().toLowerCase());
        const cities = (service["Населённый пункт"] || "")
          .split(",")
          .map((s) => s.trim().toLowerCase());
        const profile = (service["Профиль деятельности"] || "").toLowerCase();
        const type = (service["Вид деятельности"] || "").toLowerCase();
        const district = (service["Район"] || "").toLowerCase();
        const name = (
          (service["Имя"] || "") +
          " " +
          (service["Компания"] || "")
        ).toLowerCase();

        return (
          (!regionVal || regions.includes(regionVal)) &&
          (!cityVal || cities.includes(cityVal)) &&
          (!profileVal || profile.includes(profileVal)) &&
          (!typeVal || type.includes(typeVal)) &&
          (!districtVal || district.includes(districtVal)) &&
          (!nameVal || name.includes(nameVal))
        );
      });

      if (id === "filterProfile") {
        populateList("listProfile", filtered, "Профиль деятельности");
      } else if (id === "filterType") {
        const list = document.getElementById("listType");
        if (!list) return; // Если элемента нет - выходим
        list.innerHTML = "";

        const valuesSet = new Set();
        filtered.forEach((service) => {
          const types = (service["Вид деятельности"] || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          types.forEach((t) => valuesSet.add(t));
        });

        Array.from(valuesSet)
          .sort((a, b) => a.localeCompare(b, "ru"))
          .forEach((val) => {
            const option = document.createElement("option");
            option.value = val;
            list.appendChild(option);
          });
      } else if (id === "filterDistrict") {
        populateList("listDistrict", filtered, "Район");
      } else if (id === "filterName") {
        populateList("listName", filtered, "Имя", true);
      }
    }
  });

  el.addEventListener("change", () => {
    el.blur();
  });
});

function showNotification(message) {
  // Удаляем старое уведомление если есть
  const oldNotification = document.getElementById("notification");
  if (oldNotification) {
    oldNotification.remove();
  }
  
  // Создаем новое уведомление
  const notification = document.createElement("div");
  notification.id = "notification";
  notification.textContent = message;
  
  // Стили для мобильной версии
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.left = "10px";
  notification.style.right = "10px";
  notification.style.background = "rgba(240, 147, 147, 0.95)";
  notification.style.color = "#0f0c0c";
  notification.style.padding = "15px 20px";
  notification.style.borderRadius = "8px";
  notification.style.textAlign = "center";
  notification.style.fontSize = "16px";
  notification.style.zIndex = "99999";
  notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  notification.style.fontWeight = "bold";
  
  // Добавляем в тело документа
  document.body.appendChild(notification);
  
  // Автоскрытие через 5 секунд
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

window.onload = () => {
  restoreRegionCity();
  loadServices();
  document.getElementById("logoutBtn").onclick = () => {
    logout();
    setTimeout(updateRolesVisibility, 100);
  };

  setTimeout(adjustCardsOffset, 500);
  setTimeout(updateRolesVisibility, 600);

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem("user");
    }
  }

  initGoogleAuth();
  updateAuthUI();

  document.getElementById("addServiceBtn").onclick = () => {
    window.location.href = "add.html";
  };
};

function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id:
      "1060687932793-sk24egn7c7r0h6t6i1dedk4u6hrgdotc.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    auto_select: false,
  });

  google.accounts.id.renderButton(document.getElementById("googleAuthBtn"), {
    theme: "outline",
    size: "large",
    type: "standard",
  });
}

async function handleCredentialResponse(response) {
  try {
    const payload = parseJWT(response.credential);

    // Сохраняем пользователя
    const user = {
      uid: "",
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: (await getUserRoleFromServer(payload.email)) || "user",
    };

    await saveUserToBackend(user);
    currentUser = user;
    currentUser.role = user.role || "user";
    localStorage.setItem("user", JSON.stringify(currentUser));
    updateAuthUI();
    updateRolesVisibility();
    applyFilters();
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    alert("Ошибка авторизации: " + error.message);
    logout();
  }
}

function parseJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    throw new Error("Невалидный токен");
  }
}

async function getUserRoleFromServer(email) {
  try {
    const response = await fetch(
      `${API_USER_URL}?action=getRole&email=${encodeURIComponent(email)}`
    );
    const data = await response.json();
    return data.role;
  } catch (e) {
    console.error("Ошибка при получении роли:", e);
    return null;
  }
}

async function saveUserToBackend(user) {
  try {
    const params = new URLSearchParams({
      email: user.email || "",
      name: user.name || "",
      picture: user.picture || "",
    });

    await fetch(`${API_USER_URL}?${params}`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-cache",
    });

    return { success: true };
  } catch (error) {
    console.error("Ошибка отправки:", error);
    return { success: false, error: error.message };
  }
}

function logout() {
  try {
    google.accounts.id.disableAutoSelect();
    if (currentUser?.email) {
      google.accounts.id.revoke(currentUser.email, () => {
        console.log("Доступ отозван");
      });
    }
  } catch (e) {
    console.error("Ошибка revoke:", e);
  }

  currentUser = null;
  localStorage.removeItem("user");
  updateAuthUI();
  updateRolesVisibility();
  applyFilters();
}

(function setupCustomTypeDropdown() {
  const input = document.getElementById("filterType");

  const dropdown = document.createElement("div");
  dropdown.id = "customTypeDropdown";
  dropdown.style.position = "absolute";
  dropdown.style.background = "#fff";
  dropdown.style.border = "1px solid #ccc";
  dropdown.style.borderRadius = "4px";
  dropdown.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  dropdown.style.maxHeight = "200px";
  dropdown.style.overflowY = "auto";
  dropdown.style.zIndex = "1000";
  dropdown.style.display = "none";

  document.body.appendChild(dropdown);

  function updateCustomTypeDropdown() {
    const query = input.value.trim().toLowerCase();
    dropdown.innerHTML = "";

    const matched = new Set();

    const regionVal = document
      .getElementById("filterRegion")
      .value.trim()
      .toLowerCase();
    const cityVal = document
      .getElementById("filterCity")
      .value.trim()
      .toLowerCase();
    const profileVal = document
      .getElementById("filterProfile")
      .value.trim()
      .toLowerCase();
    const districtVal = document
      .getElementById("filterDistrict")
      .value.trim()
      .toLowerCase();
    const nameVal = document
      .getElementById("filterName")
      .value.trim()
      .toLowerCase();

    allServices.forEach((s) => {
      const tags = (s["Теги"] || "").toLowerCase();
      const types = (s["Вид деятельности"] || "").split(",");

      const regions = (s["Область"] || "")
        .toLowerCase()
        .split(",")
        .map((x) => x.trim());
      const cities = (s["Населённый пункт"] || "")
        .toLowerCase()
        .split(",")
        .map((x) => x.trim());
      const profile = (s["Профиль деятельности"] || "").toLowerCase();
      const district = (s["Район"] || "").toLowerCase();
      const name = (
        (s["Имя"] || "") +
        " " +
        (s["Компания"] || "")
      ).toLowerCase();

      const match =
        (!regionVal || regions.includes(regionVal)) &&
        (!cityVal || cities.includes(cityVal)) &&
        (!profileVal || profile.includes(profileVal)) &&
        (!districtVal || district.includes(districtVal)) &&
        (!nameVal || name.includes(nameVal));

      if (match && (query === "" || tags.includes(query))) {
        types.forEach((t) => {
          const clean = t.trim();
          if (clean) matched.add(clean);
        });
      }
    });

    if (matched.size === 0) {
      dropdown.style.display = "none";
      return;
    }

    Array.from(matched)
      .sort((a, b) => a.localeCompare(b, "ru"))
      .forEach((val) => {
        const div = document.createElement("div");
        div.textContent = val;
        div.style.padding = "6px 10px";
        div.style.cursor = "pointer";
        div.addEventListener("mouseover", () => {
          div.style.background = "#f0f0f0";
        });
        div.addEventListener("mouseout", () => {
          div.style.background = "#fff";
        });
        div.addEventListener("click", () => {
          input.value = val;
          dropdown.style.display = "none";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        dropdown.appendChild(div);
      });

    const rect = input.getBoundingClientRect();
    dropdown.style.left = rect.left + window.scrollX + "px";
    dropdown.style.top = rect.bottom + window.scrollY + "px";
    dropdown.style.width = rect.width + "px";
    dropdown.style.display = "block";
  }

  input.addEventListener("input", updateCustomTypeDropdown);
  input.addEventListener("focus", () => {
    updateCustomTypeDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.style.display = "none";
    }
  });
})();

// Функция для создания единого dropdown
function initCommonDropdown(inputId) {
  const input = document.getElementById(inputId);
  const datalistId = "list" + inputId.replace("filter", "");
  if (!datalistId) return;

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown-common-style";
  dropdown.style.display = "none";
  document.body.appendChild(dropdown);

  const updateDropdown = () => {
    const value = input.value.toLowerCase();
    dropdown.innerHTML = "";

    const options = Array.from(document.getElementById(datalistId).options)
      .filter((opt) => opt.value.toLowerCase().includes(value))
      .sort((a, b) => a.value.localeCompare(b.value, "ru"));

    options.forEach((opt) => {
      const item = document.createElement("div");
      item.textContent = opt.value;
      item.addEventListener("click", () => {
        input.value = opt.value;
        dropdown.style.display = "none";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      dropdown.appendChild(item);
    });

    if (options.length > 0) {
      const rect = input.getBoundingClientRect();
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.top = `${rect.bottom}px`;
      dropdown.style.width = `${rect.width}px`;
      dropdown.style.display = "block";
    } else {
      dropdown.style.display = "none";
    }
  };

  // Обработчики событий
  input.addEventListener("focus", updateDropdown);
  input.addEventListener("input", updateDropdown);

  // Скрытие при клике вне поля
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
  // Фиксация полей на мобильных
  if (isMobile) {
    document.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focus", function () {
        this.classList.add("input-fixed-absolute");
        window.scrollTo(0, 0);
      });

      input.addEventListener("blur", function () {
        this.classList.remove("input-fixed-absolute");
      });
    });
  }
  // Функция для добавления крестиков
  function setupClearButtons() {
    const inputIds = [
      "filterRegion",
      "filterCity",
      "filterProfile",
      "filterType",
      "filterDistrict",
      "filterName",
    ];

    inputIds.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;

      // Для мобильной версии - простой крестик без обертки
if (isMobile) {
  // Удаляем существующий крестик если есть
  const existingClear = input.nextElementSibling;
  if (existingClear && existingClear.classList.contains("input-clear-mobile")) {
    existingClear.remove();
  }

  const clearBtn = document.createElement("button");
  clearBtn.className = "input-clear-mobile";
  clearBtn.innerHTML = "×";
  clearBtn.type = "button";
  clearBtn.style.display = "none"; // Сначала скрыт
  
  input.parentNode.insertBefore(clearBtn, input.nextSibling);

  // Показываем крестик при фокусе
  input.addEventListener("focus", function() {
    clearBtn.style.display = "block";
  });

  // Скрываем крестик при потере фокуса
  input.addEventListener("blur", function() {
    setTimeout(() => {
      clearBtn.style.display = "none";
    }, 200);
  });

  clearBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    input.value = "";
    input.focus();
    
    // Скрываем дропдаун если открыт
    const dropdown = document.querySelector(".dropdown-common-style");
    if (dropdown) dropdown.style.display = "none";
    
    // Скрываем крестик после очистки
    clearBtn.style.display = "none";
  });

  // Показываем крестик если поле не пустое при загрузке
  if (input.value.trim() !== "") {
    clearBtn.style.display = "block";
  }
}
      // Для десктопа - версия с оберткой
      else {
        if (input.parentNode.classList.contains("input-wrapper-dt")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "input-wrapper-dt";
        Object.assign(wrapper.style, {
          position: "relative",
          flex: "1 1 auto",
          minWidth: "0",
          width: "100%",
        });

        // Сохраняем все существующие классы и атрибуты
        const parent = input.parentNode;
        parent.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const clearBtn = document.createElement("button");
        clearBtn.className = "input-clear-desktop";
        clearBtn.innerHTML = "×";
        clearBtn.type = "button";
        wrapper.appendChild(clearBtn);

        clearBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          input.value = "";
          input.focus();
          const dropdown = document.querySelector(".dropdown-common-style");
          if (dropdown) dropdown.style.display = "none";
        });
      }
    });
  }

  // Вызываем при загрузке
  document.addEventListener("DOMContentLoaded", setupClearButtons);
}

// Убедимся что функция вызывается после полной загрузки  
document.addEventListener("DOMContentLoaded", function() {
  if (typeof setupClearButtons === 'function') {
    setupClearButtons();
  }
});

// Инициализация для всех полей
[
  "filterRegion",
  "filterCity",
  "filterProfile",
  "filterDistrict",
  "filterName",
].forEach(initCommonDropdown);

// Дополнительная функция для управления кнопками по ролям (опционально)
function manageRoleBasedButtons() {
  const allButtons = document.querySelectorAll("[data-roles]");

  allButtons.forEach((button) => {
    const allowedRoles = button.getAttribute("data-roles").split(",");
    const isVisible = currentUser && allowedRoles.includes(currentUser.role);

    if (isVisible) {
      button.classList.remove("hidden");
    } else {
      button.classList.add("hidden");
    }
  });
}

// Функция для обработки TG пользователя через GAS
async function handleTelegramUser(tgUser) {
  try {
    const tgData = JSON.stringify({
      id: tgUser.id,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      username: tgUser.username
    });
    
    const url = `https://script.google.com/macros/s/AKfycbxjECFiBLd5Y2X760SVngkL5vPDAlQ8-5SJofbdKWofhmAD3zxzwSrw_Lm01Z4wDmA/exec?tgData=${encodeURIComponent(tgData)}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      console.log("TG пользователь записан в GAS:", result.user);
      return result.user;
    } else {
      console.error("Ошибка GAS:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Ошибка связи с GAS:", error);
    return null;
  }
}

// Принудительный вызов крестиков
setTimeout(function() {
  if (typeof setupClearButtons === 'function') {
    setupClearButtons();
    console.log('Крестики инициализированы');
  } else {
    console.log('Функция setupClearButtons не найдена');
  }
}, 1000);

// Принудительная инициализация крестиков с проверкой мобильности
function initCrossButtons() {
  console.log('Инициализация крестиков, мобильный:', isMobile);
  
  const inputIds = [
    "filterRegion", "filterCity", "filterProfile", 
    "filterType", "filterDistrict", "filterName"
  ];

  inputIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    // Удаляем старые крестики
    const oldClear = input.nextElementSibling;
    if (oldClear && oldClear.classList.contains('input-clear-mobile')) {
      oldClear.remove();
    }

    if (isMobile) {
      const clearBtn = document.createElement("button");
      clearBtn.className = "input-clear-mobile";
      clearBtn.innerHTML = "×";
      clearBtn.type = "button";
      clearBtn.style.display = "none";
      
      input.parentNode.insertBefore(clearBtn, input.nextSibling);

      input.addEventListener("focus", function() {
        console.log('Фокус на поле', id);
        clearBtn.style.display = "block";
        input.classList.add('input-fixed-absolute');
      });

      input.addEventListener("blur", function() {
        setTimeout(() => {
          clearBtn.style.display = "none";
          input.classList.remove('input-fixed-absolute');
        }, 200);
      });

      clearBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        input.value = "";
        clearBtn.style.display = "none";
        input.focus();
      });

      if (input.value.trim() !== "") {
        clearBtn.style.display = "block";
      }
    }
  });
}

// Вызываем при загрузке и при изменении размера
document.addEventListener("DOMContentLoaded", initCrossButtons);
window.addEventListener('load', initCrossButtons);
setTimeout(initCrossButtons, 1000);