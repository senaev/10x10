import { Integer } from 'senaev-utils/src/utils/Number/Integer';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';

export async function animateCubeMovement({
    isVertical,
    distance,
    element,
}: {
    isVertical: boolean;
    distance: Integer;
    element: HTMLElement;
}) {
    const duration = ANIMATION_TIME * Math.abs(distance);

    const prop = isVertical ? 'top' : 'left';
    element.style.transition = `${prop} ${duration}ms cubic-bezier(.42, 0, 1, 1)`;
    forceRepaint(element);

    const currentPropValue = parseFloat(element.style[prop]);
    const newLeft = currentPropValue + distance;
    element.style[prop] = `${newLeft}em`;

    await promiseTimeout(duration);

    element.style.transition = '';
}
