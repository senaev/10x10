import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';

import { SideCubeAddress, SideCubesMask } from '../js/Cubes';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { getSideCubeViewByAddress } from './getSideCubeViewByAddress';
import { createSideCubesLineId } from './SideCubesLineIndicator';

export function animateCubesFromSideToMainField({
    firstCubeAddress: {
        field,
        x,
        y,
    },
    startCubesCount,
    sideCubesMask,
}: {
    firstCubeAddress: SideCubeAddress;
    startCubesCount: PositiveInteger;
    sideCubesMask: SideCubesMask;
}): void {
    // Получаем линию кубика
    // Коллекция пока в начальном состоянии (до хода)
    const line = getCubeAddressInSideFieldInOrderFromMain(createSideCubesLineId({
        x,
        y,
        field,
    }));

    for (let cubeIndexInLine = 0; cubeIndexInLine < (line.length - startCubesCount); cubeIndexInLine++) {
        const address = line[cubeIndexInLine];
        const cube = getSideCubeViewByAddress(sideCubesMask, address);

        cube.addAnimate({
            action: 'nearer',
            duration: startCubesCount,
            delay: 0,
        });
    }
}
