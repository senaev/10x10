import { CubeView } from '../components/CubeView';
import { Direction } from '../const/DIRECTIONS';

import { CubeAddress } from './Cubes';

export type ActionStep = 'boom' | Direction | null;

/**
 * класс для удобной работы с м-кубиком
 * м-кубик представляем из себя абстрактный объек кубика со всеми
 * необходимыми данными для построения карты хода и карты
 * анимации этого хода, м-кубики хранятся в массиве mainMask.arr
 */
export class MovingCube {
    public readonly initialAddress: CubeAddress;
    public x: number;
    public y: number;
    public color: string;
    public direction: Direction | null;
    public steps: ActionStep[];
    public cube: CubeView;

    public constructor(o: {
        initialAddress: CubeAddress;
        x: number;
        y: number;
        color: string;
        direction: Direction | null;
        cube: CubeView;
    }) {
        this.initialAddress = o.initialAddress;
        this.x = o.x;
        this.y = o.y;
        this.color = o.color;
        this.direction = o.direction;
        // массив шагов анимации для кубика, в м-кубике это просто массив, каждое значение которого -
        // действие кубика последовательно в каждый шаг анимации, может быть полностью заполнен
        // значениями null, более подробная анимация генерируется перебором этих значений в moveMap.createAnimationMap
        this.steps = [];
        this.cube = o.cube;
    }

}
