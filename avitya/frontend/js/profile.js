import { initLikeButtons } from "./components/like.js";

const BASE_URL = "/avitya";
const AUTH_URL = "/avitya/frontend/auth.html";

document.addEventListener("DOMContentLoaded", async () => {
  const meRes = await fetch(`${BASE_URL}/api/auth/me.php`, {
    credentials: "include",
  });
  const meData = await meRes.json();

  if (!meData.logged_in) {
    window.location.href = AUTH_URL;
    return;
  }

  const me = meData.user;

  document.getElementById("profile-nickname").textContent = me.nickname;
  document.getElementById("profile-email").textContent = me.email || "-";
  document.getElementById("profile-city").textContent = me.city || "Город";

  const avatarEl = document.getElementById("avatar");
  avatarEl.textContent = me.nickname[0].toUpperCase();

  document.getElementById("set-nickname").value = me.nickname;
  document.getElementById("set-email").value = me.email || "";
  document.getElementById("set-city").value = me.city || "";

  const tabButtons = document.querySelectorAll(".tabs button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabContents.forEach(c => c.style.display = "none");

  async function openTab(tabName) {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.style.display = "none");

    const btn = document.querySelector(`.tabs button[data-tab="${tabName}"]`);
    const content = document.getElementById(`tab-${tabName}`);
    if (btn) btn.classList.add("active");
    if (content) content.style.display = "block";

    if (tabName === "my-ads") loadMyAds();
    if (tabName === "favorites") loadFavorites();
    if (tabName === "chat") await initChat(me.id);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => openTab(btn.dataset.tab));
  });

  const chatWithId = new URLSearchParams(window.location.search).get("chat");
  if (chatWithId) {
    await openTab("chat");
    openDialog(parseInt(chatWithId), me.id);
  }

  const settingsForm = document.getElementById("settings-form");
  const settingsStatus = document.getElementById("settings-status");

  settingsForm.addEventListener("submit", async e => {
    e.preventDefault();

    const nickname = document.getElementById("set-nickname").value.trim();
    const email = document.getElementById("set-email").value.trim();
    const city = document.getElementById("set-city").value.trim();
    const password = document.getElementById("set-password").value;

    const body = { nickname, email, city };
    if (password) body.password = password;

    try {
      const res = await fetch(`${BASE_URL}/api/auth/update_user.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        document.getElementById("profile-nickname").textContent = data.user.nickname;
        document.getElementById("profile-email").textContent = data.user.email;
        document.getElementById("profile-city").textContent = data.user.city;
        document.getElementById("avatar").textContent = data.user.nickname[0].toUpperCase();

        document.getElementById("set-password").value = "";

        settingsStatus.style.color = "green";
        settingsStatus.textContent = "Изменения сохранены!";
        setTimeout(() => settingsStatus.textContent = "", 3000);
      } else {
        settingsStatus.style.color = "red";
        settingsStatus.textContent = data.error || "Ошибка сохранения";
      }
    } catch (err) {
      settingsStatus.style.color = "red";
      settingsStatus.textContent = "Ошибка соединения с сервером";
    }
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch(`${BASE_URL}/api/auth/logout.php`, { credentials: 'include' });
      window.location.href = AUTH_URL;
    });
  }
});

async function loadMyAds() {
  const list = document.getElementById("my-ads-list");
  list.innerHTML = "<li>Загрузка...</li>";

  const res = await fetch(`${BASE_URL}/api/ads/my.php`, { credentials: 'include' });
  const ads = await res.json();
  renderAds(ads, list, true);
}

async function loadFavorites() {
  const list = document.getElementById("favorites-list");
  list.innerHTML = "<li>Загрузка...</li>";

  const res = await fetch(`${BASE_URL}/api/ads/favorites.php`, { credentials: 'include' });
  const ads = await res.json();
  renderAds(ads, list, false);
}

function renderAds(ads, container, showEdit) {
  container.innerHTML = "";

  if (!Array.isArray(ads) || ads.length === 0) {
    container.innerHTML = "<li>Пока что нет объявлений</li>";
    return;
  }

  ads.forEach(ad => {
    let imageSrc = ad.image || `${BASE_URL}/img/ads-imgs/banka20litrov.jpg`;
    if (ad.image && ad.image.startsWith("./")) {
      imageSrc = `${BASE_URL}/img/ads-imgs/` + ad.image.split("/").pop();
    }

    const li = document.createElement("li");
    li.className = "ads__grid-list-item";
    li.dataset.id = ad.id;

    li.innerHTML = `
      <div class="card__top">
        <a href="ads.html?id=${ad.id}" class="card__top-link">
          <img class="card__top-link-img" src="${imageSrc}" alt="${ad.title}" width="236" height="236">
        </a>
      </div>
      <div class="card__bottom">
        <a href="ads.html?id=${ad.id}" class="card__bottom-descr">${ad.title}</a>
        <span class="card__bottom-price">${Number(ad.price).toLocaleString('ru-RU')}₽</span>
        <div class="card__bottom-location">${ad.city || ""}</div>
        ${showEdit
          ? `<div class="card__actions">
          <a href="add-edit.html?id=${ad.id}" class="card__edit-btn">Редактировать</a>
          <button class="card__delete-btn" type="button" data-id=${ad.id}>Удалить</button>
          </div>`
          : `<button class="card__bottom-like card__bottom-like--liked" type="button" data-ad-id="${ad.id}"}>
          <svg class="card__bottom-like-icon" width="20" height="20">
            <use xlink:href="img/sprite.svg#icon-like"></use>
          </svg>
          </button>`
        }
      </div>`;
    container.appendChild(li);

    const deleteBtn = li.querySelector(".card__delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Удалить это объявление? Действие невозможно отменить.")) return;

        const res = await fetch(`${BASE_URL}/api/ads/delete.php`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: ad.id })
        });

        const data = await res.json();

        if (data.success) {
          li.remove();
          if (!container.querySelector(".ads__grid-list-item")) {
            container.innerHTML = "<li>Пока что нет объявлений</li>"
          }
        } else {
          alert(data.error || "Ошибка удаления");
        }
      });
    }
  });

  initLikeButtons();
}

async function initChat(myId) {
  const chatContainer = document.getElementById('tab-chat');
  chatContainer.innerHTML = `
  <div class="chat">
    <div class="chat__dialogs" id="chat-dialogs">
      <h3 class="chat__dialogs-title">Диалоги</h3>
      <ul class="chat__dialogs-list" id="dialogs-list">
        <li>Загрузка...</li>
      </ul>
    </div>
    <div class="chat__window" id="chat-window" style="display:none;">
      <div class="chat__window-header">
        <button class="chat__back-btn" id="chat-back-btn">Назад</button>
        <span class="chat__window-with" id="chat-window-with"></span>
      </div>
      <div class="chat__messages" id="chat-messages"></div>
      <div class="chat__input-row">
        <input type="text" class="chat__input" id="chat-input" placeholder="Написать сообщение...">
        <button class="chat__send-btn" id="chat-send-btn">Отправить</button>
      </div>
    </div>
  </div>
  `;

  document.getElementById('chat-back-btn').addEventListener('click', () => {
    document.getElementById('chat-window').style.display = 'none';
    document.getElementById('chat-dialogs').style.display = 'block';
  });

  await loadDialogs(myId);
}

async function loadDialogs(myId) {
  const list = document.getElementById('dialogs-list');
  if (!list) return;

  const res = await fetch(`${BASE_URL}/api/chat/chat.php?action=dialogs`, { credentials: 'include' });
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    list.innerHTML = '<li class="chat__no-dialogs">Пока что нет диалогов</li>';
    return;
  }

  list.innerHTML = '';
  data.forEach(dialog => {
    const li = document.createElement('li');
    li.className = 'chat__dialog-item';
    li.innerHTML = `
      <div class="chat__dialog-avatar">${dialog.nickname[0].toUpperCase()}</div>
      <div class="chat__dialog-info">
        <span class="chat__dialog-name">${dialog.nickname}</span>
        <span class="chat__dialog-last">${dialog.last_message || ''}</span>
      </div>
      ${dialog.unread > 0 ? `<span class="chat__unread-badge">${dialog.unread}</span>` : ''}
    `;
    li.addEventListener('click', () => openDialog(dialog.user_id, myId, dialog.nickname));
    list.appendChild(li);
  });
}

let _pollingInterval = null;

async function openDialog(withUserId, myId, nickname = '') {
  const dialogsEl = document.getElementById('chat-dialogs');
  const windowEl = document.getElementById('chat-window');
  const withEl = document.getElementById('chat-window-with');
  const messagesEl = document.getElementById('chat-messages');

  if (!dialogsEl || !windowEl) {
    console.error("Chat DOM not ready, withUserId:", withUserId);
    return;
  }

  if (!nickname) nickname = `Пользователь #${withUserId}`;

  dialogsEl.style.display = 'none';
  windowEl.style.display = 'flex';
  withEl.textContent = nickname;

  if (_pollingInterval) clearInterval(_pollingInterval);

  const loadMessages = async () => {
    const res = await fetch(`${BASE_URL}/api/chat/chat.php?action=messages&with=${withUserId}`, { credentials: 'include' });
    const msgs = await res.json();

    if (!Array.isArray(msgs)) return;

    messagesEl.innerHTML = '';
    msgs.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat__message ${msg.from_user_id == myId ? 'chat__message--out' : 'chat__message--in'}`;
      div.innerHTML = `
        <span class="chat__message-text">${escapeHtml(msg.text)}</span>
        <span class="chat__message-time">${formatTime(msg.created)}</span>
      `;
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  await loadMessages();
  _pollingInterval = setInterval(loadMessages, 5000);

  const sendBtn = document.getElementById('chat-send-btn');
  const newSendBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

  const doSend = async () => {
    const inputEl = document.getElementById("chat-input");
    const text = inputEl.value.trim();
    if (!text) return;

    const res = await fetch(`${BASE_URL}/api/chat/chat.php?action=send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user_id: withUserId, text })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Ошибка отправки", err);
      return
    }

    inputEl.value = '';
    await loadMessages();
  };

  newSendBtn.addEventListener('click', doSend);
  document.getElementById("chat-input").addEventListener("keydown", e => {
    if (e.key === "Enter") doSend();
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}
