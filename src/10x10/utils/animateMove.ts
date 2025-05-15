import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { SideCubeAddress, SideCubesMask } from '../js/Cubes';
import {
    AnimationScript,
} from '../js/MoveMap';

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

    // перебираем карту анимации и передаем каждому кубику объект действия,
    // состоящий из переменных: само действие, продолжительность, задержка перед выполнением,
    // далее кубик запускает таймер до выполнения и выполняет нужную анимацию
    for (const [
        cube,
        animations,
    ] of animationsScript.entries()) {
        for (const animation of animations) {
            cube.addAnimate(animation);
        }
    }

    await promiseTimeout(animationLength * ANIMATION_TIME - 1);
}
