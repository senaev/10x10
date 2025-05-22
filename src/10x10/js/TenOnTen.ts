import { PixelSize } from 'senaev-utils/src/types/PixelSize';
import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { callFunctions } from 'senaev-utils/src/utils/Function/callFunctions/callFunctions';
import { noop } from 'senaev-utils/src/utils/Function/noop';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';
import { cloneObject } from 'senaev-utils/src/utils/Object/cloneObject/cloneObject';
import { deepEqual } from 'senaev-utils/src/utils/Object/deepEqual/deepEqual';
import { getObjectEntries } from 'senaev-utils/src/utils/Object/getObjectEntries/getObjectEntries';
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
import {
    CubeColor,
} from '../const/CUBE_COLORS';
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import { animateMove } from '../utils/animateMove';
import { checkStateAndViewsConsistence } from '../utils/checkStateAndViewsConsistence';
import { parseCubeAddressString } from '../utils/CubeAddressString';
import { generateRandomMainFieldState } from '../utils/generateRandomMainFieldState';
import { generateRandomSideCubesForLevel } from '../utils/generateRandomSideCubesForLevel';
import { getLevelColorsCount } from '../utils/getLevelColorsCount';
import { getRandomColorForCubeLevel } from '../utils/getRandomColorForCubeLevel';
import { getStartCubesByStartCubesParameters } from '../utils/getStartCubesByStartCubesParameters';
import { getStartCubesParameters } from '../utils/getStartCubesParameters';
import { isSideCubeAddress } from '../utils/isSideCubeAddress';
import { repaintDebugPanel } from '../utils/repaintDebugPanel';
import { reverseDirection } from '../utils/reverseDirection';
import { setCubeViewPositionOnTheField } from '../utils/setCubeViewPositionOnTheField';

import {
    AnimationScriptWithViews, createMoveMap, CubeAnimation,
    CubeMove,
} from './createMoveMap';
import {
    CubeAddress,
    CubeCoordinates,
    CubesViews,
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

export type MainFieldCubeWithCoordinates = MainFieldCubeStateValue & CubeCoordinates;

export type MainFieldCubesState = (MainFieldCubeStateValue | null)[][];

export type SideFieldCubeStateValue = {
    color: CubeColor;
};

export type SideFieldsCubesState = {
    left: SideFieldCubeStateValue[][];
    right: SideFieldCubeStateValue[][];
    top: SideFieldCubeStateValue[][];
    bottom: SideFieldCubeStateValue[][];
};

export type CubesState = SideFieldsCubesState & {
    main: MainFieldCubesState;
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
    public readonly cubesViews: CubesViews;

    public end: string | null;

    private readonly undoButton: UndoButton;
    private readonly refreshButton: RefreshButton;
    private readonly levelElement: HTMLElement;

    private readonly lang: keyof (typeof I18N_DICTIONARY)[keyof typeof I18N_DICTIONARY];
    private blockApp: boolean;

    private mainFieldCubesState: MainFieldCubesState;
    private sideFieldCubesState: SideFieldsCubesState;

    /**
     * Стейт, который используется для возврата хода
     */
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

        const background = document.createElement('div');
        background.classList.add('backgroundField');
        for (let key = 0; key < BOARD_SIZE * BOARD_SIZE; key++) {
            const backgroundCube = document.createElement('div');
            backgroundCube.classList.add('backgroundCube');
            background.appendChild(backgroundCube);
        }
        this.tenOnTenContainer.appendChild(background);

        this.cubesContainer = document.createElement('div');
        this.cubesContainer.classList.add('cubesContainer');
        this.tenOnTenContainer.appendChild(this.cubesContainer);

        if (localStorage.show_debug_panel) {
            const debugPanel = document.createElement('div');
            debugPanel.classList.add('debugPanel');
            container.appendChild(debugPanel);

            setInterval(() => {
                repaintDebugPanel({
                    mainFieldCubesState: this.mainFieldCubesState,
                    sideFieldCubesState: this.sideFieldCubesState,
                    element: debugPanel,
                });
            }, 1000);
        }

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

        // индикатор состояния приложения - разрешены какие-либо действия пользователя или нет
        this.blockApp = false;

        // уровень 1-10 11-60(16-65)
        this.level = 1;

        // язык
        this.lang = 'en';

        // датчик конца хода
        this.end = null;

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
            onClick: this.refreshMainCubesOnTheStartOfTheLevel,
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

        if (initialState) {
            this.mainFieldCubesState = initialState.current.main;
            this.sideFieldCubesState = {
                left: initialState.current.left,
                right: initialState.current.right,
                top: initialState.current.top,
                bottom: initialState.current.bottom,
            };
        } else {
            this.mainFieldCubesState = generateRandomMainFieldState(this.level);
            this.sideFieldCubesState = generateRandomSideCubesForLevel(this.level);
        }

        // получаем коллекцию кубиков и устанавливаем в параметрах проложение,
        // которому эти кубики принадлежат
        this.cubesViews = new CubesViews();

        this.generateMainCubeViews();
        this.generateSideCubeViews();

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
            current: cloneObject({
                main: this.mainFieldCubesState,
                ...this.sideFieldCubesState,
            }),
            isNewLevel: this.isNewLevel.value(),
        };
    }

    public setState(state: TenOnTenState) {
        this.mainFieldCubesState = state.current.main;
        this.sideFieldCubesState = {
            left: state.current.left,
            right: state.current.right,
            top: state.current.top,
            bottom: state.current.bottom,
        };

        this.setLevel(state.level);
        this.isNewLevel.next(state.isNewLevel);

        this.previousState = state.previous;

        this.applyCubesState(state.current);
    }

    // Даем возможность пользователю при переходе на новый уровень выбрать из случайных
    // комбинаций начальных кубиков
    public refreshMainCubesOnTheStartOfTheLevel = () => {
        // this.blockApp = true;
        // const cubesLocal = this.cubesViews;
        // // Удаляем нафиг кубики с главного поля
        // cubesLocal.mainCubesSet.forEach((cube) => {
        //     cubesLocal._removeMainCube({
        //         x: cube.x,
        //         y: cube.y,
        //     });
        //     cube.animate({
        //         animation: 'remove',
        //         steps: 4,
        //     });
        // });
        // setTimeout(
        //     () => {
        //         this.mainFieldCubesState = generateRandomMainFieldState(this.level);
        //         this.generateMainCubes();
        //         setTimeout(
        //             () => {
        //                 this.blockApp = false;
        //                 callFunctions(this.callbacks.onAfterNextLevelRefresh);
        //             },
        //             ANIMATION_TIME * 8
        //         );
        //     },
        //     ANIMATION_TIME
        // );
    };

    // переводим игру на следующий уровень
    public nextLevel() {
        const colorsCount = getLevelColorsCount(this.level);

        this.setLevel(this.level + 1);

        if (getLevelColorsCount(this.level) > colorsCount) {
            this.plusColor();
        }

        this.mainFieldCubesState = generateRandomMainFieldState(this.level);
        this.sideFieldCubesState = generateRandomSideCubesForLevel(this.level);
        this.generateMainCubeViews();

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
            mainFieldCubesState: this.mainFieldCubesState,
            sideCubeAddress: clickedSideCubeAddress,
        });

        // если пришел не массив - выполняем анимацию 🤷‍♂️ что ничего сделать нельзя
        if (startCubesParameters === undefined) {
            const cube = this.cubesViews.getOneExistingCubeViewByAddress(clickedSideCubeAddress);
            assertObject(cube);

            animateCubeBump({
                isVertical: clickedSideCubeAddress.field === 'top' || clickedSideCubeAddress.field === 'bottom',
                element: cube.element,
                duration: ANIMATION_TIME * 4,
            });
            return;
        }

        this.isNewLevel.next(false);

        this.previousState = this.getState().current;

        const {
            animationsScript,
            mainFieldCubesState,
            sideFieldsCubesState,
            moves,
            unshiftCubes,
        } = createMoveMap({
            startCubesParameters,
            mainFieldCubesState: this.mainFieldCubesState,
            sideFieldsCubesState: this.sideFieldCubesState,
            colorsForUnshiftCubes: createArray(BOARD_SIZE).map(() => getRandomColorForCubeLevel(this.level)),
        });

        this.sideFieldCubesState = sideFieldsCubesState;

        this.mainFieldCubesState = mainFieldCubesState;

        // блокируем приложение от начала до конца анимации
        // минус один - потому, что в последний такт обычно анимация чисто символическая
        this.blockApp = true;

        const animationScriptWithViews: AnimationScriptWithViews = new Map<CubeView, CubeAnimation[]>();

        getObjectEntries(animationsScript).forEach(([
            cubeAddressString,
            animations,
        ]) => {
            const {
                x,
                y,
                field,
            } = parseCubeAddressString(cubeAddressString);

            const cube = this.cubesViews.getOneExistingCubeViewByAddress({
                x,
                y,
                field,
            });

            assertObject(cube, 'cube is undefined');

            animationScriptWithViews.set(cube, animations);
        });

        // пошаговый запуск анимации
        await animateMove({
            animationScriptWithViews,
        });

        // разблокируем кнопку назад, если не случился переход на новый уровень
        // иначе - блокируем
        this.canUndo.next(this.end !== 'next_level');

        if (this.end !== null) {
            switch (this.end) {
            case 'next_level':
                this.nextLevel();
                break;
            case 'game_over':
                // eslint-disable-next-line no-alert
                alert('game over');
                break;
            default:
                throw new Error(`Неверное значение в app.end: ${this.end}`);
            }
        }

        // Актуализируем положение вьюх кубиков на поле
        const movesWithExtractedCubes: (CubeMove & {cubeView: CubeView})[] = moves.map((move) => {
            return {
                ...move,
                cubeView: this.cubesViews.extractOneExistingCubeViewByAddress(parseCubeAddressString(move.initialAddress)),
            };
        });

        movesWithExtractedCubes.forEach((move) => {
            if (move.type === 'shift') {
                move.cubeView.removeElementFromDOM();
                return;
            }

            if (move.type === 'explode') {
                // already removed (extracted) from cubesViews
                return;
            }

            if (move.type === 'move') {
                this.cubesViews.addCubeView(move.cubeView, move.address);

                if (isSideCubeAddress(move.address)) {
                    move.cubeView.direction.next(reverseDirection(move.address.field));
                }

                return;
            }

            throw new Error('move type is not supported');
        });

        unshiftCubes.forEach(({ initialAddress, color }) => {
            const {
                x, y, field,
            } = parseCubeAddressString(initialAddress);

            if (field === 'main') {
                throw new Error('unshift cube on main field');
            }

            this.createCubeViewAndAddToBoard({
                x,
                y,
                field,
                color,
                direction: reverseDirection(field),
            });
        });

        this.checkStepEnd();

        checkStateAndViewsConsistence({
            state: {
                main: this.mainFieldCubesState,
                ...this.sideFieldCubesState,
            },
            views: this.cubesViews.store,
            cubesContainer: this.cubesContainer,
        });

        this.blockApp = false;

        callFunctions(this.callbacks.onAfterMove);
    }

    public on(event: keyof TenOnTenCallbacks, callback: TenOnTenCallbacks[keyof TenOnTenCallbacks]) {
        this.callbacks[event].push(callback);
    }

    private applyCubesState(state: CubesState) {
        this.generateSideCubeViews();

        state.main.forEach((row, x) => {
            row.forEach((cube, y) => {
                if (cube) {
                    this.createCubeViewAndAddToBoard({
                        x,
                        y,
                        field: 'main',
                        color: cube.color,
                        direction: cube.direction,
                    });
                }
            });
        });
    }

    private generateSideCubeViews() {
        DIRECTIONS.forEach((field) => {
            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cubeState = this.sideFieldCubesState[field][x][y];

                    this.createCubeViewAndAddToBoard({
                        x,
                        y,
                        field,
                        color: cubeState.color,
                        direction: reverseDirection(field),
                    });
                }
            }
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

        const cubeAddress = this.cubesViews.getCubeAddress(cube);
        if (!cubeAddress) {
            throw new Error('cubeAddress of clicked cube is not found');
        }

        if (!isSideCubeAddress(cubeAddress)) {
            animateCubeBump({
                element: cube.element,
                duration: ANIMATION_TIME * 2,
                isVertical: randomBoolean(),
            });
            return;
        }

        this.run(cubeAddress);
    };

    private readonly handleHover = (hoveredCube: CubeView, isHovered: boolean) => {
        const cubeAddress = this.cubesViews.getCubeAddress(hoveredCube);

        if (!cubeAddress) {
            throw new Error('cubeAddress of hovered cube is not found');
        }

        if (!isSideCubeAddress(cubeAddress)) {
            return;
        }

        const startCubesParameters = getStartCubesParameters({
            mainFieldCubesState: this.mainFieldCubesState,
            sideCubeAddress: cubeAddress,
        });

        if (!startCubesParameters) {
            return;
        }

        const { startCubes: allToFirstInLineAddresses } = getStartCubesByStartCubesParameters({
            startCubesParameters,
        });

        const allToFirstInLine = allToFirstInLineAddresses
            .map((address) => this.cubesViews.getOneExistingCubeViewByAddress(address));

        for (const cube of allToFirstInLine) {
            assertObject(cube);

            cube.setReadyToMove(isHovered);
        }
    };

    private startNewGame() {
        // eslint-disable-next-line no-alert
        alert('start new game');
    }

    // генерируем кубики на главном поле
    private generateMainCubeViews() {
        this.mainFieldCubesState.forEach((row, x) => {
            row.forEach((cube, y) => {
                if (cube) {
                    this.createCubeViewAndAddToBoard({
                        x,
                        y,
                        field: 'main',
                        color: cube.color,
                        direction: cube.direction,
                    });
                }
            });
        });
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
        const cubesLocal = this.cubesViews;
        let game_over = true;
        let next_level = true;

        for (let x = 0; x < BOARD_SIZE; x++) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                const cube = cubesLocal.getCubeViewByAddress({
                    x,
                    y,
                    field: 'main',
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
        // const colorsCount = getLevelColorsCount(this.level);
        // const newColor = CUBE_COLORS_ARRAY[colorsCount - 1];
        // this.cubesViews.sideEach((cube) => {
        //     if (getRandomIntegerInARange(0, colorsCount - 1) === 0) {
        //         cube.changeColor(newColor);
        //     }
        // });
    }

    private createCubeViewAndAddToBoard(params: CubeAddress & {
        color: CubeColor;
        direction: Direction | null;
    }): void {
        const {
            field,
            x,
            y,
        } = params;

        const cube = new CubeView({
            ...params,
            container: this.cubesContainer,
            onClick: this.handleCubeClick,
            onHover: this.handleHover,
        });

        setCubeViewPositionOnTheField(cube, params);

        this.cubesViews.addCubeView(cube, {
            field,
            x,
            y,
        });
    }
}
