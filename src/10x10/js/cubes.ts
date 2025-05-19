import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { Field, FIELDS } from '../const/FIELDS';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getCubeByCoordinates } from '../utils/getCubeByCoordinates';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';
import { reverseDirection } from '../utils/reverseDirection';
import { getSideCubeLineId } from '../utils/SideCubesLineIndicator';

import { MovingCube } from './MovingCube';
import { TenOnTen } from './TenOnTen';

export type CubesFieldOptional = (CubeView | null)[][];
export type CubesFieldRequired = CubeView[][];
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

export function findCubeInSideCubes({
    cube,
    sideCubes,
}: {
    cube: CubeView;
    sideCubes: SideCubesMask;
}): SideCubeAddress | undefined {
    for (const field of DIRECTIONS) {
        const mask = sideCubes[field];

        for (let x = 0; x < mask.length; x++) {
            for (let y = 0; y < mask[x].length; y++) {
                if (mask[x][y] === cube) {
                    return {
                        field,
                        x,
                        y,
                    };
                }
            }
        }
    }

    return undefined;
}

export function createSideCubesMaskWithNullValues(): SideCubesMask {
    const cubesLocal: Partial<Record<Direction, CubesFieldOptional>> = {};

    DIRECTIONS.forEach((direction) => {
        const field: CubesFieldOptional = [];
        cubesLocal[direction] = field;

        for (let x = 0; x < BOARD_SIZE; x++) {
            field.push([]);
            for (let y = 0; y < BOARD_SIZE; y++) {
                field.at(-1)!.push(null);
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

export class Cubes {
    public readonly _app: TenOnTen;
    public sideCubesMask: SideCubesMask;
    public mainCubesMask: Set<CubeView> = new Set();

    public constructor({ app }: { app: TenOnTen }) {
        this._app = app;
        this.sideCubesMask = createSideCubesMaskWithNullValues();
    }

    // добавляем в коллекцию кубик(необходимо для инициализации приложения)
    public _addSideCube(
        cube: CubeView,
        {
            field,
        x,
        y,
        }: SideCubeAddress
    ) {
        this.sideCubesMask[field][x][y] = cube;
    }

    // берем значение клетки из коллекции по полю, иксу, игреку
    public _getSideCube(address: SideCubeAddress): CubeView {
        return getSideCubeViewByAddress(this.sideCubesMask, address)!;
    }

    public _getMainCube({ x, y }: CubeCoordinates): CubeView | undefined {
        return getCubeByCoordinates({
            x,
            y,
        }, this.mainCubesMask);
    }

    public _addMainCube(cube: CubeView) {
        this.mainCubesMask.add(cube);
    }

    public _removeMainCube({ x, y }: CubeCoordinates) {
        const cube = getCubeByCoordinates({
            x,
            y,
        }, this.mainCubesMask);

        assertObject(cube, 'cannot delete cube from mainCubes');

        this.mainCubesMask.delete(cube);
    }

    // Устанавливаем значение клетки, переданной в объекте, содержащем поле, икс, игрек
    public _setSideCube({
        x,
        y,
        field,
    }: SideCubeAddress, value: CubeView): void {
        this.sideCubesMask[field][x][y] = value;
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
                    func(this.sideCubesMask[field][x][y]!, field, x, y);
                }
            }
        });
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

        // Извлекаем startCube из боковой панели, все дальнейшие значения field кубиков
        // могут меняться только при вхождении их в боковую панель
        // Вытаскиваем кубик из боковой панели коллекции
        this._app.cutCubesFromLineAndFillByNewOnes(startCubes);

        // Меняем значение field
        for (const key in startCubes) {
            startCubes[key].field.next('main');
        }

        // Пробегаемся по массиву м-кубиков и если м-кубик вошел в боковое поле,
        // Меняем его свойства direction, field, x, y в соответствии со значениями
        // м-кубика и стороной поля, также перемещаем все кубики в линии, в которую вошел
        // данный кубик
        movingCubes.forEach((movingCube) => {
            if (movingCube.x > -1 && movingCube.x < 10 && movingCube.y > -1 && movingCube.y < 10) {
                // Кубик просто перемещается и не входит не в какую панель
                // Устанавливаем кубик в новую клетку

                if (!this.mainCubesMask.has(movingCube.cube)) {
                    this.mainCubesMask.add(movingCube.cube);
                }

                movingCube.cube.x = movingCube.x;
                movingCube.cube.y = movingCube.y;
            } else if (movingCube.x === -1 && movingCube.y === -1) {
                // если кубик взорвался во время хода, убираем его с доски

                this.mainCubesMask.delete(movingCube.cube);
            }
        });

        // Убираем в боковые поля кубики, которые ушли туда во время хода
        toSideActions.forEach((movingCube) => {
            if (this.mainCubesMask.has(movingCube.cube)) {
                this.mainCubesMask.delete(movingCube.cube);
            } else {
                // Кубик из боковой панели в боковую панель
                // (что-то взрывается и кубик, с которого стартовали, пролетает насквозь)
            }

            const cube = movingCube.cube;
            const direction = cube.direction.value();

            assertNonEmptyString(direction);

            // Меняем значения кубика
            cube.field.next(direction);
            cube.direction.next(reverseDirection(direction));

            const lineId = getSideCubeLineId({
                x: cube.x,
                y: cube.y,
                field: direction,
            });
            // Получаем линию, в которую вставим кубик
            const line = getCubeAddressInSideFieldInOrderFromMain(lineId).reverse();

            // Присваиваем значения координат в поле кубику
            cube.x = line[line.length - 1].x;
            cube.y = line[line.length - 1].y;

            // Сдвигаем линию на одну клетку от mainField
            for (let key = 0; key < line.length - 1; key++) {
                this._setSideCube(line[key], this._getSideCube(line[key + 1]));
            }

            // Устанавливаем значение первой клетки
            this._setSideCube(line[line.length - 1], cube);
        });
    }

};
