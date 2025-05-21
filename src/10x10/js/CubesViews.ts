import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { assertObject } from 'senaev-utils/src/utils/Object/assertObject/assertObject';
import { mapObjectValues } from 'senaev-utils/src/utils/Object/mapObjectValues/mapObjectValues';

import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Direction, DIRECTIONS } from '../const/DIRECTIONS';
import {
    ALL_FIELDS_OBJECT, Field, FIELDS,
} from '../const/FIELDS';

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

export type FieldViewsMask = Set<CubeView>[][];

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

function createEmptyFieldViewsMask(): FieldViewsMask {
    return createArray(BOARD_SIZE)
        .map(() => createArray(BOARD_SIZE).map(() => new Set()));
};

export function traverseFieldViewsMask(mask: FieldViewsMask, func: (cubes: Set<CubeView>, x: number, y: number) => void) {
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            func(mask[x][y], x, y);
        }
    }
}

export class CubesViews {
    public views: Record<Field, FieldViewsMask> = mapObjectValues(ALL_FIELDS_OBJECT, createEmptyFieldViewsMask);

    // добавляем в коллекцию кубик(необходимо для инициализации приложения)
    public addSideCube(
        cube: CubeView,
        address: SideCubeAddress
    ) {
        this.views[address.field][address.x][address.y].add(cube);
    }

    // берем значение клетки из коллекции по полю, иксу, игреку
    public getSideCubeByAddress(address: SideCubeAddress): CubeView {
        const cubesSet = this.views[address.field][address.x][address.y];

        if (cubesSet.size !== 1) {
            throw new Error('cannot get cube by address');
        }

        return cubesSet.values().next().value!;
    }

    public getMainCubeByAddress({ x, y }: CubeCoordinates): CubeView | undefined {
        return this.views.main[x][y].values().next().value;
    }

    public _addMainCube({ x, y }: CubeCoordinates, cube: CubeView) {
        this.views.main[x][y].add(cube);
    }

    public _removeMainCube({ x, y }: CubeCoordinates) {
        const cube = this.views.main[x][y].values().next().value;

        assertObject(cube, 'cannot delete cube from mainCubes');

        this.views.main[x][y].delete(cube);
    }

    // Устанавливаем значение клетки, переданной в объекте, содержащем поле, икс, игрек
    public setSideCube({
        x,
        y,
        field,
    }: SideCubeAddress, value: CubeView): void {
        this.views[field][x][y].add(value);
    }

    // Пробегаемся по всем элементам боковых полей, выполняем переданную функцию
    // с каждым кубиком
    public sideEach(func: (cube: CubeView, field: Direction, x: number, y: number) => void) {
        DIRECTIONS.forEach((field) => {
            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cubesSet = this.views[field][x][y];

                    if (cubesSet.size !== 1) {
                        throw new Error('cannot sideEach');
                    }

                    func(cubesSet.values().next().value!, field, x, y);
                }
            }
        });
    }

    public getCubeAddress(cube: CubeView): CubeAddress | undefined {
        let address: CubeAddress | undefined;

        FIELDS.forEach((field) => {
            traverseFieldViewsMask(this.views[field], (cubes, x, y) => {
                if (cubes.has(cube)) {
                    address = {
                        x,
                        y,
                        field,
                    };
                }
            });
        });

        return address;
    }
}
