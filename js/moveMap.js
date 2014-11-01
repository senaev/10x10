define(['data'], function (d) {
    var undefined;
    var MoveMap;
    MoveMap = function () {
        var moveMap = this;
        this.generate = function (o) {
            var cubes;
            var startCube;
            cubes = o.cubes;
            startCube = o.startCube;

            if (this.colorSheme === undefined) {
                //цветовая схема, нужна для приведения коллекции к маске
                this.generateColorSheme();
            }


        };
        //функция нужна исключительно для передачи кубиков по сети в виде JSON объекта
        this.generateMaskOfTheCubes = function (obj) {
            var cubes;
            var mask;
            var main;

            mask = {};
            main = [];
            for (var key in d.fields) {
                mask[d.fields[key]] = "";
            }
            cubes = obj.cubes;
            //сначала генерируем боковые поля, где направление кубиков зависит исключительно от поля
            cubes._sideEach(function (cube) {
                mask[cube.field] += moveMap.colorSheme[cube.color];
            });
            //затем основное поле, с указателем направления, если направления нет - ноль
            cubes._mainEach(function (cube, field, x, y, i) {
                var direction;
                direction = cube.direction === null ? "0" : cube.direction.charAt(0);
                main.push(x + "" + y + direction);
            });
            //возвращаем значения главного поля в виде строки, кубики через запятую
            mask["main"] = main.join(",");

            return mask;
        };
        //создание цветовой схемы, в которой каждому цвету присваивается число
        this.generateColorSheme = function () {
            var colors = {};
            for (var key = 0; key < d.colors.length; key++) {
                colors[d.colors[key]] = key;
            }
            this.colorSheme = colors;
        };
    };
    return new MoveMap;
});