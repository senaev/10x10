define(['data'], function (d) {
    var undefined;
    var MoveMap;
    MoveMap = function () {
        var moveMap = this;
        this.generate = function (o) {
            var cubes;
            var firstCube;
            cubes = o.cubes;
            startCube = o.startCube;

            if (this.colorSheme === undefined) {
                //цветовая схема, нужна для приведения коллекции к маске
                this.generateColorSheme();
            }

            var firstMask = this.generateMaskOfTheCubes({cubes: cubes});
            console.log(firstMask);
        };

        this.generateMaskOfTheCubes = function (obj) {
            var cubes;
            var mask;
            mask = {};
            for (var key in d.fields) {
                mask[d.fields[key]] = "";
            }
            cubes = obj.cubes;
            cubes._sideEach(function (cube) {
                mask[cube.field] += moveMap.colorSheme[cube.color];
            });
            /*cubes._mainEach(function(cube){
             mask[cube.field] += this.colorSheme[cube.field];
             });*/

            return mask;
        };

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