import { CubeCoordinates } from '../js/Cubes';

export function getCubeByCoordinates<T extends CubeCoordinates>(coordinates: CubeCoordinates, cubes: Set<T>): T | undefined {
    for (const cube of cubes) {
        if (cube.x === coordinates.x && cube.y === coordinates.y) {
            return cube;
        }
    }

    return undefined;
}
