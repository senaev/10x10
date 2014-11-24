define(function () {
    var data = {
            //ширина доски в кубиках
            cubesWidth: 10,
            //ширина одного контейнера кубика
            oneWidth: 32,
            //список полей
            fields: ["main", "top", "right", "bottom", "left"],
            //время одного шага анимации
            animTime: 45,
            //возможные цвета кубиков
            colors: ["blue", "green", "yellow", "red", "brown", "pink", "white", "purple", "lightblue", "orange"],
            //для разных языков
            lang: {
                undo: {
                    en: "undo",
                    ru: "назад"
                },
                refresh: {
                    en: "refresh",
                    ru: "обновить"
                },
                resume: {
                    en: "Resume",
                    ru: "Продолжить"
                },
                new_game: {
                    en: "New Game",
                    ru: "Новая игра"
                },
                statistics: {
                    en: "Statistics",
                    ru: "Статистика"
                },
                top_gamers: {
                    en: "Top Gamers",
                    ru: "Лучшие игроки"
                },
                sound: {
                    en: "Sound",
                    ru: "Звук"
                },
                speed: {
                    en: "Speed",
                    ru: "Скорость"
                },
                fast: {
                    en: "fast",
                    ru: "быстрая"
                },
                slow: {
                    en: "slow",
                    ru: "медленная"
                },
                middle: {
                    en: "middle",
                    ru: "средняя"
                },
                yes: {
                    en: "Yes",
                    ru: "Да"
                },
                no: {
                    en: "No",
                    ru: "Нет"
                },
                on: {
                    en: "on",
                    ru: "вкл."
                },
                off: {
                    en: "off",
                    ru: "выкл."
                },
                play_again: {
                    en: "You really want to play again?",
                    ru: "Вы действительно хотите начать сначала?"
                },
                end_of_game: {
                    en: "Game over",
                    ru: "Игра окончена"

                },
                try_again: {
                    en: "Try again",
                    ru: "Начать заново"
                }
            },
            f: {
                //распределение по уровням
                level: {
                    colorsCount: function (level) {
                        if (level < 11) {
                            return 5;
                        }
                        else if (level < 66) {
                            return 6;
                        }
                        else if (level < 101) {
                            return 7
                        }
                        else if (level < 126) {
                            return 8
                        }
                        else if (level < 151) {
                            return 9
                        }
                        else {
                            return 10;
                        }
                    },
                    cubesCount: function (level) {
                        if ((level > 0 && level < 11) || level === 100) {
                            var cubesCount = {
                                1: 6,
                                2: 11,
                                3: 11,
                                4: 9,
                                5: 11,
                                6: 12,
                                7: 7,
                                8: 13,
                                9: 12,
                                10: 18,
                                100: 25
                            };
                            return cubesCount[level];
                        }
                        else if (level < 66) {
                            return level - 11 + 16;
                        }
                        else if (level < 101) {
                            return level - 66 + 16;
                        }
                        else if (level < 126) {
                            return level - 101 + 16;
                        }
                        else if (level < 151) {
                            return level - 126 + 16;
                        }
                        else {
                            return level - 151 + 16;
                        }
                    },
                    getPositions: function (level) {
                        if ((level > 0 && level < 11) || level === 100) {
                            return data.numbers[level];
                        }
                        else {
                            return data.firstCubesPositionsPicture
                        }
                    }
                },

                rand: function rand(min, max) {
                    return min + ((max - min + 1) * Math.random() ^ 0);
                },
                reverseField: function (field) {
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
                },
                shuffle: function (o) {
                    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {
                    }
                    return o;
                },
                firstToUp: function (s) {
                    return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
                }
            },
            //координаты кубиков для уровней с рисунками
            numbers: {
                1: [[4, 3], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7]],
                2: [[3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [4, 4], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6]],
                3: [[3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [5, 6], [4, 5], [5, 7], [3, 5], [4, 7], [3, 7]],
                4: [[4, 2], [4, 3], [4, 4], [5, 4], [6, 4], [6, 3], [6, 5], [6, 2], [6, 6]],
                5: [[6, 3], [5, 3], [4, 3], [4, 4], [4, 5], [5, 5], [6, 5], [6, 6], [6, 7], [5, 7], [4, 7]],
                6: [[3, 2], [3, 3], [4, 2], [3, 4], [5, 2], [4, 4], [3, 5], [5, 4], [3, 6], [5, 5], [4, 6], [5, 6]],
                7: [[3, 3], [4, 3], [5, 3], [5, 4], [4, 5], [3, 6], [3, 7], [3, 8]],
                8: [[4, 2], [5, 2], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [5, 6], [4, 6], [4, 5], [4, 4], [4, 3], [5, 4]],
                9: [[3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [4, 6], [3, 6], [3, 3], [3, 4], [4, 4]],
                10: [[2, 3], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [6, 7], [7, 7], [7, 6], [7, 5], [7, 4], [7, 3], [6, 3]],
                100: [[0, 3], [1, 3], [1, 4], [1, 5], [1, 6], [3, 3], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [5, 5], [5, 4], [5, 3], [4, 3], [7, 3], [7, 4], [7, 5], [7, 6], [8, 6], [9, 6], [9, 5], [9, 4], [9, 3], [8, 3]]
            },
            //стандартный рисунок на главном экране
            firstCubesPositionsPicture: [[4, 4], [5, 4], [5, 5], [4, 5], [3, 3], [6, 3], [6, 6], [3, 6], [4, 2], [7, 4], [5, 7], [2, 5], [5, 2], [7, 5], [4, 7], [2, 4]]
        }
        ;

    return data;
})
;