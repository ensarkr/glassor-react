import { useEffect, useRef, useState } from "react";
import styles from "./main.module.css";
import { CanvasLogic } from "../../libs/CanvasLogic";
import { layer } from "../../typings/global";
import minusPNG from "../../assets/minus-regular-24.png";
import plusPNG from "../../assets/plus-regular-24.png";
import undoPNG from "../../assets/undo-regular-24.png";
import redoPNG from "../../assets/redo-regular-24.png";
import zoomInPNG from "../../assets/zoom-in-regular-24.png";
import zoomOutPNG from "../../assets/zoom-out-regular-24.png";
import downloadPNG from "../../assets/download-regular-24.png";
import uploadImagePNG from "../../assets/image-alt-regular-24.png";
import tutorialPNG from "../../assets/tutorial.png";

export default function ImagePart() {
  const imageRef = useRef<HTMLCanvasElement>(null!);
  const maskRef = useRef<HTMLCanvasElement>(null!);
  const orgRef = useRef<HTMLCanvasElement>(null!);

  const imageContextRef = useRef<CanvasRenderingContext2D>(null!);
  const maskContextRef = useRef<CanvasRenderingContext2D>(null!);
  const orgContextRef = useRef<CanvasRenderingContext2D>(null!);

  const imageWrapperRef = useRef<HTMLDivElement>(null!);
  const maskWrapperRef = useRef<HTMLDivElement>(null!);

  const tutorialRef = useRef<HTMLImageElement>(null!);
  const tutorialLoaded = useRef(false);

  const canvasRef = useRef<CanvasLogic>(null!);

  const [brushSize, setBrushSize] = useState(15);
  const [currentLayer, setCurrentLayer] = useState<layer>("image");
  const [scale, setScale] = useState(1);
  const [originalDimensions, setOriginalDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);

  const [background, setBackground] = useState<"image" | "color">("image");
  const [color, setColor] = useState("#fff");

  const [isUploaded, setIsUploaded] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const updateOriginalDimensions = () => {
    setOriginalDimensions({
      width: imageRef.current.getBoundingClientRect().width,
      height: imageRef.current.getBoundingClientRect().height,
    });
  };

  const reSize = () => {
    setScale(1);
    setOriginalDimensions(null);
    setTimeout(updateOriginalDimensions, 0);
  };

  const getScaledDimensions = () => {
    return originalDimensions === null
      ? {}
      : {
          width: originalDimensions.width * scale,
          height: originalDimensions.height * scale,
        };
  };

  const updateScrollPositions = (transferTo: layer) => {
    if (transferTo === "mask") {
      maskWrapperRef.current.scrollTop = imageWrapperRef.current.scrollTop;
      maskWrapperRef.current.scrollLeft = imageWrapperRef.current.scrollLeft;
    } else {
      imageWrapperRef.current.scrollTop = maskWrapperRef.current.scrollTop;
      imageWrapperRef.current.scrollLeft = maskWrapperRef.current.scrollLeft;
    }
  };

  const handleShortcuts = (e: KeyboardEvent) => {
    if (e.key === "x") {
      setCurrentLayer((pv) => {
        updateScrollPositions(pv === "image" ? "mask" : "image");
        canvasRef.current.changeLayer(pv === "image" ? "mask" : "image");
        return pv === "image" ? "mask" : "image";
      });
    }

    if (e.key === "z" && e.ctrlKey) {
      canvasRef.current.History.undo();
    }

    if (e.key === "y" && e.ctrlKey) {
      canvasRef.current.History.redo();
    }

    if (e.key === "+" && !e.ctrlKey) {
      setScale((pv) => pv + 0.25);
    }

    if (e.key === "-" && !e.ctrlKey) {
      setScale((pv) => (pv - 0.25 >= 1 ? pv - 0.25 : 1));
    }

    if (e.key === "+" && e.ctrlKey) {
      e.preventDefault();
      setBrushSize(canvasRef.current.increaseBrushSize());
    }

    if (e.key === "-" && e.ctrlKey) {
      e.preventDefault();
      setBrushSize(canvasRef.current.decreaseBrushSize());
    }
  };

  const uploadImage = async () => {
    if (
      fileRef.current === null ||
      fileRef.current.files === null ||
      fileRef.current.files.length === 0
    )
      return;

    const file = fileRef.current.files[0];

    if (!file.type.startsWith("image")) return;

    setIsUploaded(true);
    canvasRef.current.drawImage(file);
  };

  const downloadImage = async () => {
    const canvasUrl = imageRef.current.toDataURL();
    const anchor = document.createElement("a");
    anchor.href = canvasUrl;

    anchor.download = "transparent image";

    anchor.click();
    anchor.remove();
  };

  const switchLayer = (to: layer) => {
    updateScrollPositions(to);
    setCurrentLayer(to);
    canvasRef.current.changeLayer(to);
  };

  useEffect(() => {
    imageContextRef.current = imageRef.current.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    maskContextRef.current = maskRef.current.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    orgContextRef.current = orgRef.current.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;

    updateOriginalDimensions();

    canvasRef.current = new CanvasLogic(
      imageRef.current,
      imageContextRef.current,
      maskRef.current,
      maskContextRef.current,
      orgRef.current,
      orgContextRef.current
    );

    if (tutorialLoaded.current) {
      canvasRef.current.drawImage(null, tutorialRef.current);
    } else {
      tutorialRef.current.onload = () => {
        canvasRef.current.drawImage(null, tutorialRef.current);
      };
    }

    window.addEventListener("resize", reSize);
    document.addEventListener("keydown", handleShortcuts);

    return () => {
      window.removeEventListener("resize", reSize);
      document.removeEventListener("keydown", handleShortcuts);
      canvasRef.current.clearEventListeners();
    };
  }, []);

  return (
    <main>
      <img
        src={tutorialPNG}
        ref={tutorialRef}
        style={{ display: "none" }}
        onLoad={() => {
          tutorialLoaded.current = true;
        }}
      ></img>
      <div className={styles.topBar}>
        <label className={styles.fileInput}>
          <input
            type="file"
            ref={fileRef}
            accept=".png , .jpg"
            onChange={uploadImage}
          ></input>
          {isUploaded ? (
            "Image uploaded."
          ) : (
            <>
              <img src={uploadImagePNG}></img> Click to upload an image.
            </>
          )}
        </label>

        <div className={styles.tabs}>
          <button
            className={[
              styles.tabBar,
              currentLayer === "image" && styles.tabBarActive,
            ].join(" ")}
            type="button"
            onClick={() => switchLayer("image")}
          >
            image
          </button>
          <button
            className={[
              styles.tabBar,
              currentLayer === "mask" && styles.tabBarActive,
            ].join(" ")}
            type="button"
            onClick={() => switchLayer("mask")}
          >
            mask
          </button>
        </div>
      </div>
      <div className={styles.canvasPart}>
        <div
          className={styles.canvasWrapper}
          ref={imageWrapperRef}
          style={{
            ...originalDimensions,
            opacity: currentLayer === "image" ? 1 : 0,
            zIndex: currentLayer === "image" ? 1 : 0,
            overflow: scale > 1 ? "scroll" : "hidden",
          }}
        >
          <canvas
            style={{
              ...getScaledDimensions(),
              ...(background === "image"
                ? {
                    backgroundImage: "url(./background.jpg)",
                    backgroundRepeat: "repeat",
                  }
                : { backgroundColor: color }),
            }}
            ref={imageRef}
            id="imageLayer"
          ></canvas>
        </div>
        <div
          className={styles.canvasWrapper}
          ref={maskWrapperRef}
          style={{
            ...originalDimensions,
            opacity: currentLayer === "mask" ? 1 : 0,
            zIndex: currentLayer === "mask" ? 1 : 0,
            overflow: scale > 1 ? "scroll" : "hidden",
          }}
        >
          <canvas
            style={{
              ...getScaledDimensions(),
              ...(background === "image"
                ? {
                    backgroundImage: "url(./background.jpg)",
                    backgroundRepeat: "repeat",
                  }
                : { backgroundColor: color }),
            }}
            ref={maskRef}
            id="maskLayer"
          ></canvas>
        </div>
        <div
          className={styles.canvasWrapper}
          style={{
            ...originalDimensions,
            opacity: 1,
            zIndex: -1,
          }}
        ></div>

        <canvas style={{ display: "none" }} ref={orgRef}></canvas>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => canvasRef.current.History.undo()}
            >
              <img src={undoPNG}></img>
            </button>
            <button
              type="button"
              onClick={() => canvasRef.current.History.redo()}
            >
              <img src={redoPNG}></img>
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => setBrushSize(canvasRef.current.resetBrushSize())}
            >
              {brushSize}px
            </button>
            <button
              type="button"
              onClick={() =>
                setBrushSize(canvasRef.current.decreaseBrushSize())
              }
            >
              <img src={minusPNG}></img>
            </button>
            <button
              type="button"
              onClick={() =>
                setBrushSize(canvasRef.current.increaseBrushSize())
              }
            >
              <img src={plusPNG}></img>
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" onClick={() => setScale(1)}>
              {scale}x
            </button>
            <button
              type="button"
              onClick={() => setScale((pv) => (pv - 0.25 >= 1 ? pv - 0.25 : 1))}
            >
              <img src={zoomOutPNG}></img>
            </button>
            <button type="button" onClick={() => setScale((pv) => pv + 0.25)}>
              <img src={zoomInPNG}></img>
            </button>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.buttonGroup}>
            <button
              style={{
                backgroundImage: "url(./background.jpg)",
              }}
              type="button"
              onClick={() => setBackground("image")}
            ></button>

            <label
              className={styles.colorInput}
              style={{
                backgroundColor: color,
              }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setBackground("color");
                  setColor(e.target.value);
                }}
              ></input>
            </label>
          </div>
          <button disabled={!isUploaded} type="button" onClick={downloadImage}>
            <img src={downloadPNG}></img>
          </button>
        </div>
      </div>
    </main>
  );
}
