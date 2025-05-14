import { getObjectKeys } from 'senaev-utils/src/utils/Object/getObjectKeys/getObjectKeys';

export const CUBE_COLORS = {
    blue: '#4e7cff',
    green: '#0e9f0e',
    yellow: '#e7df00',
    red: '#ff4949',
    brown: '#df690a',
    pink: '#ffc0cb',
    white: '#ddd',
    purple: '#ff46ff',
    lightblue: '#9bcada',
    orange: '#ffb121',
};
export type CubeColor = keyof typeof CUBE_COLORS;

export const CUBE_COLORS_ARRAY = getObjectKeys(CUBE_COLORS);
