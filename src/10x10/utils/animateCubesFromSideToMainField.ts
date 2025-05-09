import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';

import { Cube } from '../js/Cube';
import { CubesMask } from '../js/Cubes';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { getCubeByAddress } from './getCubeByAddress';

export function animateCubesFromSideToMainField(startCubes: Cube[], mask: CubesMask): void {
    // получаем линию кубика
    // коллекция пока в начальном состоянии (до хода)
    const line = getCubeAddressInSideFieldInOrderFromMain({
        x: startCubes[0].x,
        y: startCubes[0].y,
        field: startCubes[0].field,
    });

    // массив из возможных комбинаций анимаций
    let animationArr: number[][];
    switch (startCubes.length) {
    case 1:
        animationArr = [
            [
                6,
                7,
                8,
            ],
        ];
        break;
    case 2:
        animationArr = [
            [
                6,
                7,
            ],
            [
                5,
                6,
                7,
            ],
        ];
        break;
    case 3:
        animationArr = [
            [6],
            [
                5,
                6,
            ],
            [
                4,
                5,
                6,
            ],
        ];
        break;
    default:
        throw new Error(`Неверное значение длинны startCubes: ${startCubes.length}`);
    }
    const animationNames = [
        'appearanceInSide',
        'nearer',
        'nearer',
    ];
    animationArr.forEach((animation, animationIndex) => {
        for (const num in animation) {
            const address = line[animation[num]];
            const cube = getCubeByAddress(mask, address);

            assertObject(cube);

            cube.addAnimate({
                action: animationNames[num],
                duration: 1,
                delay: animationIndex,
            });
        }
    });
}
