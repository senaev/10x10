/**
 * Created by aa.senaev on 03.11.2014.
 */
define(['mCube', 'data'], function (MCube, d) {

    /**
     * класс для маски(слепок текущего состояния с возможностью создать пошагово один ход игры)
     * класс передается коллекция кубиков, а также кубик, с которого начинается анимация.
     * во время создания экземпляра класса коздаётся массив м-кубиков( экземпляков класса МКубе),
     * затем пожагово - обращение к каждому м-кубику, методом oneStep, в котором автоматически меняются
     * параметры состояния и создаётся объект из последовательности шагов для построения анимации
     * @param o
     * @constructor
     */
    function MainMask(o) {
        var cubes,
            startCube,
            mainMask,
            undefined;

        mainMask = this;
        cubes = o.cubes;
        startCube = o.startCube;
        //основной массив со значениями
        //сюда будут попадать м-кубики, учавствующие в анимации
        this.arr = [];
        //создаем маску, берем значения из коллекции кубес
        this.initialize = function () {
            var startMCube,
                startMCubeX,
                startMCubeY;


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
        //вызываем инициализацию
        this.initialize();
        //один ход для всех кубиков на доске
        this.step = function () {
            //индикатор конца движений, если что-то происходит во время шага анимации -
            //вызываем следующий шаг, если нет, то либо заканчиваем ход если нету смежных одинаковых кубиков,
            //либо вызываем подрыв эких кубиков и вызываем следующий шаг анимации
            var somethingHappend;
            somethingHappend = false;
            for (var key in this.arr) {
                var oneStep;
                oneStep = this.arr[key].oneStep();
                if (oneStep.do !== null) {
                    somethingHappend = true;
                }
            }

            //проверяем, произошло что-то или нет в конце каждого хода
            if (somethingHappend) {
                this.step();
            }
            else {
                //ищем, появились ли у нас в результате хода смежные кубики
                //ещё один шаг хода, если нет - заканчиваем ход
                var adjacentCubes = this.searchAdjacentCubes();
                if(adjacentCubes.length){
                    //если такие группы кубиков имеются, подрываем их и запускаем
                    //еще один шаг хода
                }
                else{
                    //если нет - заканчиваем ход
                }
            }
        };
        this.searchAdjacentCubes = function(){
            var arr = this.arr,
                byColorPrev = {},
                byColor = {};
            //создаем объект с массивами м-кубиков по цветам
            for(var key in arr){
                var mCube = arr[key];
                //если такого значения в объекте еще нет - сздаем его
                if(byColorPrev[mCube.color] === undefined){
                    byColorPrev[mCube.color] = [];
                }
                //добавляем в этот массив все кубики, которые есть на доске
                if(mCube.x > 0 && mCube.x < d.cubesWidth && mCube.y > 0 && mCube.y < d.cubesWidth) {
                    byColorPrev[mCube.color].push(mCube);
                }
            }
            //если количество кубиков определенного цвета на доске меньшь двух,
            //исключаем эту группу кубиков из обработки
            for(var key in byColorPrev){
                if(byColorPrev[key].length > 2){
                    byColor[key] = byColorPrev[key];
                }
            }
            for(var key in byColor){

            }

            console.log(byColor);

            return [];
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

    return MainMask;
});

