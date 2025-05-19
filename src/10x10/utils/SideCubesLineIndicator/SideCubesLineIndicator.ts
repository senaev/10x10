import { Direction, DIRECTIONS } from '../../const/DIRECTIONS';
import { SideCubeAddress } from '../../js/Cubes';

export type SideCubesLineId = `${SideCubeAddress['field']},${SideCubeAddress['x']},${SideCubeAddress['y']}`;

export function getSideCubeLineId({
    field,
    x,
    y,
}: SideCubeAddress): SideCubesLineId {
    if (!DIRECTIONS.includes(field)) {
        throw new Error('Invalid field');
    }

    let resultX = x;
    let resultY = y;

    if (field === 'top' && y !== 9) {
        resultY = 9;
    }

    if (field === 'bottom' && y !== 0) {
        resultY = 0;
    }

    if (field === 'left' && x !== 9) {
        resultX = 9;
    }

    if (field === 'right' && x !== 0) {
        resultX = 0;
    }

    return `${field},${resultX},${resultY}`;
}

export function parseSideCubesLineId(indicator: SideCubesLineId): SideCubeAddress {
    const [
        field,
        x,
        y,
    ] = indicator.split(',');

    return {
        field: field as Direction,
        x: Number(x),
        y: Number(y),
    };
}
