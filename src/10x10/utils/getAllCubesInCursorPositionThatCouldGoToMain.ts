import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Cube } from '../js/Cube';
import { CubeAddress, CubesMask } from '../js/Cubes';

import { getCubeByAddress } from './getCubeByAddress';
import { isTheSameAddress } from './isTheSameAddress';

// находим все кубики от этого до ближнего к майн в линии относительно этого
export function getAllCubesInCursorPositionThatCouldGoToMain(mask: CubesMask, originCubeAddress: CubeAddress): Cube[] | 'empty' | 'block' {
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
    const cellsSide: number[] = isLeftOrTop
        ? END_OF_ARRAY
        : START_OF_ARRAY;

    let address: CubeAddress = {
        field: 'main',
        x: isVertical ? originCubeAddress.x : 0,
        y: isVertical ? 0 : originCubeAddress.y,
    };
    address[statProp] = originCubeAddress[statProp];
    let countOfCubesThatCanBeMoved = 0;
    for (const key in cellsMain) {
        address[dynamicProp] = cellsMain[key];
        // mask.main
        if (getCubeByAddress(mask, address) === null) {
            countOfCubesThatCanBeMoved++;
        } else {
            break;
        }
    }

    // проверяем, если линия пустая, ходить вообще нельзя
    let allNullInLine = true;
    for (let key = 0; key < BOARD_SIZE; key++) {
        address[dynamicProp] = key;
        if (getCubeByAddress(mask, address) !== null) {
            allNullInLine = false;
            break;
        }
    }
    // если все нули в линии - возвращаем индикатор пустоты
    if (allNullInLine) {
        return 'empty';
    }

    // если сразу за полем кубик - ничего не возвращаем
    if (countOfCubesThatCanBeMoved === 0) {
        return 'block';
    }

    address = {
        field: originCubeAddress.field,
        x: 0,
        y: 0,
    };
    address[statProp] = originCubeAddress[statProp];

    const arr: Cube[] = [];
    for (let key = 0; key < 3 && key < countOfCubesThatCanBeMoved; key++) {
        address[dynamicProp] = cellsSide[key];
        arr.push(getCubeByAddress(mask, address)!);

        // если доходим до кубика, над которым курсор - заканчиваем маневр
        if (isTheSameAddress(originCubeAddress, address)) {
            break;
        }
    }

    return arr;
}
