export function initAuth() {
    const radioButtons = document.querySelectorAll('input[name="auth_switch"]');
    const loginForm = document.querySelector('.auth__form-login');
    const regForm = document.querySelector('.auth__form-reg');

    radioButtons.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.value === 'login') {
                loginForm.classList.add('active');
                regForm.classList.remove('active');
            } else {
                regForm.classList.add('active');
                loginForm.classList.remove('active');
            }
        });
    });
}