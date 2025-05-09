import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Field, FIELDS } from '../const/FIELDS';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getCubeByAddress } from '../utils/getCubeByAddress';
import { reverseDirection } from '../utils/reverseDirection';

import { Cube } from './Cube';
import { __findCubeInMainMask } from './MainMask';
import { MovingCube } from './MovingCube';
import { TenOnTen } from './TenOnTen';

export type CubesFieldOptional = Record<number, Record<number, Cube | null>>;
export type CubesFieldRequired = Record<number, Record<number, Cube>>;
export type CubesFields = Record<Field, CubesFieldOptional>;

export type CubeAddress = {
    field: Field;
    x: number;
    y: number;
};

export type CubesMask = {
    readonly main: CubesFieldOptional;
    readonly top: CubesFieldRequired;
    readonly right: CubesFieldRequired;
    readonly bottom: CubesFieldRequired;
    readonly left: CubesFieldRequired;
};

export class Cubes {
    public readonly _app: TenOnTen;
    public cubesMask: CubesMask;

    public constructor({ app }: { app: TenOnTen }) {
        this._app = app;

        const cubesLocal: Partial<CubesFields> = {};

        for (const key in FIELDS) {
            const field: CubesFieldOptional = {};
            cubesLocal[FIELDS[key]] = field;
            for (let x = 0; x < BOARD_SIZE; x++) {
                field[x] = {};
                for (let y = 0; y < BOARD_SIZE; y++) {
                    field[x][y] = null;
                }
            }
        }

        this.cubesMask = {
            main: cubesLocal.main!,
            top: cubesLocal.top as CubesFieldRequired,
            right: cubesLocal.right as CubesFieldRequired,
            bottom: cubesLocal.bottom as CubesFieldRequired,
            left: cubesLocal.left as CubesFieldRequired,
        };
    }

    // добавляем в коллекцию кубик(необходимо для инициализации приложения)
    public _add(cube: Cube) {
        this.cubesMask[cube.field][cube.x][cube.y] = cube;
    }

    // берем значение клетки из коллекции по полю, иксу, игреку
    public _get(address: CubeAddress) {
        return getCubeByAddress(this.cubesMask, address);
    }

    // устанавливаем начемие клетки, переданной в объекте, содержащем поле, икс, игрек
    public _set(o: CubeAddress, value: Cube | null) {
        if (o === undefined || value === undefined) {
            throw new Error(`cubes._set не получил параметры: o: ${o} value: ${value}`);
        }

        this.cubesMask[o.field][o.x][o.y] = value;

        return this.cubesMask[o.field][o.x][o.y];
    }
    // пробегаемся по всем элементам боковых полей, выполняем переданную функцию
    // с каждым кубиком
    public _sideEach(func: (cube: Cube, field: Field, x: number, y: number) => void) {
        FIELDS.forEach((field) => {
            if (field === 'main') {
                return;
            }

            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    func(this.cubesMask[field][x][y]!, field, x, y);
                }
            }
        });
    }

    // пробегаемся по всем элементам главного поля, выполняем переданную функцию с каждым
    // не нулевым найденным кубиком
    public _mainEach(func: (cube: Cube, field: Field, x: number, y: number, i: number) => void) {
        let i;
        i = 0;
        for (let x = 0; x < BOARD_SIZE; x++) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                const cube = this.cubesMask.main[x][y];
                if (cube !== null) {
                    func(cube, 'main', x, y, i);
                    i++;
                }
            }
        }
    }

    // добавляем в линию кубик, по кубику мы должны определить, в какую линию
    public _pushInLine(cube: Cube) {
        // console.log(cube.color);
        // меняем значения кубика
        cube.field = cube.direction!;
        cube.direction = reverseDirection(cube.field);
        // получаем линию, в которую вставим кубик
        const line = getCubeAddressInSideFieldInOrderFromMain({
            x: cube.x,
            y: cube.y,
            field: cube.field,
        });
            // присваиваем значения координат в поле кубику
        cube.x = line[line.length - 1].x;
        cube.y = line[line.length - 1].y;
        // получаем удаляемый (дальний от mainField в линии) кубик
        const removedCube = this._get(line[0])!;
        // сдвигаем линию на одну клетку от mainField
        for (let key = 0; key < line.length - 1; key++) {
            this._set(line[key], this._get(line[key + 1]));
        }
        // устанавливаем значение первой клетки
        this._set(line[line.length - 1], cube);

        /**
         * заносим удаляемый кубик в массив удаляемых, а не
         * удаляем его сразу же... дело тут в том, что при входжении в боковое поле
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
        startCubes: Cube[];
        toSideActions: MovingCube[];
    }) {

        // извлекаем startCube из боковой панели, все дальнейшие значения field кубиков
        // могут меняться только при вхождении их в боковую панель
        // вытаскиваем кубик из боковой панели коллекции
        this._app.cutCubesFromLineAndFillByNewOnes(startCubes);

        // меняем значение field
        for (const key in startCubes) {
            startCubes[key].field = 'main';
        }

        // пробегаемся по массиву м-кубиков и если м-кубик вошел в боковое поле,
        // меняем его свойства direction, field, x, y в соответствии со значениями
        // м-кубика и стороной поля, также перемещаем все кубики в линии, в которую вошел
        // данный кубик
        movingCubes.forEach((movingCube) => {
            if (movingCube.x > -1 && movingCube.x < 10 && movingCube.y > -1 && movingCube.y < 10) {
                // кубик просто перемещается и не входит не в какую панель
                // устанавливаем кубик в новую клетку
                this._set({
                    field: 'main',
                    x: movingCube.x,
                    y: movingCube.y,
                }, movingCube.cube);
                // при этом если клетку, с которой сошел кубик, ещё не занял другой кубик
                // обнуляем эту клетку
                // console.log(mCube.color + " - > " + mCube.cube.x + " " + mCube.cube.y + " : " + mCube.x + " " + mCube.y);

                if (
                    movingCube.cube.x < 0 || movingCube.cube.x > 9 || movingCube.cube.y < 0 || movingCube.cube.y > 9
                ) {
                    // eslint-disable-next-line no-console
                    console.log(movingCube, movingCube.cube.x, movingCube.cube.y, movingCube.x, movingCube.y);
                }

                if (
                    !__findCubeInMainMask(movingCubes, {
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    })
                ) {
                    this._set({
                        field: 'main',
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    }, null);
                }

                movingCube.cube.x = movingCube.x;
                movingCube.cube.y = movingCube.y;
            } else if (movingCube.x === -1 && movingCube.y === -1) {
                // если кубик взорвался во время хода, убираем его с доски

                if (
                    this._get({
                        field: 'main',
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    }) === movingCube.cube
                ) {
                    this._set({
                        field: 'main',
                        x: movingCube.cube.x,
                        y: movingCube.cube.y,
                    }, null);
                }
            }
        });

        // убираем в боковые поля кубики, которые ушли туда во время хода
        toSideActions.forEach((movingCube) => {
            // если клетку, с которой сошел кубик, ещё не занял другой кубик
            // обнуляем эту клетку
            if (!__findCubeInMainMask(movingCubes, {
                x: movingCube.cube.x,
                y: movingCube.cube.y,
            })) {
                this._set({
                    field: 'main',
                    x: movingCube.cube.x,
                    y: movingCube.cube.y,
                }, null);
            }

            // пушим кубик в коллекцию боковой линии
            this._pushInLine(movingCube.cube);
        });
    }

};
