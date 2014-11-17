define(['data'], function (d) {
    var MyAlert = function (o) {
        var myAlert = this;
        this.app = o.app;

        var app = this.app;
        var undefined;

        //функция, выполняемая после areYouSure
        this.areYouSureFunc = null;

        //контейнер для пунктов меню
        this.punctsContainer = $('<div class="punctsContainer">sdfsdfsd</div>')
            .css({scale: [1, 0]});

        //контейнер для алерта(с затемняющим бэкграундом)
        this.$el = $('<div class="alertContainer"></div>')
            .append(this.punctsContainer)
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
        this.show = function (o) {
            var zI = parseInt(myAlert.$el.css("z-index"));
            //главный контейнер с затемнением
            this.$el.css({
                "z-index": 1,
                opacity: 1
            });

            if (zI < 0) {
                myAlert.punctsContainer.transition({
                    scale: 1,
                    height: o.height,
                    "margin-top": -o.height / 2 - 10
                });
            }
            else {
                myAlert.punctsContainer.css({
                    height: o.height,
                    "margin-top": -o.height / 2 - 10
                });
            }
        };

        //скрываем алерт
        this.hide = function () {
            this.$el.css({opacity: 0});
            myAlert.punctsContainer.transition({
                scale: [1, 0],
                easing: "cubic-bezier(.10, .77, 1, 1)"
            }, function () {
                myAlert.$el.css({
                    "z-index": -1
                });
                myAlert.punctsContainer.css({
                    scale: [1, 0],
                    "margin-top": "auto",
                    height: "auto"
                }).html("");
            });
        };

        //функция показа алерта, вызывается из любого куска приложения
        this.alert = function (o) {
            console.log(o);
            //контент, который будет вставлен в слерт
            var content;

            //высота алерта
            var height = 215;

            //задаем функцию для are_you_sure
            if (o.func !== undefined) {
                this.areYouSureFunc = o.func;
            }

            //вспомогательные вещи для регулировки скорости анимации
            var speeds = {
                45: app.word('fast'),
                75: app.word('middle'),
                150: app.word('slow')
            };

            function getSpeed() {
                return speeds[myAlert.app.speed];
            }

            function nextSpeed() {
                var next = myAlert.app.speed === 150 ? 75 : myAlert.app.speed === 75 ? 45 : 150;
                console.log(next);
                myAlert.app.speed = next;
                return speeds[next];
            }

            //в зависимости от типа алерта
            switch (o.action) {
                //вставляем меню
                case "menu":
                    height = 217;
                    var soundOn = myAlert.app.soundOn;

                    //пункты меню
                    var soundPunct = $('<div class="menuPunct">' + app.word('sound') + ': <span class = "value">' +
                    (soundOn ? app.word('on') : app.word('off')) +
                    '</span></div>').click(function (e) {
                        e.stopPropagation();
                        myAlert.app.soundOn = !myAlert.app.soundOn;
                        var soundOn = myAlert.app.soundOn;
                        console.log(soundOn);
                        soundPunct.find("span.value").first().html(
                            soundOn ? app.word('on') : app.word('off')
                        );
                    });


                    var speedPunct = $('<div class="menuPunct">' + app.word('speed') + ': <span class = "value">' +
                    getSpeed() +
                    '</span></div>').click(function (e) {
                        e.stopPropagation();
                        var next = nextSpeed();
                        speedPunct.find("span.value").html(next);
                    });

                    var puncts = [
                        $('<div class="menuPunct">' + app.word('resume') + '</div>').click(function (e) {
                            e.stopPropagation();
                            myAlert.hide();
                        }),
                        $('<div class="menuPunct">' + app.word('new_game') + '</div>').click(function (e) {
                            e.stopPropagation();
                            myAlert.alert({
                                action: "are_you_sure",
                                func: myAlert.app.newGame
                            });
                        }),
                        $('<div class="menuPunct">' + app.word('statistics') + '</div>').click(function (e) {
                            e.stopPropagation();
                            myAlert.alert({
                                action: "stasistics"
                            });
                        }),
                        $('<div class="menuPunct">' + app.word('top_gamers') + '</div>').click(function (e) {
                            e.stopPropagation();
                            myAlert.alert({
                                action: "stasistics"
                            });
                        }),
                    /**
                     *
                     * здесь включение-выключение звуков
                     *
                     */
                        //soundPunct,
                        speedPunct
                    ];
                    content = $('<div class="menuContent"></div>');
                    for (var key in puncts) {
                        content.append(puncts[key]);
                    }
                    break;
                //алерт "вы уверены?"
                case "are_you_sure":
                    height = 80;
                    //вопрос
                    var question = $('<div class="menuPunct"><span class="question">' +
                    app.word("play_again") +
                    '</span></div>');

                    //кнопки
                    var buttons = $('<div class="menuButtons"></div>');

                    var yes = $('<div class="menuButton menuButtonLeft">' + app.word('yes') + '</div>')
                        .click(function (e) {
                            e.stopPropagation();
                            myAlert.areYouSureFunc.apply(myAlert.app);
                            myAlert.hide();
                        })
                        .appendTo(buttons);

                    var no = $('<div class="menuButton menuButtonRight">' + app.word('no') + '</div>')
                        .click(function (e) {
                            e.stopPropagation();
                            myAlert.hide();
                        })
                        .appendTo(buttons);


                    content = $('<div class="menuContent"></div>').append(question).append(buttons);
                    break;
                default:
                    throw new Error("Неверное значение алерта");
                    break;
            }

            //вставляем контент
            myAlert.punctsContainer.html(content);

            //показываем алерт
            this.show({height: height});
        };
    };

    return MyAlert;
})
;