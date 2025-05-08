import { ANIMATION_TIME } from '../const/ANIMATION_TIME';

import { Cube } from './Cube';
import { Cubes } from './Cubes';
import { MainMask } from './MainMask';
import { MCube } from './MCube';
import { TenOnTen } from './TenOnTen';

export type Action = {
    action: string | null;
    duration: number;
    delay?: number;
};

/**
 * класс для удобной работы с абстрактным классом MainMask
 * абстрагирует функции, связанные с анимацией от этого класса
 * сочетает в себе как функцию генерации хода, так и генерации анимации
 * предоставляет удобный интерфейс для доступа к методам построения хода
 * для основного приложения
 */
export class MoveMap {
    public readonly mainMask: MainMask;
    public readonly beyondTheSide: Cube[] = [];
    public readonly startCubes: Cube[];
    public readonly toSideActions: MCube[] = [];

    private readonly animationMap: {
        actions: Action[];
        cube: Cube;
    }[] = [];
    private readonly app: TenOnTen;
    private readonly cubes: Cubes;
    private readonly animationLength: number;

    public constructor(params: { startCubes: Cube[]; cubes: Cubes; app: TenOnTen }) {
        this.cubes = params.cubes;
        this.startCubes = params.startCubes;

        this.app = params.app;

        // создаем класс маски
        this.mainMask = new MainMask({
            startCubes: this.startCubes,
            cubes: this.cubes,
        });

        // массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        this.toSideActions = [];

        // поскольку у каждого кубика одинаковое число шагов анимации, чтобы
        // узнать общую продолжительность анимации, просто берем длину шагов первого попавшегося кубика
        this.animationLength = this.mainMask.arr[0].steps.length;

        // console.log("////inMainActions:", this.mainMask.arr);

        // проходимся в цикле по всем кубикам
        for (const key in this.mainMask.arr) {
            const mCube = this.mainMask.arr[key];
            const steps = mCube.steps;

            // массив с действиями одного кубика
            const actions: Action[] = [
                {
                    action: null,
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
                // если это такой же шаг, как и предидущий
                if (step.do === lastAction.action) {
                    // иначе просто увеличиваем продолжительность предидущего
                    lastAction.duration++;
                } else {
                    // для каждого действия - по-своему, в том числе в зависимости от предидущих действий
                    switch (step.do) {
                    case 'toSide':
                        lastAction.action = 'toSide';
                        lastAction.duration++;
                        // для сортиравки попаданий в боковое поле
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
                        ].indexOf(lastAction.action!) > -1) {
                            lastAction.action = lastAction.action + 'Bump';
                            lastAction.duration++;
                        } else {
                            actions.push({
                                action: step.do,
                                duration: 1,
                            });
                        }
                        break;
                    default:
                        actions.push({
                            action: step.do,
                            duration: 1,
                        });
                        break;
                    }
                }
            }
            if (actions.length === 1 && actions[0].action === null) {
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
                    const action: Action = actions[key1];
                    // выставляем задержку от начала хода
                    action.delay = delay;
                    // добавляем к задержке следующего действия текущую продолжительность
                    delay += action.duration;
                    if (action.action !== null) {
                        nullToDelayActions.push(action);
                    }
                }
                this.animationMap.push({
                    actions: nullToDelayActions,
                    cube: this.mainMask.arr[key].cube,
                });
            }
        }
        // сортируем попавшие в боковое поле м-кубики по времени попадания
        this.toSideActions.sort(function (a, b) {
            return a.toSideTime! - b.toSideTime!;
        });
    }

    // когда ход прощитан, запускаем саму анимацию
    public animate() {
        const startCubes = this.startCubes;

        // блокируем приложение от начала до конца анимации
        // минус один - потому, что в последний такт обычно анимация чисто символическая
        this.app.blockApp = true;
        setTimeout(
            (app) => {
                app.blockApp = false;

                // удаляем ненужные html-элементы
                for (const key in this.beyondTheSide) {
                    this.beyondTheSide[key].remove();
                }

                // разблокируем кнопку назад, если не случился переход на новый уровень
                // иначе - блокируем
                if (app.end === 'next_level') {
                    app.undoButton._set({
                        active: true,
                        func: app.refresh,
                        caption: app.word('refresh'),
                    });
                } else {
                    app.undoButton._set({
                        active: true,
                        func: app.undo,
                        caption: app.word('undo'),
                    });
                }

                if (app.end !== null) {
                    switch (app.end) {
                    case 'next_level':
                        app.nextLevel();
                        break;
                    case 'game_over':

                        alert('game over');
                        break;
                    default:
                        throw new Error('Неверное значение в app.end: ' + app.end);
                    }
                }
            },
            this.animationLength * ANIMATION_TIME - 1,
            this.app
        );

        this.cubes.animate({
            action: 'fromLine',
            cube: startCubes,
        });

        // добавляем постоянную стрелку к html-элементу кубика, с которого начинается анимация
        for (const key in startCubes) {
            startCubes[key].$el.addClass('d' + startCubes[key].direction);
        }

        // перебираем карту анимации и передаем каждому кубику объект действия,
        // состоящий из переменных: само действие, продолжительность, задержка перед выполнением,
        // далее кубик запускает таймер до выполнения и выполняет нужную анимацию
        const map = this.animationMap;
        for (const key in map) {
            const cube = map[key].cube;
            const actions: Action[] = map[key].actions;
            for (const key1 in actions) {
                const action = actions[key1];
                cube.addAnimate(action);
            }
        }
    }
}
