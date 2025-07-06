// === НАСТРОЙКИ ===
const spreadsheetId = "1vKErM8FIGNM5if0zpsaCWutsQgscqrPo2bUWJACTcf0";
const sheetsURL = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&tq=`;

document.addEventListener("DOMContentLoaded", () => {
  loadRegionList();
  // Взаимоисключение: область из списка и кастомная
  const regionSelect = document.getElementById("regionSelect");
  const regionCustom = document.getElementById("regionCustom");

  regionCustom.addEventListener("input", () => {
    regionSelect.value = "";
    clearTownSelection();
  });

  regionSelect.addEventListener("change", () => {
    regionCustom.value = "";
  });
  function clearTownSelection() {
    selectedValues.selectedTownsContainer = [];
    document.getElementById("selectedTownsContainer").innerHTML = "";
    document.getElementById("townSelect").innerHTML =
      '<option value="">-- Выберите город --</option>';
    document.getElementById("townSelect").disabled = true;
    document.getElementById("townCustom").value = "";
  }

  // При выборе области - загрузить города в селект (без multiple)
  document
    .getElementById("regionSelect")
    .addEventListener("change", async () => {
      const region = document.getElementById("regionSelect").value;
      const select = document.getElementById("townSelect");
      select.innerHTML = '<option value="">-- Выберите город --</option>';

      // Очистить выбранные города
      selectedValues.selectedTownsContainer = [];
      document.getElementById("selectedTownsContainer").innerHTML = "";

      clearTownSelection();

      if (!region) {
        select.disabled = true;
        return;
      }

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

      uniqueTowns.forEach((town) => {
        const opt = document.createElement("option");
        opt.value = town;
        opt.textContent = town;
        select.appendChild(opt);
      });

      select.disabled = false;
    });

  // Обработчик выбора города из селекта (один за раз)
  document.getElementById("townSelect").addEventListener("change", (e) => {
    const val = e.target.value;
    if (!val) return;

    const containerId = "selectedTownsContainer";

    if (selectedValues[containerId].includes(val)) {
      // Удаляем из выбранных
      selectedValues[containerId] = selectedValues[containerId].filter(
        (v) => v !== val
      );
    } else {
      if (selectedValues[containerId].length >= 10) {
        showMessage("Нельзя выбрать более 10 населённых пунктов");
        e.target.value = ""; // Сброс выбора
        return;
      }

      selectedValues[containerId].push(val);
    }
    updateSelectedTownsUI();

    e.target.value = ""; // Сбросить выбор, чтобы можно было выбрать следующий
  });

  function updateSelectedTownsUI() {
    const container = document.getElementById("selectedTownsContainer");
    container.innerHTML = "";
    selectedValues.selectedTownsContainer.forEach((val) => {
      const span = document.createElement("span");
      span.textContent = val;
      span.className = "selected-item";
      span.title = "Клик для удаления";
      span.style.cursor = "pointer";
      span.addEventListener("click", () => {
        selectedValues.selectedTownsContainer =
          selectedValues.selectedTownsContainer.filter((v) => v !== val);
        updateSelectedTownsUI();
      });
      container.appendChild(span);
    });
  }

  loadProfileList();
  setupMultiInput("townCustom", "selectedTownsContainer", 10);
  setupMultiInput("kindCustom", "selectedKindsContainer", 10);
  setupProfileWatcher();
  document.getElementById("kindSelect").addEventListener("change", () => {
    const select = document.getElementById("kindSelect");
    const val = select.value;

    if (!val) return;

    const containerId = "selectedKindsContainer";

    if (selectedValues[containerId].includes(val)) {
      select.value = "";
      return;
    }

    if (selectedValues[containerId].length >= 10) {
      showMessage("Нельзя выбрать более 10 видов деятельности");
      select.value = "";
      return;
    }

    addSelectedValue(val, containerId, 10);
    select.value = "";
  });

  setupPhoneAdd();
  setupLinks();
  document
    .getElementById("serviceForm")
    .addEventListener("submit", handleSubmit);
});

// === ЗАГРУЗКА И ОБРАБОТКА ДАННЫХ ===
async function fetchSheetData(sheet, range = "") {
  const query = `SELECT *`;
  const url = `${sheetsURL}${query}&sheet=${sheet}${range}`;
  const response = await fetch(url);
  const text = await response.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));
  return json.table.rows.map((row) =>
    row.c.map((cell) => (cell ? cell.v : ""))
  );
}

async function loadRegionList() {
  const rows = await fetchSheetData("Населённые пункты");
  const all = rows
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
}

function loadTownListByRegion(region, townListRef) {
  fetchSheetData("Населённые пункты").then((rows) => {
    const towns = rows
      .filter((row) => cleanText(row[1]) === region)
      .map((r) => (r[0] || "").split(","))
      .flat()
      .map(cleanText)
      .filter(Boolean);

    const list = countAndSort(towns);

    // обновляем переданный массив
    townListRef.length = 0;
    townListRef.push(...list);
  });
}

async function loadProfileList() {
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
}

function setupProfileWatcher() {
  document
    .getElementById("profileSelect")
    .addEventListener("change", async () => {
      const selected = cleanText(
        document.getElementById("profileSelect").value
      );
      const rows = await fetchSheetData("Категории");
      const kinds = rows
        .filter((r) => cleanText(r[0]) === selected)
        .map((r) => cleanText(r[1]));
      const uniqueKinds = [...new Set(kinds)].filter(Boolean);
      const select = document.getElementById("kindSelect");
      select.innerHTML = '<option value="">-- Выберите вид --</option>';
      uniqueKinds.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      });
      select.disabled = false;

      // Очистить выбранные виды при смене профиля
      selectedValues.selectedKindsContainer = [];
      document.getElementById("selectedKindsContainer").innerHTML = "";
      select.value = "";
    });
}

// === УТИЛИТЫ ===
function cleanText(str) {
  return String(str || "")
    .replace(/[«»„“"'`]/g, "")
    .trim();
}

function countAndSort(arr) {
  const map = {};
  arr.forEach((v) => (map[v] = (map[v] || 0) + 1));
  return Object.keys(map).sort((a, b) => map[b] - map[a]);
}

const selectedValues = {
  selectedTownsContainer: [],
  selectedKindsContainer: [],
};

function setupMultiInput(inputId, containerId, limit) {
  document.getElementById(inputId).addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = cleanText(e.target.value);

      if (!val) return;

      if (selectedValues[containerId].includes(val)) return;

      if (selectedValues[containerId].length >= limit) {
        showMessage(`Нельзя выбрать более ${limit} значений`);
        return;
      }

      addSelectedValue(val, containerId, limit);
      e.target.value = "";
    }
  });
}

function addSelectedValue(val, containerId, limit) {
  if (selectedValues[containerId].includes(val)) return;
  selectedValues[containerId].push(val);
  const span = document.createElement("span");
  span.textContent = val;
  span.className = "selected-item";
  span.addEventListener("click", () => {
    span.remove();
    selectedValues[containerId] = selectedValues[containerId].filter(
      (v) => v !== val
    );
  });
  document.getElementById(containerId).appendChild(span);
}

function setupAutocomplete(inputId, sourceArray, containerId, limit) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById("townSuggestions");
  input.addEventListener("input", () => {
    const val = cleanText(input.value.toLowerCase());
    suggestions.innerHTML = "";
    if (!val) return;
    sourceArray
      .filter((item) => item.toLowerCase().startsWith(val))
      .slice(0, 10)
      .forEach((match) => {
        const li = document.createElement("li");
        li.textContent = match;
        li.addEventListener("click", () => {
          if (selectedValues[containerId].includes(match)) return;

          if (selectedValues[containerId].length >= limit) {
            showMessage(`Нельзя выбрать более ${limit} значений`);
            return;
          }

          addSelectedValue(match, containerId, limit);
          input.value = "";
          suggestions.innerHTML = "";
        });
        suggestions.appendChild(li);
      });
  });
  document.addEventListener("click", (e) => {
    if (!suggestions.contains(e.target) && e.target !== input)
      suggestions.innerHTML = "";
  });
}

function setupPhoneAdd() {
  const input = document.getElementById("phoneInput");
  const container = document.getElementById("phonesContainer");
  const btn = document.getElementById("addPhoneBtn");

  btn.addEventListener("click", () => {
    const val = input.value.trim();

    if (!/^380\d{9}$/.test(val)) {
      showMessage("Неверный формат телефона. Пример: 380671112233");
      return;
    }

    const existingPhones = Array.from(
      container.querySelectorAll(".phone-item")
    ).map((el) => el.textContent);

    if (existingPhones.includes(val)) {
      showMessage("Такой номер уже добавлен");
      input.value = "";
      return;
    }

    if (existingPhones.length >= 10) {
      showMessage("Можно добавить не более 10 номеров");
      return;
    }

    const div = document.createElement("div");
    div.textContent = val;
    div.className = "phone-item";
    div.addEventListener("click", () => div.remove());
    container.appendChild(div);
    input.value = "";
  });
}

function setupLinks() {
  document.querySelectorAll(".link-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const type = checkbox.dataset.type;
      const container = document.getElementById("linksInputsContainer");
      const existing = container.querySelector(`[data-type="${type}"]`);
      if (checkbox.checked) {
        const input = document.createElement("input");
        input.placeholder = `Введите ${type}`;
        input.dataset.type = type;
        container.appendChild(input);
      } else if (existing) {
        existing.remove();
      }
    });
  });
}

// === ОТПРАВКА ===
async function handleSubmit(e) {
  e.preventDefault();
  const errors = [];

  const region =
    document.getElementById("regionSelect").value ||
    document.getElementById("regionCustom").value;
  if (!region) errors.push("Область обязательна");

  const selectedTowns = selectedValues["selectedTownsContainer"]
    .concat(document.getElementById("townCustom").value.trim())
    .filter(Boolean);

  if (selectedTowns.length === 0 || selectedTowns.length > 10) {
    errors.push("Укажите до 10 населённых пунктов");
  }

  const kinds = selectedValues["selectedKindsContainer"]
    .concat(document.getElementById("kindCustom").value)
    .filter(Boolean);
  if (kinds.length === 0 || kinds.length > 10)
    errors.push("Укажите до 10 видов деятельности");

  const profile = document.getElementById("profileSelect").value;
  if (!profile) errors.push("Профиль деятельности обязателен");

  const descShort = document.getElementById("descShort").value;
  const descLong = document.getElementById("descLong").value;
  if (!descShort || !descLong) errors.push("Оба описания обязательны");

  const name = document.getElementById("nameInput").value;
  const company = document.getElementById("companyInput").value;
  if (!name && !company) errors.push("Укажите Имя или Компанию");

  const phoneElements = document.querySelectorAll(".phone-item");
  const phones = Array.from(phoneElements)
    .map((d) => d.textContent)
    .filter(Boolean);
  if (phones.length === 0) errors.push("Укажите хотя бы один телефон");
  const phonesString = phones.join(", ");

  if (errors.length > 0) {
    showMessage("Ошибки:<br>" + errors.join("<br>"));
    return;
  }

  const now = new Date();
  const date =
    now.toLocaleDateString("ru-RU") + " " + now.toLocaleTimeString("ru-RU");

  const payload = {
    "Дата добавления": date,
    Область: region,
    "Населённый пункт": selectedTowns.join(", "),
    "Район города": document.getElementById("cityDistrict").value,
    "Профиль деятельности": profile,
    "Вид деятельности": kinds.join(", "),
    Имя: name,
    Компания: company,
    "Описание (до 75 симв)": descShort,
    "Описание (до 700 симв)": descLong,
    Адрес: document.getElementById("addressInput").value,
    Телефоны: phonesString,

    Ссылки: Array.from(document.querySelectorAll("#linksInputsContainer input"))
      .map((i) => `${i.dataset.type}:${i.value}`)
      .join(", "),
    Геолокация: document.getElementById("geoLocation").value,
    // Остальные скрытые поля заполняются позже
  };

  console.log("Данные для отправки:", payload);
  showMessage("Отправка данных...");
  await submitToSheet(payload);
}

async function submitToSheet(data) {
  const formUrl =
    "https://script.google.com/macros/s/AKfycbw6FAWTC1ux2M3H6H8tuoZvmVEpYEfWcpihd0C0Huh-U_ErgajS6WfKOIugafn1yFTzVg/exec";

  const formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, data[key]));

  try {
    const response = await fetch(formUrl, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showMessage("Услуга успешно добавлена!");
      document.getElementById("serviceForm").reset();
      location.reload();
    } else {
      showMessage("Ошибка при отправке. Попробуйте позже.");
    }
  } catch (err) {
    console.error("Ошибка отправки:", err);
    showMessage("Ошибка соединения. Проверьте интернет.");
  }
}
function showMessage(text) {
  const box = document.getElementById("messageBox");
  box.innerHTML = text;
  box.classList.remove("hidden");
  box.classList.add("visible");

  setTimeout(() => {
    box.classList.remove("visible");
    box.classList.add("hidden");
  }, 5000);
}
