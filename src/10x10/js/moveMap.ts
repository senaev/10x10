import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { MOVE_ACTION_TO_MOVE_ANIMATION_MAP } from '../const/MOVE_ACTION_TO_MOVE_ANIMATION_MAP';
import { animateCubesFromSideToMainField } from '../utils/animateCubesFromSideToMainField';
import { directionToAnimation } from '../utils/directionToAnimation';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { prepareMovingCubes } from '../utils/prepareMovingCubes';

import { SideCubesMask } from './Cubes';
import { MoveAction, MovingCube } from './MovingCube';
import { TenOnTen } from './TenOnTen';

// {"steps":[null,null,null,null,null,null,null,null,null,null,null,{"do":"sb"},null,null,null,null,null,null,null,{"do":"sb"},{"do":"sb"},{"do":"sb"},{"do":"sb"},{"do":"toSide"},null]}
// {"actions":[{"action":null,"duration":0,"delay":0},{"action":null,"duration":1,"delay":0},{"action":null,"duration":1,"delay":1},{"action":null,"duration":1,"delay":2},{"action":null,"duration":1,"delay":3},{"action":null,"duration":1,"delay":4},{"action":null,"duration":1,"delay":5},{"action":null,"duration":1,"delay":6},{"action":null,"duration":1,"delay":7},{"action":null,"duration":1,"delay":8},{"action":null,"duration":1,"delay":9},{"action":null,"duration":1,"delay":10},{"action":"sbBump","duration":2,"delay":11},{"action":null,"duration":1,"delay":13},{"action":null,"duration":1,"delay":14},{"action":null,"duration":1,"delay":15},{"action":null,"duration":1,"delay":16},{"action":null,"duration":1,"delay":17},{"action":null,"duration":1,"delay":18},{"action":"toSide","duration":5,"delay":19},{"action":null,"duration":1,"delay":24}]}
// {"nullToDelayActions":[{"action":"sbBump","duration":2,"delay":11},{"action":"toSide","duration":5,"delay":19}]}

// {"steps":[{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},null,null,null,{"do":"sl"},{"do":"sl"},null,null,{"do":"sl"},{"do":"toSide"},null,null,null,null,null,null,null,null,null]}
// {"actions":[{"action":null,"duration":0,"delay":0},{"action":"slBump","duration":8,"delay":0},{"action":null,"duration":1,"delay":8},{"action":null,"duration":1,"delay":9},{"action":"slBump","duration":3,"delay":10},{"action":null,"duration":1,"delay":13},{"action":"toSide","duration":2,"delay":14},{"action":null,"duration":1,"delay":16},{"action":null,"duration":1,"delay":17},{"action":null,"duration":1,"delay":18},{"action":null,"duration":1,"delay":19},{"action":null,"duration":1,"delay":20},{"action":null,"duration":1,"delay":21},{"action":null,"duration":1,"delay":22},{"action":null,"duration":1,"delay":23},{"action":null,"duration":1,"delay":24}]}
// {"nullToDelayActions":[{"action":"slBump","duration":8,"delay":0},{"action":"slBump","duration":3,"delay":10},{"action":"toSide","duration":2,"delay":14}]}

// {"steps":[null,null,null,null,null,null,null,null,null,null,{"do":"sb"},{"do":"toSide"},null,null,null,null,null,null,null,null,null,null,null,null,null]}
// {"actions":[{"action":null,"duration":0,"delay":0},{"action":null,"duration":1,"delay":0},{"action":null,"duration":1,"delay":1},{"action":null,"duration":1,"delay":2},{"action":null,"duration":1,"delay":3},{"action":null,"duration":1,"delay":4},{"action":null,"duration":1,"delay":5},{"action":null,"duration":1,"delay":6},{"action":null,"duration":1,"delay":7},{"action":null,"duration":1,"delay":8},{"action":null,"duration":1,"delay":9},{"action":"toSide","duration":2,"delay":10},{"action":null,"duration":1,"delay":12},{"action":null,"duration":1,"delay":13},{"action":null,"duration":1,"delay":14},{"action":null,"duration":1,"delay":15},{"action":null,"duration":1,"delay":16},{"action":null,"duration":1,"delay":17},{"action":null,"duration":1,"delay":18},{"action":null,"duration":1,"delay":19},{"action":null,"duration":1,"delay":20},{"action":null,"duration":1,"delay":21},{"action":null,"duration":1,"delay":22},{"action":null,"duration":1,"delay":23},{"action":null,"duration":1,"delay":24}]}
// {"nullToDelayActions":[{"action":"toSide","duration":2,"delay":10}]}

// {"steps":[{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},{"do":"sl"},null,{"do":"boom"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}
// {"actions":[{"action":null,"duration":0,"delay":0},{"action":"slBump","duration":8,"delay":0},{"action":"boom","duration":1,"delay":8},{"action":null,"duration":1,"delay":9},{"action":null,"duration":1,"delay":10},{"action":null,"duration":1,"delay":11},{"action":null,"duration":1,"delay":12},{"action":null,"duration":1,"delay":13},{"action":null,"duration":1,"delay":14},{"action":null,"duration":1,"delay":15},{"action":null,"duration":1,"delay":16},{"action":null,"duration":1,"delay":17},{"action":null,"duration":1,"delay":18},{"action":null,"duration":1,"delay":19},{"action":null,"duration":1,"delay":20},{"action":null,"duration":1,"delay":21},{"action":null,"duration":1,"delay":22},{"action":null,"duration":1,"delay":23},{"action":null,"duration":1,"delay":24}]}
// {"nullToDelayActions":[{"action":"slBump","duration":8,"delay":0},{"action":"boom","duration":1,"delay":8}]}

// {"steps":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}
// {"actions":[{"action":null,"duration":0,"delay":0},{"action":null,"duration":1,"delay":0},{"action":null,"duration":1,"delay":1},{"action":null,"duration":1,"delay":2},{"action":null,"duration":1,"delay":3},{"action":null,"duration":1,"delay":4},{"action":null,"duration":1,"delay":5},{"action":null,"duration":1,"delay":6},{"action":null,"duration":1,"delay":7},{"action":null,"duration":1,"delay":8},{"action":null,"duration":1,"delay":9},{"action":null,"duration":1,"delay":10},{"action":null,"duration":1,"delay":11},{"action":null,"duration":1,"delay":12},{"action":null,"duration":1,"delay":13},{"action":null,"duration":1,"delay":14},{"action":null,"duration":1,"delay":15},{"action":null,"duration":1,"delay":16},{"action":null,"duration":1,"delay":17},{"action":null,"duration":1,"delay":18},{"action":null,"duration":1,"delay":19},{"action":null,"duration":1,"delay":20},{"action":null,"duration":1,"delay":21},{"action":null,"duration":1,"delay":22},{"action":null,"duration":1,"delay":23},{"action":null,"duration":1,"delay":24}]}
// {"nullToDelayActions":[]}

export type CubeAnimation = {
    action: CubeAnimationName | null;
    duration: PositiveInteger;
    delay?: number;
};

export type CubeAnimationStep = {
    animations: CubeAnimation[];
    cube: CubeView;
};

export type CubeToMove = {
    isFromSide: boolean;
    original: CubeView;
    moving: MovingCube;
};

export type CubesMove = {
    cubesToMove: CubeToMove[];
};

/**
 * Класс для удобной работы с абстрактным классом MainMask.
 * Абстрагирует функции, связанные с анимацией от этого класса.
 * Сочетает в себе как функцию генерации хода, так и генерации анимации.
 * Предоставляет удобный интерфейс для доступа к методам построения хода
 * для основного приложения.
 */
export class MoveMap {
    public readonly beyondTheSide: CubeView[] = [];
    public readonly startCubes: CubeView[];
    public readonly toSideActions: MovingCube[] = [];
    public readonly animationsScript: CubeAnimationStep[] = [];

    public readonly cubesMove: CubesMove;

    public constructor(params: { startCubes: CubeView[]; mainFieldCubes: CubeView[]; app: TenOnTen }) {
        const mainFieldCubes = params.mainFieldCubes;

        const startCubes = params.startCubes;
        this.startCubes = startCubes;

        this.cubesMove = prepareMovingCubes({
            startCubes,
            mainFieldCubes,
        });

        const { cubesToMove } = this.cubesMove;

        // добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
        callTimes(startCubes.length, () => {
            cubesToMove.forEach(({ isFromSide, moving }) => {
                if (isFromSide) {
                    const { direction } = moving;

                    assertNonEmptyString(direction);

                    moving.steps.push({
                        do: directionToAnimation(direction),
                    });
                } else {
                    moving.steps.push(null);
                }
            });
        });

        generateMoveSteps(cubesToMove.map(({ moving }) => moving));

        // массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        this.toSideActions = [];

        // проходимся в цикле по всем кубикам
        for (const { original, moving } of cubesToMove) {
            const steps = moving.steps;
            if (original.element.xxx) {
                console.log({ steps });
            }

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
                        moving.toSideTime = key;
                        // Заносим м-кубик в массив попадания в боковое поле
                        this.toSideActions.push(moving);
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

            if (original.element.xxx) {
                console.log({ actions });
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

            if (original.element.xxx) {
                console.log({ nullToDelayActions });
            }
            this.animationsScript.push({
                animations: nullToDelayActions,
                cube: original,
            });
        }

        // сортируем попавшие в боковое поле м-кубики по времени попадания
        this.toSideActions.sort(function (a, b) {
            return a.toSideTime! - b.toSideTime!;
        });
    }

    // когда ход просчитан, запускаем саму анимацию
    public async animate({
        startCubes,
        cubesMask,
        animationsScript,
        animationLength,
        beyondTheSide,
    }: {
        startCubes: CubeView[];
        cubesMask: SideCubesMask;
        animationsScript: CubeAnimationStep[];
        animationLength: UnsignedInteger;
        beyondTheSide: CubeView[];
    }): Promise<void> {
        animateCubesFromSideToMainField(startCubes, cubesMask);

        // добавляем постоянную стрелку к html-элементу кубика, с которого начинается анимация
        for (const key in startCubes) {
            startCubes[key].element.classList.add(`d${startCubes[key].direction.value()}`);
        }

        // перебираем карту анимации и передаем каждому кубику объект действия,
        // состоящий из переменных: само действие, продолжительность, задержка перед выполнением,
        // далее кубик запускает таймер до выполнения и выполняет нужную анимацию
        for (const { cube, animations } of animationsScript) {
            for (const animation of animations) {
                cube.addAnimate(animation);
            }
        }

        await promiseTimeout(animationLength * ANIMATION_TIME - 1);

        // удаляем ненужные html-элементы
        for (const cube of beyondTheSide) {
            cube.removeElementFromDOM();
        }
    }
}
