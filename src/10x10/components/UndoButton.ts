import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import svgIcon from '../img/undo.svg';

export class UndoButton {
    private readonly element: HTMLElement;

    public constructor(params: {
        onClick: () => void;
        container: Element;
    }) {
        const img = document.createElement('img');
        img.src = svgIcon;

        const text = document.createElement('div');
        text.textContent = I18N_DICTIONARY['undo']['en'];

        this.element = document.createElement('div');
        this.element.classList.add('undoButton');
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
