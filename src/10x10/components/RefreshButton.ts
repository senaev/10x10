import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import refreshIcon from '../img/refresh.svg';

export class RefreshButton {
    private readonly element: HTMLElement;

    public constructor(params: {
        onClick: () => void;
        container: Element;
    }) {
        const img = document.createElement('img');
        img.src = refreshIcon;

        const text = document.createElement('div');
        text.textContent = I18N_DICTIONARY['refresh']['en'];

        this.element = document.createElement('div');
        this.element.classList.add('refreshButton');
        this.element.addEventListener('click', params.onClick);
        this.element.appendChild(img);
        this.element.appendChild(text);

        params.container.appendChild(this.element);

        this.setVisible(false);
    }

    public setVisible(visible: boolean) {
        this.element.style.display = visible ? 'block' : 'none';
    }
}
