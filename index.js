let currentUser = null;
const API_URL = 'https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec';

// Инициализация
window.onload = () => {
  initGoogleAuth();
  checkAuth();
  
  // Назначаем обработчики кнопок
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
  
  // Рендерим кнопку сразу
  google.accounts.id.renderButton(
    document.getElementById("googleSignInBtn"),
    { 
      type: "standard",
      theme: "filled_blue", 
      size: "large",
      text: "signin_with",
      shape: "rectangular"
    }
  );
  
  // Показываем One Tap только если нет сохранённого пользователя
  if (!localStorage.getItem('user')) {
    google.accounts.id.prompt();
  }
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
    
    const { uid } = await saveUserToBackend(currentUser);
    currentUser.uid = uid;
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateAuthUI();
    
  } catch (error) {
    console.error('Auth error:', error);
    alert('Ошибка авторизации. Попробуйте ещё раз.');
    logout();
  }
}

async function saveUserToBackend(user) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user })
  });
  
  if (!response.ok) throw new Error('Ошибка сервера');
  return await response.json();
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