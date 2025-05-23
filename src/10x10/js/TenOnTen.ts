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
import { promiseTimeout } from 'senaev-utils/src/utils/timers/promiseTimeout/promiseTimeout';

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
import { getStepEndConsequence } from '../utils/getStepEndConsequence';
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

    private readonly undoButton: UndoButton;
    private readonly refreshButton: RefreshButton;
    private readonly levelElement: HTMLElement;

    private readonly lang: keyof (typeof I18N_DICTIONARY)[keyof typeof I18N_DICTIONARY];
    private readonly isAppBlocked: Signal<boolean> = new Signal(false);

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
        this.isAppBlocked.next(false);

        // уровень 1-10 11-60(16-65)
        this.level = 1;

        // язык
        this.lang = 'en';

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

    /**
     * Переводим игру на следующий уровень
     */
    public nextLevel() {
        // ❗️
        const nextLevel = this.level + 1;
        const colorsCount = getLevelColorsCount(this.level);

        this.setLevel(nextLevel);

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
    public readonly undo = async () => {
        // блокируем приложение до тех пор, пока не закончим анимацию
        this.isAppBlocked.next(true);

        this.canUndo.next(false);

        // пробегаем в массиве по каждому кубику предыдущего массива
        const previousState = this.previousState;
        assertObject(previousState, 'previousState is undefined');
        this.previousState = null;

        this.mainFieldCubesState = previousState.main;
        this.sideFieldCubesState = {
            left: previousState.left,
            right: previousState.right,
            top: previousState.top,
            bottom: previousState.bottom,
        };
        this.applyNewCubesState();

        await promiseTimeout(ANIMATION_TIME * 4);

        callFunctions(this.callbacks.onAfterUndo);

        this.isAppBlocked.next(false);
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
            movedCubes: moves,
            unshiftCubes,
            shiftCubes,
            explodedCubes,
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
        this.isAppBlocked.next(true);

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

        // Удаляем кубики, которые удалились, а после анимации удалим вьюшки из DOM
        const removedCubes = [
            ...explodedCubes,
            ...shiftCubes,
        ];
        const removedCubesViews = removedCubes.map((address) => this.cubesViews.extractOneExistingCubeViewByAddress(address));

        // Актуализируем положение вьюх кубиков на поле
        const movesWithExtractedCubes: (CubeMove & {cubeView: CubeView})[] = moves.map((move) => {
            return {
                ...move,
                cubeView: this.cubesViews.extractOneExistingCubeViewByAddress(move.initialAddress),
            };
        });

        movesWithExtractedCubes.forEach((move) => {
            this.cubesViews.addCubeView(move.cubeView, move.newAddress);
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

        // пошаговый запуск анимации
        await animateMove({
            animationScriptWithViews,
        });

        removedCubesViews.forEach((cubeView) => {
            cubeView.removeElementFromDOM();
        });

        // Меняем визуальное направление у кубиков, перемещенных в боковые поля
        // TODO: делать это анимацией в момент вхождения кубика в боковое поле
        movesWithExtractedCubes.forEach(({ newAddress, cubeView }) => {
            if (isSideCubeAddress(newAddress)) {
                cubeView.direction.next(reverseDirection(newAddress.field));
                cubeView.directionVisible.next(false);
            }
        });

        checkStateAndViewsConsistence({
            state: {
                main: this.mainFieldCubesState,
                ...this.sideFieldCubesState,
            },
            views: this.cubesViews.store,
            cubesContainer: this.cubesContainer,
        });

        const endState = getStepEndConsequence(this.mainFieldCubesState);

        // разблокируем кнопку назад, если не случился переход на новый уровень
        // иначе - блокируем
        this.canUndo.next(endState !== 'next_level');

        if (endState !== null) {
            switch (endState) {
            case 'next_level':
                this.nextLevel();
                break;
            case 'game_over':
                // eslint-disable-next-line no-alert
                alert('game over');
                break;
            default:
                throw new Error(`Неверное значение в app.end: ${endState}`);
            }
        }

        this.isAppBlocked.next(false);

        callFunctions(this.callbacks.onAfterMove);
    }

    public subscribe(event: keyof TenOnTenCallbacks, callback: TenOnTenCallbacks[keyof TenOnTenCallbacks]) {
        this.callbacks[event].push(callback);
    }

    private applyNewCubesState() {
        this.cubesViews.sideEach(({
            cube,
            field,
            x,
            y,
        }) => {
            const { color } = this.sideFieldCubesState[field][x][y];

            cube.color.next(color);
        });

        this.cubesViews.mainEach(({
            cube,
            x,
            y,
        }) => {
            const cubeState = this.mainFieldCubesState[x][y];

            if (!cubeState) {
                if (cube) {
                    this.cubesViews.extractOneExistingCubeViewByAddress({
                        x,
                        y,
                        field: 'main',
                    });
                    cube.removeElementFromDOM();
                }
                return;
            }

            if (!cube) {
                this.createCubeViewAndAddToBoard({
                    x,
                    y,
                    field: 'main',
                    color: cubeState.color,
                    direction: cubeState.direction,
                });
                return;
            }

            cube.color.next(cubeState.color);
            cube.direction.next(cubeState.direction);
        });

        checkStateAndViewsConsistence({
            state: {
                main: this.mainFieldCubesState,
                ...this.sideFieldCubesState,
            },
            views: this.cubesViews.store,
            cubesContainer: this.cubesContainer,
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
        if (this.isAppBlocked.value()) {
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
            // Не бросаем ошибку на случай, если в моменте происходит анимация
            // и элементы на поле могут не соответствовать стейту и не находиться в стейте
            return;
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

            cube.directionVisible.next(isHovered);
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

        if (field === 'main') {
            cube.directionVisible.next(true);
        }

        setCubeViewPositionOnTheField(cube, params);

        this.cubesViews.addCubeView(cube, {
            field,
            x,
            y,
        });
    }
}
