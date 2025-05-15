import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';

import { ANIMATION_TIME } from '../const/ANIMATION_TIME';

import { animateCubeBump } from './animateCubeBump';
import { animateCubeMovement } from './animateCubeMovement';

export async function animateCubeMovementWithBump ({
    element,
    isVertical,
    distance,
}: {
    element: HTMLElement;
    isVertical: boolean;
    distance: PositiveInteger;
}) {
    if (element.xxx) {
        console.log('animateCubeMovementWithBump start');
    }

    await animateCubeMovement({
        isVertical,
        element,
        distance,
    });

    await animateCubeBump({
        isVertical,
        element,
        duration: ANIMATION_TIME,
    });

    if (element.xxx) {
        console.log('animateCubeMovementWithBump end');
    }
};
