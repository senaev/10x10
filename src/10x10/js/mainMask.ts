import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { directionToAnimation } from '../utils/directionToAnimation';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { searchAdjacentCubes } from '../utils/searchAdjacentCubes';

import { Cube } from './Cube';
import { Cubes } from './Cubes';
import { MCube } from './MCube';

// Поскольку маска - несортированный массив, получаем куб методом перебора
export function __findCubeInMainMask(arr: MCube[], o: { x: number; y: number }): MCube | null {
    for (const key in arr) {
        if (arr[key].x === o.x && arr[key].y === o.y) {
            return arr[key];
        }
    }
    return null;
}

/**
 * Класс для маски (слепок текущего состояния с возможностью создать пошагово один ход игры).
 * Класс принимает коллекцию кубиков, а также кубик, с которого начинается анимация.
 * Во время создания экземпляра класса создаётся массив м-кубиков (экземпляров класса МКубе),
 * затем пошагово - обращение к каждому м-кубику, методом oneStep, в котором автоматически меняются
 * параметры состояния и создаётся объект из последовательности шагов для построения анимации
 */
export class MainMask {
    // Основной массив со значениями
    // Сюда будут попадать м-кубики, участвующие в анимации
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

    /**
     * Один ход для всех кубиков на доске
     */
    public step() {
        // Индикатор конца движений, если что-то происходит во время шага анимации -
        // вызываем следующий шаг, если нет, то либо заканчиваем ход если нету смежных одинаковых кубиков,
        // либо вызываем подрыв эких кубиков и вызываем следующий шаг анимации
        let somethingHappened;

        somethingHappened = false;
        for (const key in this.arr) {
            const oneStep = this.arr[key].oneStep();
            if (oneStep.do !== null) {
                somethingHappened = true;
            }
        }

        // Проверяем, произошло что-то или нет в конце каждого хода
        if (somethingHappened) {
            this.step();
        } else {
            // Ищем, появились ли у нас в результате хода смежные кубики
            // и если появились - делаем ещё один шаг хода, если нет - заканчиваем ход
            const adjacentCubes = searchAdjacentCubes(this.arr);
            if (adjacentCubes.length) {
                // Если такие группы кубиков имеются, подрываем их и запускаем
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
                            // чтобы в дальнейшей анимации они не участвовали
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

}
