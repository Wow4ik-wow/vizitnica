const user = JSON.parse(localStorage.getItem("user"));
const cardsContainer = document.getElementById("cardsContainer");
const logoutBtn = document.getElementById("logoutBtn");

if (!user) {
  cardsContainer.innerHTML = "Вы не авторизованы.";
} else {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });

  loadUserCards(user.email);
}

function loadUserCards(userEmail) {
  cardsContainer.innerHTML = "Загрузка ваших карточек...";

  fetch("https://script.google.com/macros/s/AKfycbxcUzfPgU4DEooISEACOymeWEG4-fN9aP000qU1L2UY1ficalLWiaIlM6XiI9LbAP7c/exec?action=get_user_cards&email=" + encodeURIComponent(userEmail))
    .then((res) => res.json())
    .then((data) => {
      if (!data || data.length === 0) {
        cardsContainer.innerHTML = "У вас нет карточек.";
        return;
      }

      cardsContainer.innerHTML = "";
      data.forEach((card) => {
        const cardEl = document.createElement("div");
        cardEl.className = "card";
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          <p><strong>Описание:</strong> ${card.description}</p>
          <button class="editBtn" data-id="${card.id}">✏️ Редактировать</button>
          <button class="deleteBtn" data-id="${card.id}">🗑️ Удалить</button>
        `;
        cardsContainer.appendChild(cardEl);
      });

      // Добавляем обработчики для кнопок редактирования и удаления
      cardsContainer.querySelectorAll(".editBtn").forEach(btn => {
        btn.addEventListener("click", () => {
          const cardId = btn.getAttribute("data-id");
          // TODO: добавить логику редактирования карточки с id = cardId
          alert(`Редактирование карточки ${cardId} (реализовать отдельно)`);
        });
      });

      cardsContainer.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", () => {
          const cardId = btn.getAttribute("data-id");
          if (confirm("Удалить эту карточку?")) {
            deleteUserCard(cardId, userEmail);
          }
        });
      });
    })
    .catch((err) => {
      console.error("Ошибка при загрузке карточек:", err);
      cardsContainer.innerHTML = "Ошибка загрузки карточек.";
    });
}

function deleteUserCard(cardId, userEmail) {
  fetch(`https://script.google.com/macros/s/AKfycbxcUzfPgU4DEooISEACOymeWEG4-fN9aP000qU1L2UY1ficalLWiaIlM6XiI9LbAP7c/exec?action=delete_user_card&email=${encodeURIComponent(userEmail)}&cardId=${encodeURIComponent(cardId)}`, {
    method: "POST"
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      alert("Карточка удалена");
      loadUserCards(userEmail);
    } else {
      alert("Ошибка удаления карточки");
    }
  })
  .catch(err => {
    console.error("Ошибка при удалении карточки:", err);
    alert("Ошибка при удалении карточки");
  });
}

