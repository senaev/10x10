import { PixelSize } from 'senaev-utils/src/types/PixelSize';
import { shuffleArray } from 'senaev-utils/src/utils/Array/shuffleArray/shuffleArray';
import { callFunctions } from 'senaev-utils/src/utils/Function/callFunctions/callFunctions';
import { noop } from 'senaev-utils/src/utils/Function/noop';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
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
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import { animateMove } from '../utils/animateMove';
import { generateRandomSideCubesForLevel } from '../utils/generateRandomSideCubesForLevel';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { getLevelColorsCount } from '../utils/getLevelColorsCount';
import { getLevelCubesCount } from '../utils/getLevelCubesCount';
import { getLevelCubesPositions } from '../utils/getLevelCubesPositions';
import { getRandomColorForCubeLevel } from '../utils/getRandomColorForCubeLevel';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';
import { getStartCubesByStartCubesParameters } from '../utils/getStartCubesByStartCubesParameters';
import { getStartCubesParameters } from '../utils/getStartCubesParameters';
import { setCubeViewPositionOnTheField } from '../utils/setCubeViewPositionOnTheField';
import { getSideCubeLineId } from '../utils/SideCubesLineIndicator/SideCubesLineIndicator';

import { createMoveMap } from './createMoveMap';
import {
    createSideCubesMaskWithNullValues,
    CubeAddress,
    CubeCoordinates,
    CubesViews,
    findCubeInSideCubes,
    SideCubeAddress,
} from './CubesViews';

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

export type MainFieldCubeStateValue = {
    color: CubeColor;
    direction: Direction | null;
    toMineOrder: UnsignedInteger;
};

export type SideFieldCubeStateValue = {
    color: CubeColor;
};

export type SideCubesState = {
    left: SideFieldCubeStateValue[][];
    right: SideFieldCubeStateValue[][];
    top: SideFieldCubeStateValue[][];
    bottom: SideFieldCubeStateValue[][];
};

export type CubesState = SideCubesState & {
    main: (MainFieldCubeStateValue | null)[][];
};

export type TenOnTenState = {
    level: PositiveInteger;
    previous: CubesState | null;
    current: CubesState;
    isNewLevel: boolean;
};

export class TenOnTen {
    public readonly tenOnTenContainer: HTMLElement;
    public readonly levelInfoPanel: HTMLDivElement;
    public readonly cubesContainer: HTMLDivElement;

    public level: number;
    public readonly cubes: CubesViews;

    public end: string | null;

    private readonly undoButton: UndoButton;
    private readonly refreshButton: RefreshButton;
    private readonly levelElement: HTMLElement;

    private readonly lang: keyof (typeof I18N_DICTIONARY)[keyof typeof I18N_DICTIONARY];
    private blockApp: boolean;

    private previousState: CubesState | null = null;

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

        // this.container.tabIndex = 0;

        const document = container.ownerDocument;
        const window = document.defaultView!;
        const body = document.body;

        this.tenOnTenContainer = document.createElement('div');
        this.tenOnTenContainer.classList.add('tenOnTenContainer');
        container.appendChild(this.tenOnTenContainer);

        this.cubesContainer = document.createElement('div');
        this.cubesContainer.classList.add('cubesContainer');
        this.tenOnTenContainer.appendChild(this.cubesContainer);

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

            this.tenOnTenContainer.style.fontSize = `${containerSize / APP_WIDTH_IN_CUBES}px`;
            this.tenOnTenContainer.style.width = `${containerSize}px`;
            this.tenOnTenContainer.style.height = `${containerSize}px`;
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
        this.cubes = new CubesViews({ app: this });

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
        this.cubesContainer.appendChild(background);

        const levelInfoPanel = document.createElement('div');
        levelInfoPanel.classList.add('levelInfoPanel');
        this.tenOnTenContainer.appendChild(levelInfoPanel);
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
        this.tenOnTenContainer.appendChild(actionButtons);

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
        this.tenOnTenContainer.appendChild(mainMenuPanel);

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
        this.tenOnTenContainer.appendChild(mainMenuElement);

        new MenuButton({
            onClick: () => {
                this.mainMenuOpen.next(true);
            },
            container: mainMenuPanel,
        });

        this.createSideCubes(initialState?.current ?? generateRandomSideCubesForLevel(this.level));

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
            previous: this.previousState,
            current: this.generateMask(),
            isNewLevel: this.isNewLevel.value(),
        };
    }

    public setState(state: TenOnTenState) {
        this.setLevel(state.level);
        this.isNewLevel.next(state.isNewLevel);

        this.previousState = state.previous;

        this.applyCubesState(state.current);
    }

    // даем возможность пользователю при переходе на новый уровень выбрать из случайных
    // комбинаций начальную
    public refresh = () => {
        this.blockApp = true;
        const cubesLocal = this.cubes;
        // Удаляем нафиг кубики с главного поля
        cubesLocal.mainCubesMask.forEach((cube) => {
            cubesLocal._removeMainCube({
                x: cube.x,
                y: cube.y,
            });
            cube.animate({
                animation: 'remove',
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

        this.previousState = null;
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
        const previousStepMap = this.previousState!;

        this.applyCubesState(previousStepMap);

        this.previousState = null;
    };

    public async run(clickedSideCubeAddress: SideCubeAddress) {
        // Если по боковому полю - ищем первые кубики в одной линии бокового поля с кубиком, по  которому щелкнули,
        // которые могут выйти из поля
        const startCubesParameters = getStartCubesParameters({
            mainCubes: this.cubes.mainCubesMask,
            sideCubeAddress: clickedSideCubeAddress,
        });

        // если пришел не массив - выполняем анимацию 🤷‍♂️ что ничего сделать нельзя
        if (startCubesParameters === undefined) {
            const cube = getSideCubeViewByAddress(this.cubes.sideCubesMask, clickedSideCubeAddress);

            animateCubeBump({
                isVertical: clickedSideCubeAddress.field === 'top' || clickedSideCubeAddress.field === 'bottom',
                element: cube.element,
                duration: ANIMATION_TIME * 4,
            });
            return;
        }

        const startCubesAddresses = getStartCubesByStartCubesParameters({
            startCubesParameters,
            sideCubesMask: this.cubes.sideCubesMask,
        });
        const startCubes = startCubesAddresses
            .map((address) => getSideCubeViewByAddress(this.cubes.sideCubesMask, address));

        this.isNewLevel.next(false);

        // создаем маску для возможности возврата хода
        this.previousState = this.generateMask();

        // Создаем массив из всех кубиков, которые есть на доске
        const mainFieldCubes: CubeView[] = [];
        this.cubes.mainCubesMask.forEach((cube) => {
            mainFieldCubes.push(cube);
        });

        const {
            cubesToMove,
            animationsScript,
        } = createMoveMap({
            startCubesParameters,
            mainFieldCubes,
            app: this,
            sideCubesMask: this.cubes.sideCubesMask,
        });

        // блокируем приложение от начала до конца анимации
        // минус один - потому, что в последний такт обычно анимация чисто символическая
        this.blockApp = true;

        // поскольку у каждого кубика одинаковое число шагов анимации, чтобы
        // узнать общую продолжительность анимации, просто берем длину шагов первого попавшегося кубика
        const animationLength = cubesToMove[0].stepActions.length;

        // пошаговый запуск анимации
        animateMove({
            firstCubeAddress: clickedSideCubeAddress,
            startCubesCount: startCubesParameters.count,
            sideCubesMask: this.cubes.sideCubesMask,
            animationsScript,
            animationLength,
            cubes: this.cubes,
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
            movingCubes: cubesToMove,
            startCubes,
            // toSideActions: toSideActions.map(({ movingCube }) => movingCube),
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
        const line = getCubeAddressInSideFieldInOrderFromMain(getSideCubeLineId({
            x: startCubes[0].x,
            y: startCubes[0].y,
            field,
        })).reverse();

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

    private applyCubesState(state: CubesState) {
        this.cubes.sideEach((cube) => {
            cube.removeElementFromDOM();
        });

        this.cubes.mainCubesMask.forEach((cube) => {
            cube.removeElementFromDOM();
        });

        this.cubes.mainCubesMask.clear();

        this.createSideCubes(state);

        state.main.forEach((row, x) => {
            row.forEach((cube, y) => {
                if (cube) {
                    this.createCube({
                        x,
                        y,
                        field: 'main',
                        color: cube.color,
                        appearWithAnimation: false,
                        direction: cube.direction,
                        toMineOrder: cube.toMineOrder,
                    });
                }
            });
        });
    }

    private createSideCubes(state: SideCubesState) {
        // запускаем инициализацию приложения
        // генерируем кубики в боковых панелях
        this.cubes.sideEach((cube, field, x, y) => {
            if (cube) {
                cube.removeElementFromDOM();
            }

            this.createCube({
                x,
                y,
                field,
                color: state[field][x][y].color,
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

    private readonly handleCubeClick = (cube: CubeView) => {
        // Если стоит блокировка событий приложения - не даём пользователю ничего сделать
        if (this.blockApp) {
            return;
        }

        const isMainCube = this.cubes.mainCubesMask.has(cube);
        if (isMainCube) {
            animateCubeBump({
                element: cube.element,
                duration: ANIMATION_TIME * 2,
                isVertical: randomBoolean(),
            });
            return;
        }

        const sideCubeAddress = findCubeInSideCubes({
            sideCubes: this.cubes.sideCubesMask,
            cube,
        });

        if (!sideCubeAddress) {
            throw new Error('sideCubeAddress of clicked cube is not found');
        }

        // отправляем в путь-дорогу
        this.run(sideCubeAddress);
    };

    private readonly handleHover = (hoveredCube: CubeView, isHovered: boolean) => {
        const isMainCube = this.cubes.mainCubesMask.has(hoveredCube);

        if (isMainCube) {
            return;
        }

        const sideCubeAddress = findCubeInSideCubes({
            sideCubes: this.cubes.sideCubesMask,
            cube: hoveredCube,
        });

        if (!sideCubeAddress) {
            // cube could be removed from the board despite the fact that view is still there
            return;
        }

        const startCubesParameters = getStartCubesParameters({
            mainCubes: this.cubes.mainCubesMask,
            sideCubeAddress,
        });

        if (!startCubesParameters) {
            return;
        }

        const allToFirstInLineAddresses = getStartCubesByStartCubesParameters({
            startCubesParameters,
            sideCubesMask: this.cubes.sideCubesMask,
        });

        const allToFirstInLine = allToFirstInLineAddresses
            .map((address) => getSideCubeViewByAddress(this.cubes.sideCubesMask, address));

        for (const cube of allToFirstInLine) {
            cube.setReadyToMove(isHovered);
        }
    };

    private startNewGame() {
        this.clearMainField();
        this.cubes.sideCubesMask = createSideCubesMaskWithNullValues();

        this.createSideCubes(generateRandomSideCubesForLevel(this.level));

        this.setLevel(1);
        this.generateMainCubes();

        this.previousState = null;
        this.isNewLevel.next(true);
        this.canUndo.next(false);
        callFunctions(this.callbacks.onAfterNewGameStarted);
    }

    private clearMainField() {
        this.cubes.mainCubesMask.forEach((cube) => {
            cube.removeElementFromDOM();
        });
        this.cubes.mainCubesMask.clear();
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
                if (!appearanceColors.includes(CUBE_COLORS_ARRAY[key])) {
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
        this.cubes.sideEach((cube) => {
            if (getRandomIntegerInARange(0, colorsCount - 1) === 0) {
                cube.changeColor(newColor);
            }
        });
    }

    // генерируем маску для предыдущего хода
    private generateMask(): CubesState {
        const mask: Partial<CubesState> = {};
        const cubesLocal = this.cubes;

        for (const field of DIRECTIONS) {
            const fieldValue: SideFieldCubeStateValue[][] = [];
            mask[field] = fieldValue;
            for (let x = 0; x < BOARD_SIZE; x++) {
                fieldValue[x] = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cube = cubesLocal._getSideCube({
                        field,
                        x,
                        y,
                    });

                    const resultValue: SideFieldCubeStateValue = {
                        color: cube.color.value(),
                    };
                    fieldValue[x][y] = resultValue;
                }
            }
        }

        mask.main = [];
        for (let x = 0; x < BOARD_SIZE; x++) {
            mask.main[x] = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                const cube = cubesLocal._getMainCube({
                    x,
                    y,
                });

                if (cube) {
                    const resultValue: MainFieldCubeStateValue = {
                        color: cube.color.value(),
                        direction: cube.direction.value(),
                        toMineOrder: cube.toMineOrder!,
                    };
                    mask.main[x][y] = resultValue;
                } else {
                    mask.main[x][y] = null;
                }
            }
        }

        return mask as CubesState;
    }

    private createCube(params: CubeAddress & {
        appearWithAnimation: boolean;
        color: CubeColor;
        direction: Direction | null;
        toMineOrder: number | null;
    }) {
        const {
            field,
            x,
            y,
        } = params;

        const cube = new CubeView({
            ...params,
            app: this,
            container: this.cubesContainer,
            onClick: this.handleCubeClick,
            onHover: this.handleHover,
        });

        setCubeViewPositionOnTheField(cube, params);

        if (field === 'main') {
            this.cubes._addMainCube(cube);
        } else {
            this.cubes._addSideCube(cube, {
                field,
                x,
                y,
            });
        }

        return cube;
    }

}
