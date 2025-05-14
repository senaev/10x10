import { getRandomIntegerInARange } from 'senaev-utils/src/utils/random/getRandomIntegerInARange';

import { CUBE_COLORS_ARRAY } from '../const/CUBE_COLORS';

import { getLevelColorsCount } from './getLevelColorsCount';

export function getRandomColorForCubeLevel(level: number) {
    return CUBE_COLORS_ARRAY[getRandomIntegerInARange(0, getLevelColorsCount(level) - 1)];
}
