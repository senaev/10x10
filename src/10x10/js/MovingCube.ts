import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';

import { CubeColor } from '../const/CUBE_COLORS';
import { Direction } from '../const/DIRECTIONS';
import { CubeAddressString } from '../utils/CubeAddressString';

export type MovingCubeStepAction = 'boom' | Direction | null;

/**
 * Мутабельный объект кубика со всеми
 * необходимыми данными для построения карты хода
 *
 * Во время каждого шага параметры кубика могут меняться и добавляется новый шаг
 */
export type MovingCube = {
    readonly initialAddress: CubeAddressString;
    readonly color: CubeColor;
    readonly direction: Direction | null;
    readonly stepActions: MovingCubeStepAction[];
    readonly toMineOrder: UnsignedInteger;
    x: number;
    y: number;
};
