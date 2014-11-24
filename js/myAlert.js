define(['data'], function (d) {
    var MyAlert = function (o) {
        var myAlert = this;
        this.app = o.app;

        var app = this.app;
        var undefined;

        this.content = $('<div class="content"></div>');

        //функция, выполняемая после areYouSure
        this.areYouSureFunc = null;
        //контейнер для алерта(с затемняющим бэкграундом)
        this.$el = $('<div class="alertContainer"></div>')
            .append(this.content)
            .appendTo(this.app.container)
            .css({
                top: -d.oneWidth * 3 - 3,
                right: -d.oneWidth * 3 - 3,
                bottom: -d.oneWidth * 3 - 3,
                left: -d.oneWidth * 3 - 3
            })
            .click(function (e) {
                e.stopPropagation();
                myAlert.hide();
            });

        //показываем алерт
        this.show = function () {
            //главный контейнер с затемнением
            this.$el.css({
                "z-index": 1,
                opacity: 1
            });
        };

        //скрываем алерт
        this.hide = function () {
            //главный контейнер с затемнением
            this.$el.css({
                opacity: 0
            });
            setTimeout(
                function (myAlert) {
                    myAlert.$el.css({
                        "z-index": -1
                    });
                }, 200, this
            );
        };

        //функция показа алерта, вызывается из любого куска приложения
        this.alert = function (o) {
            console.log(o);
            //контент, который будет вставлен в слерт
            this.content.html("");

            //в зависимости от типа алерта
            switch (o.action) {
                case "new_game":
                    var question = $('<div class="question">' +
                    this.app.word("play_again") +
                    '</div>').appendTo(myAlert.content);

                    var yes = $('<div class="button leftButton">' + this.app.word("yes") + '</div>').click(function (e) {
                        e.stopPropagation();
                        myAlert.app.newGame();
                        myAlert.hide();
                    });

                    var no = $('<div class="button rightButton">' + this.app.word("no") + '</div>').click(function (e) {
                        e.stopPropagation();
                        myAlert.hide();
                    });

                    var buttons = $('<div class="buttons"></div>').append(yes, no).appendTo(myAlert.content);
                    break;
                case "end_of_game":
                    var question = $('<div class="question">' +
                    this.app.word("end_of_game") +
                    '</div>').appendTo(myAlert.content);

                    var tryAgain = $('<div class="button buttonMin">' + this.app.word("try_again") + '</div>').click(function (e) {
                        e.stopPropagation();
                        myAlert.app.newGame();
                        myAlert.hide();
                    });

                    var buttons = $('<div class="buttons "></div>').append(tryAgain).appendTo(myAlert.content);
                    break;
                default:
                    throw new Error("Неверное значение алерта");
                    break;
            }

            //показываем алерт
            this.show();
        };
    };

    return MyAlert;
})
;