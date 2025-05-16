import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';

import { CubeAnimationName } from '../../components/CubeView';
import { MOVE_ACTION_TO_MOVE_ANIMATION_MAP } from '../../const/MOVE_ACTION_TO_MOVE_ANIMATION_MAP';
import { CubeAnimation } from '../../js/MoveMap';
import { ActionStep, MoveAction } from '../../js/MovingCube';

export function stepsToAnimations(steps: ActionStep[]): {
    animations: CubeAnimation[];
    toSideTime: number | undefined;
} {
    let toSideTime: number | undefined;
    // массив с действиями одного кубика
    const actions: {
        action: CubeAnimationName | MoveAction | null;
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
            const moveAnimation = MOVE_ACTION_TO_MOVE_ANIMATION_MAP[lastAction.action! as keyof typeof MOVE_ACTION_TO_MOVE_ANIMATION_MAP];

            if (moveAnimation) {
                lastAction.action = moveAnimation;
                lastAction.duration++;
            } else {
                actions.push({
                    action: null,
                    duration: 1,
                });
            }
        } else if (step === lastAction.action) {
        // Если это такой же шаг, как и предыдущий, увеличиваем его продолжительность
            lastAction.duration++;
        } else {
        // Для каждого действия - по-своему, в том числе в зависимости от предыдущих действий
            if (step === 'toSide') {
                lastAction.action = 'toSide';
                lastAction.duration++;

                // Для сортировки попаданий в боковое поле
                toSideTime = time;
            } else {
                actions.push({
                    action: step,
                    duration: 1,
                });
            }
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
    const nullToDelayActions: CubeAnimation[] = [];
    let delay = 0;
    for (let key = 0; key < actions.length; key++) {
        const {
            action,
            duration,
        } = actions[key];

        if (action === 'sb' || action === 'sl' || action === 'sr' || action === 'st') {
            throw new Error('one move action should be removed during animation creation');
        }

        if (action !== null) {
            nullToDelayActions.push({
                action,
                duration,
                delay,
            });
        }

        // добавляем к задержке следующего действия текущую продолжительность
        delay += duration;
    }

    return {
        animations: nullToDelayActions,
        toSideTime,
    };
};
