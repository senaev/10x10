import { Cube } from "./cube";
import { data, Field, FIELDS } from "./data";
import { MoveMap } from "./moveMap";
import { TenOnTen } from "./TenOnTen";

export type CubesField = Record<number, Record<number, Cube | null>>;
export type CubesFields = Record<Field, CubesField>;

export type CubeAddress = {
  field: Field;
  x: number;
  y: number;
};

export type Cubes = typeof cubes;

export const cubes = {
  _app: undefined as TenOnTen | undefined,
  ...(() => {
    const cubes: Partial<CubesFields> = {};

    for (var key in FIELDS) {
      const field: CubesField = {};
      cubes[FIELDS[key]] = field;
      for (var x = 0; x < data.cubesWidth; x++) {
        field[x] = {};
        for (var y = 0; y < data.cubesWidth; y++) {
          field[x][y] = null;
        }
      }
    }

    return cubes as CubesFields;
  })(),
  //добавляем в коллекцию кубик(необходимо для инициализации приложения)
  _add(cube: Cube) {
    this[cube.field][cube.x][cube.y] = cube;
  },
  //берем значение клетки из коллекции по полю, иксу, игреку
  _get(o: CubeAddress) {
    //console.log(o);
    return this[o.field][o.x][o.y];
  },
  //устанавливаем начемие клетки, переданной в объекте, содержащем поле, икс, игрек
  _set(o: CubeAddress, value: Cube | null) {
    if (o === undefined || value === undefined) {
      throw new Error(
        "cubes._set не получил параметры: o: " + o + " value: " + value
      );
    }
    //console.log(o, value);
    cubes[o.field][o.x][o.y] = value;
    /*if (value !== null && value instanceof Cube) {
           value.x = o.x;
           value.y = o.y;
           }*/
    return this[o.field][o.x][o.y];
  },
  //пробегаемся по всем элементам боковых полей, выполняем переданную функцию
  //с каждым кубиком
  _sideEach(func: (cube: Cube, field: Field, x: number, y: number) => void) {
    for (var key in data.fields) {
      if (data.fields[key] !== "main") {
        for (var x = 0; x < data.cubesWidth; x++) {
          for (var y = 0; y < data.cubesWidth; y++) {
            func(cubes[data.fields[key]][x][y]!, data.fields[key], x, y);
          }
        }
      }
    }
  },

  //пробегаемся по всем элементам главного поля, выполняем переданную функцию с каждым
  //не нулевым найденным кубиком
  _mainEach(
    func: (cube: Cube, field: Field, x: number, y: number, i: number) => void
  ) {
    var i;
    i = 0;
    for (var x = 0; x < data.cubesWidth; x++) {
      for (var y = 0; y < data.cubesWidth; y++) {
        const cube = cubes["main"][x][y];
        if (cube !== null) {
          func(cube, "main", x, y, i);
          i++;
        }
      }
    }
  },

  //получаем массив координат кубиков линии в порядке от дальнего( относительно mainField)
  //до ближайшего
  _getLine(o: CubeAddress) {
    let staticProp: "x" | "y";
    let dynamicProp: "x" | "y";
    let line: CubeAddress[] = [];
    let coords: CubeAddress;

    line = [];
    if (o.field === "top" || o.field === "bottom") {
      staticProp = "x";
      dynamicProp = "y";
    } else {
      staticProp = "y";
      dynamicProp = "x";
    }
    if (o.field === "top" || o.field === "left") {
      for (var key = 0; key < data.cubesWidth; key++) {
        coords = { field: o.field, x: 0, y: 0 };
        coords[staticProp] = o[staticProp];
        coords[dynamicProp] = key;
        line.push(coords);
      }
    } else {
      for (var key = data.cubesWidth - 1; key >= 0; key--) {
        coords = { field: o.field, x: 0, y: 0 };
        coords[staticProp] = o[staticProp];
        coords[dynamicProp] = key;
        line.push(coords);
      }
    }
    return line;
  },

  //вырезаем кубики из боковой линии и заполняем последние элементы в этой линии
  _cutFromLine(startCubes: Cube[]) {
    //получаем линию
    var line = this._getLine({
      x: startCubes[0].x,
      y: startCubes[0].y,
      field: startCubes[0].field,
    });
    //пробегаемся, меняем значения в коллекции
    for (var key = line.length - 1; key >= startCubes.length; key--) {
      var prevCube = this._get(line[key - startCubes.length])!;
      this._set(line[key], prevCube);
      prevCube.x = line[key].x;
      prevCube.y = line[key].y;
    }
    //генерируем кубики для крайних значений в линии
    for (var key = 0; key < startCubes.length; key++) {
      cubes._set(
        line[key],
        new Cube({
          x: line[key].x,
          y: line[key].y,
          field: line[key].field,
          app: this._app!,
          toMine: cubes._app!.mainCounter(),
        })
      );
    }

    /**
     * при отладке может возникать забавная ошибка, когда почему-то
     * случайно добавляются не последние значения линии, а предидущие из них
     * не верьте вьюхам!!! верьте яваскрипту, дело в том, что новые кубики появляются,
     * а старые вьюхи ни куда не деваются и одни других перекрывают :)
     */
  },

  //добавляем в линию кубик, по кубику мы должны определить, в какую линию
  _pushInLine(cube: Cube) {
    //console.log(cube.color);
    //меняем значения кубика
    cube.field = cube.direction!;
    cube.direction = data.f.reverseField(cube.field);
    //получаем линию, в которую вставим кубик
    var line = this._getLine({ x: cube.x, y: cube.y, field: cube.field });
    //присваиваем значения координат в поле кубику
    cube.x = line[line.length - 1].x;
    cube.y = line[line.length - 1].y;
    //получаем удаляемый (дальний от mainField в линии) кубик
    const removedCube = this._get(line[0])!;
    //сдвигаем линию на одну клетку от mainField
    for (var key = 0; key < line.length - 1; key++) {
      this._set(line[key], this._get(line[key + 1]));
    }
    //устанавливаем значение первой клетки
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
    this._app!.moveMap!.beyondTheSide!.push(removedCube);
  },
  _mergeMoveMap(moveMap: MoveMap) {
    var arr = moveMap.mainMask.arr;
    var startCubes = moveMap.startCubes;
    //извлекаем startCube из боковой панели, все дальнейшие значения field кубиков
    //могут меняться только при вхождении их в боковую панель
    //вытаскиваем кубик из боковой панели коллекции
    this._cutFromLine(startCubes);
    //меняем значение field
    for (var key in startCubes) {
      startCubes[key].field = "main";
    }

    //пробегаемся по массиву м-кубиков и если м-кубик вошел в боковое поле,
    //меняем его свойства direction, field, x, y в соответствии со значениями
    //м-кубика и стороной поля, также перемещаем все кубики в линии, в которую вошел
    //данный кубик
    for (var key in arr) {
      var mCube = arr[key];
      if (mCube.x > -1 && mCube.x < 10 && mCube.y > -1 && mCube.y < 10) {
        //кубик просто перемещается и не входит не в какую панель
        //устанавливаем кубик в новую клетку
        this._set({ field: "main", x: mCube.x, y: mCube.y }, mCube.cube);
        //при этом если клетку, с которой сошел кубик, ещё не занял другой кубик
        //обнуляем эту клетку
        //console.log(mCube.color + " - > " + mCube.cube.x + " " + mCube.cube.y + " : " + mCube.x + " " + mCube.y);

        if (
          mCube.cube.x < 0 ||
          mCube.cube.x > 9 ||
          mCube.cube.y < 0 ||
          mCube.cube.y > 9
        ) {
          console.log(mCube, mCube.cube.x, mCube.cube.y, mCube.x, mCube.y);
        }

        if (
          mCube.mainMask._get({ x: mCube.cube.x, y: mCube.cube.y }) === null
        ) {
          cubes._set({ field: "main", x: mCube.cube.x, y: mCube.cube.y }, null);
        }

        mCube.cube.x = mCube.x;
        mCube.cube.y = mCube.y;
      }
      //если кубик взорвался во время хода, убираем его с доски
      else if (mCube.x === -1 && mCube.y === -1) {
        //console.log("убираем: ", {color: mCube.color, x: mCube.cube.x, y: mCube.cube.y},cubes._get({field: "main", x: mCube.cube.x, y: mCube.cube.y}) === mCube.cube ? true : cubes._get({field: "main", x: mCube.cube.x, y: mCube.cube.y}));
        if (
          cubes._get({ field: "main", x: mCube.cube.x, y: mCube.cube.y }) ===
          mCube.cube
        ) {
          cubes._set({ field: "main", x: mCube.cube.x, y: mCube.cube.y }, null);
        }
      }
    }
    //убираем в боковые поля кубики, которые ушли туда во время хода
    //console.log(moveMap.toSideActions);
    for (var key in moveMap.toSideActions) {
      var mCube = moveMap.toSideActions[key];
      //если клетку, с которой сошел кубик, ещё не занял другой кубик
      //обнуляем эту клетку
      if (mCube.mainMask._get({ x: mCube.cube.x, y: mCube.cube.y }) === null) {
        cubes._set({ field: "main", x: mCube.cube.x, y: mCube.cube.y }, null);
      }
      /*mCube.cube.x = mCube.x;
               mCube.cube.y = mCube.y;*/
      //пушим кубик в коллекцию боковой линии
      this._pushInLine(mCube.cube);
    }
  },

  //массовая анимация для кубиков, вспомогательная
  //функция для удобства анимации сразу нескольких кубиков
  animate(
    o: { action: "fromLine"; cube: Cube[] } | { action: "inLine"; cube: Cube }
  ) {
    var line;

    const { cube, action } = o;

    //в зависимости от типа действия
    switch (action) {
      //при выходе одного кубика из линии, анимируем линию
      case "fromLine":
        var startCubes = cube;

        //получаем линию кубика
        //коллекция пока в начальном состоянии (до хода)
        line = this._getLine({
          x: startCubes[0].x,
          y: startCubes[0].y,
          field: startCubes[0].field,
        });

        //номер в линии первого кубика, который будет пододвинут
        var first = line.length - startCubes.length - 1;

        //массив из возможных комбинаций анимаций
        var arr;
        switch (startCubes.length) {
          case 1:
            arr = [[6, 7, 8]];
            break;
          case 2:
            arr = [
              [6, 7],
              [5, 6, 7],
            ];
            break;
          case 3:
            arr = [[6], [5, 6], [4, 5, 6]];
            break;
          default:
            throw new Error(
              "Неверное значение длинны startCubes: " + startCubes.length
            );
        }
        var anims = ["apperanceInSide", "nearer", "nearer"];
        for (var key in arr) {
          for (var num in arr[key]) {
            this._get(line[arr[key][num]])!.addAnimate({
              action: anims[num],
              duration: 1,
              delay: Number(key),
            });
          }
        }
        break;
      //при входе кубика в линию, анимируем линию
      case "inLine":
        //получаем линию кубика
        line = this._getLine({ x: cube.x, y: cube.y, field: cube.field });

        //массив, в который по порядку попадут все кубики,
        //которые войдут в эту же линию того же поля во время хода
        //0 - который входит первым
        var allCubesToSideInThisLine = [];
        //все кубики, которые попадают во время хода в боковую панель
        var toSideActions = cubes._app!.moveMap!.toSideActions;
        //для идентификации линии
        var prop: "x" | "y" = "y";
        if (cube.field === "top" || cube.field === "bottom") {
          prop = "x";
        }
        //позиция кубика среди тех, которые во время данного хода
        //попадают в данную линию данного поля 0-дальний от mainField
        var posInSide;
        for (var key in toSideActions) {
          var c = toSideActions[key].cube;
          if (c.field === cube.field && c[prop] === cube[prop]) {
            if (c === cube) {
              posInSide = allCubesToSideInThisLine.length;
            }
            allCubesToSideInThisLine.push(c);
          }
        }

        //массив кубиков, которые удалились за пределами этой линии во время хода
        //0 - первый удалённый(самый дальний)
        var removeBS = [];
        for (var key in cubes._app!.moveMap!.beyondTheSide!) {
          var c = cubes._app!.moveMap!.beyondTheSide![key];
          if (c.field === cube.field && c[prop] === cube[prop]) {
            removeBS.push(c);
          }
        }

        //вычисляем, какие кубики будем двигать при вставке в линию
        var pos =
          data.cubesWidth - allCubesToSideInThisLine.length + posInSide! - 1;
        let c1: Cube;
        let c2: Cube;
        let cr: Cube;

        //смысл этих условий в том, что если кубик, который надо анимировать,
        //еще присутствует в линии, мы берем этот кубик оттуда, если же
        //он уже удален из линии, но его нужно анимировать, мы берем его
        //из массива удаленных кубиков этой линии
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

        //третий кубик пропадает
        cr.animate({ action: "disapperanceInSide", duration: 1 });

        //остальные два сдвигаются ближе к линии
        c2.animate({ action: "forth", duration: 1 });
        c1.animate({ action: "forth", duration: 1 });
        break;
      default:
        throw new Error("Неизвестная анимация в массиве кубиков: ", action);
        break;
    }
  },
};
