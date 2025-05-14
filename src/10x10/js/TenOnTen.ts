import { PixelSize } from 'senaev-utils/src/types/PixelSize';
import { shuffleArray } from 'senaev-utils/src/utils/Array/shuffleArray/shuffleArray';
import { callFunctions } from 'senaev-utils/src/utils/Function/callFunctions/callFunctions';
import { noop } from 'senaev-utils/src/utils/Function/noop';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';
import { deepEqual } from 'senaev-utils/src/utils/Object/deepEqual/deepEqual';
import { getRandomIntegerInARange } from 'senaev-utils/src/utils/random/getRandomIntegerInARange';
import { randomBoolean } from 'senaev-utils/src/utils/random/randomBoolean';
import { Signal } from 'senaev-utils/src/utils/Signal/Signal';

import { animateCubeBump } from '../animations/animateCubeBump';
import { CubeView } from '../components/CubeView';
import { MenuButton } from '../components/MenuButton';
import { RefreshButton } from '../components/RefreshButton';
import {
    UndoButton,
} from '../components/UndoButton';
import { ANIMATION_TIME } from '../const/ANIMATION_TIME';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_COLORS_ARRAY, CubeColor } from '../const/CUBE_COLORS';
import { Direction } from '../const/DIRECTIONS';
import { Field, FIELDS } from '../const/FIELDS';
import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import { getAllCubesInCursorPositionThatCouldGoToMain } from '../utils/getAllCubesInCursorPositionThatCouldGoToMain';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { getLevelColorsCount } from '../utils/getLevelColorsCount';
import { getLevelCubesCount } from '../utils/getLevelCubesCount';
import { getLevelCubesPositions } from '../utils/getLevelCubesPositions';
import { getRandomColorForCubeLevel } from '../utils/getRandomColorForCubeLevel';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';

import {
    createSideCubesMaskWithNullValues,
    CubeAddress,
    CubeCoordinates,
    Cubes,
    findCubeInSideCubes,
    SideCubeAddress,
} from './Cubes';
import { MoveMap } from './MoveMap';

export type TenOnTenCallbacks = {
    onAfterMove: () => void;
    onAfterUndo: () => void;
    onAfterNextLevel: () => void;
    onAfterNextLevelRefresh: () => void;
    onAfterNewGameStarted: () => void;
    onAfterOpenMenu: () => void;
};

// ширина приложения в кубиках 10 центральных + 3 * 2 по бокам и еще по 0.5 * 2 отступы
const APP_WIDTH_IN_CUBES = 17;

export type MaskFieldValue = {
    color: CubeColor;
    direction: Direction | null;
    toMineOrder: number | null;
};
export type CubesPositions = {
    left: MaskFieldValue[][];
    right: MaskFieldValue[][];
    top: MaskFieldValue[][];
    bottom: MaskFieldValue[][];
    main: (MaskFieldValue | null)[][];
};

export type TenOnTenState = {
    level: PositiveInteger;
    previous: CubesPositions | null;
    current: CubesPositions;
    isNewLevel: boolean;
};

export class TenOnTen {
    public readonly container: HTMLElement;
    public readonly levelInfoPanel: Element;

    public level: number;
    public readonly cubes: Cubes;

    public moveMap: MoveMap | undefined;
    public end: string | null;

    private readonly undoButton: UndoButton;
    private readonly refreshButton: RefreshButton;
    private readonly levelElement: HTMLElement;

    private readonly lang: keyof (typeof I18N_DICTIONARY)[keyof typeof I18N_DICTIONARY];
    private blockApp: boolean;
    private previousStepMap: CubesPositions | null = null;

    private isNewLevel: Signal<boolean> = new Signal(false);

    private readonly bodySizeValue: Signal<PixelSize>;
    private readonly canUndo: Signal<boolean> = new Signal(false);
    private readonly mainMenuOpen: Signal<boolean> = new Signal(false);

    private readonly callbacks: {
        [key in keyof TenOnTenCallbacks]: TenOnTenCallbacks[key][];
    } = {
            onAfterMove: [],
            onAfterUndo: [],
            onAfterNextLevel: [],
            onAfterNextLevelRefresh: [],
            onAfterNewGameStarted: [],
            onAfterOpenMenu: [],
        };

    public constructor({
        container,
        initialState,
    }: {
        container: HTMLElement;
        initialState?: TenOnTenState;
    }) {

        this.container = container;
        // this.container.tabIndex = 0;

        const document = container.ownerDocument;
        const window = document.defaultView!;
        const body = document.body;
        function getBodySizeValue(): PixelSize {
            return {
                width: body.clientWidth,
                height: body.clientHeight,
            };
        }

        const setContainerFontSize = () => {
            const { width, height } = this.bodySizeValue.value();
            const bodyMinSize = Math.min(width, height);
            const MAX_CONTAINER_SIZE = 640;
            const containerSize = Math.min(bodyMinSize, MAX_CONTAINER_SIZE);

            this.container.style.fontSize = `${containerSize / APP_WIDTH_IN_CUBES}px`;
            this.container.style.width = `${containerSize}px`;
            this.container.style.height = `${containerSize}px`;
        };

        this.bodySizeValue = new Signal<PixelSize>(getBodySizeValue(), deepEqual);
        window.addEventListener('resize', () => {
            this.bodySizeValue.next(getBodySizeValue());
            setContainerFontSize();
        });
        setContainerFontSize();

        document.addEventListener('keydown', (e) => {
            const isCtrlOrMeta = e.metaKey || e.ctrlKey;
            if (!isCtrlOrMeta) {
                return;
            }

            const isZKey = e.key === 'z';
            if (!isZKey) {
                return;
            }
        });

        // получаем коллекцию кубиков и устанавливаем в параметрах проложение,
        // которому эти кубики принадлежат
        this.cubes = new Cubes({ app: this });

        // индикатор состояния приложения - разрешены какие-либо действия пользователя или нет
        this.blockApp = false;

        // уровень 1-10 11-60(16-65)
        this.level = 1;

        // язык
        this.lang = 'en';

        // датчик конца хода
        this.end = null;

        const background = document.createElement('div');
        background.classList.add('backgroundField');

        for (let key = 0; key < BOARD_SIZE * BOARD_SIZE; key++) {
            const backgroundCube = document.createElement('div');
            backgroundCube.classList.add('backgroundCube');
            background.appendChild(backgroundCube);
        }

        this.container.classList.add('tenOnTenContainer');
        this.container.appendChild(background);

        const levelInfoPanel = document.createElement('div');
        levelInfoPanel.classList.add('levelInfoPanel');
        this.container.appendChild(levelInfoPanel);
        this.levelInfoPanel = levelInfoPanel;

        const levelElement = document.createElement('div');
        levelElement.classList.add('level');
        levelElement.textContent = String(this.level);
        this.levelElement = levelElement;
        levelInfoPanel.appendChild(levelElement);

        const levelLabel = document.createElement('div');
        levelLabel.classList.add('levelLabel');
        levelLabel.textContent = I18N_DICTIONARY.level[this.lang];
        levelInfoPanel.appendChild(levelLabel);

        const actionButtons = document.createElement('div');
        actionButtons.classList.add('actionButtons');
        this.container.appendChild(actionButtons);

        this.undoButton = new UndoButton({
            onClick: this.undo,
            container: actionButtons,
        });
        this.canUndo.subscribe((canUndo) => {
            this.undoButton.setVisible(canUndo);
        });
        this.canUndo.next(initialState?.previous ? true : false);

        this.refreshButton = new RefreshButton({
            onClick: this.refresh,
            container: actionButtons,
        });
        this.isNewLevel.subscribe((isNewLevel) => {
            this.refreshButton.setVisible(isNewLevel);
        });
        if (initialState?.isNewLevel) {
            this.isNewLevel.next(true);
        }

        const mainMenuPanel = document.createElement('div');
        mainMenuPanel.classList.add('mainMenuPanel');
        this.container.appendChild(mainMenuPanel);

        const mainMenuElement = document.createElement('div');
        mainMenuElement.style.display = 'none';
        this.mainMenuOpen.subscribe((isOpen) => {
            mainMenuElement.style.display = isOpen ? 'flex' : 'none';
        });
        mainMenuElement.classList.add('mainMenu');
        const mainMenuItemsElement = document.createElement('div');
        mainMenuItemsElement.classList.add('mainMenuItems');
        mainMenuElement.appendChild(mainMenuItemsElement);
        const MAIN_MENU_ITEMS = [
            {
                label: I18N_DICTIONARY.newGame[this.lang],
                onClick: () => {
                    this.startNewGame();
                },
            },
            {
                label: I18N_DICTIONARY.close[this.lang],
                onClick: noop,
            },
        ];
        MAIN_MENU_ITEMS.forEach(({ label, onClick }) => {
            const mainMenuItemElement = document.createElement('div');
            mainMenuItemElement.classList.add('mainMenuItem');
            mainMenuItemElement.textContent = label;
            mainMenuItemElement.addEventListener('click', () => {
                onClick();
                this.mainMenuOpen.next(false);
            });
            mainMenuItemsElement.appendChild(mainMenuItemElement);
        });
        this.container.appendChild(mainMenuElement);

        new MenuButton({
            onClick: () => {
                this.mainMenuOpen.next(true);
            },
            container: mainMenuPanel,
        });

        this.createSideCubes(initialState);

        if (initialState) {
            this.setState(initialState);
        } else {
            this.generateMainCubes();
        }

        this.mainMenuOpen.subscribe((isOpen) => {
            if (isOpen) {
                callFunctions(this.callbacks.onAfterOpenMenu);
            }
        });
    }

    public getState(): TenOnTenState {
        return {
            level: this.level,
            previous: this.previousStepMap,
            current: this.generateMask(),
            isNewLevel: this.isNewLevel.value(),
        };
    }

    public setState(state: TenOnTenState) {
        this.setLevel(state.level);

        this.isNewLevel.next(state.isNewLevel);

        this.previousStepMap = state.previous;
        this.applyCubesState(state.current);
    }

    // даем возможность пользователю при переходе на новый уровень выбрать из случайных
    // комбинаций начальную
    public refresh = () => {
        this.blockApp = true;
        const cubesLocal = this.cubes;
        // Удаляем нафиг кубики с главного поля
        cubesLocal.mainCubes.forEach((cube) => {
            cubesLocal._removeMainCube({
                x: cube.x,
                y: cube.y,
            });
            cube.animate({
                action: 'remove',
                steps: 4,
            });
        });
        setTimeout(
            () => {
                this.generateMainCubes();
                setTimeout(
                    () => {
                        this.blockApp = false;
                        callFunctions(this.callbacks.onAfterNextLevelRefresh);
                    },
                    ANIMATION_TIME * 8
                );
            },
            ANIMATION_TIME
        );
    };

    // переводим игру на следующий уровень
    public nextLevel() {
        const colorsCount = getLevelColorsCount(this.level);

        this.setLevel(this.level + 1);

        if (getLevelColorsCount(this.level) > colorsCount) {
            this.plusColor();
        }
        this.generateMainCubes();

        this.previousStepMap = null;
        this.isNewLevel.next(true);
        this.canUndo.next(false);

        callFunctions(this.callbacks.onAfterNextLevel);
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
            () => {
                this.blockApp = false;

                callFunctions(this.callbacks.onAfterUndo);
            },
            ANIMATION_TIME * 4
        );

        this.canUndo.next(false);

        // пробегаем в массиве по каждому кубику предыдущего массива
        const previousStepMap = this.previousStepMap!;

        this.applyCubesState(previousStepMap);

        this.previousStepMap = null;
    };

    public async run(clickedSideCubeAddress: SideCubeAddress) {
        // Если по боковому полю - ищем первые кубики в одной линии бокового поля с кубиком, по  которому щелкнули,
        // которые могут выйти из поля
        const startCubes = getAllCubesInCursorPositionThatCouldGoToMain({
            mainCubes: this.cubes.mainCubes,
            sideCubesMask: this.cubes.sideCubes,
            originCubeAddress: clickedSideCubeAddress,
        });

        // если пришел не массив - выполняем анимацию 🤷‍♂️ что ничего сделать нельзя
        if (typeof startCubes === 'string') {
            const cube = getSideCubeViewByAddress(this.cubes.sideCubes, clickedSideCubeAddress);

            animateCubeBump({
                isVertical: clickedSideCubeAddress.field === 'top' || clickedSideCubeAddress.field === 'bottom',
                element: cube.element,
                duration: ANIMATION_TIME * 4,
            });
            return;
        }

        this.isNewLevel.next(false);

        // создаем маску для возможности возврата хода
        this.previousStepMap = this.generateMask();

        // Создаем массив из всех кубиков, которые есть на доске
        const mainFieldCubes: CubeView[] = [];
        this.cubes.mainCubes.forEach((cube) => {
            mainFieldCubes.push(cube);
        });

        const moveMap = new MoveMap({
            startCubes,
            mainFieldCubes,
            app: this,
        });
        this.moveMap = moveMap;

        const { cubesMove } = moveMap;

        // блокируем приложение от начала до конца анимации
        // минус один - потому, что в последний такт обычно анимация чисто символическая
        this.blockApp = true;

        // поскольку у каждого кубика одинаковое число шагов анимации, чтобы
        // узнать общую продолжительность анимации, просто берем длину шагов первого попавшегося кубика
        const animationLength = cubesMove.cubesToMove[0].moving.steps.length;

        // пошаговый запуск анимации
        this.moveMap.animate({
            startCubes,
            cubesMask: this.cubes.sideCubes,
            animationsScript: this.moveMap.animationsScript,
            animationLength,
            beyondTheSide: this.moveMap.beyondTheSide,
        }).then(() => {
            // разблокируем кнопку назад, если не случился переход на новый уровень
            // иначе - блокируем
            this.canUndo.next(this.end !== 'next_level');

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
        this.cubes._mergeMoveMap({
            movingCubes: cubesMove.cubesToMove.map(({ moving }) => moving),
            startCubes,
            toSideActions: this.moveMap.toSideActions,
        });

        this.checkStepEnd();

        callFunctions(this.callbacks.onAfterMove);
    }

    public on(event: keyof TenOnTenCallbacks, callback: TenOnTenCallbacks[keyof TenOnTenCallbacks]) {
        this.callbacks[event].push(callback);
    }

    /**
     * Вырезаем кубики из боковой линии и заполняем последние элементы в этой линии
     */
    public cutCubesFromLineAndFillByNewOnes(startCubes: CubeView[]) {
        const field = startCubes[0].field.value();

        if (field === 'main') {
            throw new Error('cutCubesFromLineAndFillByNewOnes: startCubes[0].field === "main"');
        }

        // Получаем линию
        const line = getCubeAddressInSideFieldInOrderFromMain({
            x: startCubes[0].x,
            y: startCubes[0].y,
            field,
        });

        // пробегаемся, меняем значения в коллекции
        for (let key = line.length - 1; key >= startCubes.length; key--) {
            const prevCube = this.cubes._getSideCube(line[key - startCubes.length])!;
            this.cubes._setSideCube(line[key], prevCube);
            prevCube.x = line[key].x;
            prevCube.y = line[key].y;
        }
        // генерируем кубики для крайних значений в линии
        for (let key = 0; key < startCubes.length; key++) {
            this.cubes._setSideCube(
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

    private applyCubesState(previousStepMap: CubesPositions) {
        // массив, в котором описаны все различия между текущим и предыдущим состоянием
        const changed: {
            field: Field;
            x: number;
            y: number;
            pCube: MaskFieldValue | null;
            cube: CubeView | null;
            action: string;
        }[] = [];
        if (previousStepMap) {
            for (const fieldName in previousStepMap) {
                for (const x in previousStepMap[fieldName as Field]) {
                    for (const y in previousStepMap[fieldName as Field][x]) {
                        const xNumber = parseInt(x);
                        const yNumber = parseInt(y);
                        const pCube: MaskFieldValue | null = previousStepMap[fieldName as Field][xNumber][yNumber];

                        // берем соответствующее значение текущей маски для сравнения
                        const cube = fieldName === 'main'
                            ? this.cubes._getMainCube({
                                x: xNumber,
                                y: yNumber,
                            })
                            : this.cubes._getSideCube({
                                field: fieldName as Direction,
                                x: xNumber,
                                y: yNumber,
                            });
                        // если предыдущее - null
                        if (!pCube) {
                            // а новое - что-то другое
                            // удаляем кубик из нового значения
                            if (cube) {
                                changed.push({
                                    field: fieldName as Field,
                                    x: xNumber,
                                    y: yNumber,
                                    pCube: null,
                                    cube: cube ?? null,
                                    action: 'remove',
                                });
                            }
                        } else {
                            // если же раньше тут тоже был кубик
                            // а сейчас кубика нету
                            // заполняем клетку кубиком
                            if (!cube) {
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
                                        cube[prop as keyof CubeView] !== pCube[prop as keyof MaskFieldValue]
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
                if (changed[key].field !== 'main') {
                    throw new Error('only main field cube is able to be removed');
                }
                // удаляем нафиг кубик
                this.cubes._removeMainCube({
                    x: changed[key].x,
                    y: changed[key].y,
                });

                assertObject(cube);

                cube.animate({
                    action: 'remove',
                    steps: 4,
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
                    this.cubes._getMainCube({
                        x: Number(x),
                        y: Number(y),
                    })!.toMineOrder = value.toMineOrder!;
                }
            }
        }
    }

    private createSideCubes(initialState?: TenOnTenState) {
        // запускаем инициализацию приложения
        // генерируем кубики в боковых панелях
        this.cubes._sideEach((cube, field, x, y) => {
            if (cube) {
                cube.removeElementFromDOM();
            }

            this.createCube({
                x,
                y,
                field,
                color: initialState
                    ? initialState.current[field as Direction][x][y].color
                    : getRandomColorForCubeLevel(this.level),
                appearWithAnimation: false,
                direction: null,
                toMineOrder: null,
            });
        });
    }

    private setLevel(level: number) {
        this.level = level;
        this.levelElement.textContent = String(level);
    }

    private readonly handleCubeClick = ({
        x,
        y,
        field,
    }: CubeAddress) => {
        // Если стоит блокировка событий приложения - не даём пользователю ничего сделать
        if (this.blockApp) {
            return;
        }

        // Если щелчок произошел по главному полю - ничего не делаем
        if (field === 'main') {
            const cube = this.cubes._getMainCube({
                x,
                y,
            });

            assertObject(cube);

            animateCubeBump({
                element: cube.element,
                duration: ANIMATION_TIME * 2,
                isVertical: randomBoolean(),
            });
            return;
        }

        const sideCubeAddress: SideCubeAddress = {
            x,
            y,
            field,
        };

        // отправляем в путь-дорогу
        this.run(sideCubeAddress);
    };

    private readonly handleHover = (hoveredCube: CubeView, isHovered: boolean) => {
        const field = hoveredCube.field.value();

        if (field === 'main') {
            return;
        }

        const { x, y } = findCubeInSideCubes({
            sideCubes: this.cubes.sideCubes,
            cube: hoveredCube,
            field,
        });

        const allToFirstInLine = getAllCubesInCursorPositionThatCouldGoToMain({
            mainCubes: this.cubes.mainCubes,
            sideCubesMask: this.cubes.sideCubes,
            originCubeAddress: {
                x,
                y,
                field,
            },
        });

        if (typeof allToFirstInLine === 'string') {
            return;
        }

        for (const cube of allToFirstInLine) {
            cube.setReadyToMove(isHovered);
        }
    };

    private startNewGame() {
        this.clearMainField();
        this.cubes.sideCubes = createSideCubesMaskWithNullValues();

        this.createSideCubes();

        this.setLevel(1);
        this.generateMainCubes();

        this.previousStepMap = null;
        this.isNewLevel.next(true);
        this.canUndo.next(false);
        callFunctions(this.callbacks.onAfterNewGameStarted);
    }

    private clearMainField() {
        this.cubes.mainCubes.forEach((cube) => {
            cube.removeElementFromDOM();
        });
    }

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
                            if (!this.cubes._getMainCube({
                                x,
                                y,
                            })) {
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
            const appearanceColors: string[] = [];
            for (let key = 0; key < 4; key++) {
                const coordinates: CubeCoordinates = {
                    x: cell!.x,
                    y: cell!.y,
                };

                const prop: 'x' | 'y' = key % 2 == 0 ? 'x' : 'y';
                coordinates[prop] = key < 2 ? coordinates[prop] + 1 : coordinates[prop] - 1;

                if (
                    coordinates.x > -1 && coordinates.y > -1 && coordinates.x < 10 && coordinates.y < 10
                ) {
                    const cube = this.cubes._getMainCube(coordinates);
                    if (cube) {
                        appearanceColors.push(cube.color.value());
                    }
                }
            }

            // цвета, которых нету в смежных
            const noAppearanceColors: CubeColor[] = [];
            for (let key = 0; key < colorsCount; key++) {
                if (appearanceColors.indexOf(CUBE_COLORS_ARRAY[key]) === -1) {
                    noAppearanceColors.push(CUBE_COLORS_ARRAY[key]);
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
                const cube = cubesLocal._getMainCube({
                    x,
                    y,
                });

                // если на поле еще остались кубики, уровень не завершен
                if (cube) {
                    next_level = false;
                }

                // если все крайние панели заполнены - конец игры,
                // если хоть один пустой - игра продолжается
                if (
                    x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1
                ) {
                    if (!cube) {
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
        const newColor = CUBE_COLORS_ARRAY[colorsCount - 1];
        this.cubes._sideEach((cube) => {
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
            mask[field] = fieldValue as MaskFieldValue[][];
            for (let x = 0; x < BOARD_SIZE; x++) {
                fieldValue[x] = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cube = field === 'main'
                        ? cubesLocal._getMainCube({
                            x,
                            y,
                        })
                        : cubesLocal._getSideCube({
                            field,
                            x,
                            y,
                        });

                    if (!cube) {
                        fieldValue[x][y] = null;
                    } else {
                        const resultValue: MaskFieldValue = {
                            color: cube.color.value(),
                            direction: cube.direction.value(),
                            toMineOrder: cube.toMineOrder,
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
        color: CubeColor;
        direction: Direction | null;
        toMineOrder: number | null;
    }) {
        const { field } = params;

        const cube = new CubeView({
            ...params,
            app: this,
            container: this.container,
            onClick: this.handleCubeClick,
            onHover: this.handleHover,
        });

        if (field === 'main') {
            this.cubes._addMainCube(cube);
        } else {
            this.cubes._addSideCube(cube);
        }

        return cube;
    }

}
