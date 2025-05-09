import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { animateCubesFromSideToMainField } from '../utils/animateCubesFromSideToMainField';

import { Cube } from './Cube';
import { Cubes, CubesMask } from './Cubes';
import { generateMainFieldMoves } from './MainMask';
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

/**
 * Класс для удобной работы с абстрактным классом MainMask.
 * Абстрагирует функции, связанные с анимацией от этого класса.
 * Сочетает в себе как функцию генерации хода, так и генерации анимации.
 * Предоставляет удобный интерфейс для доступа к методам построения хода
 * для основного приложения.
 */
export class MoveMap {
    public readonly movingCubes: MovingCube[];
    public readonly beyondTheSide: Cube[] = [];
    public readonly startCubes: Cube[];
    public readonly toSideActions: MovingCube[] = [];
    public readonly animationsScript: CubeAnimationStep[] = [];

    private readonly cubes: Cubes;
    private readonly animationLength: number;

    public constructor(params: { startCubes: Cube[]; cubes: Cubes; app: TenOnTen }) {
        this.cubes = params.cubes;
        this.startCubes = params.startCubes;

        // создаем класс маски
        this.movingCubes = generateMainFieldMoves({
            startCubes: this.startCubes,
            cubes: this.cubes,
        });

        // массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        this.toSideActions = [];

        // поскольку у каждого кубика одинаковое число шагов анимации, чтобы
        // узнать общую продолжительность анимации, просто берем длину шагов первого попавшегося кубика
        this.animationLength = this.movingCubes[0].steps.length;

        // console.log("////inMainActions:", this.mainMask.arr);

        // проходимся в цикле по всем кубикам
        for (const key in this.movingCubes) {
            const mCube = this.movingCubes[key];
            const steps = mCube.steps;

            // массив с действиями одного кубика
            const actions: CubeAnimation[] = [
                {
                    animation: null,
                    duration: 0,
                },
            ];

            // пробегаемся по массиву шагов анимации
            for (let key1 = 0; key1 < steps.length; key1++) {
                // один шаг анимации
                const step = steps[key1];
                // последний шаг анимации, к которому добавляем продолжительность
                // в случае совпадения со следующим шагом
                const lastAction = actions[actions.length - 1];
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
                        mCube.toSideTime = key1;
                        // заносим м-кубик в массив попадания в боковое поле
                        this.toSideActions.push(mCube);
                        break;
                    case null:
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
                                animation: step.do,
                                duration: 1,
                            });
                        }
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
            if (actions.length === 1 && actions[0].animation === null) {
                actions.shift();
            }

            // console.log(actions);

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
                    cube: this.movingCubes[key].cube,
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
    }: {
        startCubes: Cube[];
        cubesMask: CubesMask;
        animationsScript: CubeAnimationStep[];
    }): Promise<void> {
        animateCubesFromSideToMainField(startCubes, cubesMask);

        // добавляем постоянную стрелку к html-элементу кубика, с которого начинается анимация
        for (const key in startCubes) {
            startCubes[key].$el.addClass(`d${startCubes[key].direction}`);
        }

        // перебираем карту анимации и передаем каждому кубику объект действия,
        // состоящий из переменных: само действие, продолжительность, задержка перед выполнением,
        // далее кубик запускает таймер до выполнения и выполняет нужную анимацию
        for (const key in animationsScript) {
            const cube = animationsScript[key].cube;
            const actions: CubeAnimation[] = animationsScript[key].animations;
            for (const key1 in actions) {
                const action = actions[key1];
                cube.addAnimate(action);
            }
        }

        await promiseTimeout(this.animationLength * ANIMATION_TIME - 1);

        // удаляем ненужные html-элементы
        for (const key in this.beyondTheSide) {
            this.beyondTheSide[key].remove();
        }

    }
}
