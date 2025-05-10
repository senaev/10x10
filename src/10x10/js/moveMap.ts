import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { animateCubesFromSideToMainField } from '../utils/animateCubesFromSideToMainField';
import { directionToAnimation } from '../utils/directionToAnimation';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { prepareMovingCubes } from '../utils/prepareMovingCubes';

import { Cube } from './Cube';
import { CubesMask } from './Cubes';
import { MovingCube } from './MovingCube';
import { TenOnTen } from './TenOnTen';

export type CubeAnimation = {
    animation: string | null;
    duration: number;
    delay?: number;
};

export type CubeAnimationStep = {
    animations: CubeAnimation[];
    cube: Cube;
};

export type CubeToMove = {
    isFromSide: boolean;
    original: Cube;
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
    public readonly beyondTheSide: Cube[] = [];
    public readonly startCubes: Cube[];
    public readonly toSideActions: MovingCube[] = [];
    public readonly animationsScript: CubeAnimationStep[] = [];

    public readonly cubesMove: CubesMove;

    public constructor(params: { startCubes: Cube[]; mainFieldCubes: Cube[]; app: TenOnTen }) {
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

            // массив с действиями одного кубика
            const actions: CubeAnimation[] = [
                {
                    animation: null,
                    duration: 0,
                },
            ];

            // пробегаемся по массиву шагов анимации
            for (let key = 0; key < steps.length; key++) {
                // один шаг анимации
                const step = steps[key];
                // последний шаг анимации, к которому добавляем продолжительность
                // в случае совпадения со следующим шагом
                const lastAction = actions[actions.length - 1];

                if (step === null) {
                    if ([
                        'st',
                        'sr',
                        'sl',
                        'sb',
                    ].indexOf(lastAction.animation!) > -1) {
                        lastAction.animation = `${lastAction.animation}Bump`;
                        lastAction.duration++;
                    } else {
                        actions.push({
                            animation: null,
                            duration: 1,
                        });
                    }
                } else {

                    // если это такой же шаг, как и предыдущий
                    if (step.do === lastAction.animation) {
                    // иначе просто увеличиваем продолжительность предыдущего
                        lastAction.duration++;
                    } else {
                    // для каждого действия - по-своему, в том числе в зависимости от предыдущих действий
                        switch (step.do) {
                        case 'toSide':
                            lastAction.animation = 'toSide';
                            lastAction.duration++;
                            // для сортировки попаданий в боковое поле
                            moving.toSideTime = key;
                            // заносим м-кубик в массив попадания в боковое поле
                            this.toSideActions.push(moving);
                            break;
                        default:
                            actions.push({
                                animation: step.do,
                                duration: 1,
                            });
                            break;
                        }
                    }
                }

            }
            if (actions.length === 1 && actions[0].animation === null) {
                actions.shift();
            }

            // подтягиваем задержки
            if (actions.length !== 0) {
                // итоговый массив, в котором продолжительность анимаций
                // и задержки выстроены, как надо
                const nullToDelayActions = [];
                let delay = 0;
                for (let key1 = 0; key1 < actions.length; key1++) {
                    const action: CubeAnimation = actions[key1];
                    // выставляем задержку от начала хода
                    action.delay = delay;
                    // добавляем к задержке следующего действия текущую продолжительность
                    delay += action.duration;
                    if (action.animation !== null) {
                        nullToDelayActions.push(action);
                    }
                }

                this.animationsScript.push({
                    animations: nullToDelayActions,
                    cube: original,
                });
            }
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
        startCubes: Cube[];
        cubesMask: CubesMask;
        animationsScript: CubeAnimationStep[];
        animationLength: UnsignedInteger;
        beyondTheSide: Cube[];
    }): Promise<void> {
        animateCubesFromSideToMainField(startCubes, cubesMask);

        // добавляем постоянную стрелку к html-элементу кубика, с которого начинается анимация
        for (const key in startCubes) {
            startCubes[key].$el.addClass(`d${startCubes[key].direction}`);
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
            cube.remove();
        }
    }
}
