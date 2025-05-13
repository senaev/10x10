import { Direction } from '../const/DIRECTIONS';
import { Field } from '../const/FIELDS';

export function reverseDirection (field: Field): Direction | null {
    if (field === 'top') {
        return 'bottom';
    }

    if (field === 'bottom') {
        return 'top';
    }

    if (field === 'left') {
        return 'right';
    }

    if (field === 'right') {
        return 'left';
    }

    return null;
}
