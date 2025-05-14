import { CubeCoordinates } from '../js/Cubes';

import { Field } from './FIELDS';

export const FIELD_OFFSETS: Record<Field, CubeCoordinates> = {
    top: {
        x: 0,
        y: -10,
    },
    left: {
        x: -10,
        y: 0,
    },
    right: {
        x: 10,
        y: 0,
    },
    bottom: {
        x: 0,
        y: 10,
    },
    main: {
        x: 0,
        y: 0,
    },
};
