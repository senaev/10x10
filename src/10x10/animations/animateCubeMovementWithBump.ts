import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';

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
    await animateCubeMovement({
        isVertical,
        element,
        distance,
    });

    await animateCubeBump({
        isVertical,
        element,
    });
};
