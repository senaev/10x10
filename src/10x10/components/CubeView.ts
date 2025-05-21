import $ from 'jquery';
import { combineSignalsIntoNewOne } from 'senaev-utils/src/utils/Signal/combineSignalsIntoNewOne/combineSignalsIntoNewOne';
import { Signal } from 'senaev-utils/src/utils/Signal/Signal';
import { subscribeSignalAndCallWithCurrentValue } from 'senaev-utils/src/utils/Signal/subscribeSignalAndCallWithCurrentValue/subscribeSignalAndCallWithCurrentValue';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { animateCubeMovement } from '../animations/animateCubeMovement';
import { animateElementPivotWithChange, PivotAnimationType } from '../animations/animateElementPivotWithChange';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { CUBE_COLORS, CubeColor } from '../const/CUBE_COLORS';
import {
    Direction, DIRECTION_TO_ARROW_ROTATE, DIRECTIONS,
} from '../const/DIRECTIONS';
import { Field } from '../const/FIELDS';
import arrowSvg from '../img/arrow.svg';
import { CubeAnimation } from '../js/createMoveMap';
import { TenOnTen } from '../js/TenOnTen';
import { reverseDirection } from '../utils/reverseDirection';

export type CubeAnimations = {
    right: {};
    left: {};
    top: {};
    bottom: {};
    nearer: {};
    further: {};
    boom: {};
    remove: {};
};

export type CubeAnimationName = keyof CubeAnimations;

export type CubeAnimateAction = {
    animation: CubeAnimationName;
    steps: number;
};

export type Transition = Partial<{
    duration: number;
    easing: string;
    scale: [number, number] | number;
    rotate3d: string;
    rotateX: string;
    rotateY: string;
    left: string;
    top: string;
}>;

export class CubeView {
    public readonly direction = new Signal<Direction | null>(null);
    public readonly element: HTMLElement;
    public readonly field: Signal<Field>;
    public readonly color: Signal<CubeColor>;
    public readonly readyToMove: Signal<boolean> = new Signal(false);
    private readonly container: HTMLElement;

    private readonly app: TenOnTen;

    public constructor(params: {
        // ❗️ remove
        field: Field;
        app: TenOnTen;
        direction: Direction| null;
        color: CubeColor;
        container: HTMLElement;
        onClick: (cube: CubeView) => void;
        onHover: (cube: CubeView, isHovered: boolean) => void;
    }) {
        this.container = params.container;

        this.field = new Signal<Field>(params.field);
        // Указатель на игру, к которой кубик привязан
        this.app = params.app;

        // Указатель на DOM-элемент кубика с прослушиванием событий
        this.element = document.createElement('div');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.element as any).cube = this;

        const visualCubeElement = document.createElement('div');
        visualCubeElement.classList.add('visualCube');

        const arrowElement = document.createElement('img');
        arrowElement.classList.add('arrowImage');
        arrowElement.src = arrowSvg;
        visualCubeElement.appendChild(arrowElement);

        const { signal: cubeVisualDirection } = combineSignalsIntoNewOne([
            this.direction,
            this.field,
            this.readyToMove,
        ], (direction, field, readyToMove) => {
            if (readyToMove) {
                return direction;
            }

            if (field === 'main') {
                return direction;
            }

            return null;
        });

        subscribeSignalAndCallWithCurrentValue(cubeVisualDirection, (direction) => {
            if (direction) {
                arrowElement.style.display = 'block';
                arrowElement.style.transform = `rotate(${DIRECTION_TO_ARROW_ROTATE[direction]}deg)`;
            } else {
                arrowElement.style.display = 'none';
            }
        });

        this.direction.subscribe((direction) => {
            if (direction) {
                visualCubeElement.classList.add(`direction_${direction}`);
            } else {
                DIRECTIONS.forEach((dir) => {
                    visualCubeElement.classList.remove(`direction_${dir}`);
                });
            }
        });

        // Направление движения
        if (params.direction) {
            this.direction.next(params.direction);
        } else {
            const field = this.field.value();

            if (field !== 'main') {
                this.direction.next(reverseDirection(field));
            }
        }

        this.color = new Signal<CubeColor>(params.color);
        subscribeSignalAndCallWithCurrentValue(this.color, (color) => {
            visualCubeElement.style.backgroundColor = CUBE_COLORS[color];
        });

        this.element.classList.add('cube');

        this.element.appendChild(visualCubeElement);

        this.element.addEventListener('mouseover', () => {
            params.onHover(this, true);
        });
        this.element.addEventListener('mouseout', () => {
            params.onHover(this, false);
        });

        this.element.addEventListener('mousedown', () => {
            params.onClick(this);
        });

        this.container.appendChild(this.element);
    }

    public setReadyToMove(readyToMove: boolean) {
        this.readyToMove.next(readyToMove);
    }

    public performIHavePawsAnimation() {
        const scale = this.field.value() === 'left' || this.field.value() === 'right'
            ? [
                0.8,
                1.2,
            ]
            : [
                1.2,
                0.8,
            ];

        $(this.element)
            .transition({
                scale,
                duration: ANIMATION_TIME,
            })
            .transition({
                scale: 1,
                duration: ANIMATION_TIME,
            });
    }

    // добавляем объект анимации на обработку через время, полученное в атрибутах
    public async addAnimate({
        action,
        delay,
        duration,
    }: CubeAnimation) {
        await promiseTimeout(delay * ANIMATION_TIME);

        this.animate({
            animation: action as CubeAnimationName,
            steps: duration,
        });
    }

    // Добавляем объект анимации на обработку через время, полученное в атрибутах
    public removeElementFromDOM() {
        this.element.remove();
    }

    // Сама функция анимации - в зависимости од переданного значения, выполняем те или иные
    // преобразования html-элемента кубика
    public async animate({ animation: action, steps }: CubeAnimateAction): Promise<void> {
        const field = this.field.value();

        const nearer = async () => {
            await animateCubeMovement({
                element: this.element,
                isVertical: field === 'top' || field === 'bottom',
                distance: (field === 'top' || field === 'left') ? steps : -steps,
            });
        };

        const further = async () => {
            await animateCubeMovement({
                element: this.element,
                isVertical: field === 'top' || field === 'bottom',
                distance: (field === 'top' || field === 'left') ? -steps : steps,
            });
        };

        const boom = async () => {
            // console.log("boom:",cube.color, cube.x, cube.y);
            $(this.element).transition(
                {
                    scale: 1.5,
                    opacity: 0,
                    duration: ANIMATION_TIME,
                    easing: 'out',
                },
                () => {
                    this.removeElementFromDOM();
                }
            );

            await promiseTimeout(ANIMATION_TIME);
        };

        switch (action) {
        // Движение вправо со столкновением
        case 'right':
            await animateCubeMovement({
                element: this.element,
                isVertical: false,
                distance: steps,
            });
            break;
            // Движение вниз со столкновением
        case 'bottom':
            await animateCubeMovement({
                element: this.element,
                isVertical: true,
                distance: steps,
            });
            break;
            // Движение влево со столкновением
        case 'left':
            await animateCubeMovement({
                element: this.element,
                isVertical: false,
                distance: - steps,
            });
            break;
            // Движение вверх со столкновением
        case 'top':
            await animateCubeMovement({
                element: this.element,
                isVertical: true,
                distance: - steps,
            });
            break;
            // Передвигаем кубик в боковом поле ближе к mainField
        case 'nearer':
            await nearer();
            break;
            // Передвигаем кубик в боковой панели дальше от mainField
        case 'further':
            await further();
            break;
            // Передвигаем кубик в боковой панели дальше от mainField
        case 'boom':
            await boom();
            break;
            // Уменьшаем и в конце удаляем
        case 'remove':
            $(this.element)
                .transition(
                    {
                        scale: 0,
                        opacity: 0,
                        duration: steps * ANIMATION_TIME,
                        easing: 'out',
                    },
                    () => {
                        this.removeElementFromDOM();
                    }
                );
            await promiseTimeout(steps * ANIMATION_TIME);
            break;
        default:
            throw new Error(`Неизвестная анимация: ${action}`);
        }
    }

    // Меняем параметры кубика, при этом его анимируем
    public changeColor(color: CubeColor): void {
        const field = this.field.value();

        const animationDuration = ANIMATION_TIME * 8;

        const transformType: PivotAnimationType = field === 'main'
            ? 'rotate3d'
            : (field === 'top' || field === 'bottom')
                ? 'rotateX'
                : 'rotateY';

        animateElementPivotWithChange({
            element: this.element,
            duration: animationDuration,
            transformType,
            onHalfAnimationCallback: () => {
                this.color.next(color);
            },
        });

    }
}
