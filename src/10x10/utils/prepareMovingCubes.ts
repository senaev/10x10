import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeToMove } from '../js/createMoveMap';
import { SideCubesMask } from '../js/Cubes';
import { MovingCube } from '../js/MovingCube';

import { getIncrementalIntegerForMainFieldOrder } from './getIncrementalIntegerForMainFieldOrder';
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
        const movingCube = new MovingCube({
            x: cube.x,
            y: cube.y,
            color: cube.color.value(),
            direction: cube.direction.value(),
            cube,
        });

        movingCubesInMainField.push({
            moving: movingCube,
            original: cube,
            isFromSide: false,
        });
    });

    const startCubes = getStartCubesByStartCubesParameters({
        startCubesParameters,
        sideCubesMask,
    });

    assertObject(startCubes);

    // добавляем в маску кубик, с которого начинаем анимацию
    // кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: CubeToMove[] = [];
    startCubes.forEach((cube, i) => {
        cube.toMineOrder = getIncrementalIntegerForMainFieldOrder();

        const field = cube.field.value();
        let startMovingCubeX;
        let startMovingCubeY;
        if (field === 'top' || field === 'bottom') {
            startMovingCubeX = cube.x;
            if (field === 'top') {
                startMovingCubeY = startCubes.length - i - 1;
            } else {
                startMovingCubeY = BOARD_SIZE - startCubes.length + i;
            }
        } else {
            if (field === 'left') {
                startMovingCubeX = startCubes.length - i - 1;
            } else {
                startMovingCubeX = BOARD_SIZE - startCubes.length + i;
            }
            startMovingCubeY = cube.y;
        }

        const movingCube = new MovingCube({
            x: startMovingCubeX,
            y: startMovingCubeY,
            color: cube.color.value(),
            direction: cube.direction.value(),
            cube,
        });
        startMovingCubes.push({
            moving: movingCube,
            original: cube,
            isFromSide: true,
        });
    });

    return [
        ...startMovingCubes,
        ...movingCubesInMainField,
    ];
}
