let currentUser = null;
const API_URL = 'https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec';

// Инициализация
window.onload = () => {
  initGoogleAuth();
  checkAuth();
};

function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: '1060687932793-sk24egn7c7r0h6t6i1dedk4u6hrgdotc.apps.googleusercontent.com',
    callback: handleCredentialResponse,
  });
  renderGoogleButton();
}

async function handleCredentialResponse(response) {
  const { credential } = response;
  const payload = parseJWT(credential);
  
  currentUser = {
    uid: '',
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    role: 'user'
  };
  
  try {
    const { uid } = await saveUserToBackend(currentUser);
    currentUser.uid = uid;
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateAuthUI();
  } catch (error) {
    console.error('Auth error:', error);
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

async function checkAuth() {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    await verifyUserInSheet();
    updateAuthUI();
  }
}

async function handleCredentialResponse(response) {
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

  const userData = JSON.parse(jsonPayload);
  currentUser = {
    name: userData.name,
    email: userData.email,
    picture: userData.picture,
  };

  localStorage.setItem("user", JSON.stringify(currentUser));
  await saveUserToSheet();
  updateAuthUI();
}

async function saveUserToSheet() {
  try {
    // Проверяем, есть ли пользователь уже в таблице
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:B', // Колонки Email и Role
    });

    const users = response.data.values || [];
    const userExists = users.some(row => row[0] === currentUser.email);

    if (!userExists) {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'A:B',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[currentUser.email, 'user']],
        },
      });
    }
  } catch (error) {
    console.error('Ошибка при сохранении в Google Sheets:', error);
  }
}

async function verifyUserInSheet() {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:B',
    });

    const users = response.data.values || [];
    const user = users.find(row => row[0] === currentUser.email);

    if (!user) {
      // Пользователь есть в localStorage, но нет в таблице - добавляем
      await saveUserToSheet();
    }
  } catch (error) {
    console.error('Ошибка при проверке пользователя:', error);
  }
}

function updateAuthUI() {
  const signInBtn = document.getElementById("googleSignInBtn");
  const searchBtn = document.getElementById("searchBtn");
  const greeting = document.getElementById("userGreeting");

  if (currentUser) {
    signInBtn.textContent = "Выйти";
    searchBtn.classList.remove("hidden");
    greeting.textContent = `Здравствуйте, ${currentUser.name}!`;
    signInBtn.onclick = logout;
  } else {
    signInBtn.textContent = "";
    searchBtn.classList.add("hidden");
    greeting.textContent = "";
    google.accounts.id.renderButton(
      signInBtn,
      { theme: "outline", size: "large", text: "signin_with" }
    );
    signInBtn.onclick = null;
  }
}

function logout() {
  google.accounts.id.disableAutoSelect();
  currentUser = null;
  localStorage.removeItem("user");
  updateAuthUI();
}

// Обработчики кнопок
document.getElementById("addServiceBtn").onclick = () => {
  window.location.href = "add.html";
};

document.getElementById("searchBtn").onclick = () => {
  window.location.href = "index2.html";
};