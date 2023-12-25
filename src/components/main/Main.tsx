import { useEffect, useRef, useState } from "react";
import styles from "./main.module.css";
import { Canvas } from "../../libs/Canvas";
import { layer } from "../../typings/global";

export default function ImagePart() {
  const imageRef = useRef<HTMLCanvasElement>(null!);
  const maskRef = useRef<HTMLCanvasElement>(null!);
  const orgRef = useRef<HTMLCanvasElement>(null!);

  const imageContextRef = useRef<CanvasRenderingContext2D>(null!);
  const maskContextRef = useRef<CanvasRenderingContext2D>(null!);
  const orgContextRef = useRef<CanvasRenderingContext2D>(null!);

  const imageWrapperRef = useRef<HTMLDivElement>(null!);
  const maskWrapperRef = useRef<HTMLDivElement>(null!);

  const canvasRef = useRef<Canvas>(null!);

  const [brushSize, setBrushSize] = useState(15);
  const [currentLayer, setCurrentLayer] = useState<layer>("image");
  const [scale, setScale] = useState(1);
  const [originalDimensions, setOriginalDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);

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

  const uploadImage = async () => {
    if (
      fileRef.current === null ||
      fileRef.current.files === null ||
      fileRef.current.files.length === 0
    )
      return;

    const file = fileRef.current.files[0];

    if (!file.type.startsWith("image")) return;

    canvasRef.current.drawImage(file);
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

    canvasRef.current = new Canvas(
      imageRef.current,
      imageContextRef.current,
      maskRef.current,
      maskContextRef.current,
      orgRef.current,
      orgContextRef.current
    );

    window.addEventListener("resize", reSize);

    return () => {
      window.removeEventListener("resize", reSize);
      canvasRef.current.clearEventListeners();
    };
  }, []);

  return (
    <>
      <div>
        <input
          type="file"
          ref={fileRef}
          accept=".png , .jpg"
          onChange={uploadImage}
        ></input>

        <button
          type="button"
          onClick={() => {
            updateScrollPositions("image");
            setCurrentLayer("image");
            canvasRef.current.changeLayer("image");
          }}
        >
          image
        </button>
        <button
          type="button"
          onClick={() => {
            updateScrollPositions("mask");
            setCurrentLayer("mask");
            canvasRef.current.changeLayer("mask");
          }}
        >
          mask
        </button>
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
            style={getScaledDimensions()}
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
            style={getScaledDimensions()}
            ref={maskRef}
            id="maskLayer"
          ></canvas>
        </div>
        <canvas style={{ display: "none" }} ref={orgRef}></canvas>
      </div>
      <div className={styles.toolbar}>
        <>
          <button
            type="button"
            onClick={() => {
              setScale((pv) => (pv - 0.25 >= 1 ? pv - 0.25 : 1));
            }}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              setScale((pv) => pv + 0.25);
            }}
          >
            +
          </button>
        </>
        <p>{brushSize}</p>
        <button
          type="button"
          onClick={() => {
            setBrushSize(canvasRef.current.decreaseBrushSize());
          }}
        >
          -
        </button>
        <button
          type="button"
          onClick={() => {
            setBrushSize(canvasRef.current.increaseBrushSize());
          }}
        >
          +
        </button>
      </div>
    </>
  );
}
