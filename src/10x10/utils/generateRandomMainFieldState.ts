import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { getRandomIntegerInARange } from 'senaev-utils/src/utils/random/getRandomIntegerInARange';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_COLORS_ARRAY, CubeColor } from '../const/CUBE_COLORS';
import { CubeCoordinates } from '../js/CubesViews';
import { MainFieldCubesState } from '../js/TenOnTen';

import { getIncrementalIntegerForMainFieldOrder } from './getIncrementalIntegerForMainFieldOrder';
import { getLevelColorsCount } from './getLevelColorsCount';
import { getLevelCubesCount } from './getLevelCubesCount';
import { getLevelCubesPositions } from './getLevelCubesPositions';

export function generateRandomMainFieldState({
    level,
}: {
    level: UnsignedInteger;
}) {

    const firstCubesPositions = getLevelCubesPositions(level);
    const nullCells: { x: number; y: number }[] = [];

    const mainFieldCubesState: MainFieldCubesState = createArray(BOARD_SIZE)
        .map(() => createArray(BOARD_SIZE)
            .map(() => null));

    const len = getLevelCubesCount(level);

    for (let i = 0; i < len; i++) {
        let cell: { x: number; y: number } | undefined;

        const firstPosition = firstCubesPositions[i];

        if (firstPosition) {
            cell = {
                x: firstPosition[0],
                y: firstPosition[1],
            };
        } else {
            // шанс попадания кубика в крайнее поле - чем больше, тем ниже
            const chance = 2;
            for (let key = 0; key < chance; key++) {
                cell = nullCells.shift()!;
                if (
                    cell.x === 0 || cell.y === 0 || cell.x === BOARD_SIZE - 1 || cell.y === BOARD_SIZE - 1
                ) {
                    nullCells.push(cell);
                } else {
                    break;
                }
            }
        }

        // выстраиваем кубики так, чтобы не было соседних одноцветных кубиков
        const colorsCount = getLevelColorsCount(level);

        // цвета, которые есть в смежных кубиках
        const appearanceColors: string[] = [];
        for (let key = 0; key < 4; key++) {
            const coordinates: CubeCoordinates = {
                x: cell!.x,
                y: cell!.y,
            };

            const prop: 'x' | 'y' = key % 2 == 0 ? 'x' : 'y';
            coordinates[prop] = key < 2 ? coordinates[prop] + 1 : coordinates[prop] - 1;

            if (
                coordinates.x > -1 && coordinates.y > -1 && coordinates.x < 10 && coordinates.y < 10
            ) {
                const cube = mainFieldCubesState[coordinates.x][coordinates.y];
                if (cube) {
                    appearanceColors.push(cube.color);
                }
            }
        }

        // цвета, которых нету в смежных
        const noAppearanceColors: CubeColor[] = [];
        for (let key = 0; key < colorsCount; key++) {
            if (!appearanceColors.includes(CUBE_COLORS_ARRAY[key])) {
                noAppearanceColors.push(CUBE_COLORS_ARRAY[key]);
            }
        }

        // получаем итоговый цвет
        const color = noAppearanceColors[getRandomIntegerInARange(0, noAppearanceColors.length - 1)];

        mainFieldCubesState[cell!.x][cell!.y] = {
            color,
            direction: null,
            toMineOrder: getIncrementalIntegerForMainFieldOrder(),
        };
    }

    return mainFieldCubesState;
}
