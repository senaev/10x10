import { DIRECTION_STEPS } from '../const/DIRECTION_STEPS';
import { DIRECTION_TO_ANIMATION } from '../const/DIRECTION_TO_ANIMATION';
import { Direction } from '../const/DIRECTIONS';
import { CubeCoordinates } from '../js/Cubes';
import { ActionStep, MovingCube } from '../js/MovingCube';

export function isPositionOnMainField(position: CubeCoordinates): boolean {
    return position.x >= 0 && position.x <= 9 && position.y >= 0 && position.y <= 9;
}

export function getCubeNextPosition(cube: CubeCoordinates & { direction: Direction | null }): CubeCoordinates {
    const {
        direction,
        x,
        y,
    } = cube;

    if (direction === null) {
        return {
            x,
            y,
        };
    }

    return {
        x: x + DIRECTION_STEPS[direction].x,
        y: y + DIRECTION_STEPS[direction].y,
    };
}

export function getCubeInPosition(movingCubes: MovingCube[], coordinates: CubeCoordinates): MovingCube | undefined {
    return movingCubes.find(({ x, y }) => x === coordinates.x && y === coordinates.y);
}

/**
 * Один шаг для кубика, возвращает информацию о шаге для анимации
 */
export function makeOneStepForOneCube(cube: MovingCube, movingCubes: MovingCube[]): ActionStep | {
    field: Direction;
} {
    const {
        direction,
        x,
        y,
    } = cube;
    // если кубик не имеет направления - он стоит на месте
    if (direction === null) {
        return null;
    }

    // если кубик взорван, он стоит на месте
    if (x === -1 && y === -1) {
        return null;
    }

    // если у кубика имеется направление, подсчитываем, где он может оказаться
    const nextPosition: CubeCoordinates = getCubeNextPosition(cube);

    // если следующая позиция - одно из боковых полей - отправляем кубик туда
    if (!isPositionOnMainField(nextPosition)) {
        return {
            field: direction,
        };
    }

    // если следующая клетка занята - кубик стоит на месте
    const cubeInNextPosition = getCubeInPosition(movingCubes, nextPosition);
    if (cubeInNextPosition) {
        return null;
    }

    // если нет, идет обращение к коллекции кубиков, чтобы узнать, свободна ли следующая клетка
    const animation = DIRECTION_TO_ANIMATION[direction];

    // если следующая клетка свободна, задаем значениям позиции кубика значения следующей клетки
    cube.x = nextPosition.x;
    cube.y = nextPosition.y;

    return animation;
}
