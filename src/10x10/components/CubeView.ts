import $ from 'jquery';
import { assertUnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { Signal } from 'senaev-utils/src/utils/Signal/Signal';
import { combineSignalsIntoNewOne } from 'senaev-utils/src/utils/Signal/combineSignalsIntoNewOne/combineSignalsIntoNewOne';
import { subscribeSignalAndCallWithCurrentValue } from 'senaev-utils/src/utils/Signal/subscribeSignalAndCallWithCurrentValue/subscribeSignalAndCallWithCurrentValue';
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

import { forceRepaint } from '../../utils/forceRepaint';
import { animateCubeMovement } from '../animations/animateCubeMovement';
import { animateCubeMovementWithBump } from '../animations/animateCubeMovementWithBump';
import { appearCubeFromZeroSizePoint } from '../animations/appearCubeFromZeroSizePoint';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_COLORS, CubeColor } from '../const/CUBE_COLORS';
import {
    Direction, DIRECTION_TO_ARROW_ROTATE, DIRECTIONS,
} from '../const/DIRECTIONS';
import { Field } from '../const/FIELDS';
import arrowSvg from '../img/arrow.svg';
import { CubeAddress } from '../js/Cubes';
import { CubeAnimation } from '../js/MoveMap';
import { TenOnTen } from '../js/TenOnTen';
import { animateMovingCubesFromMainFieldToSide } from '../utils/animateMovingCubesFromMainFieldToSide';
import { bezier } from '../utils/bezier';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { reverseDirection } from '../utils/reverseDirection';

export type CubeAnimateAction = {
    action: string;
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
    public readonly visualCubeElement: HTMLElement;
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
        onClick: (address: CubeAddress) => void;
        onHover: (address: CubeAddress, isHovered: boolean) => void;
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

        const visualCubeElement = document.createElement('div');
        this.visualCubeElement = visualCubeElement;
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
                this.visualCubeElement.classList.add(`direction_${direction}`);
            } else {
                DIRECTIONS.forEach((dir) => {
                    this.visualCubeElement.classList.remove(`direction_${dir}`);
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
            this.visualCubeElement.style.backgroundColor = CUBE_COLORS[color];
        });

        // Проверка на то, что данный кубик в боковом поле дальше третьего и не должен быть отображен
        if (this.field.value() !== 'main') {
            if (!this._inFieldIsVisible()) {
                this.element.classList.add('cubeHidden');
            }
        }

        if (this.field.value() === 'main' && this.direction.value() !== null) {
            this.element.classList.add(`d${this.direction.value()}`);
        }

        this.element.classList.add('cube');
        // this.element.classList.add(this.color);
        this.element.classList.add(`f${this.field.value()}`);

        this.element.appendChild(visualCubeElement);

        this.element.addEventListener('mouseover', () => {
            params.onHover({
                field: this.field.value(),
                x: this.x,
                y: this.y,
            }, true);
        });
        this.element.addEventListener('mouseout', () => {
            params.onHover({
                field: this.field.value(),
                x: this.x,
                y: this.y,
            }, false);
        });

        this.element.addEventListener('mousedown', () => {
            params.onClick({
                field: this.field.value(),
                x: this.x,
                y: this.y,
            });
        });

        // Время попадания в поле майн
        if (this.field.value() === 'main') {
            this.toMineOrder = getIncrementalIntegerForMainFieldOrder();
        }

        this.toState();

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

    // Задаем html-элементу кубика положение на доске
    // Если параметры не переданы, устанавливаем текущую позицию кубика
    // Если переданы - устанавливаем в поле кубику, в позицию х/у, переданные в параметрах
    public toState(position?: { x: number; y: number }) {
        let x: number;
        let y: number;
        if (position === undefined) {
            x = this.x;
            y = this.y;
        } else {
            x = position.x;
            y = position.y;
        }
        let left = x;
        let top = y;
        switch (this.field.value()) {
        case 'top':
            top -= 10;
            break;
        case 'right':
            left += 10;
            break;
        case 'bottom':
            top += 10;
            break;
        case 'left':
            left -= 10;
            break;
        }
        this.element.style.left = `${left + 3.5}em`;
        this.element.style.top = `${top + 3.5}em`;
        this.element.setAttribute('data-top', String(top));
        this.element.setAttribute('data-left', String(left));
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
        animation: action,
        delay,
        duration,
    }: CubeAnimation) {
        assertUnsignedInteger(delay);
        assertUnsignedInteger(duration);

        setTimeout(
            () => {
                this.animate({
                    action: action!,
                    steps: duration,
                });
            },
            (delay ?? 0) * ANIMATION_TIME
        );
    }

    // Добавляем объект анимации на обработку через время, полученное в атрибутах
    public remove() {
        this.element.remove();
    }

    // Сама функция анимации - в зависимости од переданного значения, выполняем те или иные
    // преобразования html-элемента кубика
    public animate({ action, steps }: CubeAnimateAction) {
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

            const dir = reverseDirection(this.field.value());
            this.element.classList.remove(`d${this.field.value()}`);
            this.element.classList.remove(`f${dir}`);
            this.element.classList.add(`f${this.field.value()}`);

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
                distance: (field === 'top' || field === 'left') ? 1 : -1,
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

            this.toState(pos);

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
                    this.remove();
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
                        this.remove();
                    }
                );
            break;
        default:
            // eslint-disable-next-line no-console
            console.log(`Неизвестная анимация: ${action}`);
            break;
        }
    }

    // Проверка, показывать кубик или нет в поле
    public _inFieldIsVisible() {
        let pos;
        if (this.field.value() === 'main') {
            return true;
        }
        if (this.field.value() === 'top' || this.field.value() === 'bottom') {
            pos = this['y'];
            return this.field.value() === 'top' ? pos > 6 : pos < 3;
        } else {
            pos = this['x'];
            return this.field.value() === 'left' ? pos > 6 : pos < 3;
        }
    }

    // Меняем параметры кубика, при этом его анимируем
    public change(o: { color?: CubeColor; direction?: Direction }) {
        const changeParams = () => {
            // Если меняем цвет и это не тот же цвет, что сейчас
            if (o.color !== undefined && o.color !== this.color.value()) {
                const prevColor = this.color.value();
                this.color.next(o.color);
                $(this.element).removeClass(prevColor).addClass(this.color.value());
            }
            // Если меняем направление и это не то же направление, что сейчас
            if (o.direction !== undefined && o.direction !== this.direction.value()) {
                const prevDirection = this.direction.value();
                this.direction.next(o.direction);

                // Стили следует менять только у кубиков на главном поле, так как
                // слили dtop, dright, dbotom, dleft присваивают кубикам стрелки
                if (this.field.value() === 'main') {
                    $(this.element).removeClass(`d${prevDirection}`);
                    if (this.direction.value() !== null) {
                        $(this.element).addClass(`d${this.direction.value()}`);
                    }
                }
            }
        };

        if (this._inFieldIsVisible()) {
            let prop: keyof Transition;
            // Для красотенюшки задаем разную анимацию для разных полей
            if (this.field.value() === 'main') {
                prop = 'rotate3d';
            } else if (this.field.value() === 'top' || this.field.value() === 'bottom') {
                prop = 'rotateX';
            } else {
                prop = 'rotateY';
            }

            // анимация скрытия/открытия
            const transition1: Transition = { duration: ANIMATION_TIME * 2 };
            const transition2: Transition = { duration: ANIMATION_TIME * 2 };
            if (this.field.value() === 'main') {
                transition1[prop] = '1,1,0,90deg';
                transition2[prop] = '1,1,0,0deg';
            } else {
                transition1[prop] = String(90);
                transition2[prop] = String(0);
            }
            // сама анимация с изменением состояния по ходу
            $(this.element)
                .transition(transition1, function () {
                    changeParams();
                })
                .transition(transition2);
        } else {
            changeParams();
        }
    }
}
