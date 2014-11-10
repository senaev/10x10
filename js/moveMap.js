define(['data', 'mainMask'], function (d, MainMask) {
    /**
     * класс для удобной работы с абстрактным классом MainMask
     * абстрагирует функции, связанные с анимацией от этого класса
     * сочетает в себе как функцию генерации хода, так и генерации анимации
     * предаставляет удобрый интерфейс для доступа к методам построения хода
     * для основного приложения
     */
    function MoveMap() {
        var undefined;

        var moveMap = this;
        this.generate = function (o) {
            var cubes,
                mainMask;

            this.cubes = o.cubes;
            this.startCube = o.startCube;

            //создаем класс маски
            this.mainMask = new MainMask({
                startCube: this.startCube,
                cubes: this.cubes
            });

            //генерируем из м-кубиков маски карту анимации
            this.createAnimationMap();
        };

        //строим анимацию для каждого кубика одтельно на основе steps каждого м-кубика
        this.createAnimationMap = function () {
            this.animationMap = [];
            var noEmptyActions = [];

            //массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
            //в последовательности,  в которой они туда попали
            this.toSideActions = [];

            //поскольку у каждого кубика одинаковое число шагов анимации, чтобы
            //узнать общую продолжительность анимации, просто берем длину шагов первого попавшегося кубика
            this.animationLength = this.mainMask.arr[0].steps.length;

            console.log(this.mainMask.arr);

            //проходимся в цикле по всем кубикам
            for (var key in this.mainMask.arr) {
                var mCube = this.mainMask.arr[key];
                var steps = mCube.steps;
                //массив с действиями одного кубика
                var actions = [{action: null, duration: 0}];
                //пробегаемся по массиву шагов анимации
                for (var key1 = 0; key1 < steps.length; key1++) {
                    //один шаг анимации
                    var step = steps[key1];
                    //последний шаг анимации, к которому добавляем продолжительность
                    //в случае совпадения со следующим шагом
                    var lastAction = actions[actions.length - 1];
                    //если это такой же шаг, как и предидущий
                    if (step.do === lastAction.action) {
                            //иначе просто увеличиваем продолжительность предидущего
                            lastAction.duration++;
                    }
                    else {
                        //для каждого действия - по-своему, в том числе в зависимости от предидущих действий
                        switch (step.do) {
                            case "toSide":
                                lastAction.action = lastAction.action + "ToSide";
                                lastAction.duration++;
                                this.toSideActions.push(mCube);
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
                if(actions.length === 1 && actions[0].action === null) {
                    actions.shift();
                }

                //console.log(actions);

                //подтягиваем задержки
                if (actions.length !== 0) {
                    //итоговый массив, в котором продолжительность анимаций
                    //и задержки выстроены, как надо
                    var nullToDelayActions = [];
                    var delay = 0;
                    for (var key1 = 0; key1 < actions.length; key1++) {
                        var action = actions[key1];
                        //выставляем задержку от начала хода
                        action.delay = delay;
                        //добавляем к задержке следующего действия текущую продолжительность
                        delay += action.duration;
                        if (action.action !== null) {
                            nullToDelayActions.push(action);
                        }
                    }
                    this.animationMap.push({
                        actions: nullToDelayActions,
                        cube: this.mainMask.arr[key].cube
                    });
                }
            }
        };

        //когда ход прощитан, запускаем саму анимацию
        this.animate = function (o) {
            var map;
            var startCube = this.startCube;

            //блокируем приложение от начала до конца анимации
            //минус один - потому, что в последний такт обычно анимация чисто символическая
            o.app.blockApp = true;
            setTimeout(
                function (app) {
                    app.blockApp = false;
                },
                this.animationLength * d.animTime - 1,
                o.app
            );

            this.cubes.animate({action: "fromLine", cube: startCube});

            //добавляем постоянную стрелку к html-элементу кубика, с которого начинается анимация
            startCube.$el.addClass("d" + startCube.direction);

            //перебираем карту анимации и передаем каждому кубику объект действия,
            //состоящий из переменных: само действие, продолжительность, задержка перед выполнением,
            //далее кубик запускает таймер до выполнения и выполняет нужную анимацию
            map = this.animationMap;
            for (var key in map) {
                var cube = map[key].cube;
                var actions = map[key].actions;
                for (var key1 in actions) {
                    var action = actions[key1];
                    cube.addAnimate(action);
                }
            }
        };


        /**
         * Функции, которым могут понадобиться в дальнейшем
         */
            //функция нужна исключительно для передачи кубиков по сети в виде JSON объекта
        this.generateJSONMask = function (o) {

            //цветовая схема нужна для укорачивания данных, передаваемых по сети
            if (this.colorSheme === undefined) {
                //цветовая схема нужна для приведения коллекции к маске
                this.generateColorSheme();
            }

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
    };
    return MoveMap;
});