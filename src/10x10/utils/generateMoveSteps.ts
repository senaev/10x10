import { MovingCube } from '../js/MovingCube';

import { makeOneStepForOneCube } from './makeOneStepForOneCube';
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

            for (const movingCube of movingCubes) {
                const step = makeOneStepForOneCube(movingCube, movingCubes);

                movingCube.steps.push(step);

                if (step !== null) {
                    somethingHappened = true;
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
