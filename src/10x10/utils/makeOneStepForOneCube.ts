import { __findCubeInMainMask } from '../js/MainMask';
import { AnimationStep, MovingCube } from '../js/MovingCube';

import { directionToAnimation } from './directionToAnimation';

// один шаг для м-кубика, возвращает информацию о шаге для анимации
export function makeOneStepForOneCube(cube: MovingCube, movingCubes: MovingCube[]): AnimationStep {
    const step: AnimationStep = { do: null };
    // если м-кубик взорван, он стоит на месте
    if (cube.x === -1 && cube.y === -1) {
        step.do = null;
    } else {
        // если м-кубик не имеет направления - он стоит на месте
        if (cube.direction !== null) {
            // если у м-кубика имеется направление, подсчитываем, где он может оказаться
            const nextPos = {
                x: cube.x,
                y: cube.y,
            };

            if (cube.direction === 'top' || cube.direction === 'bottom') {
                if (cube.direction === 'top') {
                    nextPos.y--;
                } else {
                    nextPos.y++;
                }
            } else {
                if (cube.direction === 'left') {
                    nextPos.x--;
                } else {
                    nextPos.x++;
                }
            }

            // если следующая позиция - одно из боковых полей - отправляем кубик туда
            if (nextPos.x < 0 || nextPos.x > 9 || nextPos.y < 0 || nextPos.y > 9) {
                cube.x = nextPos.x;
                cube.y = nextPos.y;
                cube.direction = null;
                step.do = 'toSide';
            } else {
                const cubeInNextPosition = __findCubeInMainMask(movingCubes, nextPos);

                // если нет, идет обращение к коллекции м-кубиков, чтобы узнать, свободна ли следующая клетка
                if (!cubeInNextPosition) {
                    const animation = directionToAnimation(cube.direction);
                    // если следующая клетка свободна, задаем значениям позиции кубика значения следующей клетки
                    cube.x = nextPos.x;
                    cube.y = nextPos.y;
                    step.do = animation;
                } else {
                    // если клетка занята - кубик стоит на месте
                    step.do = null;
                }
            }
        } else {
            // если не имеет - стоит на мется
            step.do = null;
        }
    }
    cube.steps.push(step);

    // возвращаем значение объекту mainMask, чтобы он знал, что что-то произошло
    return step;
}
