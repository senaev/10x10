import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { Field, FIELDS } from '../const/FIELDS';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';
import { reverseDirection } from '../utils/reverseDirection';

import { __findCubeInMainMask } from './MainMask';
import { MovingCube } from './MovingCube';
import { TenOnTen } from './TenOnTen';

export type CubesFieldOptional = Record<number, Record<number, CubeView | null>>;
export type CubesFieldRequired = Record<number, Record<number, CubeView>>;
export type CubesFields = Record<Field, CubesFieldOptional>;

export type CubeCoordinates = {
    x: number;
    y: number;
};

export type SideCubeAddress = CubeCoordinates & {
    field: Direction;
};

export type CubeAddress = CubeCoordinates & {
    field: Field;
};

export type SideCubesMask = {
    readonly top: CubesFieldRequired;
    readonly right: CubesFieldRequired;
    readonly bottom: CubesFieldRequired;
    readonly left: CubesFieldRequired;
};

export function createSideCubesMaskWithNullValues(): SideCubesMask {
    const cubesLocal: Partial<Record<Direction, CubesFieldOptional>> = {};

    DIRECTIONS.forEach((direction) => {
        const field: CubesFieldOptional = {};
        cubesLocal[direction] = field;
        for (let x = 0; x < BOARD_SIZE; x++) {
            field[x] = {};
            for (let y = 0; y < BOARD_SIZE; y++) {
                field[x][y] = null;
            }
        }
    });

    return {
        top: cubesLocal.top as CubesFieldRequired,
        right: cubesLocal.right as CubesFieldRequired,
        bottom: cubesLocal.bottom as CubesFieldRequired,
        left: cubesLocal.left as CubesFieldRequired,
    };
}

function createMainCubesMaskWithNullValues(): CubesFieldOptional {
    const field: CubesFieldOptional = {};
    for (let x = 0; x < BOARD_SIZE; x++) {
        field[x] = {};
        for (let y = 0; y < BOARD_SIZE; y++) {
            field[x][y] = null;
        }
    }

    return field;
}

export class Cubes {
    public readonly _app: TenOnTen;
    public sideCubes: SideCubesMask;
    public mainCubes: CubesFieldOptional;

    public constructor({ app }: { app: TenOnTen }) {
        this._app = app;
        this.sideCubes = createSideCubesMaskWithNullValues();
        this.mainCubes = createMainCubesMaskWithNullValues();
    }

    public _addMainCube(cube: CubeView) {
        this.mainCubes[cube.x][cube.y] = cube;
    }

    // добавляем в коллекцию кубик(необходимо для инициализации приложения)
    public _addSideCube(cube: CubeView) {
        const field = cube.field.value();

        if (field === 'main') {
            throw new Error('main field is not allowed');
        }

        this.sideCubes[field][cube.x][cube.y] = cube;
    }

    // берем значение клетки из коллекции по полю, иксу, игреку
    public _getSideCube(address: SideCubeAddress): CubeView {
        return getSideCubeViewByAddress(this.sideCubes, address)!;
    }

    public _getMainCube({ x, y }: CubeCoordinates): CubeView | undefined {
        return this.mainCubes[x][y] ?? undefined;
    }

    public _setMainCube({ x, y }: CubeCoordinates, value: CubeView | undefined) {
        if (value === undefined) {
            this.mainCubes[x][y] = null;
        } else {
            this.mainCubes[x][y] = value;
        }
    }

    // Устанавливаем значение клетки, переданной в объекте, содержащем поле, икс, игрек
    public _setSideCube({
        x,
        y,
        field,
    }: SideCubeAddress, value: CubeView): void {
        this.sideCubes[field][x][y] = value;
    }

    // пробегаемся по всем элементам боковых полей, выполняем переданную функцию
    // с каждым кубиком
    public _sideEach(func: (cube: CubeView, field: Direction, x: number, y: number) => void) {
        FIELDS.forEach((field) => {
            if (field === 'main') {
                return;
            }

            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    func(this.sideCubes[field][x][y]!, field, x, y);
                }
            }
        });
    }

    // пробегаемся по всем элементам главного поля, выполняем переданную функцию с каждым
    // не нулевым найденным кубиком
    public _mainEach(func: (cube: CubeView, x: number, y: number, i: number) => void) {
        let i;
        i = 0;
        for (let x = 0; x < BOARD_SIZE; x++) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                const cube = this.mainCubes[x][y];
                if (cube !== null) {
                    func(cube, x, y, i);
                    i++;
                }
            }
        }
    }

    // добавляем в линию кубик, по кубику мы должны определить, в какую линию
    public _pushInLine(cube: CubeView) {
        const direction = cube.direction.value();

        assertNonEmptyString(direction);

        // меняем значения кубика
        cube.field.next(direction);
        cube.direction.next(reverseDirection(direction));

        // получаем линию, в которую вставим кубик
        const line = getCubeAddressInSideFieldInOrderFromMain({
            x: cube.x,
            y: cube.y,
            field: direction,
        });

        // присваиваем значения координат в поле кубику
        cube.x = line[line.length - 1].x;
        cube.y = line[line.length - 1].y;

        // получаем удаляемый (дальний от mainField в линии) кубик
        const removedCube = this._getSideCube(line[0]);

        // сдвигаем линию на одну клетку от mainField
        for (let key = 0; key < line.length - 1; key++) {
            this._setSideCube(line[key], this._getSideCube(line[key + 1]));
        }

        // устанавливаем значение первой клетки
        this._setSideCube(line[line.length - 1], cube);

        /**
         * Заносим удаляемый кубик в массив удаляемых, а не
         * удаляем его сразу же... дело тут в том, что при вхождении в боковое поле
         * большого количества кубиков, при практически полной замене боковой линии,
         * ссылки могут удаляться на cubesWidth - 1 кубиков в этой линии, соответственно
         * html-элементы таких кубиков будут удалены еще до того, как начнется
         * какая-либо анимация, поэтому заносим удаляемые кубики в массив, а по мере
         * анимации вставки кубика в боковое поле, будем удалять и сами вьюхи
         */
        this._app.moveMap!.beyondTheSide!.push(removedCube);
    }

    public _mergeMoveMap({
        movingCubes,
        startCubes,
        toSideActions,
    }: {
        movingCubes: MovingCube[];
        startCubes: CubeView[];
        toSideActions: MovingCube[];
    }) {

        // извлекаем startCube из боковой панели, все дальнейшие значения field кубиков
        // могут меняться только при вхождении их в боковую панель
        // вытаскиваем кубик из боковой панели коллекции
        this._app.cutCubesFromLineAndFillByNewOnes(startCubes);

        // меняем значение field
        for (const key in startCubes) {
            startCubes[key].field.next('main');
        }

        // пробегаемся по массиву м-кубиков и если м-кубик вошел в боковое поле,
        // меняем его свойства direction, field, x, y в соответствии со значениями
        // м-кубика и стороной поля, также перемещаем все кубики в линии, в которую вошел
        // данный кубик
        movingCubes.forEach((movingCube) => {
            if (movingCube.x > -1 && movingCube.x < 10 && movingCube.y > -1 && movingCube.y < 10) {
                // кубик просто перемещается и не входит не в какую панель
                // устанавливаем кубик в новую клетку
                this._setMainCube({
                    x: movingCube.x,
                    y: movingCube.y,
                }, movingCube.cube);
                // при этом если клетку, с которой сошел кубик, ещё не занял другой кубик
                // обнуляем эту клетку
                // console.log(mCube.color + " - > " + mCube.cube.x + " " + mCube.cube.y + " : " + mCube.x + " " + mCube.y);

                if (
                    movingCube.cube.x < 0 || movingCube.cube.x > 9 || movingCube.cube.y < 0 || movingCube.cube.y > 9
                ) {
                    // eslint-disable-next-line no-console
                    console.log(movingCube, movingCube.cube.x, movingCube.cube.y, movingCube.x, movingCube.y);
                }

                if (
                    !__findCubeInMainMask(movingCubes, {
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    })
                ) {
                    this._setMainCube({
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    }, undefined);
                }

                movingCube.cube.x = movingCube.x;
                movingCube.cube.y = movingCube.y;
            } else if (movingCube.x === -1 && movingCube.y === -1) {
                // если кубик взорвался во время хода, убираем его с доски

                if (
                    this._getMainCube({
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    }) === movingCube.cube
                ) {
                    this._setMainCube({
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    }, undefined);
                }
            }
        });

        // убираем в боковые поля кубики, которые ушли туда во время хода
        toSideActions.forEach((movingCube) => {
            // если клетку, с которой сошел кубик, ещё не занял другой кубик
            // обнуляем эту клетку
            if (!__findCubeInMainMask(movingCubes, {
                x: movingCube.cube.x,
                y: movingCube.cube.y,
            })) {
                this._setMainCube({
                    x: movingCube.cube.x,
                    y: movingCube.cube.y,
                }, undefined);
            }

            // пушим кубик в коллекцию боковой линии
            this._pushInLine(movingCube.cube);
        });
    }

};
