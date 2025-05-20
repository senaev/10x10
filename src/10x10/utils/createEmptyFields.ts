import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';

import { BOARD_SIZE } from '../const/BOARD_SIZE';

export function createEmptyFields(): null[][] {
    return createArray(BOARD_SIZE).map(() => createArray(BOARD_SIZE, null));
}
