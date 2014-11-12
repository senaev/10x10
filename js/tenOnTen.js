define(['cube', 'cubes', 'data', 'movemap'], function (Cube, cubes, d, MoveMap) {
    var TenOnTen = function (args) {
        var undefined;
        var tenOnTen = this;

        //получаем коллекцию кубиков и устанавливаем в параметрах проложение,
        //которому эти кубики принадлежат
        this.cubes = cubes;
        this.cubes._app = this;

        //индикатор состояния приложения - разрешены какие-либо действия пользователя или нет
        this.blockApp = false;

        //variables
        var appContainer;

        //Find App Container
        if (!args) {
            throw new Error("tenOnTen: Add tenOnTen arguments");
        }
        else if (typeof args === "string") {
            appContainer = $(args).first();
        }
        else if (typeof args === "object") {
            appContainer = $(args.appContainer).first();
        }
        else {
            throw new Error("tenOnTen: app container type error");
        }
        this.container = appContainer;


        //Initialize container function
        (function () {
            var topRightPanel = '<div class="panel topRightPanel"><div class="previousButton blocked">undo</div></div>';
            var background = '<div class="backgroungField">';
            for (var key = 0; key < d.cubesWidth * d.cubesWidth; key++) {
                background += '<div class="dCube"></div>';
            }
            background += '</div>';
            var backgroundField = $(background).css({
                height: d.oneWidth * d.cubesWidth,
                width: d.oneWidth * d.cubesWidth,
                padding: d.oneWidth * 3 + 3,
                left: d.oneWidth * -3 - 3,
                top: d.oneWidth * -3 - 3
            });
            this.container.css({
                height: d.oneWidth * d.cubesWidth,
                width: d.oneWidth * d.cubesWidth,
                margin: d.oneWidth * 3,
                position: "relative"
            }).addClass("tenOnTenContainer")
                .append(backgroundField)
                .append(topRightPanel);

            $(".tenOnTenContainer>.panel.topRightPanel>.previousButton").click(function () {
                tenOnTen.undo()
            });
        }).apply(this);


        //Initialize map function
        this.initialize = function () {
            //генерируем кубики в боковых панелях
            cubes._sideEach(function (cube, field, x, y) {
                cube = new Cube({
                    x: x,
                    y: y,
                    field: field,
                    app: tenOnTen
                });
            });
            //генерируем кубики на главном поле
            for (var number = 0, len = d.levels[d.level].cubesCount; number < len; number++) {
                if (d.firstCubesPosition[number] !== undefined) {
                    var pos = d.firstCubesPosition[number];
                    var cube;
                    cube = new Cube({
                        x: pos[0],
                        y: pos[1],
                        field: 'main',
                        app: tenOnTen,
                        color: d.colors[number % d.levels[d.level].colorsCount]
                    });
                }
                else {
                    throw new Error("Необходимо создать функцию генерации кубов в случайных местах и внедрить в initialize");
                }
            }
        };
        //запускаем инициализацию приложения
        this.initialize();
        //запускаем ход, начиная движение со startCube
        this.run = function (o) {
            this.moveMap = new MoveMap();

            //создаем маску для возможности возврата хода
            this.previousStepMap = this.generateMask();

            this.moveMap.generate({
                startCube: o.startCube,
                cubes: this.cubes,
                app: tenOnTen
            });
            //пошаговый запуск анимации
            this.moveMap.animate();
            //подитоживание - внесение изменений, произошедших в абстрактном moveMap
            //в реальную коллекцию cubes
            this.cubes._mergeMoveMap(this.moveMap);

            //console.log("//////////ITOG CUBES:", this.cubes);
        };
        //делаем возврат хода
        this.undo = function () {
            var previousButton = this.container.find(".panel.topRightPanel>.previousButton");
            if (previousButton.hasClass("blocked")) {
                //console.log("blocked");
            }
            else {
                //блокируем приложение до тех пор, пока не закончим анимацию
                this.blockApp = true;
                setTimeout(
                    function(app){
                        app.blockApp = false;
                    },
                    d.animTime * 4,
                    this
                );

                previousButton.addClass("blocked");

                //массив, в котором описаны все различия между текущим и предидущим состоянием
                var changed = [];
                //пробегаем в массиве по каждому кубику предидущего массива
                for (var fieldName in this.previousStepMap) {
                    for (var x in this.previousStepMap[fieldName]) {
                        for (var y in this.previousStepMap[fieldName][x]) {
                            x = parseInt(x);
                            y = parseInt(y);
                            var pCube = this.previousStepMap[fieldName][x][y];
                            //берем соответствующее значение текущей маски для сравнения
                            var cube = this.cubes._get({field: fieldName, x: x, y: y});
                            //если предидущее - null
                            if (pCube === null) {
                                //а новое - что-то другое
                                //удаляем кубик из нового значения
                                if (cube !== null) {
                                    changed.push({
                                        field: fieldName,
                                        x: x,
                                        y: y,
                                        pCube: null,
                                        cube: cube,
                                        action: "remove"
                                    });
                                }
                            }
                            //если же раньше тут тоже был кубик
                            else {
                                //а сейчас кубика нету
                                //заполняем клетку кубиком
                                if (cube === null) {
                                    changed.push({
                                        field: fieldName,
                                        x: x,
                                        y: y,
                                        pCube: pCube,
                                        cube: null,
                                        action: "add"
                                    });
                                }
                                //если и раньше и сейчас - нужно сравнить эти значения
                                else {
                                    //пробегаемся по каждому параметру
                                    for (var prop in pCube) {
                                        //если какие-то параметры различаются,
                                        //меняем параметры кубика
                                        if (cube[prop] !== pCube[prop]) {
                                            changed.push({
                                                field: fieldName,
                                                x: x,
                                                y: y,
                                                pCube: pCube,
                                                cube: cube,
                                                action: "change"
                                            });
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                for (var key in changed) {
                    var cube = changed[key].cube;
                    switch (changed[key].action) {
                        case "add":
                            //создаем новый кубик с теми же параметрами и подменяем им предидущий
                            cube = new Cube({
                                x: changed[key].x,
                                y: changed[key].y,
                                field: changed[key].field,
                                color: changed[key].pCube.color,
                                direction: changed[key].pCube.direction,
                                app: this,
                                disapperance: "cool"
                            });
                            console.log(cube);
                            break;
                        case "remove":
                            //удаляем нафиг кубик
                            this.cubes._set({field: changed[key].field, x: changed[key].x, y: changed[key].y}, null);
                            cube.animate({action: "remove", duration: 4, delay: 0});
                            break;
                        case "change":
                            cube.change({
                                color: changed[key].pCube.color,
                                direction: changed[key].pCube.direction
                            });
                            break;
                        default :
                            throw new Error("Неизвествое значение в changed[key].action: ", changed[key].action);
                            break;
                    }
                }
            }
        };
        //генерируем маску для предидущего хода
        this.generateMask = function () {
            var cubes;
            var mask;
            var main;

            mask = {};
            cubes = this.cubes;

            for (var fieldNumber in d.fields) {
                var field = d.fields[fieldNumber];
                mask[field] = [];
                for (var x = 0; x < d.cubesWidth; x++) {
                    mask[field][x] = [];
                    for (var y = 0; y < d.cubesWidth; y++) {

                        var c = cubes._get({field: field, x: x, y: y});

                        if (c === null) {
                            mask[field][x][y] = null;
                        }
                        else {
                            mask[field][x][y] = {
                                color: c.color,
                                direction: c.direction
                            };
                        }
                    }
                }
            }

            return mask;
        };
    };

    return TenOnTen;
});
