import { AngleInDegrees } from 'senaev-utils/src/types/Number/AngleInDegrees';

export const DIRECTIONS = [
    'top',
    'bottom',
    'left',
    'right',
] as const;

export type Direction = (typeof DIRECTIONS)[number];

export const DIRECTION_TO_ARROW_ROTATE: Record<Direction, AngleInDegrees> = {
    right: 0,
    top: 270,
    left: 180,
    bottom: 90,
};
