import { getObjectKeys } from 'senaev-utils/src/utils/Object/getObjectKeys/getObjectKeys';

export const ALL_FIELDS_OBJECT = {
    main: undefined,
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined,
} as const;

export const FIELDS = getObjectKeys(ALL_FIELDS_OBJECT);

export type Field = keyof typeof ALL_FIELDS_OBJECT;
