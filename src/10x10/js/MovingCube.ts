import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';

import { Direction } from '../const/DIRECTIONS';

import { CubeAddress } from './CubesViews';

export type MovingCubeStepAction = 'boom' | Direction | null;

/**
 * Мутабельный объект кубика со всеми
 * необходимыми данными для построения карты хода
 *
 * Во время каждого шага параметры кубика могут меняться и добавляется новый шаг
 */
export type MovingCube = {
    readonly initialAddress: Readonly<CubeAddress>;
    readonly color: string;
    readonly direction: Direction | null;
    readonly stepActions: MovingCubeStepAction[];
    readonly toMineOrder: UnsignedInteger;
    x: number;
    y: number;
};
