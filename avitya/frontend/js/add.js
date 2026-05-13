document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("adForm");
  const status = document.getElementById("status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageWrap = document.querySelector('.page-wrap');
  const pageTitle = document.getElementById("page-heading")
  const breadcrumb = document.getElementById("breadcrumb-label")

  const AUTH_URL = "/avitya/frontend/auth.html";

  const params = new URLSearchParams(window.location.search);
  const adId = params.get("id");
  let isEditMode = !!adId;

  const meRes = await fetch("/avitya/api/auth/me.php", {
    credentials: "include",
  });
  const meData = await meRes.json();

  if (!meData.logged_in) {
    window.location.href = AUTH_URL;
    return;
  }

  pageWrap.style.visibility = "visible";

  if (isEditMode) {
    pageTitle.textContent = "Редактировать объявление";
    breadcrumb.textContent = "Редактирование объявления";
    submitBtn.textContent = "Сохранить изменения";

    try {
      const res = await fetch(`/avitya/api/ads/view.php?id=${adId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ad = await res.json();

      if (meData.user.id != ad.user_id) {
        status.style.color = "red";
        status.textContent = "Вы не владелец этого объявления";
        submitBtn.disabled = true;
        return;
      }

      document.getElementById("title").value = ad.title || "";
      document.getElementById("category").value = ad.category || "";
      document.getElementById("price").value = ad.price || "";
      document.getElementById("description").value = ad.description || "";
      document.getElementById("city").value = ad.city || "";

      const stateEl = document.getElementById("state");
      if (stateEl) stateEl.value = ad.state || "Б/у";

      const availEl = document.getElementById("availability");
      if (availEl) availEl.value = ad.availability || "В наличии";
    } catch (err) {
      status.textContent = "Ошибка загрузки: " + err.message;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Публикуем...";

    const formData = new FormData(form);
    if (isEditMode) {
      formData.append("id", adId);
    }

    try {
      const url = isEditMode
        ? "/avitya/api/ads/update.php"
        : "/avitya/api/ads/create.php";

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const text = (await res.text()).trim().replace(/^[\s\S]*?(\{)/, "$1");

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Сервер вернул некорректный ответ");
      }

      if (data.success) {
        status.style.color = "green";
        status.textContent = isEditMode
          ? "Объявление успешно обновлено!"
          : `Объявление создано! ID: ${data.id}`;

        setTimeout(() => {
          window.location.href = `ads.html?id=${data.id || adId}`;
        }, 1200);
      } else {
        status.style.color = "red";
        status.textContent = "Ошибка: " + (data.error || "неизвестная ошибка");
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? "Сохранить изменения" : "Опубликовать";
      }
    } catch (err) {
      status.style.color = "red";
      status.textContent = "Ошибка: " + err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = isEditMode ? "Сохранить изменения" : "Опубликовать";
    }
  });
});
