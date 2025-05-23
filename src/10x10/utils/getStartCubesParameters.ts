import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeCoordinates, SideCubeAddress } from '../js/CubesViews';
import { MainFieldCubesState } from '../js/TenOnTen';

import { SideCubesLineId, getSideCubeLineId } from './SideCubesLineIndicator/SideCubesLineIndicator';

export type StartCubesParameters = {
    line: SideCubesLineId;
    count: UnsignedInteger;
};

export function getStartCubesParameters({
    mainFieldCubesState,
    sideCubeAddress: initialCubeAddress,
}: {
    mainFieldCubesState: MainFieldCubesState;
    sideCubeAddress: SideCubeAddress;
}): StartCubesParameters | undefined {
    const isVertical = initialCubeAddress.field === 'top' || initialCubeAddress.field === 'bottom';
    const isLeftOrTop = initialCubeAddress.field === 'left' || initialCubeAddress.field === 'top';
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
        x: isVertical ? initialCubeAddress.x : 0,
        y: isVertical ? 0 : initialCubeAddress.y,
    };
    mainFieldAddress[statProp] = initialCubeAddress[statProp];
    let countOfCubesThatCanBeMoved = 0;
    for (const key in cellsMain) {
        mainFieldAddress[dynamicProp] = cellsMain[key];

        const mainCube = mainFieldCubesState[mainFieldAddress.x][mainFieldAddress.y];

        if (mainCube) {
            // Упираемся в кубик на главном поле
            break;
        } else {
            countOfCubesThatCanBeMoved++;
        }
    }

    // Проверяем, если линия пустая, ходить вообще нельзя
    let allNullInLine = true;
    for (let key = 0; key < BOARD_SIZE; key++) {
        mainFieldAddress[dynamicProp] = key;
        const mainCube = mainFieldCubesState[mainFieldAddress.x][mainFieldAddress.y];
        if (mainCube) {
            allNullInLine = false;
            break;
        }
    }

    // Если все нули в линии - возвращаем индикатор пустоты
    if (allNullInLine) {
        return undefined;
    }

    // Если сразу за полем кубик - ничего не возвращаем
    if (countOfCubesThatCanBeMoved === 0) {
        return undefined;
    }

    const address: SideCubeAddress = {
        field: initialCubeAddress.field,
        x: 0,
        y: 0,
    };
    address[statProp] = initialCubeAddress[statProp];

    const line: SideCubesLineId = getSideCubeLineId(address);

    const dynamicPropValue = initialCubeAddress[dynamicProp];
    const count = Math.min(countOfCubesThatCanBeMoved, isLeftOrTop ? BOARD_SIZE - dynamicPropValue : dynamicPropValue + 1);

    return {
        line,
        count,
    };
}
