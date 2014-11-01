//Cubes collection
define(['data'], function (d) {
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

    cubes._add = function (cube) {
        cubes[cube.field][cube.x][cube.y] = cube;
    };
    cubes._get = function (o) {
        return cubes[o.field][o.x][o.y];
    };
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
    /*cubes._mainEach = function(func){
     for (var x = 0; x < d.cubesWidth; x++) {
     for (var y = 0; y < d.cubesWidth; y++) {
     func( cubes["main"][x][y], "main", x, y );
     }
     }
     };*/

    return cubes;
})
;