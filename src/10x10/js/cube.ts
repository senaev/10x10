import $ from "jquery";
import { CubeAddress } from "./cubes";
import { data, Field } from "./data";
import { TenOnTen } from "./TenOnTen";
export type Direction = "top" | "bottom" | "left" | "right";

export type CubeAnimateAction = {
  action: string;
  duration: number;
};

export type Transition = Partial<{
  duration: number;
  easing: string;
  scale: [number, number] | number;
  rotate3d: string;
  rotateX: string;
  rotateY: string;
  left: string;
  top: string;
}>;

function bezier(duration: number): number {
  var o: Record<number, number> = {
    1: 99,
    2: 58,
    3: 42,
    4: 34,
    5: 27,
    6: 23,
    7: 19,
    8: 15,
    9: 12,
    10: 11,
    11: 10,
  };
  return o[duration];
}

export class Cube {
  public field: Field;
  public x: number;
  public y: number;
  public direction: Direction | null;
  public color: string;
  public extra?: Record<string, any>;
  public toMine?: number | null;
  public readonly app: TenOnTen;
  public readonly $el: JQuery<HTMLElement>;

  private disapperance?: string;

  constructor(o: {
    x: number;
    y: number;
    disapperance?: string;
    toMine?: number;
    field: Field;
    app: TenOnTen;
    extra?: Record<string, any>;
    direction?: Direction;
    color?: string;
  }) {
    var color, visibleModeClasses;

    this.x = o.x;
    this.y = o.y;

    if (o.disapperance !== undefined) {
      this.disapperance = o.disapperance;
    }

    //время попадания в главное поле
    if (o.toMine === undefined) {
      this.toMine = null;
    } else {
      this.toMine = o.toMine;
    }

    this.field = o.field;
    //указатель на игру, к которой кубик привязан
    this.app = o.app;
    //понадобится дополнительно для дополнительных функций кубика
    this.extra = {};
    //направнение движения
    if (o.direction === undefined) {
      this.direction = (function (field) {
        if (field === "top") {
          return "bottom";
        } else if (field === "bottom") {
          return "top";
        } else if (field === "left") {
          return "right";
        } else if (field === "right") {
          return "left";
        } else {
          return null;
        }
      })(this.field);
    } else {
      this.direction = o.direction;
    }
    //задаем цвет кубика
    if (o.color === undefined) {
      color =
        data.colors[
          data.f.rand(0, data.f.level.colorsCount(this.app.level) - 1)
        ];
    } else {
      color = o.color;
    }
    this.color = color;

    //проверка на то, что данный кубик в боковом поле дальше третьего и не должен быть отображен
    if (this.field !== "main") {
      if (this._inFieldIsVisible()) {
        visibleModeClasses = " ";
      } else {
        visibleModeClasses = " cubeHidden";
      }
    } else {
      visibleModeClasses = " ";
    }

    var directionClass = "";
    if (this.field === "main" && this.direction !== null) {
      directionClass = "d" + this.direction;
    }

    //указатель на DOM-элемент кубика с прослушиванием событий
    this.$el = $('<div class="cube"></div>')
      .addClass(
        this.color + " f" + this.field + visibleModeClasses + directionClass
      )
      .hover(
        (e) => {
          e.preventDefault();

          if (this.field === "main") {
          } else {
            //cube.findFirstInLine().$el.addClass("firstInHoverLine");
            var allToFirstInLine = this.findAllInLineCanGoToMain();
            if (typeof allToFirstInLine !== "string") {
              for (var key in allToFirstInLine) {
                allToFirstInLine[key].$el.addClass("firstInHoverLine");
              }
            }
          }
        },
        (e) => {
          e.preventDefault();

          if (this.field === "main") {
          } else {
            //cube.findFirstInLine().$el.removeClass("firstInHoverLine");
            var allToFirstInLine = this.findAllInLineCanGoToMain();
            if (typeof allToFirstInLine !== "string") {
              for (var key in allToFirstInLine) {
                allToFirstInLine[key].$el.removeClass("firstInHoverLine");
              }
            }
          }
        }
      )
      .click((e) => {
        //не даем продолжить выполнение событий
        e.preventDefault();
        //и снимаем курсор с элемента
        this.$el.trigger("mouseout");

        //если стоит блокировка событий приложения - не даём пользователю ничего сделать
        if (this.app.blockApp) {
          return;
        }

        //если щелчек произошол по  полю - ничего не делаем
        if (this.field === "main") {
        }
        //если по боковому
        else {
          //ищем первые кубики в одной линии бокового поля с кубиком, по  которому щелкнули,
          //которые могут выйти из поля
          var startCubes = this.findAllInLineCanGoToMain();
          //если пришел не массив - выполняем анимацию
          if (typeof startCubes === "string") {
            var scale =
              this.field === "left" || this.field === "right"
                ? [0.8, 1.2]
                : [1.2, 0.8];
            this.$el
              .transition({
                scale: scale,
                duration: data.animTime,
              })
              .transition({
                scale: 1,
                duration: data.animTime,
              });
          }
          //и отправляем их в путь-дорогу
          else {
            this.app.run({ startCubes: startCubes });
          }
        }
      });

    this.toField();
  }

  //отправляем созданный кубик в приложение - добавляем в коллекцию cubes и в html-контейнер
  public toField() {
    this.app.cubes._add(this);

    //время попадания в поле майн
    if (this.field === "main") {
      this.toMine = this.app.mainCounter();
    }

    this.toState();

    if (this.disapperance !== undefined && this.disapperance === "cool") {
      this.$el
        .css({ scale: 0 })
        .appendTo(this.app.container)
        .transition({
          scale: 1,
          duration: data.animTime * 4,
        });
      delete this.disapperance;
    } else {
      this.$el.appendTo(this.app.container);
    }
  }

  // Ищем первый кубик в одной линии бокового поля с кубиком, по  которому щелкнули
  public findFirstInLine() {
    const address: CubeAddress = {
      field: this.field,
      x: this.x,
      y: this.y,
    };
    if (address.field === "top" || address.field === "bottom") {
      address.y = address.field === "top" ? 9 : 0;
    } else {
      address.x = address.field === "left" ? 9 : 0;
    }
    return this.app.cubes._get(address);
  }

  //находим все кубики от этого до ближнего к майн в линии относительно этого
  public findAllInLineCanGoToMain(): Cube[] | "empty" | "block" {
    let statProp: "y" | "x" = "y";
    let dynamicProp: "x" | "y" = "x";
    if (this.field === "top" || this.field === "bottom") {
      statProp = "x";
      dynamicProp = "y";
    }

    //проверяем, сколько кубиков можно достать из боковой линии
    //по количеству свободных клеток в поле майн
    var cellsMain: [number, number, number] =
      this.field === "top" || this.field === "left" ? [0, 1, 2] : [9, 8, 7];
    var cellsSide: [number, number, number] =
      this.field === "top" || this.field === "left" ? [9, 8, 7] : [0, 1, 2];

    let address: CubeAddress = { field: "main", x: 0, y: 0 };
    address[statProp] = this[statProp];
    var count = 0;
    for (var key in cellsMain) {
      address[dynamicProp] = cellsMain[key];
      if (this.app.cubes._get(address) === null) {
        count++;
      } else {
        break;
      }
    }

    //проверяем, если линия пустая, ходить вообще нельзя
    var allNullInLine = true;
    for (let key = 0; key < data.cubesWidth; key++) {
      address[dynamicProp] = key;
      if (this.app.cubes._get(address) !== null) {
        allNullInLine = false;
        break;
      }
    }

    const arr: Cube[] = [];
    //если все нули в линии - возвращаем индикатор пустоты
    if (allNullInLine) {
      return "empty";
    }

    //если сразу за полем кубик - ничего не возвращаем
    if (count === 0) {
      return "block";
    }

    address = { field: this.field, x: 0, y: 0 };
    address[statProp] = this[statProp];
    for (let key = 0; key < 3 && key < count; key++) {
      address[dynamicProp] = cellsSide[key];
      arr.push(this.app.cubes._get(address)!);
      //если доходим до кубика, над которым курсор - заканчиваем маневр
      if (this.app.cubes._get(address) === this) {
        break;
      }
    }
    return arr;
  }

  // Задаем html-элементу кубика положение на доске
  // Если параметры не переданы, устанавливаем текущую позицию кубика
  // Если переданы - устанавливаем в поле кубику, в позицию х/у, переданные в параметрах
  public toState(o?: { x: number; y: number }) {
    let x: number;
    let y: number;
    if (o === undefined) {
      x = this.x;
      y = this.y;
    } else {
      x = o.x;
      y = o.y;
    }
    var left = x * data.oneWidth;
    var top = y * data.oneWidth;
    switch (this.field) {
      case "top":
        top -= data.oneWidth * 10;
        break;
      case "right":
        left += data.oneWidth * 10;
        break;
      case "bottom":
        top += data.oneWidth * 10;
        break;
      case "left":
        left -= data.oneWidth * 10;
        break;
    }
    this.$el.css({
      left: left,
      top: top,
    });
  }

  //добавляем объект анимации на обработку через время, полученное в атрибутах
  public addAnimate(o: { action: string; delay: number; duration: number }) {
    var action, delay, duration;

    action = o.action;
    delay = o.delay;
    duration = o.duration;

    setTimeout(
      (o) => {
        this.animate(o);
      },
      delay * data.animTime,
      { action: action, duration: duration }
    );
  }

  // Добавляем объект анимации на обработку через время, полученное в атрибутах
  public remove() {
    this.$el.remove();
  }

  // Сама функция анимации - в зависимости од переданного значения, выполняем те или иные
  // преобразования html-элемента кубика
  public animate(o: CubeAnimateAction) {
    var dur;
    const cube = this;
    const action = o.action;
    const duration = o.duration;
    switch (action) {
      //движение вправо со столкновением
      case "srBump":
        slideWithBump("left", "+");
        break;
      //движение вправо со столкновением
      case "sbBump":
        slideWithBump("top", "+");
        break;
      //движение вправо со столкновением
      case "slBump":
        slideWithBump("left", "-");
        break;
      //движение вправо со столкновением
      case "stBump":
        slideWithBump("top", "-");
        break;
      //движение с последующим вливанием в поле
      case "toSide":
        var field = cube.field;
        var sign: "+" | "-" = "-";
        var prop: "left" | "top" = "left";
        if (field === "top" || field === "bottom") {
          prop = "top";
          if (field === "bottom") {
            sign = "+";
          }
        } else {
          if (field === "right") {
            sign = "+";
          }
        }
        slideToSide(prop, sign);
        break;
      //передвигаем кубик в боковом поле ближе к mainField
      case "nearer":
        nearer();
        break;
      //кубик появляется третим в боковом поле
      case "apperanceInSide":
        apperance();
        break;
      //третий кубик в боковой линии пропадает
      case "disapperanceInSide":
        disapperance();
        break;
      //передвигаем кубик в боковой панели дальше от mainField
      case "forth":
        forth();
        break;
      //передвигаем кубик в боковой панели дальше от mainField
      case "boom":
        boom();
        break;
      //уменьшаем и в конце удаляем
      case "remove":
        cube.$el.transition(
          {
            scale: 0,
            opacity: 0,
            duration: duration * data.animTime,
            easing: "out",
          },
          function () {
            cube.remove();
          }
        );
        break;
      default:
        console.log("Неизвестная анимация: " + action);
        break;
    }

    function slideWithBump(prop: "left" | "top", sign: "+" | "-") {
      dur = duration - 1;
      const scale: [number, number] = prop === "left" ? [0.9, 1.1] : [1.1, 0.9];

      const trans0: Transition = {
        duration: data.animTime * dur,
        easing: "cubic-bezier(." + bezier(dur) + ", 0, 1, 1)",
      };
      trans0[prop] = sign + "=" + dur * data.oneWidth;
      const trans1: Transition = {
        scale: scale,
        duration: data.animTime / 2,
      };
      trans1[prop] = (sign === "+" ? "+" : "-") + "=4";
      const trans2: Transition = {
        scale: 1,
        duration: data.animTime / 2,
      };
      trans2[prop] = (sign === "+" ? "-" : "+") + "=4";
      cube.$el.transition(trans0).transition(trans1).transition(trans2);
    }

    function slideToSide(prop: "left" | "top", sign: "+" | "-") {
      /*
       * движение в боковую панель без разрывов анимации,
       * чтобы сохранить максимальную плавность анимации, делать
       * одним перемещением по возможности
       * */
      dur = duration;
      //задаем нужный изинг
      var easing =
        "cubic-bezier(." + bezier(dur) + ", 0,." + (100 - bezier(dur)) + ", 1)";
      const trans: Transition = {
        duration: data.animTime * dur,
        easing: easing,
      };
      trans[prop] = sign + "=" + dur * data.oneWidth;

      //отправляем в коллекцию команду вставки кубика в линию,
      //чтобы остальные кубики в этой линии пододвинулись
      setTimeout(
        function (cube) {
          cube.app.cubes.animate({ action: "inLine", cube: cube });
        },
        data.animTime * (dur - 1),
        cube
      );

      //анимируем движение, в конце - убираем стрелку, меняем классы
      cube.$el.transition(trans, function () {
        var dir = data.f.reverseField(cube.field);
        cube.$el
          .removeClass("d" + cube.field + " f" + dir)
          .addClass("f" + cube.field);
      });
    }

    function nearer() {
      var prop: "top" | "left" = "left";
      var sign: "+" | "-" = "-";
      const trans: Transition = { duration: data.animTime };

      if (cube.field === "top" || cube.field === "bottom") {
        prop = "top";
        if (cube.field === "top") {
          sign = "+";
        }
      } else {
        prop = "left";
        if (cube.field === "left") {
          sign = "+";
        }
      }
      trans[prop] = sign + "=" + duration * data.oneWidth;
      cube.$el.transition(trans);
    }

    function forth() {
      var prop: "top" | "left" = "left";
      var sign: "+" | "-" = "+";
      const trans: Transition = { duration: data.animTime };

      if (cube.field === "top" || cube.field === "bottom") {
        prop = "top";
        if (cube.field === "top") {
          sign = "-";
        }
      } else {
        prop = "left";
        if (cube.field === "left") {
          sign = "-";
        }
      }
      trans[prop] = sign + "=" + duration * data.oneWidth;
      cube.$el.transition(trans);
    }

    function apperance() {
      var pos = { x: cube.x, y: cube.y };
      switch (cube.field) {
        case "top":
          pos.y = data.cubesWidth - 3;
          break;
        case "right":
          pos.x = 2;
          break;
        case "bottom":
          pos.y = 2;
          break;
        case "left":
          pos.x = data.cubesWidth - 3;
          break;
      }
      cube.toState(pos);
      cube.$el
        .removeClass("cubeHidden")
        .css({ scale: 0, opacity: 0.4 })
        .transition({
          scale: 1,
          opacity: 1,
          duration: duration * data.animTime,
          delay: duration * data.animTime,
          easing: "out",
        });
    }

    function disapperance() {
      cube.$el.transition({
        scale: 0,
        opacity: 0,
        duration: duration * data.animTime,
        easing: "out",
      });
      setTimeout(
        function (cube) {
          cube.$el
            .css({
              scale: 1,
              opacity: 1,
            })
            .addClass("cubeHidden");
        },
        duration * data.animTime,
        cube
      );
    }

    function boom() {
      //console.log("boom:",cube.color, cube.x, cube.y);
      cube.$el.transition(
        {
          scale: 1.5,
          opacity: 0,
          duration: data.animTime,
          easing: "out",
        },
        function () {
          cube.remove();
        }
      );
    }
  }

  //проверка, показывать кубик или нет в поле
  public _inFieldIsVisible() {
    var pos;
    if (this.field === "main") {
      return true;
    }
    if (this.field === "top" || this.field === "bottom") {
      pos = this["y"];
      return this.field === "top" ? pos > 6 : pos < 3;
    } else {
      pos = this["x"];
      return this.field === "left" ? pos > 6 : pos < 3;
    }
  }

  // Меняем параметры кубика, при этом его анимируем
  public change(o: { color?: string; direction?: Direction }) {
    const changeParams = () => {
      //если меняем цвет и это не тот же цвет, что сейчас
      if (o.color !== undefined && o.color !== this.color) {
        var prevColor = this.color;
        this.color = o.color;
        this.$el.removeClass(prevColor).addClass(this.color);
      }
      //если меняем направление и это не то же направление, что сейчас
      if (o.direction !== undefined && o.direction !== this.direction) {
        var prevDirection = this.direction;
        this.direction = o.direction;

        //стили следует менять только у кубиков на главном поле, так как
        //слили dtop, dright, dbotom, dleft присваивают кубикам стрелки
        if (this.field === "main") {
          this.$el.removeClass("d" + prevDirection);
          if (this.direction !== null) {
            this.$el.addClass("d" + this.direction);
          }
        }
      }
    };

    if (this._inFieldIsVisible()) {
      type TransitionProp = "rotate3d" | "rotateX" | "rotateY";
      let prop: TransitionProp;
      //для красотенюшки задаем разную анимацию для разных полей
      if (this.field === "main") {
        prop = "rotate3d";
      } else if (this.field === "top" || this.field === "bottom") {
        prop = "rotateX";
      } else {
        prop = "rotateY";
      }

      type Transition = { duration: number } & Partial<
        Record<TransitionProp, string>
      >;
      //анимация скрытия/открытия
      const transition1: Transition = { duration: data.animTime * 2 };
      const transition2: Transition = { duration: data.animTime * 2 };
      if (this.field === "main") {
        transition1[prop] = "1,1,0,90deg";
        transition2[prop] = "1,1,0,0deg";
      } else {
        transition1[prop] = String(90);
        transition2[prop] = String(0);
      }
      //сама анимация с изменением состояния по ходу
      this.$el
        .transition(transition1, function () {
          changeParams();
        })
        .transition(transition2);
    } else {
      changeParams();
    }
  }
}
