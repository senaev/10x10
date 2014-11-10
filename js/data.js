define(function () {
    var data = {
        //ширина доски в кубиках
        cubesWidth: 10,
        //уровень, с которого начинаем
        level: 1,
        //ширина одного контейнера кубика
        oneWidth: 32,
        //список полей
        fields: ["main", "top", "right", "bottom", "left"],
        //время одного шага анимации
        animTime: 50,
        //распределение по уровням
        levels: {
            "1": {
                colorsCount: 5,
                cubesCount: 5
            },
            "10": {
                colorsCount: 10,
                cubesCount: 10
            }
        },
        //начальная позиция кубиков надоске
        firstCubesPosition: [
            [3, 4],
            [3, 5],
            [4, 6],
            [5, 6],
            [6, 5],
            [6, 4],
            [5, 3],
            [4, 3],
            [4, 5],
            [5, 4],
            [4, 4],
            [5, 5]
        ],
        //возможные цвета кубиков
        colors: ["blue", "green", "yellow", "red", "brown", "pink", "white", "purple", "lightblue", "orange"],
        f: {
            rand: function rand(min, max) {
                return min + ((max - min + 1) * Math.random() ^ 0);
            },
            reverseField: function(field){
                if (field === "top") {
                    return "bottom";
                }
                else if (field === "bottom") {
                    return "top";
                }
                else if (field === "left") {
                    return "right";
                }
                else if (field === "right") {
                    return "left";
                }
            }
        }
    };

    return data;
});