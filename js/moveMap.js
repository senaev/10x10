define(['data'], function (d) {
    function MoveMap() {
        var undefined;

        var moveMap = this;
        this.generate = function (o) {
            var cubes,
                startCube,
                mainMask;

            cubes = o.cubes;
            startCube = o.startCube;

            if (this.colorSheme === undefined) {
                //цветовая схема, нужна для приведения коллекции к маске
                this.generateColorSheme();
            }

            mainMask = this.generateMainMask({
                startCube: startCube,
                cubes: cubes
            });
            console.log(mainMask);
        };
        //функция нужна исключительно для передачи кубиков по сети в виде JSON объекта
        this.generateJSONMask = function (o) {
            var cubes;
            var mask;
            var main;

            mask = {};
            main = [];
            for (var key in d.fields) {
                mask[d.fields[key]] = "";
            }
            cubes = o.cubes;
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
        //генерация маски из кубиков, которые могут учавствовать в построении хода
        this.generateMainMask = function (o) {
            var startCube,
                mainMask,
                cubes;

            startCube = o.startCube;
            cubes = o.cubes;
            //класс для маски(слепок текущего состояния с возможностью создать пошагово один ход игры)
            function MainMask() {
                var cubes,
                    startCube,
                    mainMask;

                mainMask = this;
                cubes = o.cubes;
                startCube = o.startCube;
                //основной массив со значениями
                this.arr = [];
                //создаем маску, берем значения из коллекции кубес
                this.initialize = function () {
                    var startMCube,
                        startMCubeX,
                        startMCubeY;

                    //класс для удобной работы с м-кубиком
                    function MCube(o) {
                        this.x = o.x;
                        this.y = o.y;
                        this.color = o.color;
                        this.direction = o.direction;
                        this.extra = o.extra;
                        this.mainMask = o.mainMask;
                        this.steps = [];
                        this.cube = o.cube;
                    }

                    //один шаг для м-кубика, возвращает информацию о шаге для анимации
                    MCube.prototype.oneStep = function () {
                        var step;
                        step = {};
                        if (this.direction !== null) {
                            var nextPos = {x: this.x, y: this.y};
                            var prop;
                            if (this.direction === "top" || this.direction === "bottom") {
                                this.direction === "top" ? nextPos.y-- : nextPos.y++;
                            }
                            else {
                                this.direction === "left" ? nextPos.x-- : nextPos.x++;
                            }
                            if (nextPos.x < 0 || nextPos.x > 9 || nextPos.y < 0 || nextPos.y > 9) {
                                this.x = nextPos.x;
                                this.y = nextPos.y;
                                this.direction = null;
                                step.do = "toSide";
                            }
                            else {
                                if (this.mainMask._get(nextPos) === null) {
                                    this.x = nextPos.x;
                                    this.y = nextPos.y;
                                    step.do = "s" + this.direction.charAt(0);
                                }
                                else {
                                    step.do = null;
                                }
                            }
                        }
                        else {
                            step.do = null;
                        }
                        this.steps.push(step);
                        return step;
                    };
                    //создаем массив из всех кубиков, которые есть на доске
                    cubes._mainEach(function (cube) {
                        mainMask.arr.push(new MCube({
                            x: cube.x,
                            y: cube.y,
                            color: cube.color,
                            direction: cube.direction,
                            extra: cube.extra,
                            mainMask: mainMask,
                            cube: cube
                        }));
                    });
                    //добавляем в маску кубик, с которого начинаем анимацию
                    if (startCube.field === "top" || startCube.field === "bottom") {
                        startMCubeX = startCube.x;
                        startMCubeY = (startCube.field === "top") ? -1 : 10;
                    }
                    else {
                        startMCubeX = (startCube.field === "left") ? -1 : 10;
                        startMCubeY = startCube.y;
                    }
                    startMCube = new MCube({
                        x: startMCubeX,
                        y: startMCubeY,
                        color: startCube.color,
                        direction: startCube.direction,
                        extra: startCube.extra,
                        mainMask: mainMask,
                        cube: startCube
                    });
                    this.arr.push(startMCube);
                };
                this.initialize();
                //один ход для всех кубиков на доске
                this.step = function () {
                    var somethingHappend;
                    somethingHappend = false;
                    for (var key in this.arr) {
                        var oneStep;
                        oneStep = this.arr[key].oneStep();
                        if (oneStep.do !== null) {
                            somethingHappend = true;
                        }
                    }

                    //console.log("//////////_endOneStep");

                    if (somethingHappend) {
                        this.step();
                    }
                    else {
                        //console.log("//////////_endOfRun");
                        /**
                         * здесь долдна быть функция подрыва кубиков и проверки,
                         * продолжается ход или нет
                         * и если да, то выполняем еще один степ()
                         */
                        this.createAnimationMap();
                    }
                };
                //строим анимацию для каждого кубика одтельно на основе steps каждого м-кубика
                this.createAnimationMap = function () {
                    this.animationMap = [];
                    var noEmptyActions = [];
                    for (var key in this.arr) {
                        var steps = this.arr[key].steps;
                        //console.log(steps);
                        var cube = this.arr[key].cube;
                        var actions = [{action: null, duration: 0}];
                        for (var key1 = 0; key1 < steps.length; key1++) {
                            var step = steps[key1];
                            var lastAction = actions[actions.length - 1];
                            //console.log(key1,  step.do, lastAction.action, steps);
                            if (step.do === lastAction.action) {
                                lastAction.duration++;
                            }
                            else {
                                //для каждого действия - по-своему, в том числе в зависимости от предидущих действий
                                switch (step.do) {
                                    case "toSide":
                                        lastAction.action = lastAction.action + "ToSide";
                                        lastAction.duration++;
                                        break;
                                    case null:
                                        if (["st", "sr", "sl", "sb"].indexOf(lastAction.action) > -1) {
                                            lastAction.action = lastAction.action + "Bump";
                                            lastAction.duration++;
                                        }
                                        else {
                                            actions.push({action: step.do, duration: 1});
                                        }
                                        break;
                                    default:
                                        actions.push({action: step.do, duration: 1});
                                        break;
                                }
                            }
                        }
                        actions.shift();


                        if (actions.length !== 0) {
                            var nullToDelayActions = [];
                            var delay = 0;
                            for (var key1 = 0; key1 < actions.length; key1++) {
                                var action = actions[key1];
                                action.delay = delay;
                                delay += action.duration;
                                if (action.action !== null) {
                                    nullToDelayActions.push(action);
                                }
                            }
                            this.animationMap.push({
                                actions: nullToDelayActions,
                                cube: this.arr[key].cube
                            });
                        }
                    }
                };
                this.step();
            }

            //поскольку маска - несортированный масив, получаем куб методом перебора
            MainMask.prototype._get = function (o) {
                var arr;
                arr = this.arr;
                for (var key in arr) {
                    if (arr[key].x === o.x && arr[key].y === o.y) {
                        return arr[key];
                    }
                }
                return null;
            };
            mainMask = new MainMask({
                startCube: startCube,
                cubes: cubes
            });
            return mainMask;
        }
    };
    return new MoveMap;
});