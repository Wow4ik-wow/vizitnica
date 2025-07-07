let currentUser = null;
const scriptUrl = "https://script.google.com/macros/s/AKfycbzpraBNAzlF_oqYIDLYVjczKdY6Ui32qJNwY37HGSj6vtPs9pXseJYqG3oLAr28iZ0c/exec";

window.onload = () => {
  google.accounts.id.initialize({
    client_id: '1060687932793-sk24egn7c7r0h6t6i1dedk4hrgdotc.apps.googleusercontent.com',
    callback: handleCredentialResponse,
  });

  google.accounts.id.renderButton(
    document.getElementById("googleSignInBtn"),
    { theme: "outline", size: "large", text: "signin_with" }
  );

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateAuthUI();
  }

  document.getElementById("addServiceBtn").onclick = () => {
    window.location.href = "add.html";
  };

  document.getElementById("searchBtn").onclick = () => {
    window.location.href = "index2.html";
  };
};

function handleCredentialResponse(response) {
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
  checkOrCreateUser(currentUser);
}

function checkOrCreateUser(user) {
  const params = new URLSearchParams({
    action: "check",
    email: user.email,
  });

  fetch("https://corsproxy.io/?" + encodeURIComponent(scriptUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  })
    .then(res => res.json())
    .then(data => {
      if (data.found) {
        updateAuthUI();
      } else {
        addNewUser(user);
      }
    })
    .catch(err => {
      console.error("Ошибка при check:", err);
    });
}

function addNewUser(user) {
  const params = new URLSearchParams({
    action: "add",
    email: user.email,
    name: user.name,
    photoURL: user.picture,
    role: "user",
  });

  fetch("https://corsproxy.io/?" + encodeURIComponent(scriptUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  })
    .then(res => res.json())
    .then(data => {
      updateAuthUI();
    })
    .catch(err => {
      console.error("Ошибка при add:", err);
    });
}

function updateAuthUI() {
  const signInBtn = document.getElementById("googleSignInBtn");
  const searchBtn = document.getElementById("searchBtn");
  const greeting = document.getElementById("userGreeting");

  if (currentUser) {
    signInBtn.textContent = "Выйти";
    searchBtn.classList.remove("hidden");
    greeting.textContent = `Здравствуйте, ${currentUser.name}!`;

    signInBtn.onclick = () => logout();
  } else {
    signInBtn.textContent = "";
    searchBtn.classList.add("hidden");
    greeting.textContent = "";

    google.accounts.id.renderButton(signInBtn, {
      theme: "outline",
      size: "large",
      text: "signin_with",
    });

    signInBtn.onclick = null;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("user");
  updateAuthUI();
}
