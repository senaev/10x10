//Cube class
define(['data', 'cubeAnimation'], function (d, cubeAnimation) {
    function Cube(o) {
        var undefined,
            cube,
            color,
            visibleModeClasses;

        cube = this;
        this.x = o.x;
        this.y = o.y;


        this.rand = d.f.rand(0, 1000000);

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
    Cube.prototype.animate = cubeAnimation;

    //проверка, показывать кубик или нет в поле
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