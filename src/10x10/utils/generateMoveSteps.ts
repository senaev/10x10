import { separateArray } from 'senaev-utils/src/utils/Array/separateArray/separateArray';
import { isObject } from 'senaev-utils/src/utils/Object/isObject/isObject';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { DIRECTION_TO_ANIMATION } from '../const/DIRECTION_TO_ANIMATION';
import { MovingCube } from '../js/MovingCube';

import {
    getCubeInPosition, getCubeNextPosition, isPositionOnMainField, makeOneStepForOneCube,
} from './makeOneStepForOneCube';
import { searchAdjacentCubes } from './searchAdjacentCubes';

/**
 * Один ход для всех кубиков на доске
 */
export function generateMoveSteps(movingCubes: MovingCube[]) {
    while (true) {
        while (true) {
            // Индикатор конца движений, если что-то происходит во время шага анимации -
            // Индикатор конца движений, если что-то происходит во время шага анимации -
            // вызываем следующий шаг, если нет, то либо заканчиваем ход если нету смежных одинаковых кубиков,
            // либо вызываем подрыв этих кубиков и вызываем следующий шаг анимации
            let somethingHappened = false;

            const movedToSide = [];

            const [
                cubesOnField,
                cubesOutOfField,
            ] = separateArray(movingCubes, isPositionOnMainField);

            for (const movingCube of cubesOnField) {
                const step = makeOneStepForOneCube(movingCube, movingCubes);

                if (isObject(step)) {
                    movingCube.steps.push(DIRECTION_TO_ANIMATION[step.field]);
                    movedToSide.push(movingCube);
                } else {
                    movingCube.steps.push(step);
                }

                if (step !== null) {
                    somethingHappened = true;
                }
            }

            const movedOutOfField = new Set<MovingCube>();
            movedToSide.forEach((movingCube) => {
                while (true) {
                    const direction = movingCube.direction;
                    assertNonEmptyString(direction);

                    const nextCubePosition = getCubeNextPosition(movingCube);

                    const cubeInNextPosition = getCubeInPosition(cubesOutOfField, nextCubePosition);

                    movingCube.x = nextCubePosition.x;
                    movingCube.y = nextCubePosition.y;
                    movingCube.steps.push(DIRECTION_TO_ANIMATION[direction]);
                    movedOutOfField.add(movingCube);

                    if (!cubeInNextPosition) {
                        break;
                    }

                    movingCube = cubeInNextPosition;
                }
            });

            for (const movingCube of cubesOutOfField) {
                if (!movedOutOfField.has(movingCube)) {
                    movingCube.steps.push(null);
                }
            }

            // Проверяем, произошло что-то или нет в конце каждого хода
            if (!somethingHappened) {
                break;
            }
        }

        // Ищем, появились ли у нас в результате хода смежные кубики
        // и если появились - делаем ещё один шаг хода, если нет - заканчиваем ход
        const adjacentCubes = searchAdjacentCubes(movingCubes);
        if (!adjacentCubes.length) {
        // заканчиваем ход
            return;
        }

        // Если такие группы кубиков имеются, подрываем их и запускаем
        // еще один шаг хода, при этом обновляем массив м-кубиков
        // сюда попадут все кубики, которые будут взорваны
        adjacentCubes.forEach((group) => {
            movingCubes.forEach((movingCube) => {
                if (group.includes(movingCube)) {
                    movingCube.steps.push('boom');
                    // взорвавшимся м-кубикам присваиваем координаты -1 -1,
                    // чтобы в дальнейшей анимации они не участвовали
                    movingCube.x = -1;
                    movingCube.y = -1;
                } else {
                    movingCube.steps.push(null);
                }
            });
        });
    }
}
