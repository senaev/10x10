import { Direction } from '../types/Direction';
import { directionToAnimation } from '../utils/directionToAnimation';

import { Cube } from './Cube';
import { MainMask, __findCubeInMainMask } from './MainMask';

export type MoveAnimation = 'st' | 'sb' | 'sl' | 'sr';

export type AnimationStep = {
    do: 'toSide' | MoveAnimation | 'boom' | null;
};

/**
 * класс для удобной работы с м-кубиком
 * м-кубик представляем из себя абстрактный объек кубика со всеми
 * необходимыми данными для построения карты хода и карты
 * анимации этого хода, м-кубики хранятся в массиве mainMask.arr
 */
export class MCube {
    public x: number;
    public y: number;
    public color: string;
    public direction: Direction | null;
    public mainMask: MainMask;
    public cube: Cube;
    public steps: AnimationStep[];
    public toSideTime: number | undefined;

    public constructor(o: {
        x: number;
        y: number;
        color: string;
        direction: Direction | null;
        mainMask: MainMask;
        cube: Cube;
    }) {
        this.x = o.x;
        this.y = o.y;
        this.color = o.color;
        this.direction = o.direction;
        this.mainMask = o.mainMask;

        // массив шагов анимации для кубика, в м-кубике это просто массив, каждое значение которого -
        // действие кубика последовательно в каждый шаг анимации, может быть полностью заполнен
        // значениями null, более подробная анимация генерируется перебором этих значений в moveMap.createAnimationMap
        this.steps = [];
        this.cube = o.cube;
    }

    // один шаг для м-кубика, возвращает информацию о шаге для анимации
    public oneStep() {
        const step: AnimationStep = { do: null };
        // если м-кубик взорван, он стоит на месте
        if (this.x === -1 && this.y === -1) {
            step.do = null;
        } else {
            // если м-кубик не имеет направления - он стоит на месте
            if (this.direction !== null) {
                // если у м-кубика имеется направление, подсчитываем, где он может оказаться
                const nextPos = {
                    x: this.x,
                    y: this.y,
                };

                if (this.direction === 'top' || this.direction === 'bottom') {
                    if (this.direction === 'top') {
                        nextPos.y--;
                    } else {
                        nextPos.y++;
                    }
                } else {
                    if (this.direction === 'left') {
                        nextPos.x--;
                    } else {
                        nextPos.x++;
                    }
                }

                // если следующая позиция - одно из боковых полей - отправляем кубик туда
                if (nextPos.x < 0 || nextPos.x > 9 || nextPos.y < 0 || nextPos.y > 9) {
                    this.x = nextPos.x;
                    this.y = nextPos.y;
                    this.direction = null;
                    step.do = 'toSide';
                } else {
                    // если нет, идет обращение к коллекции м-кубиков, чтобы узнать, свободна ли следующая клетка
                    if (!__findCubeInMainMask(this.mainMask.arr, nextPos)) {
                        const animation = directionToAnimation(this.direction);
                        // если следующая клетка свободна, задаем значениям позиции кубика значения следующей клетки
                        this.x = nextPos.x;
                        this.y = nextPos.y;
                        step.do = animation;
                    } else {
                        // если клетка занята - кубик стоит на месте
                        step.do = null;
                    }
                }
            } else {
                // если не имеет - стоит на мется
                step.do = null;
            }
        }
        this.steps.push(step);

        // возвращаем значение объекту mainMask, чтобы он знал, что что-то произошло
        return step;
    }
}
