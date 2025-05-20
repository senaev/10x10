import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { mapObjectValues } from 'senaev-utils/src/utils/Object/mapObjectValues/mapObjectValues';

import { SideCubesLineId, getSideCubeLineId } from '../utils/SideCubesLineIndicator/SideCubesLineIndicator';

import { BOARD_SIZE } from './BOARD_SIZE';
import { DIRECTION_STEPS } from './DIRECTION_STEPS';
import { Direction } from './DIRECTIONS';

export const ALL_SIDE_LINES: Record<Direction, SideCubesLineId[]> = mapObjectValues(
    DIRECTION_STEPS,
    (_directionStep, field) => createArray(BOARD_SIZE).map((_, i) => getSideCubeLineId({
        field,
        x: i,
        y: i,
    }))
);
