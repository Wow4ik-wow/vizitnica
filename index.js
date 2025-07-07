let currentUser = null;

// Инициализация Google Identity Services
window.onload = () => {
  google.accounts.id.initialize({
    client_id: '1060687932793-sk24egn7c7r0h6t6i1dedk4u6hrgdotc.apps.googleusercontent.com',
    callback: handleCredentialResponse,
  });

  // Рендерим кнопку Вход (Google Sign In)
  google.accounts.id.renderButton(
    document.getElementById("googleSignInBtn"),
    { theme: "outline", size: "large", text: "signin_with" }
  );

  // Если пользователь в localStorage — восстанавливаем
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateAuthUI();
  }

  // Кнопка "Добавить услугу" всегда ведёт на add.html
  document.getElementById("addServiceBtn").onclick = () => {
    window.location.href = "add.html";
  };

  // Кнопка "Искать услуги" — только авторизованным
  document.getElementById("searchBtn").onclick = () => {
    window.location.href = "index2.html";
  };
};

// Обработка успешного входа Google
function handleCredentialResponse(response) {
  // Получаем JWT токен и расшифровываем (упрощённо)
  // Можно использовать сторонние библиотеки, но здесь упростим
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  const userData = JSON.parse(jsonPayload);

  currentUser = {
    name: userData.name,
    email: userData.email,
    picture: userData.picture,
  };

  localStorage.setItem("user", JSON.stringify(currentUser));
  updateAuthUI();
}

// Обновление интерфейса после входа/выхода
function updateAuthUI() {
  const signInBtn = document.getElementById("googleSignInBtn");
  const searchBtn = document.getElementById("searchBtn");
  const greeting = document.getElementById("userGreeting");

  if (currentUser) {
    signInBtn.textContent = "Выйти";
    searchBtn.classList.remove("hidden");
    greeting.textContent = `Здравствуйте, ${currentUser.name}!`;

    signInBtn.onclick = () => {
      logout();
    };
  } else {
    signInBtn.textContent = "";
    searchBtn.classList.add("hidden");
    greeting.textContent = "";

    // Показываем кнопку Google Sign In заново (через renderButton)
    google.accounts.id.renderButton(
      signInBtn,
      { theme: "outline", size: "large", text: "signin_with" }
    );

    signInBtn.onclick = null;
  }
}

// Выход (очистка localStorage)
function logout() {
  currentUser = null;
  localStorage.removeItem("user");
  updateAuthUI();
}
