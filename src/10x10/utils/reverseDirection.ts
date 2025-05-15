import { Direction } from '../const/DIRECTIONS';

export function reverseDirection (field: Direction): Direction {
    if (field === 'top') {
        return 'bottom';
    }

    if (field === 'bottom') {
        return 'top';
    }

    if (field === 'left') {
        return 'right';
    }

    return 'left';
}
