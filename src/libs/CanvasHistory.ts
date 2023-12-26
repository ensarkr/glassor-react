import { action } from "../typings/global";
import { CanvasLogic } from "./CanvasLogic";

class CanvasHistory {
  constructor(canvas: CanvasLogic) {
    this.canvas = canvas;
  }

  private canvas: CanvasLogic;
  private currentId: number = -1;
  private actions: action[][] = [];

  public newAction(action?: action) {
    this.currentId++;

    this.actions = this.actions.slice(0, this.currentId);

    this.actions[this.currentId] = [];

    if (action === undefined) return;

    this.actions[this.currentId].push(action);
  }

  public addAction(action: action) {
    this.actions[this.currentId].push(action);
  }

  public undo() {
    if (this.canvas.getIsPainting()) return;

    if (this.currentId === -1) return;

    for (let i = this.actions[this.currentId].length - 1; i >= 0; i--) {
      this.doOpposite(this.actions[this.currentId][i]);
    }

    this.currentId--;
  }

  public redo() {
    if (this.canvas.getIsPainting()) return;

    if (this.actions[this.currentId + 1] === undefined) return;

    this.currentId++;

    for (let i = 0; i < this.actions[this.currentId].length; i++) {
      this.doSame(this.actions[this.currentId][i]);
    }
  }

  public doSame(action: action) {
    switch (action.type) {
      case "transferImageData": {
        if (action.to === "mask") {
          this.canvas.drawToMask(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
          this.canvas.removeFromImage(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
        } else {
          this.canvas.drawToImage(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
          this.canvas.removeFromMask(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
        }

        return;
      }
    }
  }
  public doOpposite(action: action) {
    switch (action.type) {
      case "transferImageData": {
        if (action.to === "mask") {
          this.canvas.drawToImage(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
          this.canvas.removeFromMask(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
        } else {
          this.canvas.drawToMask(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
          this.canvas.removeFromImage(
            { x: action.rect.x, y: action.rect.y },
            action.rect.width
          );
        }

        return;
      }
    }
  }
}

export { CanvasHistory };
