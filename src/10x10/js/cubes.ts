import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Field, FIELDS } from '../const/FIELDS';
import { getCubeAddressInSideFieldInOfderFromMain } from '../utils/getCubeAddressInSideFieldInOfderFromMain';
import { getCubeByAddress } from '../utils/getCubeByAddress';
import { reverseDirection } from '../utils/reverseDirection';

import { Cube } from './Cube';
import { MoveMap } from './MoveMap';
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
    public mask: CubesMask;

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

        this.mask = {
            main: cubesLocal.main!,
            top: cubesLocal.top as CubesFieldRequired,
            right: cubesLocal.right as CubesFieldRequired,
            bottom: cubesLocal.bottom as CubesFieldRequired,
            left: cubesLocal.left as CubesFieldRequired,
        };
    }

    // добавляем в коллекцию кубик(необходимо для инициализации приложения)
    public _add(cube: Cube) {
        this.mask[cube.field][cube.x][cube.y] = cube;
    }

    // берем значение клетки из коллекции по полю, иксу, игреку
    public _get(o: CubeAddress) {
        return getCubeByAddress(this.mask, o);
    }

    // устанавливаем начемие клетки, переданной в объекте, содержащем поле, икс, игрек
    public _set(o: CubeAddress, value: Cube | null) {
        if (o === undefined || value === undefined) {
            throw new Error('cubes._set не получил параметры: o: ' + o + ' value: ' + value);
        }

        this.mask[o.field][o.x][o.y] = value;

        return this.mask[o.field][o.x][o.y];
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
                    func(this.mask[field][x][y]!, field, x, y);
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
                const cube = this.mask.main[x][y];
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
        const line = getCubeAddressInSideFieldInOfderFromMain({
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

    public _mergeMoveMap(moveMap: MoveMap) {
        const arr = moveMap.mainMask.arr;
        const startCubes = moveMap.startCubes;

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
        for (const key in arr) {
            const mCube = arr[key];
            if (mCube.x > -1 && mCube.x < 10 && mCube.y > -1 && mCube.y < 10) {
                // кубик просто перемещается и не входит не в какую панель
                // устанавливаем кубик в новую клетку
                this._set({
                    field: 'main',
                    x: mCube.x,
                    y: mCube.y,
                }, mCube.cube);
                // при этом если клетку, с которой сошел кубик, ещё не занял другой кубик
                // обнуляем эту клетку
                // console.log(mCube.color + " - > " + mCube.cube.x + " " + mCube.cube.y + " : " + mCube.x + " " + mCube.y);

                if (
                    mCube.cube.x < 0 ||
              mCube.cube.x > 9 ||
              mCube.cube.y < 0 ||
              mCube.cube.y > 9
                ) {
                    // eslint-disable-next-line no-console
                    console.log(mCube, mCube.cube.x, mCube.cube.y, mCube.x, mCube.y);
                }

                if (
                    mCube.mainMask._get({
                        x: mCube.cube.x,
                        y: mCube.cube.y,
                    }) === null
                ) {
                    this._set({
                        field: 'main',
                        x: mCube.cube.x,
                        y: mCube.cube.y,
                    }, null);
                }

                mCube.cube.x = mCube.x;
                mCube.cube.y = mCube.y;
            } else if (mCube.x === -1 && mCube.y === -1) {
                // если кубик взорвался во время хода, убираем его с доски

                if (
                    this._get({
                        field: 'main',
                        x: mCube.cube.x,
                        y: mCube.cube.y,
                    }) === mCube.cube
                ) {
                    this._set({
                        field: 'main',
                        x: mCube.cube.x,
                        y: mCube.cube.y,
                    }, null);
                }
            }
        }
        // убираем в боковые поля кубики, которые ушли туда во время хода
        for (const key in moveMap.toSideActions) {
            const mCube = moveMap.toSideActions[key];
            // если клетку, с которой сошел кубик, ещё не занял другой кубик
            // обнуляем эту клетку
            if (mCube.mainMask._get({
                x: mCube.cube.x,
                y: mCube.cube.y,
            }) === null) {
                this._set({
                    field: 'main',
                    x: mCube.cube.x,
                    y: mCube.cube.y,
                }, null);
            }

            // пушим кубик в коллекцию боковой линии
            this._pushInLine(mCube.cube);
        }
    }

    // массовая анимация для кубиков, вспомогательная
    // функция для удобства анимации сразу нескольких кубиков
    public animate(o: { action: 'fromLine'; cube: Cube[] } | { action: 'inLine'; cube: Cube }) {

        const { cube, action } = o;

        // в зависимости от типа действия
        switch (action) {
        // при выходе одного кубика из линии, анимируем линию
        case 'fromLine':
            (() => {

                const startCubes = cube;

                // получаем линию кубика
                // коллекция пока в начальном состоянии (до хода)
                const line = getCubeAddressInSideFieldInOfderFromMain({
                    x: startCubes[0].x,
                    y: startCubes[0].y,
                    field: startCubes[0].field,
                });

                // массив из возможных комбинаций анимаций
                let arr;
                switch (startCubes.length) {
                case 1:
                    arr = [
                        [
                            6,
                            7,
                            8,
                        ],
                    ];
                    break;
                case 2:
                    arr = [
                        [
                            6,
                            7,
                        ],
                        [
                            5,
                            6,
                            7,
                        ],
                    ];
                    break;
                case 3:
                    arr = [
                        [6],
                        [
                            5,
                            6,
                        ],
                        [
                            4,
                            5,
                            6,
                        ],
                    ];
                    break;
                default:
                    throw new Error('Неверное значение длинны startCubes: ' + startCubes.length);
                }
                const anims = [
                    'apperanceInSide',
                    'nearer',
                    'nearer',
                ];
                for (const key in arr) {
                    for (const num in arr[key]) {
                        this._get(line[arr[key][num]])!.addAnimate({
                            action: anims[num],
                            duration: 1,
                            delay: Number(key),
                        });
                    }
                }
            })();
            break;
            // при входе кубика в линию, анимируем линию
        case 'inLine':
            (() => {
                // получаем линию кубика
                const line = getCubeAddressInSideFieldInOfderFromMain({
                    x: cube.x,
                    y: cube.y,
                    field: cube.field,
                });

                // массив, в который по порядку попадут все кубики,
                // которые войдут в эту же линию того же поля во время хода
                // 0 - который входит первым
                const allCubesToSideInThisLine = [];
                // все кубики, которые попадают во время хода в боковую панель
                const toSideActions = this._app.moveMap!.toSideActions;
                // для идентификации линии
                let prop: 'x' | 'y' = 'y';
                if (cube.field === 'top' || cube.field === 'bottom') {
                    prop = 'x';
                }
                // позиция кубика среди тех, которые во время данного хода
                // попадают в данную линию данного поля 0-дальний от mainField
                let posInSide;
                for (const key in toSideActions) {
                    const c = toSideActions[key].cube;
                    if (c.field === cube.field && c[prop] === cube[prop]) {
                        if (c === cube) {
                            posInSide = allCubesToSideInThisLine.length;
                        }
                        allCubesToSideInThisLine.push(c);
                    }
                }

                // массив кубиков, которые удалились за пределами этой линии во время хода
                // 0 - первый удалённый(самый дальний)
                const removeBS = [];
                for (const key in this._app.moveMap!.beyondTheSide!) {
                    const c = this._app.moveMap!.beyondTheSide![key];
                    if (c.field === cube.field && c[prop] === cube[prop]) {
                        removeBS.push(c);
                    }
                }

                // вычисляем, какие кубики будем двигать при вставке в линию
                const pos =
              BOARD_SIZE - allCubesToSideInThisLine.length + posInSide! - 1;
                let c1: Cube;
                let c2: Cube;
                let cr: Cube;

                // смысл этих условий в том, что если кубик, который надо анимировать,
                // еще присутствует в линии, мы берем этот кубик оттуда, если же
                // он уже удален из линии, но его нужно анимировать, мы берем его
                // из массива удаленных кубиков этой линии
                if (pos - 2 > -1) {
                    cr = this._get(line[pos - 2])!;
                } else {
                    cr = removeBS[removeBS.length + (pos - 2)];
                }

                if (pos > -1) {
                    c1 = this._get(line[pos])!;
                } else {
                    c1 = removeBS[removeBS.length + pos];
                }

                if (pos - 1 > -1) {
                    c2 = this._get(line[pos - 1])!;
                } else {
                    c2 = removeBS[removeBS.length + (pos - 1)];
                }

                // третий кубик пропадает
                cr.animate({
                    action: 'disapperanceInSide',
                    duration: 1,
                });

                // остальные два сдвигаются ближе к линии
                c2.animate({
                    action: 'forth',
                    duration: 1,
                });
                c1.animate({
                    action: 'forth',
                    duration: 1,
                });
            })();
            break;
        default:
            throw new Error('Неизвестная анимация в массиве кубиков: ', action);
        }
    }
};
