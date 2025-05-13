import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';

export async function appearCubeFromZeroSizePoint({
    element,
}: {
    element: HTMLElement;
}) {
    element.style.transform = 'scale(0,0)';
    element.style.opacity = '0.4';
    element.style.transition = `transform ${ANIMATION_TIME}ms ease-out, opacity ${ANIMATION_TIME}ms ease-out`;
    forceRepaint(element);

    element.style.transform = 'scale(1,1)';
    element.style.opacity = '1';
    await promiseTimeout(ANIMATION_TIME);

    element.style.transition = '';
}
