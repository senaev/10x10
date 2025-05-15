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
    for (let key = 0; key < steps.length; key++) {
    // Один шаг анимации
        const step = steps[key];

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
        } else if (step.do === lastAction.action) {
        // Если это такой же шаг, как и предыдущий, увеличиваем его продолжительность
            lastAction.duration++;
        } else {
        // Для каждого действия - по-своему, в том числе в зависимости от предыдущих действий
            if (step.do === 'toSide') {
                lastAction.action = 'toSide';
                lastAction.duration++;

                // Для сортировки попаданий в боковое поле
                toSideTime = key;
            } else {
                actions.push({
                    action: step.do,
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
    const nullToDelayActions = [];
    let delay = 0;
    for (let key1 = 0; key1 < actions.length; key1++) {
        const action = actions[key1] as {
        // MoveAction (st, sb, sl, sr) к этому моменту удалены,
        // поскольку ни одна анимация не заканчивается просто движением,
        // все они преобразуются либо в 'toSide', либо в 'slBump', либо во что-то еще
            action: CubeAnimationName | null;
            duration: PositiveInteger;
            delay?: number;
        };
        // выставляем задержку от начала хода
        action.delay = delay;
        // добавляем к задержке следующего действия текущую продолжительность
        delay += action.duration;
        if (action.action !== null) {
            nullToDelayActions.push(action);
        }
    }

    return {
        animations: nullToDelayActions,
        toSideTime,
    };
};
