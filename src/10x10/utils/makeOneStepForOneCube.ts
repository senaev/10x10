import { DIRECTION_STEPS } from '../const/DIRECTION_STEPS';
import { DIRECTION_TO_ANIMATION } from '../const/DIRECTION_TO_ANIMATION';
import { __findCubeInMainMask } from '../js/MainMask';
import { ActionStep, MovingCube } from '../js/MovingCube';

/**
 * Один шаг для кубика, возвращает информацию о шаге для анимации
 */
export function makeOneStepForOneCube(cube: MovingCube, movingCubes: MovingCube[]): ActionStep {
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
        x: cube.x + DIRECTION_STEPS[cube.direction].x,
        y: cube.y + DIRECTION_STEPS[cube.direction].y,
    };

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
    const animation = DIRECTION_TO_ANIMATION[cube.direction];
    // если следующая клетка свободна, задаем значениям позиции кубика значения следующей клетки
    cube.x = nextPos.x;
    cube.y = nextPos.y;

    return { do: animation };
}
