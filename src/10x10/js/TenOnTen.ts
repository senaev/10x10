import { PixelSize } from 'senaev-utils/src/types/PixelSize';
import { callFunctions } from 'senaev-utils/src/utils/Function/callFunctions/callFunctions';
import { noop } from 'senaev-utils/src/utils/Function/noop';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { cloneObject } from 'senaev-utils/src/utils/Object/cloneObject/cloneObject';
import { deepEqual } from 'senaev-utils/src/utils/Object/deepEqual/deepEqual';
import { getObjectEntries } from 'senaev-utils/src/utils/Object/getObjectEntries/getObjectEntries';
import { mapObjectValues } from 'senaev-utils/src/utils/Object/mapObjectValues/mapObjectValues';
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
import {
    CUBE_COLORS, CUBE_COLORS_ARRAY, CubeColor,
} from '../const/CUBE_COLORS';
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { FIELD_OFFSETS } from '../const/FIELD_OFFSETS';
import { I18N_DICTIONARY } from '../const/I18N_DICTIONARY';
import { animateMove } from '../utils/animateMove';
import { generateRandomSideCubesForLevel } from '../utils/generateRandomSideCubesForLevel';
import { generateRandomStateForLevel } from '../utils/generateRandomStateForLevel';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { getLevelColorsCount } from '../utils/getLevelColorsCount';
import { getRandomColorForCubeLevel } from '../utils/getRandomColorForCubeLevel';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';
import { getStartCubesByStartCubesParameters } from '../utils/getStartCubesByStartCubesParameters';
import { getStartCubesParameters } from '../utils/getStartCubesParameters';
import { setCubeViewPositionOnTheField } from '../utils/setCubeViewPositionOnTheField';
import { getSideCubeLineId } from '../utils/SideCubesLineIndicator/SideCubesLineIndicator';

import {
    AnimationScriptWithViews, createMoveMap, CubeAnimation,
} from './createMoveMap';
import {
    createSideCubesMaskWithNullValues,
    CubeAddress,
    CubeCoordinates,
    CubesViews,
    findCubeInSideCubes,
    SideCubeAddress,
} from './CubesViews';
import { parseCubeAddressString } from './MovingCube';

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

const START_LEVEL = 1;

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

function repaintDebugPanel({
    state,
    element,
}: {
    state: CubesState;
    element: HTMLElement;
}) {
    element.innerHTML = '';
    getObjectEntries(state).forEach(([
        field,
        cubes,
    ]) => {
        cubes.forEach((row, x) => {
            row.forEach((cube, y) => {
                if (!cube) {
                    return;
                }

                const cubeElement = document.createElement('div');
                cubeElement.classList.add('debugPanelCube');
                cubeElement.style.backgroundColor = CUBE_COLORS[cube.color];

                const oneCubeSize = 100 / (BOARD_SIZE * 3);
                const position = {
                    left: FIELD_OFFSETS[field].x + x + BOARD_SIZE,
                    top: FIELD_OFFSETS[field].y + y + BOARD_SIZE,
                };

                cubeElement.style.left = `${position.left * oneCubeSize}%`;
                cubeElement.style.top = `${position.top * oneCubeSize}%`;

                element.appendChild(cubeElement);
            });
        });

    });
}

export class TenOnTen {
    public readonly tenOnTenContainer: HTMLElement;
    public readonly levelInfoPanel: HTMLDivElement;
    public readonly cubesContainer: HTMLDivElement;

    public level: number;
    public cubesViews: CubesViews;

    public end: string | null;

    private readonly undoButton: UndoButton;
    private readonly refreshButton: RefreshButton;
    private readonly levelElement: HTMLElement;

    private readonly lang: keyof (typeof I18N_DICTIONARY)[keyof typeof I18N_DICTIONARY];
    private blockApp: boolean;

    private state: CubesState;
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

        if (localStorage.show_debug_panel) {
            const debugPanel = document.createElement('div');
            debugPanel.classList.add('debugPanel');
            container.appendChild(debugPanel);

            setInterval(() => {
                repaintDebugPanel({
                    state: this.state,
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

        // получаем коллекцию кубиков и устанавливаем в параметрах проложение,
        // которому эти кубики принадлежат
        this.cubesViews = new CubesViews({ app: this });

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

        if (initialState) {
            this.state = initialState.current;
            this.setState(initialState);
        } else {
            this.state = generateRandomStateForLevel({
                level: this.level,
            });

            this.generateMainCubes();
        }

        this.createSideCubes(this.state);

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
            current: cloneObject(this.state),
            isNewLevel: this.isNewLevel.value(),
        };
    }

    public setState(state: TenOnTenState) {
        this.state = state.current;

        this.setLevel(state.level);
        this.isNewLevel.next(state.isNewLevel);

        this.previousState = state.previous;

        this.applyCubesState(state.current);
    }

    // даем возможность пользователю при переходе на новый уровень выбрать из случайных
    // комбинаций начальную
    public refresh = () => {
        this.blockApp = true;
        const cubesLocal = this.cubesViews;
        // Удаляем нафиг кубики с главного поля
        cubesLocal.mainCubesSet.forEach((cube) => {
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
                this.state = generateRandomStateForLevel({
                    level: this.level,
                });
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

        this.state = generateRandomStateForLevel({
            level: this.level,
        });
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
            mainCubes: this.cubesViews.mainCubesSet,
            sideCubeAddress: clickedSideCubeAddress,
        });

        // если пришел не массив - выполняем анимацию 🤷‍♂️ что ничего сделать нельзя
        if (startCubesParameters === undefined) {
            const cube = getSideCubeViewByAddress(this.cubesViews.sideCubesMask, clickedSideCubeAddress);

            animateCubeBump({
                isVertical: clickedSideCubeAddress.field === 'top' || clickedSideCubeAddress.field === 'bottom',
                element: cube.element,
                duration: ANIMATION_TIME * 4,
            });
            return;
        }

        this.isNewLevel.next(false);

        // создаем маску для возможности возврата хода
        this.previousState = this.generateMask();

        // Создаем массив из всех кубиков, которые есть на доске
        const mainFieldCubes: CubeView[] = [];
        this.cubesViews.mainCubesSet.forEach((cube) => {
            mainFieldCubes.push(cube);
        });

        const {
            animationsScript,
            mainFieldCubesState,
            sideFieldsCubesState,
        } = createMoveMap({
            startCubesParameters,
            mainFieldCubesState: this.state.main,
            sideFieldsCubesState: mapObjectValues(this.cubesViews.sideCubesMask, (cubesTable) => cubesTable.map((cubesRow) => cubesRow.map((cube) => {
                return {
                    color: cube.color.value(),
                };
            }))),
        });

        DIRECTIONS.forEach((direction) => {
            this.state[direction] = sideFieldsCubesState[direction];
        });

        this.state.main = mainFieldCubesState;

        // блокируем приложение от начала до конца анимации
        // минус один - потому, что в последний такт обычно анимация чисто символическая
        this.blockApp = true;

        const animationScriptWithViews: AnimationScriptWithViews = new Map<CubeView, CubeAnimation[]>();

        getObjectEntries(animationsScript).forEach(([
            cubeAddressString,
            animations,
        ]) => {
            const address = parseCubeAddressString(cubeAddressString);
            let cube: CubeView;
            if (address.field === 'main') {
                cube = this.cubesViews._getMainCube(address)!;
            } else {
                cube = this.cubesViews._getSideCube(address as SideCubeAddress);
            }

            animationScriptWithViews.set(cube, animations);
        });

        // пошаговый запуск анимации
        animateMove({
            animationScriptWithViews,
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
            const prevCube = this.cubesViews._getSideCube(line[key - startCubes.length])!;
            this.cubesViews._setSideCube(line[key], prevCube);
            prevCube.x = line[key].x;
            prevCube.y = line[key].y;
        }
        // генерируем кубики для крайних значений в линии
        for (let key = 0; key < startCubes.length; key++) {
            this.cubesViews._setSideCube(
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
        this.cubesViews.clear();

        this.cubesViews = new CubesViews({ app: this });
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

    private createSideCubes(state: SideFieldsCubesState) {
        // запускаем инициализацию приложения
        // генерируем кубики в боковых панелях
        this.cubesViews.sideEach((cube, field, x, y) => {
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

        const isMainCube = this.cubesViews.mainCubesSet.has(cube);
        if (isMainCube) {
            animateCubeBump({
                element: cube.element,
                duration: ANIMATION_TIME * 2,
                isVertical: randomBoolean(),
            });
            return;
        }

        const sideCubeAddress = findCubeInSideCubes({
            sideCubes: this.cubesViews.sideCubesMask,
            cube,
        });

        if (!sideCubeAddress) {
            throw new Error('sideCubeAddress of clicked cube is not found');
        }

        // отправляем в путь-дорогу
        this.run(sideCubeAddress);
    };

    private readonly handleHover = (hoveredCube: CubeView, isHovered: boolean) => {
        const isMainCube = this.cubesViews.mainCubesSet.has(hoveredCube);

        if (isMainCube) {
            return;
        }

        const sideCubeAddress = findCubeInSideCubes({
            sideCubes: this.cubesViews.sideCubesMask,
            cube: hoveredCube,
        });

        if (!sideCubeAddress) {
            // cube could be removed from the board despite the fact that view is still there
            return;
        }

        const startCubesParameters = getStartCubesParameters({
            mainCubes: this.cubesViews.mainCubesSet,
            sideCubeAddress,
        });

        if (!startCubesParameters) {
            return;
        }

        const { startCubes: allToFirstInLineAddresses } = getStartCubesByStartCubesParameters({
            startCubesParameters,
        });

        const allToFirstInLine = allToFirstInLineAddresses
            .map((address) => getSideCubeViewByAddress(this.cubesViews.sideCubesMask, address));

        for (const cube of allToFirstInLine) {
            cube.setReadyToMove(isHovered);
        }
    };

    private startNewGame() {
        this.clearMainField();
        this.cubesViews.sideCubesMask = createSideCubesMaskWithNullValues();

        this.createSideCubes(generateRandomSideCubesForLevel(this.level));

        this.setLevel(START_LEVEL);

        this.state = generateRandomStateForLevel({
            level: this.level,
        });
        this.generateMainCubes();

        this.previousState = null;
        this.isNewLevel.next(true);
        this.canUndo.next(false);
        callFunctions(this.callbacks.onAfterNewGameStarted);
    }

    private clearMainField() {
        this.cubesViews.mainCubesSet.forEach((cube) => {
            cube.removeElementFromDOM();
        });
        this.cubesViews.mainCubesSet.clear();
    }

    // генерируем кубики на главном поле
    private generateMainCubes() {
        const mainFieldCubesState = this.state.main;

        mainFieldCubesState.forEach((row, x) => {
            row.forEach((cube, y) => {
                if (cube) {
                    this.createCube({
                        x,
                        y,
                        field: 'main',
                        color: cube.color,
                        appearWithAnimation: true,
                        direction: null,
                        toMineOrder: cube.toMineOrder,
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
        this.cubesViews.sideEach((cube) => {
            if (getRandomIntegerInARange(0, colorsCount - 1) === 0) {
                cube.changeColor(newColor);
            }
        });
    }

    // генерируем маску для предыдущего хода
    private generateMask(): CubesState {
        const mask: Partial<CubesState> = {};
        const cubesLocal = this.cubesViews;

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
            this.cubesViews._addMainCube(cube);
        } else {
            this.cubesViews._addSideCube(cube, {
                field,
                x,
                y,
            });
        }

        return cube;
    }

}
