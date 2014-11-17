define(function () {
    //кнопка назад, может меняться на кнопку обновить для нового уровня
    var UndoButton = function (o) {
        var undoButton = this;
        var undefined;

        this.app = o.app;
        this.active = true;
        this.caption = this.app.word("refresh");
        this.func = undoButton.app.refresh;

        this.$el = $('<div class="undoButton">' + undoButton.app.word("refresh") + '</div>').click(function (e) {
            //не даем продолжить выполнение событий
            e.preventDefault();

            if (undoButton.active && !undoButton.app.blockApp) {
                undoButton.func.apply(undoButton.app);
            }
        }).appendTo(undoButton.app.container.children(".panel.topRightPanel").first());

        this._set = function (o) {
            if (o.func !== undefined && undoButton.func !== o.func) {
                undoButton.func = o.func;
            }
            if (o.caption !== undefined && undoButton.caption !== o.caption) {
                undoButton.caption = o.caption;
                undoButton.$el.html(o.caption);
            }
            if (o.active !== undefined && undoButton.active !== o.active) {
                undoButton.active = o.active;
                if (undoButton.active) {
                    undoButton.$el.removeClass("blocked");
                }
                else {
                    undoButton.$el.addClass("blocked");
                }
            }
        };

        this._get = function (prop) {
            return undoButton[prop];
        };
    };
    return UndoButton;
});
