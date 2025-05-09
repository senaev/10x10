import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { directionToAnimation } from '../utils/directionToAnimation';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';

import { Cube } from './Cube';
import { Cubes } from './Cubes';
import { MCube } from './MCube';

/**
 * Класс для маски (слепок текущего состояния с возможностью создать пошагово один ход игры).
 * Класс принимает коллекцию кубиков, а также кубик, с которого начинается анимация.
 * Во время создания экземпляра класса создаётся массив м-кубиков (экземпляров класса МКубе),
 * затем пошагово - обращение к каждому м-кубику, методом oneStep, в котором автоматически меняются
 * параметры состояния и создаётся объект из последовательности шагов для построения анимации
 */
export class MainMask {
    // основной массив со значениями
    // сюда будут попадать м-кубики, участвующие в анимации
    public readonly arr: MCube[] = [];

    public constructor(params: {
        cubes: Cubes;
        startCubes: Cube[];
    }) {
        const {
            cubes, startCubes,
        } = params;

        // вызываем инициализацию

        let startMCubeX;
        let startMCubeY;

        // создаем массив из всех кубиков, которые есть на доске
        cubes._mainEach((cube) => {
            this.arr.push(new MCube({
                x: cube.x,
                y: cube.y,
                color: cube.color,
                direction: cube.direction,
                mainMask: this,
                cube,
            }));
        });
        // добавляем в маску кубик, с которого начинаем анимацию
        const startMCubes: MCube[] = [];
        for (const key in startCubes) {
            const startCube = startCubes[key];

            startCube.toMineOrder = getIncrementalIntegerForMainFieldOrder();

            if (startCube.field === 'top' || startCube.field === 'bottom') {
                startMCubeX = startCube.x;
                if (startCube.field === 'top') {
                    startMCubeY = startCubes.length - Number(key) - 1;
                } else {
                    startMCubeY = BOARD_SIZE - startCubes.length + parseInt(key);
                }
            } else {
                if (startCube.field === 'left') {
                    startMCubeX = startCubes.length - Number(key) - 1;
                } else {
                    startMCubeX = BOARD_SIZE - startCubes.length + parseInt(key);
                }
                startMCubeY = startCube.y;
            }

            const startMCube = new MCube({
                x: startMCubeX,
                y: startMCubeY,
                color: startCube.color,
                direction: startCube.direction,
                mainMask: this,
                cube: startCube,
            });
            this.arr.push(startMCube);
            startMCubes.push(startMCube);
        }

        // добавим шаги анимации для выплывающих из боковой линии кубиков
        for (const _step in startMCubes) {
            this.arr.forEach((mCube) => {
                if (startMCubes.indexOf(mCube) === -1) {
                    mCube.steps.push({ do: null });
                } else {
                    const { direction } = mCube;

                    assertNonEmptyString(direction);

                    mCube.steps.push({
                        do: directionToAnimation(direction),
                    });
                }
            });
        }

        this.arr.sort(function (a, b) {
            return a.cube.toMineOrder! - b.cube.toMineOrder!;
        });

        this.step();
    }

    // один ход для всех кубиков на доске
    public step() {
    // индикатор конца движений, если что-то происходит во время шага анимации -
    // вызываем следующий шаг, если нет, то либо заканчиваем ход если нету смежных одинаковых кубиков,
    // либо вызываем подрыв эких кубиков и вызываем следующий шаг анимации
        let somethingHappend;

        somethingHappend = false;
        for (const key in this.arr) {
            const oneStep = this.arr[key].oneStep();
            if (oneStep.do !== null) {
                somethingHappend = true;
            }
        }

        // проверяем, произошло что-то или нет в конце каждого хода
        if (somethingHappend) {
            this.step();
        } else {
            // ищем, появились ли у нас в результате хода смежные кубики
            // и если появились - делаем ещё один шаг хода, если нет - заканчиваем ход
            const adjacentCubes = this.searchAdjacentCubes();
            if (adjacentCubes.length) {
                // console.log(adjacentCubes);
                // если такие группы кубиков имеются, подрываем их и запускаем
                // еще один шаг хода, при этом обновляем массив м-кубиков
                // сюда попадут все кубики, которые будут взорваны
                for (const key in adjacentCubes) {
                    const group = adjacentCubes[key];

                    for (const key2 in this.arr) {
                        if (group.indexOf(this.arr[key2]) === -1) {
                            this.arr[key2].steps.push({ do: null });
                        } else {
                            // console.log("add boom in:",this.arr[key]);
                            this.arr[key2].steps.push({ do: 'boom' });
                            // взорвавшимся м-кубикам присваиваем координаты -1 -1,
                            // чтобы в дальнейшей анимации они не учавствовали
                            this.arr[key2].x = -1;
                            this.arr[key2].y = -1;
                        }
                    }
                }
                // продолжаем ход
                this.step();
            } else {
                // заканчиваем ход
            }
        }
    }

    public searchAdjacentCubes() {
        const arr = this.arr;
        const byColorPrev: Record<string, MCube[]> = {};
        const byColor: Record<string, MCube[]> = {};

        // создаем объект с массивами м-кубиков по цветам
        for (const key in arr) {
            // неободимо сбрасывать каждый раз иначе может возникнуть ситтуация:
            // кубики летели, соприкоснулись, создалась группа, взорвались другие
            // кубики, один из кубиков полетел дальше, нашел кубик того же цвета
            // и добавил его в группу, в итоге образовалась группа из трех кубиков,
            // которые по факту не вместе
            arr[key].inGroup = null;

            const mCube = arr[key];
            // если такого значения в объекте еще нет - сздаем его
            if (byColorPrev[mCube.color] === undefined) {
                byColorPrev[mCube.color] = [];
            }
            // добавляем в этот массив все кубики, которые есть на доске
            if (
                mCube.x > -1 &&
        mCube.x < BOARD_SIZE &&
        mCube.y > -1 &&
        mCube.y < BOARD_SIZE
            ) {
                byColorPrev[mCube.color].push(mCube);
            }
        }
        // если количество кубиков определенного цвета на доске меньшь двух,
        // исключаем эту группу кубиков из обработки
        for (const key in byColorPrev) {
            if (byColorPrev[key].length > 2) {
                byColor[key] = byColorPrev[key];
            }
        }

        // ищем группы смежных кубиков и помещаем их в массив groups
        let groups: MCube[][] = [];
        for (const key in byColor) {
            groups = groups.concat(this.searchAdjacentCubesByColor(byColor[key]));
        }
        return groups;
    }

    // функция поиска смежных в массиве по цветам
    public searchAdjacentCubesByColor(arr: MCube[]): MCube[][] {
        let group;
        for (let key = 0; key < arr.length - 1; key++) {
            // текущий кубик
            const current = arr[key];
            for (let key1 = key + 1; key1 < arr.length; key1++) {
                // кубик, который проверяем на смежность текущену кубику
                const compare: MCube = arr[key1];
                // если кубики смежные
                if (
                    Math.abs(current.x - compare.x) + Math.abs(current.y - compare.y) ===
          1
                ) {
                    // если текущий кубик не принадлежик групппе
                    if (current.inGroup === null) {
                        // и кубик, с которым сравниваем не принадлежит группе
                        if (compare.inGroup === null) {
                            // создаём группу
                            group = [
                                current,
                                compare,
                            ];
                        } else {
                            // а если кубик, с которым сравниваем, принадлежит группе
                            // закидываем текущий кубик в группу кубика, с которым сравниваем
                            group = compare.inGroup;
                            compare.inGroup.push(current);
                        }
                    } else {
                        // если же текущий кубик принадлежит группе
                        // а кубик, с которым савниваем принадлежит
                        if (compare.inGroup === null) {
                            // закидываем кубик, с которым сравниваем, в группу текущего
                            group = current.inGroup;
                            current.inGroup.push(compare);
                        } else {
                            // иначе закидываем все кубики и группы сравниваемого в группу текущего
                            group = current.inGroup;
                            if (current.inGroup !== compare.inGroup) {
                                for (const key2 in compare.inGroup) {
                                    if (current.inGroup.indexOf(compare.inGroup[key2]) === -1) {
                                        group.push(compare.inGroup[key2]);
                                    }
                                }
                            }
                        }
                    }
                    // пробегаем в цикле по измененной или созданной группе
                    // и меняем значене принадлежности к группе кубиков на измененную группу
                    for (const key2 in group) {
                        group[key2].inGroup = group;
                    }
                }
            }
        }

        // теперь, когда группы созданы, выбираем из кубиков все
        // существующие неповторяющиеся группы
        const groups: MCube[][] = [];
        for (const key in arr) {
            const groupLocal = arr[key].inGroup;
            // добавляем ненулевые, уникальные, имеющие не менее трёх кубиков группы
            if (groupLocal !== null && groupLocal.length > 2 && groups.indexOf(groupLocal) === -1) {
                groups.push(groupLocal);
            }
        }

        return groups;
    }

    // поскольку маска - несортированный масив, получаем куб методом перебора
    public _get(o: { x: number; y: number }): MCube | null {
        const arr = this.arr;
        for (const key in arr) {
            if (arr[key].x === o.x && arr[key].y === o.y) {
                return arr[key];
            }
        }
        return null;
    }
}
