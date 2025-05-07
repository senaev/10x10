export const FIELDS = [
    'main',
    'top',
    'right',
    'bottom',
    'left',
] as const;
export type Field = (typeof FIELDS)[number];
