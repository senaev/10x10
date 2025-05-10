import { MovingCube } from './MovingCube';

// Поскольку маска - несортированный массив, получаем куб методом перебора
export function __findCubeInMainMask(arr: MovingCube[], o: { x: number; y: number }): MovingCube | null {
    for (const key in arr) {
        if (arr[key].x === o.x && arr[key].y === o.y) {
            return arr[key];
        }
    }
    return null;
}
