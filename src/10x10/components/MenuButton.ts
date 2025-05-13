import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import svgIcon from '../img/menu.svg';

export class MenuButton {
    private readonly element: HTMLElement;

    public constructor(params: {
        onClick: () => void;
        container: Element;
    }) {
        const img = document.createElement('img');
        img.src = svgIcon;

        const text = document.createElement('div');
        text.classList.add('menuButtonText');
        text.textContent = I18N_DICTIONARY['menu']['en'];

        this.element = document.createElement('div');
        this.element.classList.add('menuButton');
        this.element.addEventListener('click', params.onClick);

        this.element.appendChild(img);
        this.element.appendChild(text);

        params.container.appendChild(this.element);
    }
}
