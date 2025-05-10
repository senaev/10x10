import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';

export class UndoButton {
    private readonly element: HTMLElement;

    public constructor(params: {
        onClick: () => void;
        container: Element;
    }) {
        this.element = document.createElement('div');
        this.element.classList.add('undoButton');
        this.element.addEventListener('click', params.onClick);
        this.element.innerHTML = I18N_DICTIONARY['undo']['en'];

        params.container.appendChild(this.element);
    }

    public setVisible(visible: boolean) {
        this.element.style.display = visible ? 'block' : 'none';
    }
}
