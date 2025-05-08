import { getRandomIntegerInARange } from 'senaev-utils/src/utils/random/getRandomIntegerInARange';

import { CUBE_COLORS } from '../const/CUBE_COLORS';

import { getLevelColorsCount } from './getLevelColorsCount';

export function getRandomColorForCubeLevel(level: number) {
    return CUBE_COLORS[getRandomIntegerInARange(0, getLevelColorsCount(level) - 1)];
}
