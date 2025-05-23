import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
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

export type CubesViewsStore = Record<Field, FieldViewsMask>;

export class CubesViews {
    public store: CubesViewsStore = mapObjectValues(ALL_FIELDS_OBJECT, createEmptyFieldViewsMask);

    public removeCube(cube: CubeView) {
        const address = this.getCubeAddress(cube);

        if (!address) {
            return;
        }

        const set = this.store[address.field][address.x][address.y];

        if (!set.has(cube)) {
            throw new Error('cube to remove not found');
        }

        set.delete(cube);
    }

    public getCubesSetByAddress(address: CubeAddress): Set<CubeView> {
        return this.store[address.field][address.x][address.y];
    }

    public extractOneExistingCubeViewByAddress(address: CubeAddress): CubeView {
        const cubesSet = this.getCubesSetByAddress(address);

        if (cubesSet.size !== 1) {
            throw new Error(`cannot get one existing cube by address, size=${cubesSet.size}`);
        }

        const cube = cubesSet.values().next().value!;
        cubesSet.delete(cube);

        return cube;
    }

    public getOneExistingCubeViewByAddress(address: CubeAddress): CubeView {
        const cubesSet = this.getCubesSetByAddress(address);

        if (cubesSet.size !== 1) {
            throw new Error(`cannot get one existing cube by address, size=${cubesSet.size}`);
        }

        return cubesSet.values().next().value!;
    }

    public getCubeViewByAddress(address: CubeAddress): CubeView | undefined {
        const cubesSet = this.getCubesSetByAddress(address);

        if (cubesSet.size > 1) {
            throw new Error(`cannot get one by address, size=${cubesSet.size}`);
        }

        return cubesSet.values().next().value!;
    }

    public addCubeView(cube: CubeView, address: CubeAddress) {
        const cubesSet = this.getCubesSetByAddress(address);

        cubesSet.add(cube);
    }

    // Устанавливаем значение клетки, переданной в объекте, содержащем поле, икс, игрек
    public setSideCube({
        x,
        y,
        field,
    }: SideCubeAddress, value: CubeView): void {
        this.store[field][x][y].add(value);
    }

    public sideEach(func: (params: {
        cube: CubeView;
        field: Direction;
        x: number;
        y: number;
    }) => void) {
        for (const field of DIRECTIONS) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    func({
                        cube: this.getOneExistingCubeViewByAddress({
                            x,
                            y,
                            field,
                        }),
                        field,
                        x,
                        y,
                    });
                }
            }
        }
    }

    public getCubeAddress(cube: CubeView): CubeAddress | undefined {
        let address: CubeAddress | undefined;

        FIELDS.forEach((field) => {
            traverseFieldViewsMask(this.store[field], (cubes, x, y) => {
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
