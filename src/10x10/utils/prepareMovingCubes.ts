import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubesMove, CubeToMove } from '../js/MoveMap';
import { MovingCube } from '../js/MovingCube';

import { getIncrementalIntegerForMainFieldOrder } from './getIncrementalIntegerForMainFieldOrder';

/**
 * Собираем все кубики, которые будут принимать участие в движении по главному полю
 * В том числе выставляем на доску кубики из боковой линии
 */
export function prepareMovingCubes({
    startCubes,
    mainFieldCubes,
}: {
    startCubes: CubeView[];
    mainFieldCubes: CubeView[];
}): CubesMove {
    const mainFieldCubesSorted = [...mainFieldCubes].sort((a, b) => a.toMineOrder! - b.toMineOrder!);

    // Основной массив со значениями
    // Сюда будут попадать м-кубики, участвующие в анимации
    const movingCubesInMainField: CubeToMove[] = [];

    // создаем массив из всех кубиков, которые есть на доске
    mainFieldCubesSorted.forEach((cube) => {
        const movingCube = new MovingCube({
            x: cube.x,
            y: cube.y,
            color: cube.color,
            direction: cube.direction,
            cube,
        });

        movingCubesInMainField.push({
            moving: movingCube,
            original: cube,
            isFromSide: false,
        });
    });

    // добавляем в маску кубик, с которого начинаем анимацию
    // кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: CubeToMove[] = [];
    startCubes.forEach((cube, i) => {
        cube.toMineOrder = getIncrementalIntegerForMainFieldOrder();

        let startMovingCubeX;
        let startMovingCubeY;
        if (cube.field === 'top' || cube.field === 'bottom') {
            startMovingCubeX = cube.x;
            if (cube.field === 'top') {
                startMovingCubeY = startCubes.length - i - 1;
            } else {
                startMovingCubeY = BOARD_SIZE - startCubes.length + i;
            }
        } else {
            if (cube.field === 'left') {
                startMovingCubeX = startCubes.length - i - 1;
            } else {
                startMovingCubeX = BOARD_SIZE - startCubes.length + i;
            }
            startMovingCubeY = cube.y;
        }

        const movingCube = new MovingCube({
            x: startMovingCubeX,
            y: startMovingCubeY,
            color: cube.color,
            direction: cube.direction,
            cube,
        });
        startMovingCubes.push({
            moving: movingCube,
            original: cube,
            isFromSide: true,
        });
    });

    return {
        cubesToMove: [
            ...startMovingCubes,
            ...movingCubesInMainField,
        ],
    };
}
