import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';

import { CubesState } from '../js/TenOnTen';

import { generateRandomMainFieldState } from './generateRandomMainFieldState';
import { generateRandomSideCubesForLevel } from './generateRandomSideCubesForLevel';

export function generateRandomStateForLevel({
    level,
}: {
    level: PositiveInteger;
}): CubesState {
    const main = generateRandomMainFieldState({
        level,
    });

    const side = generateRandomSideCubesForLevel(level);

    return {
        main,
        ...side,
    };
}
