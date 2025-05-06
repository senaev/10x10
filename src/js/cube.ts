import $ from "jquery";
import { cubeAnimation } from "./cubeAnimation";
import { data } from "./data";

export class Cube {
  constructor(o) {
    var undefined, cube, color, visibleModeClasses;

    cube = this;
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
    if (cube.field !== "main") {
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
        function (e) {
          e.preventDefault();

          if (cube.field === "main") {
          } else {
            //cube.findFirstInLine().$el.addClass("firstInHoverLine");
            var allToFirstInLine = cube.findAllInLineCanGoToMain();
            if (typeof allToFirstInLine !== "string") {
              for (var key in allToFirstInLine) {
                allToFirstInLine[key].$el.addClass("firstInHoverLine");
              }
            }
          }
        },
        function (e) {
          e.preventDefault();

          if (cube.field === "main") {
          } else {
            //cube.findFirstInLine().$el.removeClass("firstInHoverLine");
            var allToFirstInLine = cube.findAllInLineCanGoToMain();
            if (typeof allToFirstInLine !== "string") {
              for (var key in allToFirstInLine) {
                allToFirstInLine[key].$el.removeClass("firstInHoverLine");
              }
            }
          }
        }
      )
      .click(function (e) {
        //не даем продолжить выполнение событий
        e.preventDefault();
        //и снимаем курсор с элемента
        cube.$el.trigger("mouseout");

        //если стоит блокировка событий приложения - не даём пользователю ничего сделать
        if (cube.app.blockApp) {
          return;
        }

        //если щелчек произошол по главному полю - ничего не делаем
        if (cube.field === "main") {
        }
        //если по боковому
        else {
          //ищем первые кубики в одной линии бокового поля с кубиком, по  которому щелкнули,
          //которые могут выйти из поля
          var startCubes = cube.findAllInLineCanGoToMain();
          //если пришел не массив - выполняем анимацию
          if (typeof startCubes === "string") {
            var scale =
              cube.field === "left" || cube.field === "right"
                ? [0.8, 1.2]
                : [1.2, 0.8];
            cube.$el
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
            cube.app.run({ startCubes: startCubes });
          }
        }
      });

    this.toField();
  }

  //отправляем созданный кубик в приложение - добавляем в коллекцию cubes и в html-контейнер
  public toField = function () {
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
  };

  //ищем первый кубик в одной линии бокового поля с кубиком, по  которому щелкнули
  public findFirstInLine = function () {
    var o = { field: this.field };
    if (o.field === "top" || o.field === "bottom") {
      o.x = this.x;
      o.y = o.field === "top" ? 9 : 0;
    } else {
      o.x = o.field === "left" ? 9 : 0;
      o.y = this.y;
    }
    return this.app.cubes._get(o);
  };

  //находим все кубики от этого до ближнего к майн в линии относительно этого
  public findAllInLineCanGoToMain = function () {
    var statProp = "y";
    var dynamicProp = "x";
    if (this.field === "top" || this.field === "bottom") {
      statProp = "x";
      dynamicProp = "y";
    }
    //проверяем, сколько кубиков можно достать из боковой линии
    //по количеству свободных клеток в поле майн
    var cellsMain =
      this.field === "top" || this.field === "left" ? [0, 1, 2] : [9, 8, 7];
    var cellsSide =
      this.field === "top" || this.field === "left" ? [9, 8, 7] : [0, 1, 2];
    var pos = { field: "main" };
    pos[statProp] = this[statProp];
    var count = 0;
    for (var key in cellsMain) {
      pos[dynamicProp] = cellsMain[key];
      if (this.app.cubes._get(pos) === null) {
        count++;
      } else {
        break;
      }
    }

    //проверяем, если линия пустая, ходить вообще нельзя
    var allNullInLine = true;
    for (var key = 0; key < data.cubesWidth; key++) {
      pos[dynamicProp] = key;
      if (this.app.cubes._get(pos) !== null) {
        allNullInLine = false;
        break;
      }
    }

    var arr = [];
    //если все нули в линии - возвращаем индикатор пустоты
    if (allNullInLine) {
      return "empty";
    } else {
      if (count !== 0) {
        pos = { field: this.field };
        pos[statProp] = this[statProp];
        for (var key = 0; key < 3 && key < count; key++) {
          pos[dynamicProp] = cellsSide[key];
          arr.push(this.app.cubes._get(pos));
          //если доходим до кубика, над которым курсор - заканчиваем маневр
          if (this.app.cubes._get(pos) === this) {
            break;
          }
        }
        return arr;
      }
      //если сразу за полем кубик - ничего не возвращаем
      else {
        return "block";
      }
    }
  };

  //задаем html-элементу кубика положение на доске
  //если параметры не переданы, устанавливаем текущую позицию кубика
  //если переданы - устанавливаем в поле кубику, в позицию х/у, переданные в параметрах
  public toState = function (o) {
    var x, y;
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
  };

  //добавляем объект анимации на обработку через время, полученное в атрибутах
  public addAnimate = function (o) {
    var action, delay, duration, cube;

    action = o.action;
    delay = o.delay;
    duration = o.duration;
    cube = this;
    setTimeout(
      function (o) {
        cube.animate(o);
      },
      delay * data.animTime,
      { action: action, duration: duration }
    );
  };
  //добавляем объект анимации на обработку через время, полученное в атрибутах
  public remove = function () {
    this.$el.remove();
  };
  //сама функция анимации - в зависимости од переданного значения, выполняем те или иные
  //преобразования html-элемента кубика
  public animate = cubeAnimation;

  //проверка, показывать кубик или нет в поле
  public _inFieldIsVisible = function () {
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
  };

  //меняем параметры кубика, при этом его анимируем
  public change = function (o) {
    var cube = this;

    if (this._inFieldIsVisible()) {
      var prop;
      //для красотенюшки задаем разную анимацию для разных полей
      if (this.field === "main") {
        prop = "rotate3d";
      } else if (this.field === "top" || this.field === "bottom") {
        prop = "rotateX";
      } else {
        prop = "rotateY";
      }
      //анимация скрытия/открытия
      var trans1, trans2;
      trans1 = { duration: data.animTime * 2 };
      trans2 = { duration: data.animTime * 2 };
      if (this.field === "main") {
        trans1[prop] = "1,1,0,90deg";
        trans2[prop] = "1,1,0,0deg";
      } else {
        trans1[prop] = 90;
        trans2[prop] = 0;
      }
      //сама анимация с изменением состояния по ходу
      this.$el
        .transition(trans1, function () {
          changeParams();
        })
        .transition(trans2);
    } else {
      changeParams();
    }

    function changeParams() {
      //если меняем цвет и это не тот же цвет, что сейчас
      if (o.color !== undefined && o.color !== cube.color) {
        var prevColor = cube.color;
        cube.color = o.color;
        cube.$el.removeClass(prevColor).addClass(cube.color);
      }
      //если меняем направление и это не то же направление, что сейчас
      if (o.direction !== undefined && o.direction !== cube.direction) {
        var prevDirection = cube.direction;
        cube.direction = o.direction;

        //стили следует менять только у кубиков на главном поле, так как
        //слили dtop, dright, dbotom, dleft присваивают кубикам стрелки
        if (cube.field === "main") {
          cube.$el.removeClass("d" + prevDirection);
          if (cube.direction !== null) {
            cube.$el.addClass("d" + cube.direction);
          }
        }
      }
    }
  };
}
