import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { CubeAnimationName } from '../components/CubeView';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { SideCubeAddress, SideCubesMask } from '../js/Cubes';
import {
    AnimationScript,
} from '../js/createMoveMap';

import { animateCubesFromSideToMainField } from './animateCubesFromSideToMainField';

// когда ход просчитан, запускаем саму анимацию
export async function animateMove({
    firstCubeAddress,
    startCubesCount,
    sideCubesMask,
    animationsScript,
    animationLength,
}: {
    firstCubeAddress: SideCubeAddress;
    startCubesCount: PositiveInteger;
    sideCubesMask: SideCubesMask;
    animationsScript: AnimationScript;
    animationLength: UnsignedInteger;
}): Promise<void> {

    animateCubesFromSideToMainField({
        firstCubeAddress,
        startCubesCount,
        sideCubesMask,
    });

    for (const [
        cube,
        animations,
    ] of animationsScript.entries()) {
        (async () => {

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
