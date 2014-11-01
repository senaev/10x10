define(['cube', 'cubes', 'data', 'movemap'], function (Cube, cubes, d, moveMap) {
    var TenOnTen = function (args) {
        var undefined;
        var tenOnTen = this;

        this.cubes = cubes;

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
            this.container.css({
                height: d.oneWidth * d.cubesWidth,
                width: d.oneWidth * d.cubesWidth,
                margin: d.oneWidth * 3,
                position: "relative"
            }).addClass("tenOnTenContainer");
        }).apply(this);


        //Initialize map function
        this.initialize = function () {
            cubes._sideEach(function (cube, field, x, y) {
                cube = new Cube({
                    x: x,
                    y: y,
                    field: field,
                    app: tenOnTen
                });
            });
            for (var number = 0, len = d.levels[d.level].cubesCount; number < len; number++) {
                if (d.firstCubesPosition[number] !== undefined) {
                    var pos = d.firstCubesPosition[number];
                    var cube = cubes._get({
                        field: 'main',
                        x: pos[0],
                        y: pos[1]
                    });
                    cube = new Cube({
                        x: pos[0],
                        y: pos[1],
                        field: 'main',
                        app: tenOnTen
                    });
                }
                else {
                    throw new Error("Необходимо создать функцию генерации кубов в случайных местах и внедрить в initialize");
                }
            }
        };
        this.initialize();

        this.run = function (o) {
            moveMap.generate({
                startCube: o.startCube,
                cubes: this.cubes
            });
        }
    };

    return TenOnTen;
});
