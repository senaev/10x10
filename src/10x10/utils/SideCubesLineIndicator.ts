import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { SideCubeAddress } from '../js/Cubes';

export type SideCubesLineIndicator = `${SideCubeAddress['field']},${SideCubeAddress['x']},${SideCubeAddress['y']}`;

export function createSideCubesLineIndicator({
    field,
    x,
    y,
}: SideCubeAddress): SideCubesLineIndicator {
    if (!DIRECTIONS.includes(field)) {
        throw new Error('Invalid field');
    }

    if (field === 'top' && y !== 9) {
        throw new Error('Invalid y for top field');
    }

    if (field === 'bottom' && y !== 0) {
        throw new Error('Invalid y for bottom field');
    }

    if (field === 'left' && x !== 9) {
        throw new Error('Invalid x for left field');
    }

    if (field === 'right' && x !== 0) {
        throw new Error('Invalid x for right field');
    }

    return `${field},${x},${y}`;
}

export function parseSideCubesLineIndicator(indicator: SideCubesLineIndicator): SideCubeAddress {
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
