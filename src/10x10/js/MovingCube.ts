import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';

import { Direction } from '../const/DIRECTIONS';

import { CubeAddress } from './CubesViews';

export type MovingCubeStepAction = 'boom' | Direction | null;

export type CubeAddressString = `${CubeAddress['field']},${CubeAddress['x']},${CubeAddress['y']}`;

export function getCubeAddressString(cubeAddress: CubeAddress): CubeAddressString {
    return `${cubeAddress.field},${cubeAddress.x},${cubeAddress.y}`;
}

export function parseCubeAddressString(cubeAddressString: CubeAddressString): CubeAddress {
    const [
        field,
        x,
        y,
    ] = cubeAddressString.split(',');

    return {
        field: field as CubeAddress['field'],
        x: parseInt(x),
        y: parseInt(y),
    };
}
/**
 * Мутабельный объект кубика со всеми
 * необходимыми данными для построения карты хода
 *
 * Во время каждого шага параметры кубика могут меняться и добавляется новый шаг
 */
export type MovingCube = {
    readonly initialAddress: CubeAddressString;
    readonly color: string;
    readonly direction: Direction | null;
    readonly stepActions: MovingCubeStepAction[];
    readonly toMineOrder: UnsignedInteger;
    x: number;
    y: number;
};
