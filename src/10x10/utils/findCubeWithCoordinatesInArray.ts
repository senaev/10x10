import { CubeCoordinates } from '../js/Cubes';

// Поскольку маска - несортированный массив, получаем куб методом перебора
export function findCubeWithCoordinatesInArray<T extends CubeCoordinates>(arr: T[], coordinates: CubeCoordinates): T | undefined {
    return arr.find((cube) => cube.x === coordinates.x && cube.y === coordinates.y);
}
