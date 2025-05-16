import { BOARD_SIZE } from '../const/BOARD_SIZE';

import { searchAdjacentCubesByColor } from './searchAdjacentCubesByColor';

export function searchAdjacentCubes<T extends { x: number; y: number; color: string }>(cubes: T[]) {
    const byColorPrev: Record<string, T[]> = {};
    const byColor: Record<string, T[]> = {};

    // создаем объект с массивами м-кубиков по цветам
    for (const key in cubes) {
        const mCube = cubes[key];
        // Если такого значения в объекте еще нет - создаем его
        if (byColorPrev[mCube.color] === undefined) {
            byColorPrev[mCube.color] = [];
        }

        // добавляем в этот массив все кубики, которые есть на доске
        if (
            mCube.x > -1 && mCube.x < BOARD_SIZE && mCube.y > -1 && mCube.y < BOARD_SIZE
        ) {
            byColorPrev[mCube.color].push(mCube);
        }
    }
    // Если количество кубиков определенного цвета на доске меньше двух,
    // исключаем эту группу кубиков из обработки
    for (const key in byColorPrev) {
        if (byColorPrev[key].length > 2) {
            byColor[key] = byColorPrev[key];
        }
    }

    // ищем группы смежных кубиков и помещаем их в массив groups
    let groups: T[][] = [];
    for (const key in byColor) {
        groups = groups.concat(searchAdjacentCubesByColor(byColor[key]));
    }
    return groups;
}
