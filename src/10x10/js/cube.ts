import $ from 'jquery';
import { assertUnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';

import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_WIDTH } from '../const/CUBE_WIDTH';
import { Field } from '../const/FIELDS';
import { Direction } from '../types/Direction';
import { animateMovingCubesFromMainFieldToSide } from '../utils/animateMovingCubesFromMainFieldToSide';
import { bezier } from '../utils/bezier';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { reverseDirection } from '../utils/reverseDirection';

import { CubeAddress } from './Cubes';
import { CubeAnimation } from './MoveMap';
import { TenOnTen } from './TenOnTen';

export type CubeAnimateAction = {
    action: string;
    duration: number;
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

export class Cube {
    public field: Field;
    public x: number;
    public y: number;
    public direction: Direction | null;
    public color: string;
    public toMineOrder: number | null;
    public readonly $el: JQuery<HTMLElement>;
    private readonly container: JQuery<HTMLElement>;

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
        color: string;
        container: JQuery<HTMLElement>;
        onClick: (address: CubeAddress) => void;
        onHover: (address: CubeAddress, isHovered: boolean) => void;
    }) {
        let visibleModeClasses;

        this.x = params.x;
        this.y = params.y;
        this.container = params.container;
        this.appearWithAnimation = params.appearWithAnimation;

        // время попадания в главное поле
        this.toMineOrder = params.toMineOrder;

        this.field = params.field;
        // указатель на игру, к которой кубик привязан
        this.app = params.app;

        // направление движения
        if (!params.direction) {
            this.direction = (function (field) {
                if (field === 'top') {
                    return 'bottom';
                } else if (field === 'bottom') {
                    return 'top';
                } else if (field === 'left') {
                    return 'right';
                } else if (field === 'right') {
                    return 'left';
                } else {
                    return null;
                }
            })(this.field);
        } else {
            this.direction = params.direction;
        }

        this.color = params.color;

        // проверка на то, что данный кубик в боковом поле дальше третьего и не должен быть отображен
        if (this.field !== 'main') {
            if (this._inFieldIsVisible()) {
                visibleModeClasses = ' ';
            } else {
                visibleModeClasses = ' cubeHidden';
            }
        } else {
            visibleModeClasses = ' ';
        }

        let directionClass = '';
        if (this.field === 'main' && this.direction !== null) {
            directionClass = `d${this.direction}`;
        }

        // указатель на DOM-элемент кубика с прослушиванием событий
        this.$el = $('<div class="cube"></div>')
            .addClass(`${this.color} f${this.field}${visibleModeClasses}${directionClass}`)
            .hover(
                (e) => {
                    e.preventDefault();

                    params.onHover({
                        field: this.field,
                        x: this.x,
                        y: this.y,
                    }, true);
                },
                (e) => {
                    e.preventDefault();

                    params.onHover({
                        field: this.field,
                        x: this.x,
                        y: this.y,
                    }, false);
                }
            )
            .click((e) => {
                // не даем продолжить выполнение событий
                e.preventDefault();
                // и снимаем курсор с элемента
                this.$el.trigger('mouseout');

                params.onClick({
                    field: this.field,
                    x: this.x,
                    y: this.y,
                });
            });

        // время попадания в поле майн
        if (this.field === 'main') {
            this.toMineOrder = getIncrementalIntegerForMainFieldOrder();
        }

        this.toState();

        if (this.appearWithAnimation) {
            this.$el
                .css({ scale: 0 })
                .appendTo(this.container)
                .transition({
                    scale: 1,
                    duration: ANIMATION_TIME * 10,
                });
            this.appearWithAnimation = false;
        } else {
            this.$el.appendTo(this.container);
        }
    }

    public setRowVisibility(isVisible: boolean) {
        if (isVisible) {
            this.$el.addClass('firstInHoverLine');
        } else {
            this.$el.removeClass('firstInHoverLine');
        }
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
        let left = x * CUBE_WIDTH;
        let top = y * CUBE_WIDTH;
        switch (this.field) {
        case 'top':
            top -= CUBE_WIDTH * 10;
            break;
        case 'right':
            left += CUBE_WIDTH * 10;
            break;
        case 'bottom':
            top += CUBE_WIDTH * 10;
            break;
        case 'left':
            left -= CUBE_WIDTH * 10;
            break;
        }
        this.$el.css({
            left,
            top,
        });
    }

    public performIHavePawsAnimation() {
        const scale = this.field === 'left' || this.field === 'right'
            ? [
                0.8,
                1.2,
            ]
            : [
                1.2,
                0.8,
            ];

        this.$el
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
                    duration,
                });
            },
            (delay ?? 0) * ANIMATION_TIME
        );
    }

    // Добавляем объект анимации на обработку через время, полученное в атрибутах
    public remove() {
        this.$el.remove();
    }

    // Сама функция анимации - в зависимости од переданного значения, выполняем те или иные
    // преобразования html-элемента кубика
    public animate({ action, duration }: CubeAnimateAction) {
        let dur;

        const field = this.field;

        const slideWithBump = (prop: 'left' | 'top', sign: '+' | '-') => {
            dur = duration - 1;
            const scale: [number, number] = prop === 'left'
                ? [
                    0.9,
                    1.1,
                ]
                : [
                    1.1,
                    0.9,
                ];

            const trans0: Transition = {
                duration: ANIMATION_TIME * dur,
                easing: `cubic-bezier(.${bezier(dur)}, 0, 1, 1)`,
            };
            trans0[prop] = `${sign}=${dur * CUBE_WIDTH}`;
            const trans1: Transition = {
                scale,
                duration: ANIMATION_TIME / 2,
            };
            trans1[prop] = `${sign === '+' ? '+' : '-'}=4`;
            const trans2: Transition = {
                scale: 1,
                duration: ANIMATION_TIME / 2,
            };
            trans2[prop] = `${sign === '+' ? '-' : '+'}=4`;
            this.$el.transition(trans0).transition(trans1).transition(trans2);
        };

        /*
        * движение в боковую панель без разрывов анимации,
        * чтобы сохранить максимальную плавность анимации, делать
        * одним перемещением по возможности
        */
        const slideToSide = (prop: 'left' | 'top', sign: '+' | '-') => {
            dur = duration;
            // задаем нужный изинг
            const easing = `cubic-bezier(.${bezier(dur)}, 0,.${100 - bezier(dur)}, 1)`;
            const trans: Transition = {
                duration: ANIMATION_TIME * dur,
                easing,
            };
            trans[prop] = `${sign}=${dur * CUBE_WIDTH}`;

            // отправляем в коллекцию команду вставки кубика в линию,
            // чтобы остальные кубики в этой линии пододвинулись
            setTimeout(
                () => {
                    animateMovingCubesFromMainFieldToSide({
                        cube: this,
                        toSideActions: this.app.moveMap!.toSideActions,
                        beyondTheSide: this.app.moveMap!.beyondTheSide,
                        cubesMask: this.app.cubes.cubesMask,
                    });
                },
                ANIMATION_TIME * (dur - 1)
            );

            // анимируем движение, в конце - убираем стрелку, меняем классы
            this.$el.transition(trans, () => {
                const dir = reverseDirection(this.field);
                this.$el
                    .removeClass(`d${this.field} f${dir}`)
                    .addClass(`f${this.field}`);
            });
        };

        const nearer = () => {
            let prop: 'top' | 'left' = 'left';
            let sign: '+' | '-' = '-';
            const trans: Transition = { duration: ANIMATION_TIME };

            if (this.field === 'top' || this.field === 'bottom') {
                prop = 'top';
                if (this.field === 'top') {
                    sign = '+';
                }
            } else {
                prop = 'left';
                if (this.field === 'left') {
                    sign = '+';
                }
            }
            trans[prop] = `${sign}=${duration * CUBE_WIDTH}`;
            this.$el.transition(trans);
        };

        const forth = () => {
            let prop: 'top' | 'left' = 'left';
            let sign: '+' | '-' = '+';
            const trans: Transition = { duration: ANIMATION_TIME };

            if (this.field === 'top' || this.field === 'bottom') {
                prop = 'top';
                if (this.field === 'top') {
                    sign = '-';
                }
            } else {
                prop = 'left';
                if (this.field === 'left') {
                    sign = '-';
                }
            }
            trans[prop] = `${sign}=${duration * CUBE_WIDTH}`;
            this.$el.transition(trans);
        };

        const appearance = () => {

            const pos = {
                x: this.x,
                y: this.y,
            };
            switch (this.field) {
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
            this.$el
                .removeClass('cubeHidden')
                .css({
                    scale: 0,
                    opacity: 0.4,
                })
                .transition({
                    scale: 1,
                    opacity: 1,
                    duration: duration * ANIMATION_TIME,
                    delay: duration * ANIMATION_TIME,
                    easing: 'out',
                });
        };

        const disappearance = () => {
            this.$el.transition({
                scale: 0,
                opacity: 0,
                duration: duration * ANIMATION_TIME,
                easing: 'out',
            });
            setTimeout(
                function (cube) {
                    cube.$el
                        .css({
                            scale: 1,
                            opacity: 1,
                        })
                        .addClass('cubeHidden');
                },
                duration * ANIMATION_TIME,
                this
            );
        };

        const boom = () => {
            // console.log("boom:",cube.color, cube.x, cube.y);
            this.$el.transition(
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
        // движение вправо со столкновением
        case 'srBump':
            slideWithBump('left', '+');
            break;
            // движение вправо со столкновением
        case 'sbBump':
            slideWithBump('top', '+');
            break;
            // движение вправо со столкновением
        case 'slBump':
            slideWithBump('left', '-');
            break;
            // движение вправо со столкновением
        case 'stBump':
            slideWithBump('top', '-');
            break;
            // движение с последующим вливанием в поле
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
            // передвигаем кубик в боковом поле ближе к mainField
        case 'nearer':
            nearer();
            break;
            // кубик появляется третим в боковом поле
        case 'appearanceInSide':
            appearance();
            break;
            // третий кубик в боковой линии пропадает
        case 'disappearanceInSide':
            disappearance();
            break;
            // передвигаем кубик в боковой панели дальше от mainField
        case 'forth':
            forth();
            break;
            // передвигаем кубик в боковой панели дальше от mainField
        case 'boom':
            boom();
            break;
            // уменьшаем и в конце удаляем
        case 'remove':
            this.$el.transition(
                {
                    scale: 0,
                    opacity: 0,
                    duration: duration * ANIMATION_TIME,
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

    // проверка, показывать кубик или нет в поле
    public _inFieldIsVisible() {
        let pos;
        if (this.field === 'main') {
            return true;
        }
        if (this.field === 'top' || this.field === 'bottom') {
            pos = this['y'];
            return this.field === 'top' ? pos > 6 : pos < 3;
        } else {
            pos = this['x'];
            return this.field === 'left' ? pos > 6 : pos < 3;
        }
    }

    // Меняем параметры кубика, при этом его анимируем
    public change(o: { color?: string; direction?: Direction }) {
        const changeParams = () => {
            // если меняем цвет и это не тот же цвет, что сейчас
            if (o.color !== undefined && o.color !== this.color) {
                const prevColor = this.color;
                this.color = o.color;
                this.$el.removeClass(prevColor).addClass(this.color);
            }
            // если меняем направление и это не то же направление, что сейчас
            if (o.direction !== undefined && o.direction !== this.direction) {
                const prevDirection = this.direction;
                this.direction = o.direction;

                // стили следует менять только у кубиков на главном поле, так как
                // слили dtop, dright, dbotom, dleft присваивают кубикам стрелки
                if (this.field === 'main') {
                    this.$el.removeClass(`d${prevDirection}`);
                    if (this.direction !== null) {
                        this.$el.addClass(`d${this.direction}`);
                    }
                }
            }
        };

        if (this._inFieldIsVisible()) {
            let prop: keyof Transition;
            // для красотенюшки задаем разную анимацию для разных полей
            if (this.field === 'main') {
                prop = 'rotate3d';
            } else if (this.field === 'top' || this.field === 'bottom') {
                prop = 'rotateX';
            } else {
                prop = 'rotateY';
            }

            // анимация скрытия/открытия
            const transition1: Transition = { duration: ANIMATION_TIME * 2 };
            const transition2: Transition = { duration: ANIMATION_TIME * 2 };
            if (this.field === 'main') {
                transition1[prop] = '1,1,0,90deg';
                transition2[prop] = '1,1,0,0deg';
            } else {
                transition1[prop] = String(90);
                transition2[prop] = String(0);
            }
            // сама анимация с изменением состояния по ходу
            this.$el
                .transition(transition1, function () {
                    changeParams();
                })
                .transition(transition2);
        } else {
            changeParams();
        }
    }
}
