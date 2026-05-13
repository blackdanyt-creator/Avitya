export function initModals() {
    const loginForm = document.getElementById("form_login");
    const regForm = document.getElementById("form_reg");
    const closeButtons = document.querySelectorAll('.modal__close');

    const AUTH_URL = "/avitya/frontend/auth.html";
    const INDEX_URL = "/avitya/frontend/index.html";

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData);

            try {
                const res = await fetch('/avitya/api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (result.success) {
                    document.getElementById("modal-login-success").classList.remove("hidden");
                    setTimeout(() => window.location.href = INDEX_URL, 1200);
                } else {
                    alert(result.message || "Неверный телефон или пароль");
                }
            } catch (err) {
                alert("Не удалось подключиться к серверу");
                console.error(err);
            }
        });
    }

    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(regForm);
            const data = Object.fromEntries(formData);

            try {
                const res = await fetch('/avitya/api/auth/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (result.success) {
                    document.getElementById("modal-reg-success").classList.remove("hidden");
                    setTimeout(() => window.location.href = AUTH_URL, 1500);
                } else {
                    alert(result.error || "Ошибка регистрации");
                }
            } catch (err) {
                alert("Не удается подключиться к серверу");
                console.error(err);
            }
        });
    }

    closeButtons.forEach(btn => {
        btn.addEventListener("click", () => btn.closest(".modal").classList.add("hidden"));
    });
}
