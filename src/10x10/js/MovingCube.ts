import { Direction } from '../const/DIRECTIONS';

import { CubeAddress } from './Cubes';

export type ActionStep = 'boom' | Direction | null;

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
    readonly steps: ActionStep[];
    x: number;
    y: number;
};
