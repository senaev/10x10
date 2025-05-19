import { assertInteger } from 'senaev-utils/src/utils/Number/Integer';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeCoordinates, SideCubesMask } from '../js/CubesViews';
import { getCubeAddressString, MovingCube } from '../js/MovingCube';
import { MainFieldCubeStateValue } from '../js/TenOnTen';

import { getIncrementalIntegerForMainFieldOrder } from './getIncrementalIntegerForMainFieldOrder';
import { getSideCubeViewByAddress } from './getSideCubeViewByAddress';
import { getStartCubesByStartCubesParameters } from './getStartCubesByStartCubesParameters';
import { StartCubesParameters } from './getStartCubesParameters';

/**
 * Собираем все кубики, которые будут принимать участие в движении по главному полю
 * В том числе выставляем на доску кубики из боковой линии
 */
export function prepareMovingCubes({
    startCubesParameters,
    sideCubesMask,
    mainFieldCubes,
}: {
    startCubesParameters: StartCubesParameters;
    sideCubesMask: SideCubesMask;
    mainFieldCubes: (MainFieldCubeStateValue & CubeCoordinates)[];
}): MovingCube[] {
    const mainFieldCubesSorted = [...mainFieldCubes].sort((a, b) => a.toMineOrder - b.toMineOrder);

    // Основной массив со значениями
    // Сюда будут попадать м-кубики, участвующие в анимации
    const movingCubesInMainField: MovingCube[] = [];

    // создаем массив из всех кубиков, которые есть на доске
    mainFieldCubesSorted.forEach((cube) => {
        const toMineOrder = cube.toMineOrder;

        assertInteger(toMineOrder);

        const movingCube: MovingCube = {
            initialAddress: getCubeAddressString({
                x: cube.x,
                y: cube.y,
                field: 'main',
            }),
            toMineOrder,
            x: cube.x,
            y: cube.y,
            color: cube.color,
            direction: cube.direction,
            stepActions: [],
        };

        movingCubesInMainField.push(movingCube);
    });

    const startCubesAddresses = getStartCubesByStartCubesParameters({
        startCubesParameters,
        sideCubesMask,
    });

    const startCubeViews = startCubesAddresses.map((address) => getSideCubeViewByAddress(sideCubesMask, address));

    // добавляем в маску кубик, с которого начинаем анимацию
    // кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: MovingCube[] = [];
    startCubeViews.forEach((cubeView, i) => {
        const initialAddress = {
            x: cubeView.x,
            y: cubeView.y,
            field: cubeView.field.value(),
        };

        const toMineOrder = getIncrementalIntegerForMainFieldOrder();

        const field = cubeView.field.value();
        let startMovingCubeX;
        let startMovingCubeY;
        if (field === 'top' || field === 'bottom') {
            startMovingCubeX = cubeView.x;
            if (field === 'top') {
                startMovingCubeY = startCubeViews.length - i - 1;
            } else {
                startMovingCubeY = BOARD_SIZE - startCubeViews.length + i;
            }
        } else {
            if (field === 'left') {
                startMovingCubeX = startCubeViews.length - i - 1;
            } else {
                startMovingCubeX = BOARD_SIZE - startCubeViews.length + i;
            }
            startMovingCubeY = cubeView.y;
        }

        const movingCube: MovingCube = {
            initialAddress: getCubeAddressString(initialAddress),
            x: startMovingCubeX,
            y: startMovingCubeY,
            color: cubeView.color.value(),
            direction: cubeView.direction.value(),
            stepActions: [],
            toMineOrder,
        };

        startMovingCubes.push(movingCube);
    });

    return [
        ...startMovingCubes,
        ...movingCubesInMainField,
    ];
}
