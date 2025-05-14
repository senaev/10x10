import { Milliseconds } from 'senaev-utils/src/types/Time/Milliseconds';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';

export async function animateCubeBump({
    isVertical,
    element,
    duration,
}: {
    isVertical: boolean;
    element: HTMLElement;
    duration: Milliseconds;
}) {
    const scale: [number, number] = isVertical
        ? [
            1.4,
            0.8,
        ]
        : [
            0.8,
            1.4,
        ];
    const halfDuration = duration / 2;

    element.style.transition = `transform ${halfDuration}ms ease`;
    forceRepaint(element);

    element.style.transform = `scale(${scale[0]},${scale[1]})`;
    await promiseTimeout(halfDuration);

    element.style.transform = '';
    await promiseTimeout(halfDuration);

    element.style.transition = '';
}
