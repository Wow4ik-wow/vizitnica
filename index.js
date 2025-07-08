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

async function saveUserToBackend(user) {
  return new Promise((resolve) => {
    // Создаем iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    
    // Обработчик сообщений от iframe
    const messageHandler = (event) => {
      if (event.data === 'authComplete') {
        window.removeEventListener('message', messageHandler);
        document.body.removeChild(iframe);
        resolve({ success: true });
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Формируем URL
    const params = new URLSearchParams({
      email: user.email,
      name: user.name,
      picture: user.picture || ''
    });
    
    iframe.src = `${API_URL}?${params}`;
    document.body.appendChild(iframe);
    
    // Таймаут на случай ошибки
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      document.body.removeChild(iframe);
      resolve({ success: false, error: 'Timeout' });
    }, 5000);
  });
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
    // Для авторизованного пользователя
    signInBtn.innerHTML = '';
    google.accounts.id.renderButton(
      signInBtn,
      { 
        type: "icon",
        theme: "outline", 
        size: "large",
        text: "signout"
      }
    );
    signInBtn.onclick = logout;
    
    searchBtn.classList.remove("hidden");
    greeting.innerHTML = `
      Добро пожаловать, ${currentUser.name}!<br>
      <img src="${currentUser.picture}" 
           style="border-radius:50%; width:40px; margin-top:10px;">
    `;
  } else {
    // Для неавторизованного
    signInBtn.innerHTML = '';
    google.accounts.id.renderButton(
      signInBtn,
      { 
        type: "standard",
        theme: "filled_blue", 
        size: "large",
        text: "signin_with",
        shape: "rectangular"
      }
    );
    signInBtn.onclick = null;
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