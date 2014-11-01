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
            function MainMask(){
                var mask,
                    cubes,
                    startCube,
                    mainMask;

                mainMask = this;
                mask = [];
                cubes = o.cubes;
                startCube = o.startCube;
                this.initialize = function(){
                    var startMCube,
                        startMCubeX,
                        startMCubeY;

                    function MCube(o){
                        this.x = o.x;
                        this.y = o.y;
                        this.color = o.color;
                        this.direction = o.direction;
                        this.extra = o.extra;
                        this.mainMask = o.mainMask
                    }
                    MCube.prototype.oneStep = function(){
                        var step;
                        step = {};
                        if(this.direction !== null){
                            var nextPos = {x: this.x, y: this.y};
                            var prop;
                            if (this.direction === "top" || this.direction === "bottom") {
                                this.direction === "top" ? nextPos.y-- : nextPos.y++;
                            }
                            else {
                                this.direction === "left" ? nextPos.x-- : nextPos.x++;
                            }
                            if(nextPos.x < 0 || nextPos.x > 9 || nextPos.y < 0 || nextPos.y > 9){
                                this.x = nextPos.x;
                                this.y = nextPos.y;
                                this.direction = null;
                                step.do = "toSide";
                            }

                            if(this.mainMask._get(nextPos) === null){
                                this.x = nextPos.x;
                                this.y = nextPos.y;
                                step.do = "s" + this.direction.charAt(0);
                            }
                            else{
                                step.do = null;
                            }
                        }
                        else{
                            step.do = null;
                        }
                        return step;
                    };

                    cubes._mainEach(function(cube){
                        mask.push(new MCube({
                            x: cube.x,
                            y: cube.y,
                            color: cube.color,
                            direction: cube.direction,
                            extra: cube.extra,
                            mainMask: mainMask
                        }));
                    });
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
                        mainMask: mainMask
                    });
                    mask.push(startMCube);
                    this.arr = mask;
                };
                this.initialize();
                this.step = function(){
                    var somethingHappend;
                    somethingHappend = false;
                    for(var key in this.arr){
                        var oneStep;
                        this.arr[key].steps = [];
                        oneStep = this.arr[key].oneStep();
                        if(oneStep.do !== null){
                            somethingHappend = true;
                        }
                    }

                    console.log("//////////_endOneStep");
                    console.log(this.arr);

                    if(somethingHappend){
                        this.step();
                    }
                    else{
                        console.log("//////////_endOfRun");
                    }
                }
                this.step();
            }
            MainMask.prototype._get = function(o){
                var arr;
                arr = this.arr;
                for(var key in arr){
                    if(arr[key].x === o.x && arr[key].y === o.y){
                        return arr[key];
                    }
                }
                return null;
            };
            mainMask = new MainMask({
                startCube: startCube,
                cubes: cubes
            });
        }
    };
    return new MoveMap;
});