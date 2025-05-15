import { Milliseconds } from 'senaev-utils/src/types/Time/Milliseconds';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';

export type PivotAnimationType = 'rotate3d' | 'rotateX' | 'rotateY';

export async function animateElementPivotWithChange({
    element,
    duration,
    onHalfAnimationCallback,
    transformType,
}: {
    element: HTMLElement;
    duration: Milliseconds;
    onHalfAnimationCallback: VoidFunction;
    transformType: PivotAnimationType;
}): Promise<void> {

    const halfAnimationDuration = duration / 2;

    element.style.transition = `transform ${halfAnimationDuration}ms ease`;
    forceRepaint(element);

    const transformParams1 = transformType === 'rotate3d'
        ? '1,1,0,90deg'
        : '90deg';
    element.style.transform = `${transformType}(${transformParams1})`;

    await promiseTimeout(halfAnimationDuration);

    onHalfAnimationCallback();

    const transformParams2 = transformType === 'rotate3d'
        ? '1,1,0,0deg'
        : '0deg';
    element.style.transform = `${transformType}(${transformParams2})`;

    await promiseTimeout(halfAnimationDuration);

    element.style.transition = '';
    element.style.transform = '';
}
