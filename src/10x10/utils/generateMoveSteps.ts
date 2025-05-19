import { separateArray } from 'senaev-utils/src/utils/Array/separateArray/separateArray';
import { mapGetOrSet } from 'senaev-utils/src/utils/Map/mapGetOrSet/mapGetOrSet';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { MovingCube } from '../js/MovingCube';

import { getOppositeFieldCubeAddress } from './getOppositeFieldCubeAddress/getOppositeFieldCubeAddress';
import {
    getCubeInPosition, getCubeNextPosition, isPositionOnMainField, makeOneStepForOneCube,
} from './makeOneStepForOneCube';
import { reverseDirection } from './reverseDirection';
import { searchAdjacentCubes } from './searchAdjacentCubes';
import { createSideCubesLineId, SideCubesLineId } from './SideCubesLineIndicator';

/**
 * Один ход для всех кубиков на доске
 */
export function generateMoveSteps(movingCubes: MovingCube[]): {
    sideLinesMovementSteps: Map<SideCubesLineId, UnsignedInteger[]>;
    stepsCount: UnsignedInteger;
} {
    let stepId: UnsignedInteger = 0;
    const sideLinesMovementSteps: Map<SideCubesLineId, UnsignedInteger[]> = new Map();

    while (true) {
        while (true) {
            // Индикатор конца движений, если что-то происходит во время шага анимации -
            // Индикатор конца движений, если что-то происходит во время шага анимации -
            // вызываем следующий шаг, если нет, то либо заканчиваем ход если нету смежных одинаковых кубиков,
            // либо вызываем подрыв этих кубиков и вызываем следующий шаг анимации
            let somethingHappened = false;

            const movedOutOfMainField = new Set<MovingCube>();

            const [
                cubesOnField,
                cubesOutOfField,
            ] = separateArray(movingCubes, isPositionOnMainField);

            for (const movingCube of cubesOnField) {
                const step = makeOneStepForOneCube(movingCube, movingCubes);

                if (step === 'move_to_side') {
                    const direction = movingCube.direction;
                    assertNonEmptyString(direction);

                    let tempMovingCube = movingCube;

                    while (true) {

                        const nextCubePosition = getCubeNextPosition(tempMovingCube);

                        const cubeInNextPosition = getCubeInPosition(cubesOutOfField, nextCubePosition);

                        tempMovingCube.x = nextCubePosition.x;
                        tempMovingCube.y = nextCubePosition.y;
                        tempMovingCube.steps.push(direction);
                        movedOutOfMainField.add(tempMovingCube);

                        if (!cubeInNextPosition) {
                            break;
                        }

                        tempMovingCube = cubeInNextPosition;
                    }

                    const oppositeFieldCubeAddress = getOppositeFieldCubeAddress({
                        field: reverseDirection(direction),
                        x: tempMovingCube.x,
                        y: tempMovingCube.y,
                    });
                    const sideLineId = createSideCubesLineId(oppositeFieldCubeAddress);

                    const sideLineMovements = mapGetOrSet(sideLinesMovementSteps, sideLineId, []);
                    sideLineMovements.push(stepId);
                } else {
                    movingCube.steps.push(step);
                }

                if (step !== null) {
                    somethingHappened = true;
                }
            }

            for (const movingCube of cubesOutOfField) {
                if (!movedOutOfMainField.has(movingCube)) {
                    movingCube.steps.push(null);
                }
            }

            stepId++;

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
            return {
                sideLinesMovementSteps,
                stepsCount: stepId,
            };
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

            stepId++;
        });
    }
}
