export const DIRECTIONS = [
    'top',
    'bottom',
    'left',
    'right',
] as const;

export type Direction = (typeof DIRECTIONS)[number];
