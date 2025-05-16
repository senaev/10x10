import { DIRECTION_STEPS } from '../const/DIRECTION_STEPS';
import { DIRECTION_TO_ANIMATION } from '../const/DIRECTION_TO_ANIMATION';
import { CubeCoordinates } from '../js/Cubes';
import { ActionStep, MovingCube } from '../js/MovingCube';

/**
 * Один шаг для кубика, возвращает информацию о шаге для анимации
 */
export function makeOneStepForOneCube(cube: MovingCube, movingCubes: MovingCube[]): ActionStep {
    // если кубик не имеет направления - он стоит на месте
    if (cube.direction === null) {
        return null;
    }

    // если кубик взорван, он стоит на месте
    if (cube.x === -1 && cube.y === -1) {
        return null;
    }

    // если у кубика имеется направление, подсчитываем, где он может оказаться
    const nextPosition: CubeCoordinates = {
        x: cube.x + DIRECTION_STEPS[cube.direction].x,
        y: cube.y + DIRECTION_STEPS[cube.direction].y,
    };

    // если следующая позиция - одно из боковых полей - отправляем кубик туда
    if (nextPosition.x < 0 || nextPosition.x > 9 || nextPosition.y < 0 || nextPosition.y > 9) {
        cube.x = nextPosition.x;
        cube.y = nextPosition.y;
        const action = DIRECTION_TO_ANIMATION[cube.direction];
        cube.direction = null;

        return action;
    }

    // если следующая клетка занята - кубик стоит на месте
    const cubeInNextPosition = movingCubes.find(({ x, y }) => x === nextPosition.x && y === nextPosition.y);
    if (cubeInNextPosition) {
        return null;
    }

    // если нет, идет обращение к коллекции кубиков, чтобы узнать, свободна ли следующая клетка
    const animation = DIRECTION_TO_ANIMATION[cube.direction];
    // если следующая клетка свободна, задаем значениям позиции кубика значения следующей клетки
    cube.x = nextPosition.x;
    cube.y = nextPosition.y;

    return animation;
}
