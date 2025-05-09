import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { directionToAnimation } from '../utils/directionToAnimation';
import { generateMoveStep } from '../utils/generateMoveStep';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';

import { Cube } from './Cube';
import { Cubes } from './Cubes';
import { MovingCube } from './MovingCube';

// Поскольку маска - несортированный массив, получаем куб методом перебора
export function __findCubeInMainMask(arr: MovingCube[], o: { x: number; y: number }): MovingCube | null {
    for (const key in arr) {
        if (arr[key].x === o.x && arr[key].y === o.y) {
            return arr[key];
        }
    }
    return null;
}

/**
 * Класс для маски (слепок текущего состояния с возможностью создать пошагово один ход игры).
 * Класс принимает коллекцию кубиков, а также кубик, с которого начинается анимация.
 * Во время создания экземпляра класса создаётся массив м-кубиков (экземпляров класса МКубе),
 * затем пошагово - обращение к каждому м-кубику, методом oneStep, в котором автоматически меняются
 * параметры состояния и создаётся объект из последовательности шагов для построения анимации
 */
export function generateMainFieldMoves({
    cubes, startCubes,
}: {
    cubes: Cubes;
    startCubes: Cube[];
}): MovingCube[] {
    // Основной массив со значениями
    // Сюда будут попадать м-кубики, участвующие в анимации
    const movingCubes: MovingCube[] = [];

    // создаем массив из всех кубиков, которые есть на доске
    cubes._mainEach((cube) => {
        movingCubes.push(new MovingCube({
            x: cube.x,
            y: cube.y,
            color: cube.color,
            direction: cube.direction,
            movingCubes,
            cube,
        }));
    });

    // добавляем в маску кубик, с которого начинаем анимацию
    const startMCubes: MovingCube[] = [];
    for (const key in startCubes) {
        const startCube = startCubes[key];

        startCube.toMineOrder = getIncrementalIntegerForMainFieldOrder();

        let startMCubeX;
        let startMCubeY;
        if (startCube.field === 'top' || startCube.field === 'bottom') {
            startMCubeX = startCube.x;
            if (startCube.field === 'top') {
                startMCubeY = startCubes.length - Number(key) - 1;
            } else {
                startMCubeY = BOARD_SIZE - startCubes.length + parseInt(key);
            }
        } else {
            if (startCube.field === 'left') {
                startMCubeX = startCubes.length - Number(key) - 1;
            } else {
                startMCubeX = BOARD_SIZE - startCubes.length + parseInt(key);
            }
            startMCubeY = startCube.y;
        }

        const startMCube = new MovingCube({
            x: startMCubeX,
            y: startMCubeY,
            color: startCube.color,
            direction: startCube.direction,
            movingCubes,
            cube: startCube,
        });
        movingCubes.push(startMCube);
        startMCubes.push(startMCube);
    }

    // добавим шаги анимации для выплывающих из боковой линии кубиков
    for (const _step in startMCubes) {
        movingCubes.forEach((mCube) => {
            if (startMCubes.indexOf(mCube) === -1) {
                mCube.steps.push({ do: null });
            } else {
                const { direction } = mCube;

                assertNonEmptyString(direction);

                mCube.steps.push({
                    do: directionToAnimation(direction),
                });
            }
        });
    }

    movingCubes.sort(function (a, b) {
        return a.cube.toMineOrder! - b.cube.toMineOrder!;
    });

    generateMoveStep(movingCubes);

    return movingCubes;
}
