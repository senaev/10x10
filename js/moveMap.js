define(['data', 'mainMask'], function (d, MainMask) {

    function MoveMap() {
        var undefined;

        var moveMap = this;
        this.generate = function (o) {
            var cubes,
                startCube,
                mainMask;

            cubes = o.cubes;
            startCube = o.startCube;

            //создаем класс маски
            this.mainMask = new MainMask({
                startCube: startCube,
                cubes: cubes
            });

            //генерируем из м-кубиков маски карту анимации
            this.createAnimationMap();
        };

        //строим анимацию для каждого кубика одтельно на основе steps каждого м-кубика
        this.createAnimationMap = function () {
            this.animationMap = [];
            var noEmptyActions = [];
            for (var key in this.mainMask.arr) {
                var steps = this.mainMask.arr[key].steps;
                //console.log(steps);
                var cube = this.mainMask.arr[key].cube;
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
                        cube: this.mainMask.arr[key].cube
                    });
                }
            }
        };

        //когда ход прощитан, запускаем саму анимацию
        this.animate = function(o){
            var map;
            var startCube = o.startCube;
            //добавляем постоянную стрелку с кубику, с которого начинается анимация
            startCube.$el.addClass("d" + startCube.direction);

            map = this.animationMap;
            for(var key in map){
                var cube = map[key].cube;
                var actions = map[key].actions;
                for(var key1 in actions){
                    var action = actions[key1];
                    cube.addAnimate(action);
                }
            }
        }


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
    return new MoveMap;
});