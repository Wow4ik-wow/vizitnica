let currentUser = null;
const API_URL = 'https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec';

// Инициализация
window.onload = () => {
  initGoogleAuth();
  checkAuth();
  
  document.getElementById("addServiceBtn").onclick = () => {
    window.location.href = "add.html";
  };
  
  document.getElementById("searchBtn").onclick = () => {
    window.location.href = "index2.html";
  };

  document.getElementById("logoutBtn").onclick = logout;

};

function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: '1060687932793-sk24egn7c7r0h6t6i1dedk4u6hrgdotc.apps.googleusercontent.com',
    callback: handleCredentialResponse,
    auto_select: false
  });
  
  renderGoogleButton();
}

function renderGoogleButton() {
  google.accounts.id.renderButton(
    document.getElementById("googleSignInBtn"),
    { 
      theme: "filled_blue",
      size: "large",
      text: "signin_with",
      shape: "rectangular"
    }
  );
}

async function handleCredentialResponse(response) {
  try {
    const payload = parseJWT(response.credential);
    const email = payload.email;

    // Получаем данные из таблицы по email
    const userData = await fetchUserFromBackend(email);

    if (!userData.success) throw new Error(userData.message || "Пользователь не найден");

    currentUser = {
      uid: userData.uid || '',
      name: userData.name || payload.name,
      email: email,
      picture: userData.picture || payload.picture,
      role: userData.role || 'user'
    };

    localStorage.setItem('user', JSON.stringify(currentUser));
    updateAuthUI();

  } catch (error) {
    console.error('Auth error:', error);
    alert('Ошибка авторизации: ' + error.message);
    logout();
  }
}


async function saveUserToBackend(user) {
  try {
    // Формируем URL с параметрами
    const params = new URLSearchParams({
      email: user.email || '',
      name: user.name || '',
      picture: user.picture || ''
    });
    
    // Отправляем через fetch с обработкой CORS
    const response = await fetch(`${API_URL}?${params}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    
    // В режиме no-cors мы не можем читать ответ, но запрос уйдет
    return { success: true };
    
  } catch (error) {
    console.error('Ошибка отправки:', error);
    return { success: false, error: error.message };
  }
}

// Парсинг JWT токена
function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('JWT parse error:', e);
    throw new Error('Неверный форток токена');
  }
}

// Проверка авторизации при загрузке
function checkAuth() {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      updateAuthUI();
    } catch (e) {
      console.error('Failed to parse user:', e);
      logout();
    }
  }
}

// Обновление интерфейса
function updateAuthUI() {
  const signInBtn = document.getElementById("googleSignInBtn");
  const searchBtn = document.getElementById("searchBtn");
  const greeting = document.getElementById("userGreeting");

  if (currentUser) {
  // Показываем кнопку "Выйти", прячем "Войти"
  document.getElementById("googleSignInBtn").style.display = "none";
document.getElementById("logoutBtn").style.display = "inline-block";


  searchBtn.classList.remove("hidden");
  greeting.innerHTML = `
    Добро пожаловать, ${currentUser.name}!<br>
    <img src="${currentUser.picture}" 
         style="border-radius:50%; width:40px; margin-top:10px;">
  `;
} else {
  // Показываем "Войти", прячем "Выйти"
  document.getElementById("googleSignInBtn").style.display = "inline-block";
document.getElementById("logoutBtn").style.display = "none";


  searchBtn.classList.add("hidden");
  greeting.textContent = '';
}
}

// Выход из системы
function logout() {
  try {
    google.accounts.id.disableAutoSelect();
    if (currentUser?.email) {
      google.accounts.id.revoke(currentUser.email, () => {
        console.log('Доступ отозван');
      });
    }
  } catch (e) {
    console.error('Revoke error:', e);
  }
  
  currentUser = null;
  localStorage.removeItem('user');
  updateAuthUI();
  location.reload();
}

async function fetchUserFromBackend(email) {
  try {
    const response = await fetch(`${API_URL}?getUserByEmail=${encodeURIComponent(email)}`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Ошибка запроса пользователя:', error);
    return { success: false, message: error.message };
  }
}
