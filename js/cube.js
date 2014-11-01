//Cube class
define(['data', 'cube'], function (d, Cube) {
    function Cube(o) {
        var cube = this;
        this.x = o.x;
        this.y = o.y;
        this.field = o.field;
        this.app = o.app;
        this.direction = (function (field) {
            if (field === "top") {
                return "bottom";
            }
            else if (field === "bottom") {
                return "top";
            }
            else if (field === "left") {
                return "right";
            }
            else if (field === "right") {
                return "left";
            }
            else {
                return null;
            }
        })(this.field);
        this.color = d.colors[d.f.rand(0, d.levels[d.level].colorsCount - 1)];
        this.$el = $('<div class="cube"></div>')
            .addClass(this.color)
            .hover(
            function () {
                if (cube.field === "main") {

                }
                else {
                    cube.findFirstInLine().$el.addClass("firstInHoverLine");
                }
            },
            function () {
                if (cube.field === "main") {

                }
                else {
                    cube.findFirstInLine().$el.removeClass("firstInHoverLine");
                }
            })
            .click(function () {
                if (cube.field === "main") {

                }
                else {
                    var startCube = cube.findFirstInLine();
                    cube.app.run({startCube: startCube});
                }
            });

        this.toField();
    }

    Cube.prototype.toField = function () {
        this.app.cubes._add(this);
        this.toState();
        this.app.container.append(this.$el);
    }
    Cube.prototype.findFirstInLine = function () {
        var o = {field: this.field};
        if (o.field === "top" || o.field === "bottom") {
            o.x = this.x;
            o.y = (o.field === "top") ? 9 : 0;
        }
        else {
            o.x = (o.field === "left") ? 9 : 0;
            o.y = this.y;
        }
        return this.app.cubes._get(o);
    }
    Cube.prototype.toState = function () {
        var left = this.x * d.oneWidth;
        var top = this.y * d.oneWidth;
        switch (this.field) {
            case "top":
                top -= d.oneWidth * 10;
                break;
            case "right":
                left += d.oneWidth * 10;
                break;
            case "bottom":
                top += d.oneWidth * 10;
                break;
            case "left":
                left -= d.oneWidth * 10;
                break;
        }
        this.$el.css({
            left: left,
            top: top
        });
    }
    return Cube;
});