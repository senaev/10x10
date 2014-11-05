//Cubes collection
define(['data', 'cube'], function (d, Cube) {
    var cubes = {};

    for (var key in d.fields) {
        cubes[d.fields[key]] = {};
        for (var x = 0; x < d.cubesWidth; x++) {
            cubes[d.fields[key]][x] = {};
            for (var y = 0; y < d.cubesWidth; y++) {
                cubes[d.fields[key]][x][y] = null;
            }
        }
    }

    //добавляем в коллекцию кубик(необходимо для инициализации приложения)
    cubes._add = function (cube) {
        this[cube.field][cube.x][cube.y] = cube;
    };
    //берем значение клетки из коллекции по полю, иксу, игреку
    cubes._get = function (o) {
        return this[o.field][o.x][o.y];
    };
    //устанавливаем начемие клетки, переданной в объекте, содержащем поле, икс, игрек
    cubes._set = function (o, value) {
        cubes[o.field][o.x][o.y] = value;
        return this[o.field][o.x][o.y];
    };
    //пробегаемся по всем элементам боковых полей, выполняем переданную функцию
    //с каждым кубиком
    cubes._sideEach = function (func) {
        for (var key in d.fields) {
            if (d.fields[key] !== "main") {
                for (var x = 0; x < d.cubesWidth; x++) {
                    for (var y = 0; y < d.cubesWidth; y++) {
                        func(cubes[d.fields[key]][x][y], d.fields[key], x, y);
                    }
                }
            }
        }
    };
    //пробегаемся по всем элементам главного поля, выполняем переданную функцию с каждым
    //не нулевым найденным кубиком
    cubes._mainEach = function (func) {
        var i;
        i = 0;
        for (var x = 0; x < d.cubesWidth; x++) {
            for (var y = 0; y < d.cubesWidth; y++) {
                if (cubes["main"][x][y] !== null) {
                    func(cubes["main"][x][y], "main", x, y, i);
                    i++;
                }
            }
        }
    };
    //получаем массив координат кубиков линии в порядке от дальнего( относительно mainField)
    //до ближайшего
    cubes._getLine = function (o) {
        var staticProp,
            dynamicProp,
            line,
            coords;

        line = [];
        if (o.field === "top" || o.field === "bottom") {
            staticProp = "x";
            dynamicProp = "y";
        }
        else {
            staticProp = "y";
            dynamicProp = "x";
        }
        if (o.field === "top" || o.field === "left") {
            for (var key = 0; key < d.cubesWidth; key++) {
                coords = {field: o.field};
                coords[staticProp] = o[staticProp];
                coords[dynamicProp] = key;
                line.push(coords);
            }
        }
        else {
            for (var key = d.cubesWidth - 1; key >= 0; key--) {
                coords = {field: o.field};
                coords[staticProp] = o[staticProp];
                coords[dynamicProp] = key;
                line.push(coords);
            }
        }
        return line;
    };
    //вырезаем кубик из боковой линии и заполняем последний элемент в этой линии
    cubes._cutFromLine = function (cube) {
        var x = cube.x;
        var y = cube.y;
        var field = cube.field;
        //получаем линию
        var line = this._getLine({x: x, y: y, field: field});
        //пробегаемся, меняем значения в коллекции
        for (var key = line.length - 1; key > 0; key--) {
            this._set(line[key], this._get(line[key - 1]));
        }
        //генерируем кубик для крайнего значения в линии
        this._set(line[0], new Cube({
            x: line[0].x,
            y: line[0].y,
            field: line[0].field,
            app: this._app
        }))
    };
    //добавляем в линию кубик, по кубику мы должны определить, в какую линию
    cubes._pushInLine = function (cube) {
        //меняем значения кубика
        cube.field = cube.direction;
        cube.direction = null;
        //получаем линию, в которую вставим кубик
        var line = this._getLine({x: cube.x, y: cube.y, field: cube.field});
        //получаем удаляемый (дальний от mainField в линии) кубик
        var removedCube = this._get(line[0]);
        //сдвигаем линию на одну клетку от mainField
        for (var key = 0; key < line.length - 1; key++) {
            this._set(line[key], this._get(line[key + 1]));
        }
        //устанавливаем значение первой клетки
        this._set(line[line.length - 1], cube);
        //удаляем крайний кубик
        removedCube.remove();
    };
    cubes._mergeMoveMap = function (moveMap) {
        var arr = moveMap.mainMask.arr;
        var startCube = moveMap.startCube;
        //извлекаем startCube из боковой панели, все дальнейшие значения field кубиков
        //могут меняться только при вхождении их в боковую панель
        //вытаскиваем кубик из боковой панели коллекции
        this._cutFromLine(startCube);
        //меняем значение field
        startCube.field = "main";

        //пробегаемся по массиву м-кубиков и если м-кубик вошел в боковое поле,
        //меняем его свойства direction, field, x, y в соответствии со значениями
        //м-кубика и стороной поля, также перемещаем все кубики в линии, в которую вошел
        //данный кубик
        for (var key in arr) {
            var mCube = arr[key];
            if (mCube.x > -1 && mCube.x < 10 && mCube.y > -1 && mCube.y < 10) {
                //кубик просто перемещается и не входит не в какую панель
                //устанавливаем кубик в новую клетку
                this._set({field: "main", x: mCube.x, y: mCube.y}, mCube.cube);
                //при этом если клетку, с которой сошел кубик, ещё не занял другой кубик
                //обнуляем эту клетку
                if (mCube.mainMask._get({x: mCube.cube.x, y: mCube.cube.y}) === null) {
                    cubes._set({field: "main", x: mCube.cube.x, y: mCube.cube.y}, null);
                }
                mCube.cube.x = mCube.x;
                mCube.cube.y = mCube.y;
            }
        }
        for (var key in moveMap.toSideActions) {
            var mCube = moveMap.toSideActions[key];
            //если клетку, с которой сошел кубик, ещё не занял другой кубик
            //обнуляем эту клетку
            if (mCube.mainMask._get({x: mCube.cube.x, y: mCube.cube.y}) === null) {
                cubes._set({field: "main", x: mCube.cube.x, y: mCube.cube.y}, null);
            }
            mCube.cube.x = mCube.x;
            mCube.cube.y = mCube.y;
            //пушим кубик в коллекцию боковой линии
            this._pushInLine(mCube.cube);
        }
        console.log(arr);
    };
    cubes.animate = function (o) {
        var action,
            cube;

        action = o.action;
        cube = o.cube;
        switch  (action){
            case "fromLine":
        //        var line = this._getLine({x: cube.x, y: cube.y, field: cube.field});
        //        console.log(line);
                break;
        }
    };

    return cubes;
})
;