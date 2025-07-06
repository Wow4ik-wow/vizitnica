const apiUrl =
  "https://script.google.com/macros/s/AKfycbw27eyw53gPs8tgLexDkiYmjMJ70HpB0fkDFuCu6gRK0Hz997jDzw3TAMh-rQD_mqoTDA/exec";
let allServices = [];

async function loadServices() {
  document.getElementById("cards").innerText = "Сайт загружается...";
  try {
    const response = await fetch(apiUrl);
    allServices = await response.json();
    populateAllLists();
    document.getElementById("cards").innerText =
      "Сайт готов к работе. Нажмите кнопку «Поиск», чтобы увидеть результаты.";
  } catch (e) {
    console.error("Ошибка загрузки данных:", e);
    // Ошибку показывать не будем, чтобы не пугать пользователя
    // Можно просто оставить надпись "Сайт готов к работе"
    document.getElementById("cards").innerText =
      "Сайт готов к работе. Начинайте заполнять поля поиска.";
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

    const id = service["id номер"] || "";

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

      <div class="card-text" style="display:none; font-size: 14px;">`;

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
      contentHTML += `<div><strong>Описание:</strong> ${description}</div>`;

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

    contentHTML += socialButtonsHTML;
    contentHTML += geoHTML;

    contentHTML += `
      <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button onclick="window.scrollTo({ top: 0, behavior: 'smooth' })" style="padding: 6px 10px;">НАЗАД К ПОИСКУ</button>
        <button onclick="addToFavorites('${id}')" style="padding: 6px 10px;">В ИЗБРАННОЕ</button>
      </div>

      ${
        id
          ? `<div style="text-align: right; font-size: 10px; margin-top: 10px; color: #888;">${id}</div>`
          : ""
      }

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
  });
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
  populateList("listType", filtered, "Вид деятельности");
  populateList("listDistrict", filtered, "Район");
  populateList("listName", filtered, "Имя", true);
}

function populateAllLists() {
  populateDatalist("listRegion", getUniqueValues(allServices, "Область"));
  populateProfileList(allServices);

  populateDatalist(
    "listType",
    getUniqueValues(allServices, "Вид деятельности")
  );
  populateDatalist("listDistrict", getUniqueValues(allServices, "Район"));
  populateList("listName", allServices, "Имя", true);

  populateDependentLists(allServices);
}

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

  // Получаем текущие значения фильтров и нормализуем их
  const filterValues = {};
  for (const key in filterFields) {
    const val = filterFields[key];
    filterValues[key] = useLowerCase ? val.trim().toLowerCase() : val.trim();
  }

  services.forEach((service) => {
    // Для каждого фильтра получаем массив значений (сплитим по запятой, убираем пробелы и нормализуем)
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
      // Сплитим и добавляем каждое отдельно, убираем пустые
      valueToAdd
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)
        .forEach((v) => valuesSet.add(useLowerCase ? v.toLowerCase() : v));
    } else if (fieldName === "Имя" || fieldName === "Компания") {
      // Для списка имён объединяем Имя и Компания
      // Но эта функция вызывается отдельно для listName с объединением ниже
      // Здесь игнорируем, чтобы не дублировать
    } else {
      valuesSet.add(
        useLowerCase ? valueToAdd.trim().toLowerCase() : valueToAdd.trim()
      );
    }
  });

  // Особая обработка для listName - объединяем Имя и Компания из services
  if (listId === "listName") {
    // Собираем уникальные Имя и Компания по фильтрам отдельно
    services.forEach((service) => {
      // Проверка фильтров повторяется, можно было оптимизировать, но оставим так
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

  // Преобразуем в массив и сортируем по-русски, с учетом регистра для читаемости
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
    // input.value = ""; // <- закомментировано, чтобы не очищать поле сразу
    if (typeof onFocusCallback === "function") onFocusCallback();
  });
  input.addEventListener("blur", () => {
    // пустой обработчик, чтобы не мешать списку выпадать
  });
}

// Поведение поля ОБЛАСТЬ
setupInputAutobehavior("filterRegion", () => {
  populateDependentLists(filtered);
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

      if (id === "filterProfile")
        populateList("listProfile", filtered, "Профиль деятельности");
      else if (id === "filterType")
        populateList("listType", filtered, "Вид деятельности");
      else if (id === "filterDistrict")
        populateList("listDistrict", filtered, "Район");
      else if (id === "filterName")
        populateList("listName", filtered, "Имя", true);
    }
  });

  el.addEventListener("change", () => {
    el.blur(); // при выборе из списка закрываем его
  });
});

function showNotification(message) {
  const el = document.getElementById("notification");
  el.textContent = message;
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 5000);
}

let currentUser = null;

window.onload = () => {
  google.accounts.id.initialize({
    client_id:
      "1060687932793-sk24egn7c7r0h6t6i1dedk4u6hrgdotc.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    auto_select: false,
  });

  // Восстанавливаем пользователя из localStorage
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateAuthUI();
  }

  document.getElementById("loginBtn").addEventListener("click", () => {
    if (!currentUser) {
      google.accounts.id.prompt();
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Назначаем обработчик кнопке "Добавить услугу" в зависимости от авторизации
  if (currentUser) {
    document.getElementById("addServiceBtn").onclick = () => {
      window.location.href = "add.html";
    };
  } else {
    document.getElementById("addServiceBtn").onclick = () => {
      showNotification("Авторизуйтесь, чтобы добавить услугу");
    };
  }
};

function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  const user = {
    uid: data.sub,
    email: data.email,
    name: data.name,
    photoURL: data.picture,
    role: "user" // Добавляем роль по умолчанию
  };
  
  currentUser = user;
  localStorage.setItem("user", JSON.stringify(user));

  // Отправка данных в Google Sheets
  fetch("https://script.google.com/macros/s/AKfycbzTO5l8uAXewXcaAEOuYEBZgeyQ-mQz49wp8HeX1xBE2Dtwdt3DecCpMKL6VrT3rOBd/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
    mode: 'no-cors'
  })
  .then(() => {
    console.log("Данные отправлены в таблицу");
    updateAuthUI();
    checkUserRole(); // Проверяем роль пользователя
  })
  .catch(error => {
    console.error("Ошибка отправки:", error);
    updateAuthUI(); // Все равно обновляем интерфейс
  });
}

function checkUserRole() {
  if (!currentUser) return;
  
  fetch(`https://script.google.com/macros/s/AKfycbzTO5l8uAXewXcaAEOuYEBZgeyQ-mQz49wp8HeX1xBE2Dtwdt3DecCpMKL6VrT3rOBd/exec?action=getRole&uid=${currentUser.uid}`)
  .then(response => response.json())
  .then(data => {
    if (data.role === "admin") {
      document.getElementById("adminBtn").classList.remove("hidden");
    }
  })
  .catch(console.error);
}

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

function updateAuthUI() {
  const isLoggedIn = !!currentUser;
  
  document.getElementById("loginBtn").classList.toggle("hidden", isLoggedIn);
  document.getElementById("logoutBtn").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("cabinetBtn").classList.toggle("hidden", !isLoggedIn);
  
  // Кнопка админа скрыта по умолчанию, показывается только после checkUserRole
  document.getElementById("addServiceBtn").onclick = isLoggedIn 
    ? () => window.location.href = "add.html"
    : () => showNotification("Авторизуйтесь для добавления услуги");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("user");
  google.accounts.id.disableAutoSelect();
  document.getElementById("loginBtn").classList.remove("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
  document.getElementById("cabinetBtn").classList.add("hidden");
  document.getElementById("adminBtn").classList.add("hidden");

  document.getElementById("addServiceBtn").onclick = () => {
    showNotification("Авторизуйтесь, чтобы добавить услугу");
  };
}

function saveUserToSheet(user) {
  const scriptUrl =
    "https://script.google.com/macros/s/AKfycbxwzZChCBrrgV-I9NJItR2KITwyA9Xi23aQt9CZblsvXKEnkFE5xJBSnWXcceOzYxnjyg/exec";

  fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: user.token }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Ответ от сервера:", data);
    })
    .catch((error) => {
      console.error("❌ Ошибка при отправке данных:", error);
    });
}
