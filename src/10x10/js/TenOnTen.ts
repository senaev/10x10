import $ from 'jquery';

import { Cube, Direction } from './cube';
import { CubeAddress, cubes } from './cubes';
import { data, Field } from './data';
import { MoveMap } from './moveMap';
import { UndoButton } from './undoButton';

export type MaskFieldValue = {
    color: string;
    direction: Direction | null;
    toMine?: number | null;
};
export type Mask = Record<Field, (MaskFieldValue | null)[][]>;

export class TenOnTen {
    public readonly container: JQuery<HTMLElement>;
    public blockApp: boolean;
    public level: number;
    public readonly cubes: typeof cubes;

    public moveMap: MoveMap | undefined;
    public end: string | null;
    public readonly undoButton: UndoButton;

    //счетчик для значений toMine кубиков, попадающих в главное поле
    public readonly mainCounter: () => number = (function () {
        let numberOfCalls = 0;
        return function () {
            return ++numberOfCalls;
        };
    })();

    private readonly lang: keyof (typeof data.lang)[keyof typeof data.lang];

    private previousStepMap: Mask | undefined;

    constructor({ container }: { container: HTMLElement }) {
    //получаем коллекцию кубиков и устанавливаем в параметрах проложение,
    //которому эти кубики принадлежат
        this.cubes = cubes;
        this.cubes._app = this;

        //индикатор состояния приложения - разрешены какие-либо действия пользователя или нет
        this.blockApp = false;

        //уровень 1-10 11-60(16-65)
        this.level = 1;

        //язык
        this.lang = 'ru';

        //console.log(d.f.level.colorsCount(this.level));
        console.log('cubesCount:', data.f.level.cubesCount(this.level));
        console.log('colorsCount:', data.f.level.colorsCount(this.level));

        //датчик конца хода
        this.end = null;

        this.container = $(container);

        //Initialize container function
        (() => {
            const topRightPanel = '<div class="panel topRightPanel"></div>'; //
            let background = '<div class="backgroungField">';
            for (let key = 0; key < data.cubesWidth * data.cubesWidth; key++) {
                background += '<div class="dCube"></div>';
            }
            background += '</div>';

            const backgroundField = $(background).css({
                height: data.oneWidth * data.cubesWidth,
                width: data.oneWidth * data.cubesWidth,
                padding: data.oneWidth * 3 + 3,
                left: data.oneWidth * -3 - 3,
                top: data.oneWidth * -3 - 3,
            });

            this.container
                .css({
                    height: data.oneWidth * data.cubesWidth,
                    width: data.oneWidth * data.cubesWidth,
                    margin: data.oneWidth * 3,
                    position: 'relative',
                })
                .addClass('tenOnTenContainer')
                .append(backgroundField)
                .append(topRightPanel);
        })();

        //запускаем инициализацию приложения
        this.initialize();
        //запускаем ход, начиная движение со startCubes

        //добавляем кнопку "назад"
        this.undoButton = new UndoButton({ app: this });
    }

    //даем возможность пользователю при переходе на новый уровень выбрать из случайных
    //комбинаций начальную
    public refresh = () => {
        this.blockApp = true;
        const cubes = this.cubes;
        //удаляем нафиг кубики с главного поля
        cubes._mainEach(function (cube, field, x, y) {
            cubes._set({
                field,
                x,
                y,
            }, null);
            cube.animate({
                action: 'remove',
                duration: 4,
            });
        });
        setTimeout(
            function (app) {
                app.generateMainCubes();
                setTimeout(
                    function (app) {
                        app.blockApp = false;
                    },
                    data.animTime * 8,
                    app
                );
            },
            data.animTime,
            this
        );
    };

    //генерируем маску для предидущего хода
    private generateMask(): Mask {
        const mask: Partial<Mask> = {};
        const cubes = this.cubes;

        for (const fieldNumber in data.fields) {
            const field = data.fields[fieldNumber];
            const fieldValue: (MaskFieldValue | null)[][] = [];
            mask[field] = fieldValue;
            for (let x = 0; x < data.cubesWidth; x++) {
                fieldValue[x] = [];
                for (let y = 0; y < data.cubesWidth; y++) {
                    const c = cubes._get({
                        field,
                        x,
                        y,
                    });

                    if (c === null) {
                        fieldValue[x][y] = null;
                    } else {
                        const resultValue: MaskFieldValue = {
                            color: c.color,
                            direction: c.direction,
                        };
                        fieldValue[x][y] = resultValue;
                        //для корректной обработки порядка попадания в главное поле
                        if (field === 'main') {
                            resultValue.toMine = c.toMine;
                        }
                    }
                }
            }
        }

        return mask as Mask;
    }

    //переводим игру на следующий уровень
    public nextLevel() {
        const colorsCount = data.f.level.colorsCount(this.level);
        this.level++;
        if (data.f.level.colorsCount(this.level) > colorsCount) {
            this.plusColor();
        }
        this.generateMainCubes();
    }

    //при переходе на уровень с большим количеством цветов, добавляем кубики с новыми цветами в боковые поля
    private plusColor() {
        const colorsCount = data.f.level.colorsCount(this.level);
        const newColor = data.colors[colorsCount - 1];
        this.cubes._sideEach(function (cube) {
            if (data.f.rand(0, colorsCount - 1) === 0) {
                cube.change({
                    color: newColor,
                });
            }
        });
    }

    // Возвращаем слово в необходимом переводе
    public word(w: keyof typeof data.lang) {
        return data.lang[w][this.lang];
    }

    //Initialize map function
    private initialize() {
    //генерируем кубики в боковых панелях
        cubes._sideEach((cube, field, x, y) => {
            cube = new Cube({
                x,
                y,
                field,
                app: this,
            });
        });

        this.generateMainCubes();
    }

    //генерируем кубики на главном поле
    private generateMainCubes() {
        const firstCubesPosition = data.f.level.getPositions(this.level);
        let nullCells: { x: number; y: number }[] = [];

        let fPos;

        for (
            let number = 0, len = data.f.level.cubesCount(this.level);
            number < len;
            number++
        ) {
            let cell: { x: number; y: number } | undefined;
            let fPos = null;

            if (firstCubesPosition[number] !== undefined) {
                fPos = firstCubesPosition[number];
            }

            if (fPos === null) {
                //создаем массив из свободных ячеек, перемешиваем его
                if (nullCells === undefined) {
                    nullCells = [];
                    for (let x = 0; x < data.cubesWidth; x++) {
                        for (let y = 0; y < data.cubesWidth; y++) {
                            if (cubes['main'][x][y] === null) {
                                nullCells.push({
                                    x,
                                    y,
                                });
                            }
                        }
                    }
                    data.f.shuffle(nullCells);
                }

                //шанс попадания кубика в крайнее поле - чем больше, тем ниже
                const chance = 2;
                for (var key = 0; key < chance; key++) {
                    cell = nullCells.shift()!;
                    if (
                        cell.x === 0 ||
            cell.y === 0 ||
            cell.x === data.cubesWidth - 1 ||
            cell.y === data.cubesWidth - 1
                    ) {
                        nullCells.push(cell);
                    } else {
                        break;
                    }
                }
            } else {
                cell = {
                    x: fPos[0],
                    y: fPos[1],
                };
            }

            //выстраиваем кубики так, чтобы не было соседних одноцветных кубиков
            const colorsCount = data.f.level.colorsCount(this.level);
            const colorNumber = data.f.rand(0, colorsCount - 1);

            //цвета, которые есть в смежных кубиках
            const apperanceColors = [];
            for (var key = 0; key < 4; key++) {
                const address: CubeAddress = {
                    x: cell!.x,
                    y: cell!.y,
                    field: 'main',
                };

                const prop: 'x' | 'y' = key % 2 == 0 ? 'x' : 'y';
                address[prop] = key < 2 ? address[prop] + 1 : address[prop] - 1;

                if (
                    address.x > -1 &&
          address.y > -1 &&
          address.x < 10 &&
          address.y < 10
                ) {
                    const c = this.cubes._get(address);
                    if (c !== null) {
                        apperanceColors.push(c.color);
                    }
                }
            }

            //цвета, которых нету в смежных
            const noApperanceColors = [];
            for (var key = 0; key < colorsCount; key++) {
                if (apperanceColors.indexOf(data.colors[key]) === -1) {
                    noApperanceColors.push(data.colors[key]);
                }
            }

            //получаем итоговый цвет
            const color =
        noApperanceColors[data.f.rand(0, noApperanceColors.length - 1)];

            new Cube({
                x: cell!.x,
                y: cell!.y,
                field: 'main',
                app: this,
                color,
                disapperance: 'cool',
            });
        }
    }

    //проверяем в конце хода на конец уровня или конец изры
    private checkStepEnd() {
    /**
     * если нет - заканчиваем ход
     * и проверяем, это просто ход или пользователь проиграл или
     * пользователь перешел на новый уровень
     * записываем в this.end:
     * null - просто ход,
     * game_over - конец игры,
     * next_level - конец уровня, переход на следующий
     */
        const cubes = this.cubes;
        let game_over = true;
        let next_level = true;

        for (let x = 0; x < data.cubesWidth; x++) {
            for (let y = 0; y < data.cubesWidth; y++) {
                const cube = cubes['main'][x][y];

                //если на поле еще остались кубики, уровень не завершен
                if (cube !== null) {
                    next_level = false;
                }

                //если все крайние панели заполнены - конец игры,
                //если хоть один пустой - игра продолжается
                if (
                    x === 0 ||
          y === 0 ||
          x === data.cubesWidth - 1 ||
          y === data.cubesWidth - 1
                ) {
                    if (cube === null) {
                        game_over = false;
                    }
                }
            }
            if (!next_level && !game_over) {
                break;
            }
        }

        if (next_level) {
            //меняем датчик на следующий уровень
            this.end = 'next_level';
        } else if (game_over) {
            //меняем датчик на конец игры
            this.end = 'game_over';
        } else {
            //иначе - ничего не делаем
            this.end = null;
        }
    }

    //делаем возврат хода
    public undo() {
    //блокируем приложение до тех пор, пока не закончим анимацию
        this.blockApp = true;
        setTimeout(
            function (app) {
                app.blockApp = false;
            },
            data.animTime * 4,
            this
        );

        this.undoButton._set({ active: false });

        //массив, в котором описаны все различия между текущим и предидущим состоянием
        const changed: {
            field: Field;
            x: number;
            y: number;
            pCube: MaskFieldValue | null;
            cube: Cube | null;
            action: string;
        }[] = [];

        //пробегаем в массиве по каждому кубику предыдущего массива
        const previousStepMap = this.previousStepMap;
        if (previousStepMap) {
            for (const fieldName in previousStepMap) {
                for (const x in previousStepMap[fieldName as Field]) {
                    for (const y in previousStepMap[fieldName as Field][x]) {
                        const xNumber = parseInt(x);
                        const yNumber = parseInt(y);
                        const pCube: MaskFieldValue | null =
              previousStepMap[fieldName as Field][xNumber][yNumber];
                        //берем соответствующее значение текущей маски для сравнения
                        const cube = this.cubes._get({
                            field: fieldName as Field,
                            x: xNumber,
                            y: yNumber,
                        });
                        //если предидущее - null
                        if (pCube === null) {
                            //а новое - что-то другое
                            //удаляем кубик из нового значения
                            if (cube !== null) {
                                changed.push({
                                    field: fieldName as Field,
                                    x: xNumber,
                                    y: yNumber,
                                    pCube: null,
                                    cube,
                                    action: 'remove',
                                });
                            }
                        }
                        //если же раньше тут тоже был кубик
                        else {
                            //а сейчас кубика нету
                            //заполняем клетку кубиком
                            if (cube === null) {
                                changed.push({
                                    field: fieldName as Field,
                                    x: xNumber,
                                    y: yNumber,
                                    pCube,
                                    cube: null,
                                    action: 'add',
                                });
                            }
                            //если и раньше и сейчас - нужно сравнить эти значения
                            else {
                                //пробегаемся по каждому параметру
                                for (const prop in pCube) {
                                    //если какие-то параметры различаются,
                                    //меняем параметры кубика
                                    if (
                                        cube[prop as keyof Cube] !==
                    pCube[prop as keyof MaskFieldValue]
                                    ) {
                                        changed.push({
                                            field: fieldName as Field,
                                            x: xNumber,
                                            y: yNumber,
                                            pCube,
                                            cube,
                                            action: 'change',
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const key in changed) {
            let cube = changed[key].cube;
            switch (changed[key].action) {
            case 'add':
                //создаем новый кубик с теми же параметрами и подменяем им предидущий
                cube = new Cube({
                    x: changed[key].x,
                    y: changed[key].y,
                    field: changed[key].field,
                    color: changed[key]!.pCube!.color,
                    direction: changed[key]!.pCube!.direction!,
                    app: this,
                    disapperance: 'cool',
                });
                //console.log(cube);
                break;
            case 'remove':
                //удаляем нафиг кубик
                this.cubes._set(
                    {
                        field: changed[key].field,
                        x: changed[key].x,
                        y: changed[key].y,
                    },
                    null
                );
                cube!.animate({
                    action: 'remove',
                    duration: 4,
                });
                break;
            case 'change':
                cube!.change({
                    color: changed[key].pCube!.color,
                    direction: changed[key].pCube!.direction!,
                });
                break;
            default:
                throw new Error('Неизвествое значение в changed[key].action: ' + changed[key].action);
                break;
            }
        }

        //меняем значения ту майн всех кубиков на поле
        const mainField = this.previousStepMap!['main'];
        for (const x in mainField) {
            for (const y in mainField[x]) {
                if (mainField[x][y] !== null) {
                    this.cubes._get({
                        field: 'main',
                        x: Number(x),
                        y: Number(y),
                    })!.toMine = mainField[x][y]!.toMine!;
                }
            }
        }
    }

    public run(o: { startCubes: Cube[] }) {
    //создаем маску для возможности возврата хода
        this.previousStepMap = this.generateMask();

        this.moveMap = new MoveMap({
            startCubes: o.startCubes,
            cubes: this.cubes,
            app: this,
        });
        //пошаговый запуск анимации
        this.moveMap.animate();
        //подитоживание - внесение изменений, произошедших в абстрактном moveMap
        //в реальную коллекцию cubes
        this.cubes._mergeMoveMap(this.moveMap);

        this.checkStepEnd();
    }
}
