import $ from 'jquery';
import { assertUnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { Signal } from 'senaev-utils/src/utils/Signal/Signal';
import { combineSignalsIntoNewOne } from 'senaev-utils/src/utils/Signal/combineSignalsIntoNewOne/combineSignalsIntoNewOne';
import { subscribeSignalAndCallWithCurrentValue } from 'senaev-utils/src/utils/Signal/subscribeSignalAndCallWithCurrentValue/subscribeSignalAndCallWithCurrentValue';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';
import { animateCubeMovement } from '../animations/animateCubeMovement';
import { animateCubeMovementWithBump } from '../animations/animateCubeMovementWithBump';
import { animateElementPivotWithChange, PivotAnimationType } from '../animations/animateElementPivotWithChange';
import { appearCubeFromZeroSizePoint } from '../animations/appearCubeFromZeroSizePoint';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_COLORS, CubeColor } from '../const/CUBE_COLORS';
import {
    Direction, DIRECTION_TO_ARROW_ROTATE, DIRECTIONS,
} from '../const/DIRECTIONS';
import { Field } from '../const/FIELDS';
import arrowSvg from '../img/arrow.svg';
import { CubeAnimation } from '../js/MoveMap';
import { TenOnTen } from '../js/TenOnTen';
import { animateMovingCubesFromMainFieldToSide } from '../utils/animateMovingCubesFromMainFieldToSide';
import { bezier } from '../utils/bezier';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { reverseDirection } from '../utils/reverseDirection';
import { setCubeViewPositionOnTheField } from '../utils/setCubeViewPositionOnTheField';

export type CubeAnimations = {
    srBump: {};
    sbBump: {};
    slBump: {};
    stBump: {};
    toSide: {};
    nearer: {};
    appearanceInSide: {};
    disappearanceInSide: {};
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
    public x: number;
    public y: number;
    public toMineOrder: number | null;
    private readonly container: HTMLElement;

    private readonly app: TenOnTen;
    private appearWithAnimation: boolean;

    public constructor(params: {
        x: number;
        y: number;
        appearWithAnimation: boolean;
        toMineOrder: number | null;
        field: Field;
        app: TenOnTen;
        direction: Direction| null;
        color: CubeColor;
        container: HTMLElement;
        onClick: (cube: CubeView) => void;
        onHover: (cube: CubeView, isHovered: boolean) => void;
    }) {
        this.x = params.x;
        this.y = params.y;
        this.container = params.container;
        this.appearWithAnimation = params.appearWithAnimation;

        // Время попадания в главное поле
        this.toMineOrder = params.toMineOrder;

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
            this.direction.next(reverseDirection(this.field.value()));
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

        // Время попадания в поле майн
        if (this.field.value() === 'main') {
            this.toMineOrder = getIncrementalIntegerForMainFieldOrder();
        }

        if (this.appearWithAnimation) {
            $(this.element)
                .css({ scale: 0 })
                .appendTo(this.container)
                .transition({
                    scale: 1,
                    duration: ANIMATION_TIME * 10,
                });
            this.appearWithAnimation = false;
        } else {
            this.container.appendChild(this.element);
        }
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
    public addAnimate({
        action,
        delay,
        duration,
    }: CubeAnimation) {
        assertUnsignedInteger(delay);
        assertUnsignedInteger(duration);

        setTimeout(
            () => {
                this.animate({
                    animation: action as CubeAnimationName,
                    steps: duration,
                });
            },
            (delay ?? 0) * ANIMATION_TIME
        );
    }

    // Добавляем объект анимации на обработку через время, полученное в атрибутах
    public removeElementFromDOM() {
        this.element.remove();
    }

    // Сама функция анимации - в зависимости од переданного значения, выполняем те или иные
    // преобразования html-элемента кубика
    public animate({ animation: action, steps }: CubeAnimateAction) {
        const field = this.field.value();

        /*
        * движение в боковую панель без разрывов анимации,
        * чтобы сохранить максимальную плавность анимации, делать
        * одним перемещением по возможности
        */
        const slideToSide = async (prop: 'left' | 'top', sign: '+' | '-') => {
            const dur = steps;

            const slideDuration = ANIMATION_TIME * dur;
            this.element.style.transition = `${prop} ${slideDuration}ms cubic-bezier(.${bezier(dur)}, 0,.${100 - bezier(dur)}, 1)`;
            forceRepaint(this.element);

            const currentPropValue = parseFloat(this.element.style[prop]);
            const nextPropValue = sign === '+'
                ? currentPropValue + dur
                : currentPropValue - dur;
            this.element.style[prop] = `${nextPropValue}em`;

            const delayDuration = ANIMATION_TIME * (dur - 1);
            await promiseTimeout(delayDuration);

            animateMovingCubesFromMainFieldToSide({
                cube: this,
                toSideActions: this.app.moveMap!.toSideActions,
                beyondTheSide: this.app.moveMap!.beyondTheSide,
                cubesMask: this.app.cubes.sideCubes,
            });
        };

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
                distance: (field === 'top' || field === 'left') ? -1 : 1,
            });
        };

        const appearanceInSide = async () => {
            const pos = {
                x: this.x,
                y: this.y,
            };
            switch (this.field.value()) {
            case 'top':
                pos.y = BOARD_SIZE - 3;
                break;
            case 'right':
                pos.x = 2;
                break;
            case 'bottom':
                pos.y = 2;
                break;
            case 'left':
                pos.x = BOARD_SIZE - 3;
                break;
            }

            setCubeViewPositionOnTheField(this, {
                x: pos.x,
                y: pos.y,
                field: this.field.value(),
            });

            await promiseTimeout(steps * ANIMATION_TIME);

            this.element.classList.remove('cubeHidden');
            await appearCubeFromZeroSizePoint({
                element: this.element,
            });
        };

        const disappearanceInSide = async () => {
            const animationDuration = steps * ANIMATION_TIME;
            this.element.style.transform = 'scale(1,1)';
            this.element.style.opacity = '1';
            this.element.style.transition = `transform ${animationDuration}ms ease-out, opacity ${animationDuration}ms ease-out`;
            forceRepaint(this.element);

            this.element.style.transform = 'scale(0,0)';
            this.element.style.opacity = '0';
            await promiseTimeout(animationDuration);

            this.element.style.transition = '';
            this.element.style.transform = '';
            this.element.style.opacity = '';

            this.element.classList.add('cubeHidden');
        };

        const boom = () => {
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
        };

        switch (action) {
        // Движение вправо со столкновением
        case 'srBump':
            animateCubeMovementWithBump({
                element: this.element,
                isVertical: false,
                distance: steps - 1,
            });
            break;
            // Движение вниз со столкновением
        case 'sbBump':
            animateCubeMovementWithBump({
                element: this.element,
                isVertical: true,
                distance: steps - 1,
            });
            break;
            // Движение влево со столкновением
        case 'slBump':
            animateCubeMovementWithBump({
                element: this.element,
                isVertical: false,
                distance: 1 - steps,
            });
            break;
            // Движение вверх со столкновением
        case 'stBump':
            animateCubeMovementWithBump({
                element: this.element,
                isVertical: true,
                distance: 1 - steps,
            });
            break;
            // Движение с последующим вливанием в поле
        case 'toSide':
            (() => {
                let sign: '+' | '-' = '-';
                let prop: 'left' | 'top' = 'left';
                if (field === 'top' || field === 'bottom') {
                    prop = 'top';
                    if (field === 'bottom') {
                        sign = '+';
                    }
                } else {
                    if (field === 'right') {
                        sign = '+';
                    }
                }
                slideToSide(prop, sign);
            })();
            break;
            // Передвигаем кубик в боковом поле ближе к mainField
        case 'nearer':
            nearer();
            break;
            // Кубик появляется третьим в боковом поле
        case 'appearanceInSide':
            appearanceInSide();
            break;
            // Третий кубик в боковой линии пропадает
        case 'disappearanceInSide':
            disappearanceInSide();
            break;
            // Передвигаем кубик в боковой панели дальше от mainField
        case 'further':
            further();
            break;
            // Передвигаем кубик в боковой панели дальше от mainField
        case 'boom':
            boom();
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
