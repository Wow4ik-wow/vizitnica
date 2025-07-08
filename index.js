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

  document.getElementById("googleSignInBtn").onclick = () => {
  // Имитация клика по скрытой системной кнопке Google
  const hiddenGoogleButton = document.querySelector('#googleBtnContainer div div');
  if (hiddenGoogleButton) hiddenGoogleButton.click();
  else alert("Google кнопка не готова");
};


};

function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: '1060687932793-sk24egn7c7r0h6t6i1dedk4u6hrgdotc.apps.googleusercontent.com',
    callback: handleCredentialResponse,
    auto_select: false
  });

  // Рендерим скрытую кнопку
  google.accounts.id.renderButton(
    document.getElementById("googleBtnContainer"),
    {
      theme: "outline",
      size: "large"
    }
  );
}




async function handleCredentialResponse(response) {
  try {
    const payload = parseJWT(response.credential);
    currentUser = {
      uid: '',
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: 'user'
    };
    
    const result = await saveUserToBackend(currentUser);
    console.log('Backend response:', result);
    
    if (!result.success) throw new Error(result.error || 'Ошибка сервера');
    
    currentUser.uid = result.uid;
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateAuthUI();
    
  } catch (error) {
    console.error('Auth error:', error);
    alert('Ошибка авторизации: ' + error.message);
    logout();
  }
}

function saveUserToBackend(user) {
  // 1. Формируем URL с защитой от ошибок
  const params = new URLSearchParams();
  params.append('email', user.email || '');
  params.append('name', user.name || '');
  params.append('picture', user.picture || '');

  // 2. Отправляем через Image (работает всегда)
  const img = new Image();
  img.src = `https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec?${params.toString()}`;
  
  // 3. Возвращаем успех (так как нет возможности получить ответ при таком методе)
  return { success: true };
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
  document.getElementById("googleSignInBtn").classList.add("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");

  searchBtn.classList.remove("hidden");
  greeting.innerHTML = `
    Добро пожаловать, ${currentUser.name}!<br>
    <img src="${currentUser.picture}" 
         style="border-radius:50%; width:40px; margin-top:10px;">
  `;
} else {
  // Показываем "Войти", прячем "Выйти"
  document.getElementById("googleSignInBtn").classList.remove("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");

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