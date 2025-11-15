const headerKeys = {
  // Боковые рекламные блоки
  sideBlockLeft: {
    1920: { top: 80, left: 100, width: 450, height: 450 },
    1281: { top: 80, left: 20, width: 340, height: 340 },
    1280: { top: 280, left: 50, width: 300, height: 300 },
    961: { top: 280, left: 20, width: 300, height: 300 },
    960: { top: 430, left: 200, width: 200, height: 200 },
    500: { top: 430, left: 30, width: 200, height: 200 },
  },
  sideBlockRight: {
    1920: { top: 80, left: 1360, width: 450, height: 450 },
    1281: { top: 80, left: 910, width: 340, height: 340 },
    1280: { top: 280, left: 920, width: 300, height: 300 },
    961: { top: 280, left: 640, width: 300, height: 300 },
    960: { top: 430, left: 550, width: 200, height: 200 },
    500: { top: 430, left: 260, width: 200, height: 200 },
  },

  // Нижние рекламные блоки под фильтрами (каждый блок отдельно)
  bottomBlock1: {
    1920: { top: 555, left: 320, width: 300, height: 300 },
    1281: { top: 430, left: 20, width: 300, height: 300 },
    1280: { top: 280, left: 490, width: 300, height: 300 },
    961: { top: 280, left: 330, width: 300, height: 300 },
    960: { top: 640, left: 200, width: 200, height: 200 },
    500: { top: 640, left: 30, width: 200, height: 200 },
  },
  bottomBlock2: {
    1920: { top: 555, left: 640, width: 300, height: 300 },
    1281: { top: 430, left: 330, width: 300, height: 300 },
    1280: { top: 590, left: 50, width: 300, height: 300 },
    961: { top: 590, left: 20, width: 300, height: 300 },
    960: { top: 640, left: 550, width: 200, height: 200 },
    500: { top: 640, left: 260, width: 200, height: 200 },
  },
  bottomBlock3: {
    1920: { top: 555, left: 960, width: 300, height: 300 },
    1281: { top: 430, left: 640, width: 300, height: 300 },
    1280: { top: 590, left: 490, width: 300, height: 300 },
    961: { top: 590, left: 330, width: 300, height: 300 },
    960: { top: 850, left: 200, width: 200, height: 200 },
    500: { top: 850, left: 30, width: 200, height: 200 },
  },
  bottomBlock4: {
    1920: { top: 555, left: 1280, width: 300, height: 300 },
    1281: { top: 430, left: 950, width: 300, height: 300 },
    1280: { top: 590, left: 920, width: 300, height: 300 },
    961: { top: 590, left: 640, width: 300, height: 300 },
    960: { top: 850, left: 550, width: 200, height: 200 },
    500: { top: 850, left: 260, width: 200, height: 200 },
  },

  // Заголовок
  pageTitle: {
    1920: { top: 68, left: 830, fontSize: 48, width: 350 },
    1281: { top: 68, left: 530, fontSize: 48, width: 350 },
    1280: { top: 18, left: 10, fontSize: 48, width: 350 },
    961: { top: 18, left: 10, fontSize: 48, width: 350 },
    960: { top: 325, left: 400, fontSize: 40, width: 470 },
    500: { top: 325, left: 10, fontSize: 40, width: 470 },
  },
  // Подпись под заголовком
  pageSubtitle: {
    1920: { top: 180, left: 830, fontSize: 32 },
    1281: { top: 180, left: 530, fontSize: 23 },
    1280: { top: 230, left: 10, fontSize: 24 },
    961: { top: 230, left: 10, fontSize: 21 },
    960: { top: 385, left: 400, fontSize: 26 },
    500: { top: 385, left: 100, fontSize: 22 },
  },

  // Кнопка поиска
  searchBtn: {
    1920: { top: 380, left: 600, width: 705, height: 35 },
    1281: { top: 380, left: 365, width: 540, height: 35 },
    1280: { top: 230, left: 540, width: 710, height: 35 },
    961: { top: 230, left: 360, width: 570, height: 35 },
    960: { top: 278, left: 800, width: 140, height: 40 },
    500: { top: 278, left: 340, width: 140, height: 40 },
  },

  // Кнопки (каждая отдельная)
  
  authLogin: {
    // Кнопка ВХОД/ВЫХОД
    1920: { top: 28, left: 1750, width: 140, height: 40 },
    961: { top: 28, left: 800, width: 140, height: 40 },
    960: { top: 28, left: 800, width: 140, height: 40 },
    500: { top: 28, left: 340, width: 140, height: 40 },
  },
  authAdmin: {
    // Кнопка АДМИНКА
    1920: { top: 28, left: 1370, width: 90, height: 40 },
    961: { top: 28, left: 415, width: 90, height: 40 },
    960: { top: 78, left: 800, width: 140, height: 40 },
    500: { top: 78, left: 340, width: 140, height: 40 },
  },
  authAddService: {
    // Кнопка ДОБАВИТЬ УСЛУГУ
    1920: { top: 28, left: 1465, width: 140, height: 40 },
    961: { top: 28, left: 512, width: 140, height: 40 },
    960: { top: 128, left: 800, width: 140, height: 40 },
    500: { top: 128, left: 340, width: 140, height: 40 },
  },
  authProfile: {
    // Кнопка ЛИЧНЫЙ КАБИНЕТ
    1920: { top: 28, left: 1610, width: 133, height: 40 },
    961: { top: 28, left: 660, width: 133, height: 40 },
    960: { top: 178, left: 800, width: 140, height: 40 },
    500: { top: 178, left: 340, width: 140, height: 40 },
  },

  // Поля фильтров (каждое поле отдельно)
  filter1: {
    // Поле ОБЛАСТЬ
    1920: { top: 230, left: 600, width: 350, height: 40 },
    1281: { top: 230, left: 365, width: 265, height: 40 },
    1280: { top: 80, left: 540, width: 350, height: 40 },
    961: { top: 80, left: 360, width: 265, height: 40 },
    960: { top: 28, left: 370, width: 400, height: 40 },
    500: { top: 28, left: 110, width: 220, height: 40 },
  },
  filter2: {
    // Поле ГОРОД
    1920: { top: 230, left: 955, width: 350, height: 40 },
    1281: { top: 230, left: 640, width: 265, height: 40 },
    1280: { top: 80, left: 900, width: 350, height: 40 },
    961: { top: 80, left: 665, width: 265, height: 40 },
    960: { top: 78, left: 370, width: 400, height: 40 },
    500: { top: 78, left: 110, width: 220, height: 40 },
  },

  filter3: {
    // Поле ПРОФИЛЬ
    1920: { top: 280, left: 600, width: 350, height: 40 },
    1281: { top: 280, left: 365, width: 265, height: 40 },
    1280: { top: 130, left: 540, width: 350, height: 40 },
    961: { top: 130, left: 360, width: 265, height: 40 },
    960: { top: 128, left: 370, width: 400, height: 40 },
    500: { top: 128, left: 110, width: 220, height: 40 },
  },
  filter4: {
    // Поле ВИД
    1920: { top: 280, left: 955, width: 350, height: 40 },
    1281: { top: 280, left: 640, width: 265, height: 40 },
    1280: { top: 130, left: 900, width: 350, height: 40 },
    961: { top: 130, left: 665, width: 265, height: 40 },
    960: { top: 178, left: 370, width: 400, height: 40 },
    500: { top: 178, left: 110, width: 220, height: 40 },
  },

  filter5: {
    // Поле РАЙОН
    1920: { top: 330, left: 600, width: 350, height: 40 },
    1281: { top: 330, left: 365, width: 265, height: 40 },
    1280: { top: 180, left: 540, width: 350, height: 40 },
    961: { top: 180, left: 360, width: 265, height: 40 },
    960: { top: 228, left: 370, width: 400, height: 40 },
    500: { top: 228, left: 110, width: 220, height: 40 },
  },
  filter6: {
    // Поле ИМЯ
    1920: { top: 330, left: 955, width: 350, height: 40 },
    1281: { top: 330, left: 640, width: 265, height: 40 },
    1280: { top: 180, left: 900, width: 350, height: 40 },
    961: { top: 180, left: 665, width: 265, height: 40 },
    960: { top: 278, left: 370, width: 400, height: 40 },
    500: { top: 278, left: 110, width: 220, height: 40 },
  },
};

// Интерполяция числовых значений
function interpolate(val1, val2, ratio) {
  return val1 + (val2 - val1) * ratio;
}

// Применяем ключевые точки к объектам
function applyHeaderKeys() {
  const width = window.innerWidth;

  const applyElement = (element, points) => {
    if (!element) return;

    const breakpoints = Object.keys(points)
      .map(Number)
      .sort((a, b) => a - b);
    let leftBP = breakpoints[0];
    let rightBP = breakpoints[breakpoints.length - 1];

    for (let i = 0; i < breakpoints.length; i++) {
      if (width >= breakpoints[i]) leftBP = breakpoints[i];
      if (width <= breakpoints[i]) {
        rightBP = breakpoints[i];
        break;
      }
    }

    const leftVal = points[leftBP];
    const rightVal = points[rightBP];
    const ratio = (width - leftBP) / (rightBP - leftBP || 1);

    if (element.id === "googleAuthBtn") {
      const googleInner = element.querySelector("div");
      if (googleInner) googleInner.style.transform = "none";
    }

    if (
      element.classList?.contains("filter1") ||
      element.classList?.contains("filter2") ||
      element.classList?.contains("filter3") ||
      element.classList?.contains("filter4") ||
      element.classList?.contains("filter5") ||
      element.classList?.contains("filter6")
    ) {
      element.style.position = "static";
      element.style.margin = "0";
      const container =
        element.closest(".input-wrapper-dt") || element.parentElement;
      container.style.position = "absolute";
      container.style.left = `${interpolate(
        leftVal.left || leftVal.marginLeft,
        rightVal.left || rightVal.marginLeft,
        ratio
      )}px`;
      container.style.top = `${interpolate(
        leftVal.top || leftVal.marginTop,
        rightVal.top || rightVal.marginTop,
        ratio
      )}px`;
      container.style.width = `${interpolate(
        leftVal.width,
        rightVal.width,
        ratio
      )}px`;
      element.style.width = "100%";
      element.style.height = `${interpolate(
        leftVal.height,
        rightVal.height,
        ratio
      )}px`;
      return;
    }

    element.style.position = "absolute";
    for (let prop in leftVal) {
      if (["left", "top", "width", "height", "fontSize"].includes(prop)) {
        element.style[prop] = `${interpolate(
          leftVal[prop],
          rightVal[prop],
          ratio
        )}px`;
      }
    }
  };

  for (let key in headerKeys) {
    const el =
      document.querySelector("." + key) || document.getElementById(key);

    if (key === "authLogin") {
  // Применяем стили к ОБЕИМ кнопкам (ВХОД и ВЫХОД)
  const loginBtn = document.querySelector(".auth-login-wrapper");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) applyElement(loginBtn, headerKeys[key]);
  if (logoutBtn) applyElement(logoutBtn, headerKeys[key]);
  continue;
}

    if (el) applyElement(el, headerKeys[key]);
  }
}

adjustCardsOffset();

// Сдвигаем карточки так, чтобы они начинались сразу под самой "низкой" рекламой
function adjustCardsOffset() {
  const header = document.querySelector(".header");
  if (!header) return;

  const headerRect = header.getBoundingClientRect();
  const headerBottom = headerRect.bottom + window.scrollY;

  // Находим самый нижний элемент в шапке (включая рекламу)
  let maxBottom = headerBottom;
  const headerElements = header.querySelectorAll("*");

  headerElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const bottom = rect.bottom + window.scrollY;
      if (bottom > maxBottom) maxBottom = bottom;
    }
  });

  // Добавляем отступ 20px между рекламой и контентом
  const delta = Math.max(maxBottom - headerBottom + 20, 0);

  const spacer = document.getElementById("scrollTarget");
  if (spacer) {
    spacer.style.height = delta + "px";
  }

  // Также добавляем отступ для надписи с количеством результатов
  const searchCount = document.getElementById("searchCount");
  if (searchCount) {
    searchCount.style.marginTop = "10px";
    searchCount.style.marginBottom = "10px";
  }
}

// Запуск при загрузке и ресайзе
window.addEventListener("load", function () {
  applyHeaderKeys();
  setTimeout(adjustCardsOffset, 100);
});

window.addEventListener("resize", function () {
  applyHeaderKeys();
  setTimeout(adjustCardsOffset, 50);
});
