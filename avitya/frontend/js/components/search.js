import { initLikeButtons } from "./like.js";

const BASE_URL = "/avitya";

export function initSearch() {
    const input = document.querySelector('.header__middle-search-field');
    const btn = document.querySelector('.header__middle-search-btn');
    if (!input) return;

    const dropdown = document.createElement("div");
    dropdown.className = "search-dropdown";
    dropdown.style.display = "none";
    input.parentNode.style.position = "relative";
    input.parentNode.appendChild(dropdown);

    let debounceTimer = null;

    input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        const q = input.value.trim();

        if (q.length < 2) {
            hideDropdown();
            return;
        }

        debounceTimer = setTimeout(() => loadDropdown(q), 300);
    });

    input.addEventListener('keydown', e => {
        if (e.key === "Escape") hideDropdown();
        if (e.key === "Enter") goToSearch();
    });

    if (btn) {
        btn.addEventListener("click", () => goToSearch());
    }

    document.addEventListener('click',  e => {
        if (!input.parentNode.contains(e.target)) {
            hideDropdown();
        }
    });

    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q && document.getElementById("search-title")) {
        input.value = q;
        loadSearchPage(q);
    }

    async function loadDropdown(q) {
        try {
            const res = await fetch(`${BASE_URL}/api/ads/search.php?q=${encodeURIComponent(q)}&limit=8`, { credentials: "include" });
            const ads = await res.json();
            renderDropdown(ads, q);
        } catch (e) {
            console.error("Search dropdown error:", e);
        }
    }

    function renderDropdown(ads, q) {
        dropdown.innerHTML = "";

        if (!ads.length) {
            dropdown.innerHTML = `<div class="search-dropdown__empty">Объявление не найдено</div>`;
            showDropdown();
            return;
        }

        ads.forEach(ad => {
            const item = document.createElement("a");
            item.className = "search-dropdown__item";
            item.href = `ads.html?id=${ad.id}`;

            item.innerHTML = `
            <img class="search-dropdown__item-img" src="${resolveImage(ad.image)}" alt="${ad.title}" width="40" height="40">
            <div class="search-dropdown__item-info">
                <span class="search-dropdown__item-title">${highlightMatch(ad.title, q)}</span>
                <span class="search-dropdown__item-meta">${Number(ad.price).toLocaleString("ru-RU")}₽ · ${ad.city || ""}</span>
            </div>`;

            item.addEventListener("click", () => {
                hideDropdown();
                input.value = "";
            });

            dropdown.appendChild(item);
        });

        const more = document.createElement("a");
        more.className = "search-dropdown__more";
        more.href = `search.html?q=${encodeURIComponent(q)}`;
        more.textContent = `Показать все результаты для «${q}»`;
        more.addEventListener("click", () => hideDropdown());
        dropdown.appendChild(more);

        showDropdown();
    }

    function showDropdown() {
        dropdown.style.display = "block";
    }

    function hideDropdown() {
        dropdown.style.display = "none";
    }

    function goToSearch() {
        const q = input.value.trim();
        if (!q) return;
        hideDropdown();
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    }
}

async function loadSearchPage(q) {
    const titleEl = document.getElementById("search-title");
    const list = document.getElementById("ads-list");
    if (!list) return;

    list.innerHTML = "<li>Загрузка...</li>";
    if (titleEl) titleEl.textContent = `Результаты поиска: «${q}»`;

    try {
        const res = await fetch(`${BASE_URL}/api/ads/search.php?q=${encodeURIComponent(q)}`, { credentials: "include" });
        const ads = await res.json();

        list.innerHTML = "";

        if (!ads.length) {
            if (titleEl) titleEl.textContent = `По запросу «${q}» ничего не найдено`;
            list.innerHTML = "<li>Попробуйте изменить запрос</li>";
            return;
        }

        if (titleEl) titleEl.textContent = `Результаты поиска: «${q}» - ${ads.length} объявлений`;

        ads.forEach(ad => {
            const item = document.createElement("li");
            item.className = "ads__grid-list-item";
            item.dataset.id = ad.id;
            item.innerHTML = `
            <div class="card__top">
                <a href="ads.html?id=${ad.id}" class="card__top-link">
                    <img class="card__top-link-img" src="${resolveImage(ad.image)}" alt="${ad.title}" width="236" height="236">
                </a>
            </div>
            <div class="card__bottom">
                <a href="ads.html?id=${ad.id}" class="card__bottom-descr">${ad.title}</a>
                <span class="card__bottom-price">${Number(ad.price).toLocaleString("ru-RU")}₽</span>
                <div class="card__bottom-location">${ad.city || ""}</div>
                <button class="card__bottom-like${ad.is_favorited ? ' card__bottom-like--liked' : ''}" type="button" data-ad-id="${ad.id}">
                    <svg class="card__bottom-like-icon" width="20" height="20" aria-hidden="true">
                        <use xlink:href="img/sprite.svg#icon-like"></use>
                    </svg>
                </button>
            </div>`;
            list.appendChild(item);
        });

        initLikeButtons();
    } catch (e) {
        console.error("Search page error:", e);
        list.innerHTML = "<li>Ошибка загрузки</li>";
    }
}

function resolveImage(path) {
    if (!path) return `${BASE_URL}/img/ads-imgs/banka20litrov.jpg`;
    if (path.startsWith("./")) return `${BASE_URL}/img/ads-imgs/` + path.split("/").pop();
    return path;
}

function highlightMatch(text, q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), "<strong>$1</strong>");
}
