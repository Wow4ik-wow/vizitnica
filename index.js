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
    auto_select: false // Отключаем авто-выбор
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
    if (!result.success) throw new Error(result.error);
    
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
  img.src = `ВАШ_APPSCRIPT_URL?${params.toString()}`;
  
  // 3. Возвращаем успех (так как нет возможности получить ответ при таком методе)
  return { success: true };
}

function parseJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

function checkAuth() {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateAuthUI();
  }
}

function updateAuthUI() {
  const signInBtn = document.getElementById("googleSignInBtn");
  const searchBtn = document.getElementById("searchBtn");
  const greeting = document.getElementById("userGreeting");

  if (currentUser) {
    signInBtn.innerHTML = ''; // Очищаем перед рендером
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
    greeting.textContent = `Добро пожаловать, ${currentUser.name}!`;
    greeting.innerHTML += `<br><img src="${currentUser.picture}" style="border-radius:50%; width:40px; margin-top:10px;">`;
    
  } else {
    signInBtn.innerHTML = ''; // Очищаем перед рендером
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

function logout() {
  google.accounts.id.disableAutoSelect();
  google.accounts.id.revoke(currentUser.email, () => {
    console.log('Доступ отозван');
  });
  
  currentUser = null;
  localStorage.removeItem('user');
  updateAuthUI();
  
  // Перезагружаем страницу для чистого состояния
  setTimeout(() => location.reload(), 500);
}