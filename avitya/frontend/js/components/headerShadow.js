export function initHeaderShadow() {
    const header = document.querySelector('.header');
    if (!header) return;

    function toggleShadow() {
        if (window.scrollY > 0) {
            header.classList.add("header--scrolled");
        } else {
            header.classList.remove("header--scrolled");
        }
    }

    window.addEventListener('scroll', toggleShadow);
    toggleShadow();
}