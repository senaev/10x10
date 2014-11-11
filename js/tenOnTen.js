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
            var topRightPanel = '<div class="panel topRightPanel"><div class="previousButton">back</div></div>';
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

        this.run = function (o) {
            var moveMap;
            moveMap = new MoveMap();

            moveMap.generate({
                startCube: o.startCube,
                cubes: this.cubes
            });
            //пошаговый запуск анимации
            moveMap.animate({
                app: this
            });
            //подитоживание - внесение изменений, произошедших в абстрактном moveMap
            //в реальную коллекцию cubes
            this.cubes._mergeMoveMap(moveMap);

            //console.log("//////////ITOG CUBES:", this.cubes);
        }
    };

    return TenOnTen;
});
