import $ from 'jquery';

import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';

import { TenOnTen } from './TenOnTen';

export class UndoButtonNew {
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

export class UndoButton {
    private app: TenOnTen;
    private active: boolean;
    private caption: string;
    private func: () => void;
    private $el: JQuery<HTMLElement>;

    public constructor(params: { app: TenOnTen }) {

        this.app = params.app;
        this.active = true;
        this.caption = this.app.word('refresh');
        this.func = this.app.refresh;

        this.$el = $('<div class="undoButton">' + this.app.word('refresh') + '</div>')
            .click((e) => {
                // не даем продолжить выполнение событий
                e.preventDefault();

                if (this.active && !this.app.blockApp) {
                    this.func.apply(this.app);
                }
            })
            .appendTo(this.app.container.children('.panel.topRightPanel').first());
    }

    public _set = (o: {
        active: boolean;
        func?: () => void;
        caption?: string;
    }) => {
        if (o.func !== undefined && this.func !== o.func) {
            this.func = o.func;
        }
        if (o.caption !== undefined && this.caption !== o.caption) {
            this.caption = o.caption;
            this.$el.html(o.caption);
        }
        if (o.active !== undefined && this.active !== o.active) {
            this.active = o.active;
            if (this.active) {
                this.$el.removeClass('blocked');
            } else {
                this.$el.addClass('blocked');
            }
        }
    };
}
