import { DEFAULT_CUBES_POSITIONS_PICTURE } from '../const/DEFAULT_CUBES_POSITIONS_PICTURE';
import { Field } from '../const/FIELDS';
import { PRE_INSTALLED_LEVELS } from '../const/PRE_INSTALLED_LEVELS';

import { Direction } from './cube';

export const data = {
    //ширина доски в кубиках
    cubesWidth: 10,
    //ширина одного контейнера кубика
    oneWidth: 32,
    //время одного шага анимации
    animTime: 45,
    f: {
    //распределение по уровням
        level: {
            cubesCount (level: number) {
                if ((level > 0 && level < 11) || level === 100) {
                    const cubesCount = {
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
                        100: 25,
                    };
                    return cubesCount[level as keyof typeof cubesCount];
                } else if (level < 66) {
                    return level - 11 + 16;
                } else if (level < 101) {
                    return level - 66 + 16;
                } else if (level < 126) {
                    return level - 101 + 16;
                } else if (level < 151) {
                    return level - 126 + 16;
                } else {
                    return level - 151 + 16;
                }
            },
            getPositions (level: number) {
                if ((level > 0 && level < 11) || level === 100) {
                    return PRE_INSTALLED_LEVELS[level];
                } else {
                    return DEFAULT_CUBES_POSITIONS_PICTURE;
                }
            },
        },

        rand: function rand(min: number, max: number) {
            return min + (((max - min + 1) * Math.random()) ^ 0);
        },
        reverseField (field: Field): Direction | null {
            if (field === 'top') {
                return 'bottom';
            }

            if (field === 'bottom') {
                return 'top';
            }

            if (field === 'left') {
                return 'right';
            }

            if (field === 'right') {
                return 'left';
            }

            return null;
        },
        shuffle <T>(o: T[]) {
            for (
                let j, x, i = o.length;
                i;
                j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
            ) {
                //
            }
            return o;
        },
    },
} as const;
