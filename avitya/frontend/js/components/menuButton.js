export function initMenuButton() {
    const menuButton = document.querySelector('.header__middle-btn');
    const categoriesMenu = document.querySelector('.categories-menu');
    const main = document.querySelector('main');
    
    if (!menuButton || !categoriesMenu) {
        return;
    }

    const iconUse = menuButton.querySelector('use');

    menuButton.addEventListener('click', () => {
        const isOpen = categoriesMenu.classList.toggle('active');

        if (isOpen) {
            main.classList.add('opened');
            iconUse.setAttribute('xlink:href', 'img/sprite.svg#category-icon-open');
        } else {
            main.classList.remove('opened');
            iconUse.setAttribute('xlink:href', 'img/sprite.svg#category-icon');
        }
    });
}