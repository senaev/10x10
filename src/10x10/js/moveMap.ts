import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { animateCubesFromSideToMainField } from '../utils/animateCubesFromSideToMainField';
import { directionToAnimation } from '../utils/directionToAnimation';
import { generateMoveStep } from '../utils/generateMoveStep';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';

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

// export type CubesMove = {
//     cubesToMove: {
//         original: Cube;
//         moving: MovingCube;
//     }[];
// };

// function createMovingCubes(cubesMove: { startCubes: Cube[]; cubes: Cubes; }): CubesMove {
//     const { cubesToMove } = cubesMove;

//     return {

//     };
// }

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

    private readonly movingCubes: MovingCube[];
    private readonly animationLength: number;

    public constructor(params: { startCubes: Cube[]; mainFieldCubes: Cube[]; app: TenOnTen }) {
        const mainFieldCubes = params.mainFieldCubes;

        const startCubes = params.startCubes;
        this.startCubes = startCubes;

        const mainFieldCubesSorted = [...mainFieldCubes]
            .sort((a, b) => a.toMineOrder! - b.toMineOrder!);

        // Основной массив со значениями
        // Сюда будут попадать м-кубики, участвующие в анимации
        const movingCubesInMainField: MovingCube[] = [];

        // создаем массив из всех кубиков, которые есть на доске
        mainFieldCubesSorted.forEach((cube) => {
            movingCubesInMainField.push(new MovingCube({
                x: cube.x,
                y: cube.y,
                color: cube.color,
                direction: cube.direction,
                movingCubes: movingCubesInMainField,
                cube,
            }));
        });

        // добавляем в маску кубик, с которого начинаем анимацию
        // кубики сразу добавляем на главное поле для расчетов движения
        const startMovingCubes: MovingCube[] = [];
        startCubes.forEach((startCube, i) => {
            startCube.toMineOrder = getIncrementalIntegerForMainFieldOrder();

            let startMovingCubeX;
            let startMovingCubeY;
            if (startCube.field === 'top' || startCube.field === 'bottom') {
                startMovingCubeX = startCube.x;
                if (startCube.field === 'top') {
                    startMovingCubeY = startCubes.length - i - 1;
                } else {
                    startMovingCubeY = BOARD_SIZE - startCubes.length + i;
                }
            } else {
                if (startCube.field === 'left') {
                    startMovingCubeX = startCubes.length - i - 1;
                } else {
                    startMovingCubeX = BOARD_SIZE - startCubes.length + i;
                }
                startMovingCubeY = startCube.y;
            }

            const startMCube = new MovingCube({
                x: startMovingCubeX,
                y: startMovingCubeY,
                color: startCube.color,
                direction: startCube.direction,
                movingCubes: movingCubesInMainField,
                cube: startCube,
            });
            startMovingCubes.push(startMCube);
        });

        // добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
        callTimes(startMovingCubes.length, () => {
            movingCubesInMainField.forEach((movingCube) => {
                movingCube.steps.push({ do: null });
            });

            startMovingCubes.forEach((movingCube) => {
                const { direction } = movingCube;

                assertNonEmptyString(direction);

                movingCube.steps.push({
                    do: directionToAnimation(direction),
                });
            });
        });

        const allCubes = [
            ...startCubes,
            ...mainFieldCubesSorted,
        ];
        const allMovingCubes = [
            ...startMovingCubes,
            ...movingCubesInMainField,
        ];
        generateMoveStep(allMovingCubes);

        this.movingCubes = allMovingCubes;

        // массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        this.toSideActions = [];

        // поскольку у каждого кубика одинаковое число шагов анимации, чтобы
        // узнать общую продолжительность анимации, просто берем длину шагов первого попавшегося кубика
        this.animationLength = allMovingCubes[0].steps.length;

        // проходимся в цикле по всем кубикам
        for (const key in allMovingCubes) {
            const cube = allCubes[key];
            const movingCube = allMovingCubes[key];
            const steps = movingCube.steps;

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
                        movingCube.toSideTime = key1;
                        // заносим м-кубик в массив попадания в боковое поле
                        this.toSideActions.push(movingCube);
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
                    cube,
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
