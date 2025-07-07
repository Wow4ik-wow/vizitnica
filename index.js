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
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  );

  const userData = JSON.parse(jsonPayload);

  const user = {
    name: userData.name,
    email: userData.email,
    picture: userData.picture,
  };

  checkOrCreateUser(user);
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

const usersApiUrl = "https://script.google.com/macros/s/AKfycbz8SXYyTQNTBS8SfoEM0PPWC7Q3VvH42wRvxKAfJr8whFIZC59QyAkRA7FPnDuu9yvs/exec";

function checkOrCreateUser(user) {
  fetch(`${usersApiUrl}?action=check&email=${encodeURIComponent(user.email)}`)
    .then(res => res.json())
    .then(data => {
      if (data.found) {
        user.role = data.role || "user";
        currentUser = user;
        localStorage.setItem("user", JSON.stringify(currentUser));
        updateAuthUI();
      } else {
        fetch(usersApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            name: user.name,
            email: user.email,
            picture: user.picture,
            role: "user"
          })
        })
        .then(() => {
          user.role = "user";
          currentUser = user;
          localStorage.setItem("user", JSON.stringify(currentUser));
          updateAuthUI();
        })
        .catch(err => {
          alert("Ошибка при добавлении пользователя.");
          console.error(err);
        });
      }
    })
    .catch(err => {
      alert("Ошибка при проверке пользователя.");
      console.error(err);
    });
}
