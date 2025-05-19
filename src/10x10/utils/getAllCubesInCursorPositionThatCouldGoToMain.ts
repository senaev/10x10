import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import {
    CubeCoordinates,
    SideCubeAddress,
    SideCubesMask,
} from '../js/Cubes';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { getCubeByCoordinates } from './getCubeByCoordinates';
import { getSideCubeViewByAddress } from './getSideCubeViewByAddress';
import { isTheSameAddress } from './isTheSameAddress';
import { createSideCubesLineId, SideCubesLineId } from './SideCubesLineIndicator';

export type StartCubesParameters = {
    line: SideCubesLineId;
    count: UnsignedInteger;
};

/**
 * Находим все кубики от этого до ближнего к майн в линии относительно этого
 */
export function getAllCubesInCursorPositionThatCouldGoToMain({
    mainCubes,
    sideCubesMask,
    originCubeAddress,
}: {
    mainCubes: Set<CubeView>;
    sideCubesMask: SideCubesMask;
    originCubeAddress: SideCubeAddress;
}): CubeView[] | 'empty' | 'block' {
    const isVertical = originCubeAddress.field === 'top' || originCubeAddress.field === 'bottom';
    const isLeftOrTop = originCubeAddress.field === 'left' || originCubeAddress.field === 'top';
    const statProp: 'x' | 'y' = isVertical ? 'x' : 'y';
    const dynamicProp: 'x' | 'y' = isVertical ? 'y' : 'x';

    const START_OF_ARRAY: number[] = [
        0,
        1,
        2,
    ];
    const END_OF_ARRAY: number[] = [
        9,
        8,
        7,
    ];

    // проверяем, сколько кубиков можно достать из боковой линии
    // по количеству свободных клеток в поле майн
    const cellsMain: number[] = isLeftOrTop
        ? START_OF_ARRAY
        : END_OF_ARRAY;

    const mainFieldAddress: CubeCoordinates = {
        x: isVertical ? originCubeAddress.x : 0,
        y: isVertical ? 0 : originCubeAddress.y,
    };
    mainFieldAddress[statProp] = originCubeAddress[statProp];
    let countOfCubesThatCanBeMoved = 0;
    for (const key in cellsMain) {
        mainFieldAddress[dynamicProp] = cellsMain[key];

        if (!getCubeByCoordinates(mainFieldAddress, mainCubes)) {
            countOfCubesThatCanBeMoved++;
        } else {
            break;
        }
    }

    // Проверяем, если линия пустая, ходить вообще нельзя
    let allNullInLine = true;
    for (let key = 0; key < BOARD_SIZE; key++) {
        mainFieldAddress[dynamicProp] = key;
        if (getCubeByCoordinates(mainFieldAddress, mainCubes)) {
            allNullInLine = false;
            break;
        }
    }

    // Если все нули в линии - возвращаем индикатор пустоты
    if (allNullInLine) {
        return 'empty';
    }

    // Если сразу за полем кубик - ничего не возвращаем
    if (countOfCubesThatCanBeMoved === 0) {
        return 'block';
    }

    const address: SideCubeAddress = {
        field: originCubeAddress.field,
        x: 0,
        y: 0,
    };
    address[statProp] = originCubeAddress[statProp];
    address[dynamicProp] = originCubeAddress.field === 'top' || originCubeAddress.field === 'left' ? 9 : 0;

    const line: SideCubesLineId = createSideCubesLineId(address);

    const sideCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(line);

    const cubes: CubeView[] = [];
    for (let key = 0; key < countOfCubesThatCanBeMoved; key++) {
        const sideCubeAddress = sideCubeAddresses[key];
        const cube = getSideCubeViewByAddress(sideCubesMask, sideCubeAddress);
        cubes.push(cube);

        if (isTheSameAddress(originCubeAddress, sideCubeAddress)) {
            break;
        }
    }

    return cubes;
}
