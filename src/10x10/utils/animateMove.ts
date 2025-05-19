import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import {
    AnimationScript,
} from '../js/createMoveMap';
import {
    CubesViews, SideCubeAddress, SideCubesMask,
} from '../js/CubesViews';
import { parseCubeAddressString } from '../js/MovingCube';

import { animateCubesFromSideToMainField } from './animateCubesFromSideToMainField';

// когда ход просчитан, запускаем саму анимацию
export async function animateMove({
    firstCubeAddress,
    startCubesCount,
    sideCubesMask,
    animationsScript,
    animationLength,
    cubes,
}: {
    firstCubeAddress: SideCubeAddress;
    startCubesCount: PositiveInteger;
    sideCubesMask: SideCubesMask;
    animationsScript: AnimationScript;
    animationLength: UnsignedInteger;
    cubes: CubesViews;
}): Promise<void> {

    animateCubesFromSideToMainField({
        firstCubeAddress,
        startCubesCount,
        sideCubesMask,
    });

    for (const [
        cubeAddressString,
        animations,
    ] of animationsScript.entries()) {
        (async () => {

            const address = parseCubeAddressString(cubeAddressString);
            let cube: CubeView;
            if (address.field === 'main') {
                cube = cubes._getMainCube(address)!;
            } else {
                cube = cubes._getSideCube(address as SideCubeAddress);
            }

            let time = 0;
            for (const {
                action,
                duration,
                delay,
            } of animations) {
                const stepsToAction = delay - time;

                await promiseTimeout(stepsToAction * ANIMATION_TIME);

                await cube.animate({
                    animation: action as CubeAnimationName,
                    steps: duration,
                });

                time += (stepsToAction + duration);
            }
        })();
    }

    await promiseTimeout(animationLength * ANIMATION_TIME - 1);
}
