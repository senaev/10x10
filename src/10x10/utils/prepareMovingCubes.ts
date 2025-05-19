import { assertInteger } from 'senaev-utils/src/utils/Number/Integer';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeColor } from '../const/CUBE_COLORS';
import { Direction } from '../const/DIRECTIONS';
import { CubeCoordinates } from '../js/CubesViews';
import { getCubeAddressString, MovingCube } from '../js/MovingCube';
import {
    MainFieldCubeStateValue, SideCubesState,
} from '../js/TenOnTen';

import { getIncrementalIntegerForMainFieldOrder } from './getIncrementalIntegerForMainFieldOrder';
import { getStartCubesByStartCubesParameters } from './getStartCubesByStartCubesParameters';
import { StartCubesParameters } from './getStartCubesParameters';
import { reverseDirection } from './reverseDirection';

/**
 * Собираем все кубики, которые будут принимать участие в движении по главному полю
 * В том числе выставляем на доску кубики из боковой линии
 */
export function prepareMovingCubes({
    startCubesParameters,
    sideCubesState,
    mainFieldCubes,
}: {
    startCubesParameters: StartCubesParameters;
    sideCubesState: SideCubesState;
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
    });

    const startCubeViews: ({
        color: CubeColor;
        field: Direction;
    } & CubeCoordinates)[] = startCubesAddresses.map((address) => {
        return {
            color: sideCubesState[address.field][address.x][address.y].color,
            x: address.x,
            y: address.y,
            field: address.field,
        };
    });

    // добавляем в маску кубик, с которого начинаем анимацию
    // кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: MovingCube[] = [];
    startCubeViews.forEach((cubeView, i) => {
        const initialAddress = {
            x: cubeView.x,
            y: cubeView.y,
            field: cubeView.field,
        };

        const toMineOrder = getIncrementalIntegerForMainFieldOrder();

        const field = cubeView.field;
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
            color: cubeView.color,
            direction: reverseDirection(cubeView.field),
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
