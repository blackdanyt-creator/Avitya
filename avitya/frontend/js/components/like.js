export function initLikeButtons() {
  document.querySelectorAll(".card__bottom-like, .advertisement__btn-like").forEach(btn => {
    if (btn.dataset.likeInited) return;
    btn.dataset.likeInited = "1";

    btn.addEventListener('click', async () => {
      const adId = btn.dataset.adId || btn.closest("[data-id]")?.dataset.id;
      if (!adId) return;

      try {
        const res = await fetch('/avitya/api/ads/toggle_favorite.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `ad_id=${adId}`
        });

        if (res.status === 401) {
          window.location.href = '/avitya/frontend/auth.html';
          return
        }

        const data = await res.json();

        if (data.success) {
          btn.classList.toggle("card__bottom-like--liked", data.favorited);
          btn.classList.toggle("advertisement__btn-like--liked", data.favorited);
        }
      } catch (e) {
        console.error('Like error:', e);
      }
    });
  });
}
