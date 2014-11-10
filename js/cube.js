//Cube class
define(['data'], function (d) {
    function Cube(o) {
        var undefined,
            cube,
            color,
            visibleModeClasses;

        cube = this;
        this.x = o.x;
        this.y = o.y;
        this.field = o.field;
        //указатель на игру, к которой кубик привязан
        this.app = o.app;
        //понадобится дополнительно для дополнительных функций кубика
        this.extra = {};
        //направнение движения
        this.direction = (function (field) {
            if (field === "top") {
                return "bottom";
            }
            else if (field === "bottom") {
                return "top";
            }
            else if (field === "left") {
                return "right";
            }
            else if (field === "right") {
                return "left";
            }
            else {
                return null;
            }
        })(this.field);

        //задаем цвет кубика
        if (o.color === undefined) {
            color = d.colors[d.f.rand(0, d.levels[d.level].colorsCount - 1)];
        }
        else {
            color = o.color;
        }
        this.color = color;

        //проверка на то, что данный кубик в боковом поле дальше третьего и не должен быть отображен
        if (cube.field !== "main") {
            if (this._inFieldIsVisible()) {
                visibleModeClasses = " ";
            }
            else {
                visibleModeClasses = " cubeHidden";
            }
        }
        else {
            visibleModeClasses = " ";
        }

        //указатель на DOM-элемент кубика с прослушиванием событий
        this.$el = $('<div class="cube"></div>')
            .addClass(this.color + " f" + this.field + visibleModeClasses)
            .hover(
            function (e) {
                e.preventDefault();

                if (cube.field === "main") {

                }
                else {
                    cube.findFirstInLine().$el.addClass("firstInHoverLine");
                }
            },
            function (e) {
                e.preventDefault();

                if (cube.field === "main") {

                }
                else {
                    cube.findFirstInLine().$el.removeClass("firstInHoverLine");
                }
            })
            .click(function (e) {
                //не даем продолжить выполнение событий
                e.preventDefault();
                //и снимаем курсор с элемента
                cube.$el.trigger("mouseout");

                //если стоит блокировка событий приложения - не даём пользователю ничего сделать
                if (cube.app.blockApp) {
                    return;
                }

                //если щелчек произошол по главному полю - ничего не делаем
                if (cube.field === "main") {

                }
                //если по боковому
                else {
                    //ищем первый кубик в одной линии бокового поля с кубиком, по  которому щелкнули
                    var startCube = cube.findFirstInLine();
                    //и отправляем его в путь-дорогу
                    cube.app.run({startCube: startCube});
                }
            });

        this.toField();
    }

    //отправляем созданный кубик в приложение - добавляем в коллекцию cubes и в html-контейнер
    Cube.prototype.toField = function () {
        this.app.cubes._add(this);
        this.toState();
        this.app.container.append(this.$el);
    };
    //ищем первый кубик в одной линии бокового поля с кубиком, по  которому щелкнули
    Cube.prototype.findFirstInLine = function () {
        var o = {field: this.field};
        if (o.field === "top" || o.field === "bottom") {
            o.x = this.x;
            o.y = (o.field === "top") ? 9 : 0;
        }
        else {
            o.x = (o.field === "left") ? 9 : 0;
            o.y = this.y;
        }
        return this.app.cubes._get(o);
    };
    //задаем html-элементу кубика положение на доске
    //если параметры не переданы, устанавливаем текущую позицию кубика
    //если переданы - устанавливаем в поле кубику, в позицию х/у, переданные в параметрах
    Cube.prototype.toState = function (o) {
        var x,
            y;
        if (o === undefined) {
            x = this.x;
            y = this.y;
        }
        else {
            x = o.x;
            y = o.y;
        }
        var left = x * d.oneWidth;
        var top = y * d.oneWidth;
        switch (this.field) {
            case "top":
                top -= d.oneWidth * 10;
                break;
            case "right":
                left += d.oneWidth * 10;
                break;
            case "bottom":
                top += d.oneWidth * 10;
                break;
            case "left":
                left -= d.oneWidth * 10;
                break;
        }
        this.$el.css({
            left: left,
            top: top
        });
    };
    //добавляем объект анимации на обработку через время, полученное в атрибутах
    Cube.prototype.addAnimate = function (o) {
        var action,
            delay,
            duration,
            cube;

        console.log(o);

        action = o.action;
        delay = o.delay;
        duration = o.duration;
        cube = this;
        setTimeout(function (o) {
            cube.animate(o);
        },delay* d.animTime,{action: action, duration: duration});
    };
    //добавляем объект анимации на обработку через время, полученное в атрибутах
    Cube.prototype.remove = function () {
        this.$el.remove();
    };
    //сама функция анимации - в зависимости од переданного значения, выполняем те или иные
    //преобразования html-элемента кубика
    Cube.prototype.animate = function (o) {

        var action,
            duration,
            dur,
            cube;
        cube = this;
        action = o.action;
        duration = o.duration;
        switch (action) {
            //движение вправо со столкновением
            case "srBump":
                slideWithBump("left", "+");
                break;
            //движение вправо со столкновением
            case "sbBump":
                slideWithBump("top", "+");
                break;
            //движение вправо со столкновением
            case "slBump":
                slideWithBump("left", "-");
                break;
            //движение вправо со столкновением
            case "stBump":
                slideWithBump("top", "-");
                break;
            //движение вправо с последующим вливанием в правое поле
            case "srToSide":
                slideToSide("left", "+");
                break;
            //движение вправо с последующим вливанием в правое поле
            case "stToSide":
                slideToSide("top", "-");
                break;
            //движение вправо с последующим вливанием в правое поле
            case "slToSide":
                slideToSide("left", "-");
                break;
            //движение вправо с последующим вливанием в правое поле
            case "sbToSide":
                slideToSide("top", "+");
                break;
            //передвигаем кубик в боковом поле ближе к mainField
            case "nearer":
                nearer();
                break;
            //кубик появляется третим в боковом поле
            case "apperanceInSide":
                apperance();
                break;
            //третий кубик в боковой линии пропадает
            case "disapperanceInSide":
                disapperance();
                break;
                e();
                break;
            //передвигаем кубик в боковой панели дальше от mainField
            case "forth":
                forth();
                break;
            //передвигаем кубик в боковой панели дальше от mainField
            case "boom":
                boom();
                break;
            default:
                console.log("Неизвестная анимация: " + action);
                break
        }


        function bezier(duration) {
            var o = {
                1: 99,
                2: 58,
                3: 42,
                4: 34,
                5: 27,
                6: 23,
                7: 19,
                8: 15,
                9: 12,
                10: 11,
                11: 10
            }
            return o[duration];
        }

        function slideWithBump(prop, sign) {
            dur = duration - 1;
            var scale = (prop === "left") ? [0.9, 1.1] : [1.1, 0.9];
            var trans0 = {
                duration: d.animTime * dur,
                easing: 'cubic-bezier(.' + bezier(dur) + ', 0, 1, 1)'
            };
            trans0[prop] = sign + '=' + dur * d.oneWidth;
            var trans1 = {
                scale: scale,
                duration: d.animTime / 2
            };
            trans1[prop] = (sign === "+" ? "+" : "-") + "=4";
            var trans2 = {
                scale: 1,
                duration: d.animTime / 2
            }
            trans2[prop] = (sign === "+" ? "-" : "+") + "=4";
            cube.$el.transition(trans0)
                .transition(trans1)
                .transition(trans2);
        }

        function slideToSide(prop, sign) {
            dur = duration;
            var easing = 'cubic-bezier(.' + bezier(dur) + ', 0,.' + (100 - bezier(dur)) + ', 1)';
            var trans = {
                duration: d.animTime * dur,
                easing: easing
            };
            trans[prop] = sign + '=' + dur * d.oneWidth;

            setTimeout(function (cube) {
                cube.app.cubes.animate({action: "inLine", cube: cube});
            }, d.animTime * (dur - 1), cube);

            cube.$el.transition(trans, function () {
                var dir = d.f.reverseField(cube.field);
                cube.$el.removeClass("d" + cube.field + " f" + dir)
                    .addClass("f" + cube.field);
            });
        }

        function nearer() {
            var prop,
                sign = "-",
                trans = {};

            if (cube.field === "top" || cube.field === "bottom") {
                prop = "top";
                if (cube.field === "top") {
                    sign = "+";
                }
            }
            else {
                prop = "left";
                if (cube.field === "left") {
                    sign = "+";
                }
            }
            trans[prop] = sign + "=" + duration * d.oneWidth;
            cube.$el.transition(trans)
        }

        function forth() {
            var prop,
                sign = "+",
                trans = {easing: "out"};

            if (cube.field === "top" || cube.field === "bottom") {
                prop = "top";
                if (cube.field === "top") {
                    sign = "-";
                }
            }
            else {
                prop = "left";
                if (cube.field === "left") {
                    sign = "-";
                }
            }
            trans[prop] = sign + "=" + duration * d.oneWidth;
            cube.$el.transition(trans)
        }

        function apperance() {
            var pos = {x: cube.x, y: cube.y};
            switch (cube.field) {
                case "top":
                    pos.y = d.cubesWidth - 3;
                    break;
                case "right":
                    pos.x = 2;
                    break;
                case "bottom":
                    pos.y = 2;
                    break;
                case "left":
                    pos.x = d.cubesWidth - 3;
                    break;
            }
            cube.toState(pos);
            cube.$el.removeClass("cubeHidden")
                .css({scale: 0, opacity: 0.4})
                .transition({
                    scale: 1,
                    opacity: 1,
                    duration: duration * d.animTime,
                    delay: duration * d.animTime,
                    easing: "out"
                });
        }

        function disapperance() {
            cube.$el.transition({
                    scale: 0,
                    opacity: 0,
                    duration: duration * d.animTime,
                    easing: "out"
                });
            setTimeout(function (cube) {
                cube.$el.css({
                    scale: 1,
                    opacity: 1
                }).addClass("cubeHidden");
            },duration * d.animTime,cube);
        }

        function boom(){
            console.log("123: ", duration, action);
            cube.$el.transition({
                scale: 1.5,
                opacity: 0,
                duration: d.animTime,
                easing: "out"
            },function(){
                cube.remove();
            });
        }
    };
    Cube.prototype._inFieldIsVisible = function () {
        var pos;
        if (this.field === "top" || this.field === "bottom") {
            pos = this["y"];
            return (this.field === "top") ? pos > 6 : pos < 3;
        }
        else {
            pos = this["x"];
            return (this.field === "left") ? pos > 6 : pos < 3;
        }
    };
    return Cube;
});