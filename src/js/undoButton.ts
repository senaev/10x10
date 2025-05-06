import $ from "jquery";
import { TenOnTen } from "./TenOnTen";

export class UndoButton {
  private app: TenOnTen;
  private active: boolean;
  private caption: string;
  private func: () => void;
  private $el: JQuery<HTMLElement>;

  constructor(params: { app: TenOnTen }) {
    var undoButton = this;

    this.app = params.app;
    this.active = true;
    this.caption = this.app.word("refresh");
    this.func = undoButton.app.refresh;

    this.$el = $(
      '<div class="undoButton">' + undoButton.app.word("refresh") + "</div>"
    )
      .click(function (e) {
        //не даем продолжить выполнение событий
        e.preventDefault();

        if (undoButton.active && !undoButton.app.blockApp) {
          undoButton.func.apply(undoButton.app);
        }
      })
      .appendTo(
        undoButton.app.container.children(".panel.topRightPanel").first()
      );
  }

  public _set = (o: { active: boolean }) => {
    if (o.func !== undefined && this.func !== o.func) {
      this.func = o.func;
    }
    if (o.caption !== undefined && this.caption !== o.caption) {
      this.caption = o.caption;
      this.$el.html(o.caption);
    }
    if (o.active !== undefined && this.active !== o.active) {
      this.active = o.active;
      if (this.active) {
        this.$el.removeClass("blocked");
      } else {
        this.$el.addClass("blocked");
      }
    }
  };

  public _get = (prop) => {
    return undoButton[prop];
  };
}
