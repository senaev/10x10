import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import {
    AnimationScriptWithViews,
    CubeAnimation,
} from '../js/createMoveMap';

async function animateOneCube({
    animations,
    cube,
}: {
    animations: CubeAnimation[];
    cube: CubeView;
}): Promise<void> {
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
}

// когда ход просчитан, запускаем саму анимацию
export async function animateMove({
    animationScriptWithViews,
}: {
    animationScriptWithViews: AnimationScriptWithViews;
}): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [
        cube,
        animations,
    ] of animationScriptWithViews.entries()) {
        promises.push(animateOneCube({
            cube,
            animations,
        }));
    }

    await Promise.all(promises);
}
