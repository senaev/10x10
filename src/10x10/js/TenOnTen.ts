import $ from 'jquery';
import { shuffleArray } from 'senaev-utils/src/utils/Array/shuffleArray/shuffleArray';
import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';
import { getRandomIntegerInARange } from 'senaev-utils/src/utils/random/getRandomIntegerInARange';

import { RefreshButton } from '../components/RefreshButton';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_COLORS } from '../const/CUBE_COLORS';
import { CUBE_WIDTH } from '../const/CUBE_WIDTH';
import { Field, FIELDS } from '../const/FIELDS';
import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import { Direction } from '../types/Direction';
import { getAllCubesInCursorPositionThatCouldGoToMain } from '../utils/getAllCubesInCursorPositionThatCouldGoToMain';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getCubeByAddress } from '../utils/getCubeByAddress';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { getLevelColorsCount } from '../utils/getLevelColorsCount';
import { getLevelCubesCount } from '../utils/getLevelCubesCount';
import { getLevelCubesPositions } from '../utils/getLevelCubesPositions';
import { getRandomColorForCubeLevel } from '../utils/getRandomColorForCubeLevel';

import { Cube } from './Cube';
import {
    CubeAddress, Cubes,
} from './Cubes';
import { MoveMap } from './MoveMap';
import {
    UndoButton,
} from './UndoButton';
export type MaskFieldValue = {
    color: string;
    direction: Direction | null;
    toMineOrder?: number | null;
};
export type CubesPositions = Record<Field, (MaskFieldValue | null)[][]>;

export class TenOnTen {
    public readonly container: JQuery<HTMLElement>;
    public readonly topRightPanelElement: Element;

    public level: number;
    public readonly cubes: Cubes;

    public moveMap: MoveMap | undefined;
    public end: string | null;

    private readonly undoButton: UndoButton;
    private readonly refreshButton: RefreshButton;

    private readonly lang: keyof (typeof I18N_DICTIONARY)[keyof typeof I18N_DICTIONARY];
    private blockApp: boolean;
    private previousStepMap: CubesPositions | undefined;

    public constructor({ container }: { container: HTMLElement }) {
        // получаем коллекцию кубиков и устанавливаем в параметрах проложение,
        // которому эти кубики принадлежат
        this.cubes = new Cubes({ app: this });

        // индикатор состояния приложения - разрешены какие-либо действия пользователя или нет
        this.blockApp = false;

        // уровень 1-10 11-60(16-65)
        this.level = 1;

        // язык
        this.lang = 'ru';

        // датчик конца хода
        this.end = null;

        this.container = $(container);

        // Initialize container function
        (() => {
            const topRightPanel = '<div class="panel topRightPanel"></div>'; //
            let background = '<div class="backgroundField">';
            for (let key = 0; key < BOARD_SIZE * BOARD_SIZE; key++) {
                background += '<div class="dCube"></div>';
            }
            background += '</div>';

            const backgroundField = $(background).css({
                height: CUBE_WIDTH * BOARD_SIZE,
                width: CUBE_WIDTH * BOARD_SIZE,
                padding: CUBE_WIDTH * 3 + 3,
                left: CUBE_WIDTH * -3 - 3,
                top: CUBE_WIDTH * -3 - 3,
            });

            this.container
                .css({
                    height: CUBE_WIDTH * BOARD_SIZE,
                    width: CUBE_WIDTH * BOARD_SIZE,
                    margin: CUBE_WIDTH * 3,
                    position: 'relative',
                })
                .addClass('tenOnTenContainer')
                .append(backgroundField)
                .append(topRightPanel);
        })();

        // запускаем инициализацию приложения
        // генерируем кубики в боковых панелях
        this.cubes._sideEach((_cube, field, x, y) => {
            this.createCube({
                x,
                y,
                field,
                color: getRandomColorForCubeLevel(this.level),
                appearWithAnimation: false,
                direction: null,
                toMineOrder: null,
            });
        });

        this.generateMainCubes();

        const topRightPanelElement = this.container[0].querySelector('.panel.topRightPanel');
        assertObject(topRightPanelElement);
        this.topRightPanelElement = topRightPanelElement;

        this.undoButton = new UndoButton({
            onClick: this.undo,
            container: topRightPanelElement,
        });
        this.undoButton.setState('hidden');

        this.refreshButton = new RefreshButton({
            onClick: this.refresh,
            container: topRightPanelElement,
        });
    }

    // даем возможность пользователю при переходе на новый уровень выбрать из случайных
    // комбинаций начальную
    public refresh = () => {
        this.blockApp = true;
        const cubesLocal = this.cubes;
        // удаляем нафиг кубики с главного поля
        cubesLocal._mainEach(function (cube, field, x, y) {
            cubesLocal._set({
                field,
                x,
                y,
            }, null);
            cube.animate({
                action: 'remove',
                duration: 4,
            });
        });
        setTimeout(
            function (app) {
                app.generateMainCubes();
                setTimeout(
                    function (appLocal) {
                        appLocal.blockApp = false;
                    },
                    ANIMATION_TIME * 8,
                    app
                );
            },
            ANIMATION_TIME,
            this
        );
    };

    // переводим игру на следующий уровень
    public nextLevel() {
        const colorsCount = getLevelColorsCount(this.level);
        this.level++;
        if (getLevelColorsCount(this.level) > colorsCount) {
            this.plusColor();
        }
        this.generateMainCubes();
    }

    // Возвращаем слово в необходимом переводе
    public word(w: keyof typeof I18N_DICTIONARY) {
        return I18N_DICTIONARY[w][this.lang];
    }

    // делаем возврат хода
    public readonly undo = () => {
    // блокируем приложение до тех пор, пока не закончим анимацию
        this.blockApp = true;
        setTimeout(
            function (app) {
                app.blockApp = false;
            },
            ANIMATION_TIME * 4,
            this
        );

        this.undoButton.setState('inactive');

        // массив, в котором описаны все различия между текущим и предыдущим состоянием
        const changed: {
            field: Field;
            x: number;
            y: number;
            pCube: MaskFieldValue | null;
            cube: Cube | null;
            action: string;
        }[] = [];

        // пробегаем в массиве по каждому кубику предыдущего массива
        const previousStepMap = this.previousStepMap!;
        if (previousStepMap) {
            for (const fieldName in previousStepMap) {
                for (const x in previousStepMap[fieldName as Field]) {
                    for (const y in previousStepMap[fieldName as Field][x]) {
                        const xNumber = parseInt(x);
                        const yNumber = parseInt(y);
                        const pCube: MaskFieldValue | null = previousStepMap[fieldName as Field][xNumber][yNumber];
                        // берем соответствующее значение текущей маски для сравнения
                        const cube = this.cubes._get({
                            field: fieldName as Field,
                            x: xNumber,
                            y: yNumber,
                        });
                        // если предыдущее - null
                        if (pCube === null) {
                            // а новое - что-то другое
                            // удаляем кубик из нового значения
                            if (cube !== null) {
                                changed.push({
                                    field: fieldName as Field,
                                    x: xNumber,
                                    y: yNumber,
                                    pCube: null,
                                    cube,
                                    action: 'remove',
                                });
                            }
                        } else {
                            // если же раньше тут тоже был кубик
                            // а сейчас кубика нету
                            // заполняем клетку кубиком
                            if (cube === null) {
                                changed.push({
                                    field: fieldName as Field,
                                    x: xNumber,
                                    y: yNumber,
                                    pCube,
                                    cube: null,
                                    action: 'add',
                                });
                            } else {
                            // если и раньше и сейчас - нужно сравнить эти значения
                                // пробегаемся по каждому параметру
                                for (const prop in pCube) {
                                    // если какие-то параметры различаются,
                                    // меняем параметры кубика
                                    if (
                                        cube[prop as keyof Cube] !== pCube[prop as keyof MaskFieldValue]
                                    ) {
                                        changed.push({
                                            field: fieldName as Field,
                                            x: xNumber,
                                            y: yNumber,
                                            pCube,
                                            cube,
                                            action: 'change',
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const key in changed) {
            let cube = changed[key].cube;
            switch (changed[key].action) {
            case 'add':
                // создаем новый кубик с теми же параметрами и подменяем им предыдущий
                cube = this.createCube({
                    x: changed[key].x,
                    y: changed[key].y,
                    field: changed[key].field,
                    color: changed[key]!.pCube!.color,
                    direction: changed[key]!.pCube!.direction!,
                    appearWithAnimation: true,
                    toMineOrder: null,
                });
                // console.log(cube);
                break;
            case 'remove':
                // удаляем нафиг кубик
                this.cubes._set(
                    {
                        field: changed[key].field,
                        x: changed[key].x,
                        y: changed[key].y,
                    },
                    null
                );
                cube!.animate({
                    action: 'remove',
                    duration: 4,
                });
                break;
            case 'change':
                cube!.change({
                    color: changed[key].pCube!.color,
                    direction: changed[key].pCube!.direction!,
                });
                break;
            default:
                throw new Error(`Неизвестное значение в changed[key].action: ${changed[key].action}`);
            }
        }

        // меняем значения toMineOrder всех кубиков на поле
        const mainField = previousStepMap.main;
        for (const x in mainField) {
            const row = mainField[x];
            for (const y in row) {
                const value = row[y];
                if (value !== null) {
                    this.cubes._get({
                        field: 'main',
                        x: Number(x),
                        y: Number(y),
                    })!.toMineOrder = value.toMineOrder!;
                }
            }
        }
    };

    public async run(startCubes: Cube[]) {
        // создаем маску для возможности возврата хода
        this.previousStepMap = this.generateMask();

        this.moveMap = new MoveMap({
            startCubes,
            cubes: this.cubes,
            app: this,
        });

        // блокируем приложение от начала до конца анимации
        // минус один - потому, что в последний такт обычно анимация чисто символическая
        this.blockApp = true;

        // пошаговый запуск анимации
        this.moveMap.animate({
            startCubes,
            cubesMask: this.cubes.mask,
            animationsScript: this.moveMap.animationsScript,
        }).then(() => {
            // разблокируем кнопку назад, если не случился переход на новый уровень
            // иначе - блокируем
            if (this.end === 'next_level') {
                this.undoButton.setState('hidden');
                this.refreshButton.setVisible(true);
            } else {
                this.undoButton.setState('active');
                this.refreshButton.setVisible(false);
            }

            if (this.end !== null) {
                switch (this.end) {
                case 'next_level':
                    this.nextLevel();
                    break;
                case 'game_over':

                    alert('game over');
                    break;
                default:
                    throw new Error(`Неверное значение в app.end: ${this.end}`);
                }
            }

            this.blockApp = false;
        });

        // подытоживание - внесение изменений, произошедших в абстрактном moveMap
        // в реальную коллекцию cubes
        this.cubes._mergeMoveMap(this.moveMap);

        this.checkStepEnd();
    }

    // вырезаем кубики из боковой линии и заполняем последние элементы в этой линии
    public cutCubesFromLineAndFillByNewOnes(startCubes: Cube[]) {
        // получаем линию
        const line = getCubeAddressInSideFieldInOrderFromMain({
            x: startCubes[0].x,
            y: startCubes[0].y,
            field: startCubes[0].field,
        });

        // пробегаемся, меняем значения в коллекции
        for (let key = line.length - 1; key >= startCubes.length; key--) {
            const prevCube = this.cubes._get(line[key - startCubes.length])!;
            this.cubes._set(line[key], prevCube);
            prevCube.x = line[key].x;
            prevCube.y = line[key].y;
        }
        // генерируем кубики для крайних значений в линии
        for (let key = 0; key < startCubes.length; key++) {
            this.cubes._set(
                line[key],
                this.createCube({
                    x: line[key].x,
                    y: line[key].y,
                    field: line[key].field,
                    toMineOrder: getIncrementalIntegerForMainFieldOrder(),
                    color: getRandomColorForCubeLevel(this.level),
                    appearWithAnimation: false,
                    direction: null,
                })
            );
        }

        /**
         * при отладке может возникать забавная ошибка, когда почему-то
         * случайно добавляются не последние значения линии, а предыдущие из них
         * не верьте вьюхам!!! верьте яваскрипту, дело в том, что новые кубики появляются,
         * а старые вьюхи ни куда не деваются и одни других перекрывают :)
         */
    }

    private readonly handleCubeClick = (address: CubeAddress) => {
        // если стоит блокировка событий приложения - не даём пользователю ничего сделать
        if (this.blockApp) {
            return;
        }

        // если щелчек произошол по  полю - ничего не делаем
        if (address.field === 'main') {
            return;
        }

        // если по боковому
        // ищем первые кубики в одной линии бокового поля с кубиком, по  которому щелкнули,
        // которые могут выйти из поля
        const startCubes = getAllCubesInCursorPositionThatCouldGoToMain(this.cubes.mask, address);

        // если пришел не массив - выполняем анимацию 🤷‍♂️ что ничего сделать нельзя
        if (typeof startCubes === 'string') {
            getCubeByAddress(this.cubes.mask, address)!.performIHavePawsAnimation();
            return;
        }

        // отправляем в путь-дорогу
        this.run(startCubes);
    };

    private readonly handleHover = (address: CubeAddress, isHovered: boolean) => {
        if (address.field === 'main') {
            return;
        }

        const allToFirstInLine = getAllCubesInCursorPositionThatCouldGoToMain(this.cubes.mask, address);

        if (typeof allToFirstInLine === 'string') {
            return;
        }

        for (const cube of allToFirstInLine) {
            cube.setRowVisibility(isHovered);
        }
    };

    // генерируем кубики на главном поле
    private generateMainCubes() {
        const firstCubesPosition = getLevelCubesPositions(this.level);
        let nullCells: { x: number; y: number }[] = [];

        for (
            let number = 0, len = getLevelCubesCount(this.level);
            number < len;
            number++
        ) {
            let cell: { x: number; y: number } | undefined;
            let fPos = null;

            if (firstCubesPosition[number] !== undefined) {
                fPos = firstCubesPosition[number];
            }

            if (fPos === null) {
                // создаем массив из свободных ячеек, перемешиваем его
                if (nullCells === undefined) {
                    nullCells = [];
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        for (let y = 0; y < BOARD_SIZE; y++) {
                            if (this.cubes.mask.main[x][y] === null) {
                                nullCells.push({
                                    x,
                                    y,
                                });
                            }
                        }
                    }

                    shuffleArray(nullCells);
                }

                // шанс попадания кубика в крайнее поле - чем больше, тем ниже
                const chance = 2;
                for (let key = 0; key < chance; key++) {
                    cell = nullCells.shift()!;
                    if (
                        cell.x === 0 || cell.y === 0 || cell.x === BOARD_SIZE - 1 || cell.y === BOARD_SIZE - 1
                    ) {
                        nullCells.push(cell);
                    } else {
                        break;
                    }
                }
            } else {
                cell = {
                    x: fPos[0],
                    y: fPos[1],
                };
            }

            // выстраиваем кубики так, чтобы не было соседних одноцветных кубиков
            const colorsCount = getLevelColorsCount(this.level);

            // цвета, которые есть в смежных кубиках
            const appearanceColors = [];
            for (let key = 0; key < 4; key++) {
                const address: CubeAddress = {
                    x: cell!.x,
                    y: cell!.y,
                    field: 'main',
                };

                const prop: 'x' | 'y' = key % 2 == 0 ? 'x' : 'y';
                address[prop] = key < 2 ? address[prop] + 1 : address[prop] - 1;

                if (
                    address.x > -1 && address.y > -1 && address.x < 10 && address.y < 10
                ) {
                    const c = this.cubes._get(address);
                    if (c !== null) {
                        appearanceColors.push(c.color);
                    }
                }
            }

            // цвета, которых нету в смежных
            const noAppearanceColors = [];
            for (let key = 0; key < colorsCount; key++) {
                if (appearanceColors.indexOf(CUBE_COLORS[key]) === -1) {
                    noAppearanceColors.push(CUBE_COLORS[key]);
                }
            }

            // получаем итоговый цвет
            const color = noAppearanceColors[getRandomIntegerInARange(0, noAppearanceColors.length - 1)];

            this.createCube({
                x: cell!.x,
                y: cell!.y,
                field: 'main',
                color,
                appearWithAnimation: true,
                direction: null,
                toMineOrder: null,
            });
        }
    }

    // проверяем в конце хода на конец уровня или конец игры
    private checkStepEnd() {
    /**
     * если нет - заканчиваем ход
     * и проверяем, это просто ход или пользователь проиграл или
     * пользователь перешел на новый уровень
     * записываем в this.end:
     * null - просто ход,
     * game_over - конец игры,
     * next_level - конец уровня, переход на следующий
     */
        const cubesLocal = this.cubes;
        let game_over = true;
        let next_level = true;

        for (let x = 0; x < BOARD_SIZE; x++) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                const cube = cubesLocal.mask.main[x][y];

                // если на поле еще остались кубики, уровень не завершен
                if (cube !== null) {
                    next_level = false;
                }

                // если все крайние панели заполнены - конец игры,
                // если хоть один пустой - игра продолжается
                if (
                    x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1
                ) {
                    if (cube === null) {
                        game_over = false;
                    }
                }
            }
            if (!next_level && !game_over) {
                break;
            }
        }

        if (next_level) {
            // меняем датчик на следующий уровень
            this.end = 'next_level';
        } else if (game_over) {
            // меняем датчик на конец игры
            this.end = 'game_over';
        } else {
            // иначе - ничего не делаем
            this.end = null;
        }
    }

    // при переходе на уровень с большим количеством цветов, добавляем кубики с новыми цветами в боковые поля
    private plusColor() {
        const colorsCount = getLevelColorsCount(this.level);
        const newColor = CUBE_COLORS[colorsCount - 1];
        this.cubes._sideEach(function (cube) {
            if (getRandomIntegerInARange(0, colorsCount - 1) === 0) {
                cube.change({
                    color: newColor,
                });
            }
        });
    }

    // генерируем маску для предыдущего хода
    private generateMask(): CubesPositions {
        const mask: Partial<CubesPositions> = {};
        const cubesLocal = this.cubes;

        for (const field of FIELDS) {
            const fieldValue: (MaskFieldValue | null)[][] = [];
            mask[field] = fieldValue;
            for (let x = 0; x < BOARD_SIZE; x++) {
                fieldValue[x] = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const c = cubesLocal._get({
                        field,
                        x,
                        y,
                    });

                    if (c === null) {
                        fieldValue[x][y] = null;
                    } else {
                        const resultValue: MaskFieldValue = {
                            color: c.color,
                            direction: c.direction,
                            toMineOrder: c.toMineOrder,
                        };
                        fieldValue[x][y] = resultValue;
                    }
                }
            }
        }

        return mask as CubesPositions;
    }

    private createCube(params: CubeAddress & {
        appearWithAnimation: boolean;
        color: string;
        direction: Direction | null;
        toMineOrder: number | null;
    }) {
        const cube = new Cube({
            ...params,
            app: this,
            container: this.container,
            onClick: this.handleCubeClick,
            onHover: this.handleHover,
        });

        this.cubes._add(cube);

        return cube;
    }

}
