import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';

export async function animateCubeBump({
    isVertical,
    element,
}: {
    isVertical: boolean;
    element: HTMLElement;
}) {
    const scale: [number, number] = isVertical
        ? [
            1.1,
            0.9,
        ]
        : [
            0.9,
            1.1,
        ];
    const halfDuration = ANIMATION_TIME / 2;

    element.style.transition = `transform ${halfDuration}ms ease`;
    forceRepaint(element);

    element.style.transform = `scale(${scale[0]},${scale[1]})`;
    await promiseTimeout(halfDuration);

    element.style.transform = '';
    await promiseTimeout(halfDuration);

    element.style.transition = '';
}
