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
        this.element.innerHTML = I18N_DICTIONARY['undo']['ru'];

        params.container.appendChild(this.element);
    }

    public setState(state: 'active' | 'inactive' | 'hidden') {
        if (state === 'active') {
            this.element.classList.remove('blocked');
            this.element.style.display = 'block';
            return;
        }

        if (state === 'inactive') {
            this.element.classList.add('blocked');
            this.element.style.display = 'block';
            return;
        }

        this.element.style.display = 'none';
    }
}
