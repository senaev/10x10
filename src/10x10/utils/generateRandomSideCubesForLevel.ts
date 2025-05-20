import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { mapObjectValues } from 'senaev-utils/src/utils/Object/mapObjectValues/mapObjectValues';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { DIRECTION_STEPS } from '../const/DIRECTION_STEPS';
import { SideFieldsCubesState } from '../js/TenOnTen';

import { getRandomColorForCubeLevel } from './getRandomColorForCubeLevel';

export function generateRandomSideCubesForLevel(level: number): SideFieldsCubesState {
    return mapObjectValues(DIRECTION_STEPS, () => createArray(BOARD_SIZE).map(() => createArray(BOARD_SIZE).map(() => {
        return {
            color: getRandomColorForCubeLevel(level),
            direction: null,
            toMineOrder: null,
        };
    })));
}
