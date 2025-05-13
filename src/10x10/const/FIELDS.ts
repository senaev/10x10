import { DIRECTIONS } from './DIRECTIONS';

export const FIELDS = [
    'main',
    ...DIRECTIONS,
] as const;

export type Field = (typeof FIELDS)[number];
