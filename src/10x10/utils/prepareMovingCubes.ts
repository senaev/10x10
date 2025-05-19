import { assertInteger } from 'senaev-utils/src/utils/Number/Integer';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeToMove } from '../js/createMoveMap';
import { SideCubesMask } from '../js/CubesViews';
import { getCubeAddressString, MovingCube } from '../js/MovingCube';

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
    mainFieldCubes: CubeView[];
}): CubeToMove[] {
    const mainFieldCubesSorted = [...mainFieldCubes].sort((a, b) => a.toMineOrder! - b.toMineOrder!);

    // Основной массив со значениями
    // Сюда будут попадать м-кубики, участвующие в анимации
    const movingCubesInMainField: CubeToMove[] = [];

    // создаем массив из всех кубиков, которые есть на доске
    mainFieldCubesSorted.forEach((cube) => {
        const toMineOrder = cube.toMineOrder;

        assertInteger(toMineOrder);

        const movingCube: MovingCube = {
            initialAddress: getCubeAddressString({
                x: cube.x,
                y: cube.y,
                field: cube.field.value(),
            }),
            toMineOrder,
            x: cube.x,
            y: cube.y,
            color: cube.color.value(),
            direction: cube.direction.value(),
            stepActions: [],
        };

        movingCubesInMainField.push({
            moving: movingCube,
            original: cube,
        });
    });

    const startCubesAddresses = getStartCubesByStartCubesParameters({
        startCubesParameters,
        sideCubesMask,
    });

    const startCubeViews = startCubesAddresses.map((address) => getSideCubeViewByAddress(sideCubesMask, address));

    // добавляем в маску кубик, с которого начинаем анимацию
    // кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: CubeToMove[] = [];
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

        startMovingCubes.push({
            moving: movingCube,
            original: cubeView,
        });
    });

    return [
        ...startMovingCubes,
        ...movingCubesInMainField,
    ];
}
