import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import { Field } from '../const/FIELDS';
import { getCubeByCoordinates } from '../utils/getCubeByCoordinates';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';

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

export class CubesViews {
    public readonly _app: TenOnTen;
    public sideCubesMask: SideCubesMask;
    public mainCubesSet: Set<CubeView> = new Set();

    public constructor({ app }: { app: TenOnTen }) {
        this._app = app;
        this.sideCubesMask = createSideCubesMaskWithNullValues();
    }

    public clear() {
        this.sideEach((cube) => {
            cube?.removeElementFromDOM();
        });

        this.mainCubesSet.forEach((cube) => {
            cube.removeElementFromDOM();
        });
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
    public getSideCube(address: SideCubeAddress): CubeView {
        return getSideCubeViewByAddress(this.sideCubesMask, address)!;
    }

    public _getMainCube({ x, y }: CubeCoordinates): CubeView | undefined {
        return getCubeByCoordinates({
            x,
            y,
        }, this.mainCubesSet);
    }

    public _addMainCube(cube: CubeView) {
        this.mainCubesSet.add(cube);
    }

    public _removeMainCube({ x, y }: CubeCoordinates) {
        const cube = getCubeByCoordinates({
            x,
            y,
        }, this.mainCubesSet);

        assertObject(cube, 'cannot delete cube from mainCubes');

        this.mainCubesSet.delete(cube);
    }

    // Устанавливаем значение клетки, переданной в объекте, содержащем поле, икс, игрек
    public _setSideCube({
        x,
        y,
        field,
    }: SideCubeAddress, value: CubeView): void {
        this.sideCubesMask[field][x][y] = value;
    }

    // Пробегаемся по всем элементам боковых полей, выполняем переданную функцию
    // с каждым кубиком
    public sideEach(func: (cube: CubeView, field: Direction, x: number, y: number) => void) {
        DIRECTIONS.forEach((field) => {
            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    func(this.sideCubesMask[field][x][y]!, field, x, y);
                }
            }
        });
    }
};
