import { initHeaderShadow } from "./components/headerShadow.js";
import { initMenuButton } from "./components/menuButton.js";
import { initLikeButtons } from "./components/like.js";
import { initAuth } from "./components/authForm.js";
import { initModals } from "./components/modals.js";
import { initSearch } from "./components/search.js";

const BASE_URL = "/avitya";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");
  const searchQuery = urlParams.get("q");

  // Инициализация всех компонентов
  initAuth();
  initHeaderShadow();
  initMenuButton();
  initLikeButtons();
  initModals();
  initSearch();
  await initUserHeader();

  if (searchQuery) return;

  // Загрузка объявлений в зависимости от страницы
  if (categoryFromUrl) {
    const titleEl = document.getElementById("category-title");
    if (titleEl) {
      titleEl.innerHTML = `${categoryFromUrl} <span class="ads__info-city"></span>`;
    }
    loadAds(categoryFromUrl);
  } else {
    loadAds();
  }

  loadSingleAd();
});

// Универсальная функция загрузки объявлений
async function loadAds(category = null) {
  try {
    let url = `${BASE_URL}/api/ads/index.php`;
    if (category && category !== "all") {
      url += `?category=${encodeURIComponent(category)}`;
    }

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const ads = await res.json();
    const list = document.getElementById("ads-list");
    if (!list) return;

    list.innerHTML = "";

    if (!ads.length) {
      list.innerHTML = "<li>Пока что нет объявлений в этой категории</li>";
      return;
    }

    ads.forEach((ad) => {
      const item = document.createElement("li");
      item.className = "ads__grid-list-item";
      item.dataset.id = ad.id;

      item.innerHTML = `
        <div class="card__top">
          <a href="ads.html?id=${ad.id}" class="card__top-link">
            <img
              class="card__top-link-img"
              src="${resolveImage(ad.image)}"
              alt="${ad.title}"
              width="236"
              height="236"
            />
          </a>
        </div>
        <div class="card__bottom">
          <a href="ads.html?id=${ad.id}" class="card__bottom-descr">
            ${ad.title}
          </a>
          <span class="card__bottom-price">${Number(ad.price).toLocaleString('ru-RU')}₽</span>
          <div class="card__bottom-location">
            ${ad.city || "Город"}
          </div>
          <button class="card__bottom-like${ad.is_favorited ? ' card__bottom-like--liked' : ''}" type="button" data-ad-id="${ad.id}">
          <svg class="card__bottom-like-icon" width="20" height="20" aria-hidden="true">
          <use xlink:href="img/sprite.svg#icon-like"></use>
          </svg>
          </button>
        </div>`;
      list.appendChild(item);
    });

    initLikeButtons();
  } catch (err) {
    console.error("loadAds error:", err);
  }
}

async function loadSingleAd() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;

  const titleEl = document.querySelector('.advertisement__wrapper-title');
  if (!titleEl) return;

  try {
    const res = await fetch(`${BASE_URL}/api/ads/view.php?id=${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error("Объявление не найдено");

    const ad = await res.json();

    titleEl.textContent = ad.title || "Без названия";

    const imgEl = document.querySelector('.middle__wrapper-image');
    if (imgEl) imgEl.src = resolveImage(ad.image);

    const priceEl = document.querySelector('.advertisement__wrapper-right-price');
    if (priceEl) priceEl.innerHTML = `${Number(ad.price).toLocaleString('ru-RU')}&nbsp;₽`;

    const statsList = document.querySelector(
      ".advertisement__wrapper-stats-list",
    );
    if (statsList) {
      statsList.innerHTML = `
        <li class="advertisement__wrapper-stats-list-item">
          <span class="advertisement__wrapper-stats-list-item-category">Категория:</span>
            <span class="advertisement__wrapper-stats-list-item-category-value">${ad.category || "—"}</span>
        </li>
        <li class="advertisement__wrapper-stats-list-item">
          <span class="advertisement__wrapper-stats-list-item-category">Состояние:</span>
            <span class="advertisement__wrapper-stats-list-item-category-value">${ad.state || "Б/у"}</span>
        </li>
        <li class="advertisement__wrapper-stats-list-item">
          <span class="advertisement__wrapper-stats-list-item-category">Доступность:</span>
            <span class="advertisement__wrapper-stats-list-item-category-value">${ad.availability || "В наличии"}</span>
        </li>
      `;
    }

    const descrEl = document.querySelector('.advertisement__wrapper-descr-text');
    if (descrEl) descrEl.textContent = ad.description || "";

    const locationEl = document.querySelector('.advertisement__wrapper-location-descr');
    if (locationEl) locationEl.textContent = ad.city || "";

    const sellerEl = document.querySelector('.advertisement__wrapper-user-title');
    if (sellerEl) sellerEl.textContent = ad.user_name || "Продавец";

    const likeBtn = document.querySelector('.advertisement__btn-like');
    if (likeBtn) likeBtn.dataset.adId = ad.id;
    if (ad.is_favorited == 1) {
      likeBtn.classList.add("advertisement__btn-like--liked");
    }
    initLikeButtons();

    const actionsEl = document.querySelector('.advertisement__wrapper-actions');
      try {
        const me = await fetch(`${BASE_URL}/api/auth/me.php`, { credentials: 'include' }).then(r => r.json());

        if (me.logged_in && me.user.id == ad.user_id) {
          if (actionsEl) actionsEl.innerHTML = `
          <a href="add-edit.html?id=${ad.id}" class="advertisement__edit-btn">Редактировать</a>
          <button class="advertisement__delete-btn" id="delete-ad-btn">Удалить объявление</button>
          `;

          document.getElementById("delete-ad-btn")?.addEventListener("click", async () => {
            if (!confirm("Удалить это объявление? Действие невозможно отменить.")) return;

            const res = await fetch(`${BASE_URL}/api/ads/delete.php`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: ad.id })
            });
            const data = await res.json();

            if (data.success) {
              window.location.href = "index.html";
            } else {
              alert(data.error || "Ошибка удаления");
            }
          });
        }

        if (me.logged_in && me.user.id != ad.user_id) {
          const contactsEl = document.querySelector('.advertisement__wrapper-contacts');
          if (contactsEl) contactsEl.innerHTML = 
          `<a href="profile.html?chat=${ad.user_id}" class="advertisement__wrapper-contacts-btn">Написать продавцу</a>
            `;
        } 
      } catch (e) {}
  } catch (err) {
    console.error("loadSingleAd error:", err);
  }
}

async function initUserHeader() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me.php`, { credentials: 'include' });
    const text = await res.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('me.php вернул не JSON:', text.slice(0, 100));
      return
    }

    if (!data || !data.hasOwnProperty('logged_in')) return;
    if (!data.logged_in) return;
  
    const nickname = data.user.nickname;

    const headerLink = document.querySelector('.header__middle-login');
    if (headerLink) {
      headerLink.innerHTML = `<span class="header__middle-login-btn">${nickname}</span>`;
      headerLink.href = 'profile.html';
    }

    const mainLink = document.querySelector('.categories__login');
    if (mainLink) {
      mainLink.textContent = nickname;
      mainLink.href = 'profile.html';
    }

  } catch (e) {}
}

function resolveImage(path) {
  if (!path) return `${BASE_URL}/img/ads-imgs/banka20litrov.jpg`;
  if (path.startsWith('./')) return `${BASE_URL}/img/ads-imgs/` + path.split('/').pop();
  return path;
}
