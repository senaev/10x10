import $ from 'jquery';

import { TenOnTen } from './TenOnTen';

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
