import { coord, layer } from "../typings/global";
import { CanvasHistory } from "./History";

class CanvasLogic {
  constructor(
    image: HTMLCanvasElement,
    imageContext: CanvasRenderingContext2D,
    mask: HTMLCanvasElement,
    maskContext: CanvasRenderingContext2D,
    original: HTMLCanvasElement,
    originalContext: CanvasRenderingContext2D
  ) {
    this.image = image;
    this.imageContext = imageContext;

    this.mask = mask;
    this.maskContext = maskContext;

    this.original = original;
    this.originalContext = originalContext;

    this.addEventListeners();
  }

  private setIsPaintingTrue = (e: MouseEvent) => {
    this.isPainting = true;
    this.History.newAction();
    this.transferPixels(e);
  };
  private setIsPaintingFalse = () => {
    this.isPainting = false;
  };
  private transferIfPainting = (e: MouseEvent) => {
    if (this.isPainting) {
      this.transferPixels(e);
    }
  };

  private addEventListeners() {
    this.image.addEventListener("mousedown", this.setIsPaintingTrue);
    this.image.addEventListener("mouseup", this.setIsPaintingFalse);
    this.image.addEventListener("mousemove", this.transferIfPainting);

    this.mask.addEventListener("mousedown", this.setIsPaintingTrue);
    this.mask.addEventListener("mouseup", this.setIsPaintingFalse);
    this.mask.addEventListener("mousemove", this.transferIfPainting);
  }

  public clearEventListeners() {
    this.image.removeEventListener("mousedown", this.setIsPaintingTrue);
    this.image.removeEventListener("mouseup", this.setIsPaintingFalse);
    this.image.removeEventListener("mousemove", this.transferIfPainting);

    this.mask.removeEventListener("mousedown", this.setIsPaintingTrue);
    this.mask.removeEventListener("mouseup", this.setIsPaintingFalse);
    this.mask.removeEventListener("mousemove", this.transferIfPainting);
  }

  private readonly aspectRatio: number = 16 / 7;

  private readonly image: HTMLCanvasElement;
  private readonly imageContext: CanvasRenderingContext2D;

  private readonly mask: HTMLCanvasElement;
  private readonly maskContext: CanvasRenderingContext2D;

  private readonly original: HTMLCanvasElement;
  private readonly originalContext: CanvasRenderingContext2D;

  public readonly History: CanvasHistory = new CanvasHistory(this);

  private isPainting: boolean = false;
  private currentLayer: layer = "image";

  private brushSize: number = 15;

  private getMousePosition = (event: MouseEvent) => {
    const rect =
      this.currentLayer === "image"
        ? this.image.getBoundingClientRect()
        : this.mask.getBoundingClientRect();
    const scaleX = this.image.width / rect.width;
    const scaleY = this.image.height / rect.height;

    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY),
    };
  };

  private getTopLeft = (pos: coord) => {
    return {
      x: pos.x - Math.floor(this.brushSize / 2),
      y: pos.y - Math.floor(this.brushSize / 2),
    };
  };

  public async drawToImage(topLeft: coord, brushSize: number) {
    const imageData = this.originalContext.getImageData(
      topLeft.x,
      topLeft.y,
      brushSize,
      brushSize
    );

    this.imageContext.drawImage(
      await createImageBitmap(imageData),
      topLeft.x,
      topLeft.y,
      brushSize,
      brushSize
    );
  }

  public async drawToMask(topLeft: coord, brushSize: number) {
    const imageData = this.originalContext.getImageData(
      topLeft.x,
      topLeft.y,
      brushSize,
      brushSize
    );

    this.maskContext.drawImage(
      await createImageBitmap(imageData),
      topLeft.x,
      topLeft.y,
      brushSize,
      brushSize
    );
  }

  public removeFromImage(topLeft: coord, brushSize: number) {
    this.imageContext.clearRect(topLeft.x, topLeft.y, brushSize, brushSize);
  }

  public removeFromMask(topLeft: coord, brushSize: number) {
    this.maskContext.clearRect(topLeft.x, topLeft.y, brushSize, brushSize);
  }

  private transferPixels = async (event: MouseEvent) => {
    const pos = this.getMousePosition(event);
    const topLeft = this.getTopLeft(pos);

    if (this.currentLayer === "image") {
      this.drawToMask(topLeft, this.brushSize);
      this.removeFromImage(topLeft, this.brushSize);
      this.History.addAction({
        type: "transferImageData",
        to: "mask",
        rect: { ...topLeft, height: this.brushSize, width: this.brushSize },
      });
    }

    if (this.currentLayer === "mask") {
      this.drawToImage(topLeft, this.brushSize);
      this.removeFromMask(topLeft, this.brushSize);
      this.History.addAction({
        type: "transferImageData",
        to: "image",
        rect: { ...topLeft, height: this.brushSize, width: this.brushSize },
      });
    }
  };

  public changeLayer(layer: layer) {
    this.currentLayer = layer;
  }

  public increaseBrushSize() {
    return ++this.brushSize;
  }
  public decreaseBrushSize() {
    if (this.brushSize === 1) return 1;
    return --this.brushSize;
  }

  public async drawImage(file: File) {
    const imageBitMap = await createImageBitmap(file);

    if (imageBitMap.width > imageBitMap.height * this.aspectRatio) {
      this.image.width = imageBitMap.width;
      this.image.height = imageBitMap.width / this.aspectRatio;
      this.imageContext.drawImage(
        imageBitMap,
        0,
        (this.image.height - imageBitMap.height) / 2
      );

      this.original.width = imageBitMap.width;
      this.original.height = imageBitMap.width / this.aspectRatio;
      this.originalContext.drawImage(
        imageBitMap,
        0,
        (this.original.height - imageBitMap.height) / 2
      );
    } else {
      this.image.height = imageBitMap.height;
      this.image.width = imageBitMap.height * this.aspectRatio;
      this.imageContext.drawImage(
        imageBitMap,
        (this.image.width - imageBitMap.width) / 2,
        0
      );
      this.original.height = imageBitMap.height;
      this.original.width = imageBitMap.height * this.aspectRatio;
      this.originalContext.drawImage(
        imageBitMap,
        (this.original.width - imageBitMap.width) / 2,
        0
      );
    }

    this.mask.height = this.image.height;
    this.mask.width = this.image.width;
    this.maskContext.fillStyle = "rgba(0, 0, 0, 0)";
    this.maskContext.fillRect(0, 0, this.mask.width, this.mask.height);

    imageBitMap.close();
  }
}

export { CanvasLogic };
