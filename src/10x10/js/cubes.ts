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
    field,
    cube,
    sideCubes,
}: {
    field: Direction;
    cube: CubeView;
    sideCubes: SideCubesMask;
}): CubeCoordinates {
    const mask = sideCubes[field];

    for (let x = 0; x < mask.length; x++) {
        for (let y = 0; y < mask[x].length; y++) {
            if (mask[x][y] === cube) {
                return {
                    x,
                    y,
                };
            }
        }
    }

    throw new Error('cube not found in sideCubes');
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
    public sideCubes: SideCubesMask;
    public mainCubes: Set<CubeView> = new Set();

    public constructor({ app }: { app: TenOnTen }) {
        this._app = app;
        this.sideCubes = createSideCubesMaskWithNullValues();
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
        return getCubeByCoordinates({
            x,
            y,
        }, this.mainCubes);
    }

    public _addMainCube(cube: CubeView) {
        this.mainCubes.add(cube);
    }

    public _removeMainCube({ x, y }: CubeCoordinates) {
        const cube = getCubeByCoordinates({
            x,
            y,
        }, this.mainCubes);

        assertObject(cube, 'cannot delete cube from mainCubes');

        this.mainCubes.delete(cube);
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

                if (!this.mainCubes.has(movingCube.cube)) {
                    this.mainCubes.add(movingCube.cube);
                }

                movingCube.cube.x = movingCube.x;
                movingCube.cube.y = movingCube.y;
            } else if (movingCube.x === -1 && movingCube.y === -1) {
                // если кубик взорвался во время хода, убираем его с доски

                this.mainCubes.delete(movingCube.cube);
            }
        });

        // убираем в боковые поля кубики, которые ушли туда во время хода
        toSideActions.forEach((movingCube) => {
            if (this.mainCubes.has(movingCube.cube)) {
                this.mainCubes.delete(movingCube.cube);
            } else {
                // cube from side to side
            }

            // пушим кубик в коллекцию боковой линии
            this._pushInLine(movingCube.cube);
        });
    }

};
