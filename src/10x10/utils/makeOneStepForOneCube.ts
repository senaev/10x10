import { __findCubeInMainMask } from '../js/MainMask';
import { AnimationStep, MovingCube } from '../js/MovingCube';

import { directionToAnimation } from './directionToAnimation';

/**
 * Один шаг для кубика, возвращает информацию о шаге для анимации
 */
export function makeOneStepForOneCube(cube: MovingCube, movingCubes: MovingCube[]): AnimationStep {
    // если кубик взорван, он стоит на месте
    if (cube.x === -1 && cube.y === -1) {
        return null;
    }

    // если кубик не имеет направления - он стоит на месте
    if (cube.direction === null) {
        return null;
    }

    // если у кубика имеется направление, подсчитываем, где он может оказаться
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

        return { do: 'toSide' };
    }

    // если следующая клетка занята - кубик стоит на месте
    const cubeInNextPosition = __findCubeInMainMask(movingCubes, nextPos);
    if (cubeInNextPosition) {
        return null;
    }

    // если нет, идет обращение к коллекции кубиков, чтобы узнать, свободна ли следующая клетка
    const animation = directionToAnimation(cube.direction);
    // если следующая клетка свободна, задаем значениям позиции кубика значения следующей клетки
    cube.x = nextPos.x;
    cube.y = nextPos.y;

    return { do: animation };
}
