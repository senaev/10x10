import $ from "jquery";
import { Cube } from "./cube";
import { cubes } from "./cubes";
import { data } from "./data";
import { MoveMap } from "./moveMap";
import { UndoButton } from "./undoButton";

export class TenOnTen {
  public container: JQuery<HTMLElement>;
  public blockApp: boolean;

  private cubes: typeof cubes;
  private level: number;
  private lang: keyof (typeof data.lang)[keyof typeof data.lang];
  private mainCounter: () => number;
  private end: string | null;

  private undoButton: UndoButton;

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
    this.lang = "ru";

    //console.log(d.f.level.colorsCount(this.level));
    console.log("cubesCount:", data.f.level.cubesCount(this.level));
    console.log("colorsCount:", data.f.level.colorsCount(this.level));

    //счетчик для значений toMine кубиков, попадающих в главное поле
    this.mainCounter = (function () {
      var numberOfCalls = 0;
      return function () {
        return ++numberOfCalls;
      };
    })();

    //датчик конца хода
    this.end = null;

    this.container = $(container);

    //Initialize container function
    (() => {
      var topRightPanel = '<div class="panel topRightPanel"></div>'; //
      var background = '<div class="backgroungField">';
      for (var key = 0; key < data.cubesWidth * data.cubesWidth; key++) {
        background += '<div class="dCube"></div>';
      }
      background += "</div>";

      var backgroundField = $(background).css({
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
          position: "relative",
        })
        .addClass("tenOnTenContainer")
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
    var cubes = this.cubes;
    //удаляем нафиг кубики с главного поля
    cubes._mainEach(function (cube, field, x, y) {
      cubes._set({ field: field, x: x, y: y }, null);
      cube.animate({ action: "remove", duration: 4, delay: 0 });
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
  private generateMask() {
    var cubes;
    var mask;
    var main;

    mask = {};
    cubes = this.cubes;

    for (var fieldNumber in data.fields) {
      var field = data.fields[fieldNumber];
      mask[field] = [];
      for (var x = 0; x < data.cubesWidth; x++) {
        mask[field][x] = [];
        for (var y = 0; y < data.cubesWidth; y++) {
          var c = cubes._get({ field: field, x: x, y: y });

          if (c === null) {
            mask[field][x][y] = null;
          } else {
            mask[field][x][y] = {
              color: c.color,
              direction: c.direction,
            };
            //для корректной обработки порядка попадания в главное поле
            if (field === "main") {
              mask[field][x][y].toMine = c.toMine;
            }
          }
        }
      }
    }

    return mask;
  }

  //переводим игру на следующий уровень
  private nextLevel() {
    var colorsCount = data.f.level.colorsCount(this.level);
    this.level++;
    if (data.f.level.colorsCount(this.level) > colorsCount) {
      this.plusColor();
    }
    this.generateMainCubes();
  }

  //при переходе на уровень с большим количеством цветов, добавляем кубики с новыми цветами в боковые поля
  private plusColor() {
    var colorsCount = data.f.level.colorsCount(this.level);
    var newColor = data.colors[colorsCount - 1];
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
        x: x,
        y: y,
        field: field,
        app: this,
      });
    });

    this.generateMainCubes();
  }

  //генерируем кубики на главном поле
  private generateMainCubes() {
    var firstCubesPosition = data.f.level.getPositions(this.level);
    var nullCells;
    var rand;
    var fPos;
    for (
      var number = 0, len = data.f.level.cubesCount(this.level);
      number < len;
      number++
    ) {
      var cube;
      var cell;
      fPos = null;

      if (firstCubesPosition[number] !== undefined) {
        fPos = firstCubesPosition[number];
      }

      if (fPos === null) {
        //создаем массив из свободных ячеек, перемешиваем его
        if (nullCells === undefined) {
          nullCells = [];
          for (var x = 0; x < data.cubesWidth; x++) {
            for (var y = 0; y < data.cubesWidth; y++) {
              if (cubes["main"][x][y] === null) {
                nullCells.push({ x: x, y: y });
              }
            }
          }
          data.f.shuffle(nullCells);
        }

        //шанс попадания кубика в крайнее поле - чем больше, тем ниже
        var chance = 2;
        for (var key = 0; key < chance; key++) {
          cell = nullCells.shift();
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
        cell = { x: fPos[0], y: fPos[1] };
      }

      //выстраиваем кубики так, чтобы не было соседних одноцветных кубиков
      var colorsCount = data.f.level.colorsCount(this.level);
      var colorNumber = data.f.rand(0, colorsCount - 1);

      //цвета, которые есть в смежных кубиках
      var apperanceColors = [];
      for (var key = 0; key < 4; key++) {
        var pos = { x: cell.x, y: cell.y, field: "main" };
        var prop = key % 2 == 0 ? "x" : "y";
        pos[prop] = key < 2 ? pos[prop] + 1 : pos[prop] - 1;
        if (pos.x > -1 && pos.y > -1 && pos.x < 10 && pos.y < 10) {
          var c = this.cubes._get(pos);
          if (c !== null) {
            apperanceColors.push(c.color);
          }
        }
      }

      //цвета, которых нету в смежных
      var noApperanceColors = [];
      for (var key = 0; key < colorsCount; key++) {
        if (apperanceColors.indexOf(data.colors[key]) === -1) {
          noApperanceColors.push(data.colors[key]);
        }
      }

      //получаем итоговый цвет
      var color =
        noApperanceColors[data.f.rand(0, noApperanceColors.length - 1)];
      cube = new Cube({
        x: cell.x,
        y: cell.y,
        field: "main",
        app: this,
        color: color,
        disapperance: "cool",
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
    var cubes = this.cubes;
    var game_over = true;
    var next_level = true;

    for (var x = 0; x < data.cubesWidth; x++) {
      for (var y = 0; y < data.cubesWidth; y++) {
        var cube = cubes["main"][x][y];

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
      this.end = "next_level";
    } else if (game_over) {
      //меняем датчик на конец игры
      this.end = "game_over";
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
    var changed = [];
    //пробегаем в массиве по каждому кубику предидущего массива
    for (var fieldName in this.previousStepMap) {
      for (var x in this.previousStepMap[fieldName]) {
        for (var y in this.previousStepMap[fieldName][x]) {
          x = parseInt(x);
          y = parseInt(y);
          var pCube = this.previousStepMap[fieldName][x][y];
          //берем соответствующее значение текущей маски для сравнения
          var cube = this.cubes._get({ field: fieldName, x: x, y: y });
          //если предидущее - null
          if (pCube === null) {
            //а новое - что-то другое
            //удаляем кубик из нового значения
            if (cube !== null) {
              changed.push({
                field: fieldName,
                x: x,
                y: y,
                pCube: null,
                cube: cube,
                action: "remove",
              });
            }
          }
          //если же раньше тут тоже был кубик
          else {
            //а сейчас кубика нету
            //заполняем клетку кубиком
            if (cube === null) {
              changed.push({
                field: fieldName,
                x: x,
                y: y,
                pCube: pCube,
                cube: null,
                action: "add",
              });
            }
            //если и раньше и сейчас - нужно сравнить эти значения
            else {
              //пробегаемся по каждому параметру
              for (var prop in pCube) {
                //если какие-то параметры различаются,
                //меняем параметры кубика
                if (cube[prop] !== pCube[prop]) {
                  changed.push({
                    field: fieldName,
                    x: x,
                    y: y,
                    pCube: pCube,
                    cube: cube,
                    action: "change",
                  });
                  break;
                }
              }
            }
          }
        }
      }
    }

    for (var key in changed) {
      var cube = changed[key].cube;
      switch (changed[key].action) {
        case "add":
          //создаем новый кубик с теми же параметрами и подменяем им предидущий
          cube = new Cube({
            x: changed[key].x,
            y: changed[key].y,
            field: changed[key].field,
            color: changed[key].pCube.color,
            direction: changed[key].pCube.direction,
            app: this,
            disapperance: "cool",
          });
          //console.log(cube);
          break;
        case "remove":
          //удаляем нафиг кубик
          this.cubes._set(
            {
              field: changed[key].field,
              x: changed[key].x,
              y: changed[key].y,
            },
            null
          );
          cube.animate({ action: "remove", duration: 4, delay: 0 });
          break;
        case "change":
          cube.change({
            color: changed[key].pCube.color,
            direction: changed[key].pCube.direction,
          });
          break;
        default:
          throw new Error(
            "Неизвествое значение в changed[key].action: ",
            changed[key].action
          );
          break;
      }
    }

    //меняем значения ту майн всех кубиков на поле
    for (var x in this.previousStepMap["main"]) {
      for (var y in this.previousStepMap["main"][x]) {
        if (this.previousStepMap["main"][x][y] !== null) {
          this.cubes._get({ field: "main", x: x, y: y }).toMine =
            this.previousStepMap["main"][x][y].toMine;
        }
      }
    }
  }

  private run(o) {
    this.moveMap = new MoveMap();

    //создаем маску для возможности возврата хода
    this.previousStepMap = this.generateMask();

    this.moveMap.generate({
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

    //console.log("//////////ITOG CUBES:", this.cubes);
  }
}
