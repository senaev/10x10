import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';

import { CubeAnimationName } from '../../components/CubeView';
import { Direction } from '../../const/DIRECTIONS';
import { CubeAnimation } from '../../js/createMoveMap';
import { MovingCubeStepAction } from '../../js/MovingCube';

export function stepsToAnimations(steps: MovingCubeStepAction[]): CubeAnimation[] {
    // массив с действиями одного кубика
    const actions: {
        action: CubeAnimationName | Direction | null;
        duration: PositiveInteger;
    }[] = [
        {
            action: null,
            duration: 0,
        },
    ];

    // Пробегаемся по массиву шагов анимации
    for (let time = 0; time < steps.length; time++) {
    // Один шаг анимации
        const step = steps[time];

        // Последний шаг анимации, к которому добавляем продолжительность
        // в случае совпадения со следующим шагом
        const lastAction = actions.at(-1)!;

        if (step === null) {
            actions.push({
                action: null,
                duration: 1,
            });
        } else if (step === lastAction.action) {
        // Если это такой же шаг, как и предыдущий, увеличиваем его продолжительность
            lastAction.duration++;
        } else {
            actions.push({
                action: step,
                duration: 1,
            });
        }
    }

    if (actions.length === 1 && actions[0].action === null) {
        actions.shift();
    }

    if (actions.length === 0) {
        throw new Error('actions.length === 0');
    }

    // итоговый массив, в котором продолжительность анимаций
    // и задержки выстроены, как надо
    const animations: CubeAnimation[] = [];
    let delay = 0;
    for (let key = 0; key < actions.length; key++) {
        const {
            action,
            duration,
        } = actions[key];

        if (action !== null) {
            animations.push({
                action,
                duration,
                delay,
            });
        }

        // добавляем к задержке следующего действия текущую продолжительность
        delay += duration;
    }

    return animations;
};
