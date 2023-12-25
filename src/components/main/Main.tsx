import { useEffect, useRef, useState } from "react";
import styles from "./main.module.css";

type layer = "image" | "mask";

export default function ImagePart() {
  const imageRef = useRef<HTMLCanvasElement>(null!);
  const maskRef = useRef<HTMLCanvasElement>(null!);
  const orgRef = useRef<HTMLCanvasElement>(null!);

  const imageContextRef = useRef<CanvasRenderingContext2D>(null!);
  const maskContextRef = useRef<CanvasRenderingContext2D>(null!);
  const orgContextRef = useRef<CanvasRenderingContext2D>(null!);

  const imageWrapperRef = useRef<HTMLDivElement>(null!);
  const maskWrapperRef = useRef<HTMLDivElement>(null!);

  const isPaintingRef = useRef<boolean>(false);
  const [brushSize, setBrushSize] = useState(1);
  const brushSizeRef = useRef(1);

  const isDoingRef = useRef(false);

  const [currentLayer, setCurrentLayer] = useState<layer>("image");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [scale, setScale] = useState(1);
  const [originalDimensions, setOriginalDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);

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

  const getTopLeft = (pos: { x: number; y: number }) => {
    return {
      x: pos.x - Math.floor(brushSizeRef.current / 2),
      y: pos.y - Math.floor(brushSizeRef.current / 2),
    };
  };

  const getMousePosition = (event: MouseEvent) => {
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.width / rect.width;
    const scaleY = imageRef.current.height / rect.height;

    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY),
    };
  };

  const transferPixels = async (event: MouseEvent, currentLayer: layer) => {
    if (isDoingRef.current === true) return;

    isDoingRef.current = true;

    const pos = getMousePosition(event);

    if (currentLayer === "image") {
      const imageData = orgContextRef.current.getImageData(
        getTopLeft(pos).x,
        getTopLeft(pos).y,
        brushSizeRef.current,
        brushSizeRef.current
      );

      maskContextRef.current.drawImage(
        await createImageBitmap(imageData),
        getTopLeft(pos).x,
        getTopLeft(pos).y,
        brushSizeRef.current,
        brushSizeRef.current
      );

      imageContextRef.current.fillStyle = "rgba(255, 0, 0, 0.5)";
      imageContextRef.current.fillRect(
        getTopLeft(pos).x,
        getTopLeft(pos).y,
        brushSizeRef.current,
        brushSizeRef.current
      );

      isDoingRef.current = false;
    }

    if (currentLayer === "mask") {
      const imageData = orgContextRef.current.getImageData(
        getTopLeft(pos).x,
        getTopLeft(pos).y,
        brushSizeRef.current,
        brushSizeRef.current
      );

      imageContextRef.current.drawImage(
        await createImageBitmap(imageData),
        getTopLeft(pos).x,
        getTopLeft(pos).y,
        brushSizeRef.current,
        brushSizeRef.current
      );

      maskContextRef.current.fillStyle = "rgba(255, 0, 0, 0.5)";
      maskContextRef.current.fillRect(
        getTopLeft(pos).x,
        getTopLeft(pos).y,
        brushSizeRef.current,
        brushSizeRef.current
      );

      isDoingRef.current = false;
    }
  };

  const uploadImage = async () => {
    if (fileRef.current === null || fileRef.current.files === null) return;

    const file = fileRef.current.files[0];

    if (!file.type.startsWith("image")) return;

    const imageBitMap = await createImageBitmap(file);

    if (imageBitMap.width > imageBitMap.height * (16 / 7)) {
      imageRef.current.width = imageBitMap.width;
      imageRef.current.height = imageBitMap.width * (7 / 16);
      imageContextRef.current.drawImage(
        imageBitMap,
        0,
        (imageRef.current.height - imageBitMap.height) / 2
      );

      orgRef.current.width = imageBitMap.width;
      orgRef.current.height = imageBitMap.width * (7 / 16);
      orgContextRef.current.drawImage(
        imageBitMap,
        0,
        (orgRef.current.height - imageBitMap.height) / 2
      );
    } else {
      imageRef.current.height = imageBitMap.height;
      imageRef.current.width = imageBitMap.height * (16 / 7);
      imageContextRef.current.drawImage(
        imageBitMap,
        (imageRef.current.width - imageBitMap.width) / 2,
        0
      );
      orgRef.current.height = imageBitMap.height;
      orgRef.current.width = imageBitMap.height * (16 / 7);
      orgContextRef.current.drawImage(
        imageBitMap,
        (orgRef.current.width - imageBitMap.width) / 2,
        0
      );
    }

    maskRef.current.height = imageRef.current.height;
    maskRef.current.width = imageRef.current.width;
    maskContextRef.current.fillStyle = "rgba(255, 0, 0, 0.5)";
    maskContextRef.current.fillRect(
      0,
      0,
      maskRef.current.width,
      maskRef.current.height
    );

    imageBitMap.close();
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

    imageContextRef.current;

    updateOriginalDimensions();

    window.addEventListener("resize", reSize);

    imageRef.current.addEventListener("mousedown", () => {
      isPaintingRef.current = true;
    });
    imageRef.current.addEventListener("mouseup", () => {
      isPaintingRef.current = false;
    });

    imageRef.current.addEventListener("mousemove", (e) => {
      if (isPaintingRef.current) {
        transferPixels(e, "image");
      }
    });

    maskRef.current.addEventListener("mousedown", () => {
      isPaintingRef.current = true;
    });
    maskRef.current.addEventListener("mouseup", () => {
      isPaintingRef.current = false;
    });

    maskRef.current.addEventListener("mousemove", (e) => {
      if (isPaintingRef.current) {
        transferPixels(e, "mask");
      }
    });

    return () => {
      window.removeEventListener("resize", reSize);
    };
  }, []);

  return (
    <>
      <div className={styles.title}>Image</div>
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
        <button
          type="button"
          onClick={() => {
            if (brushSize !== 1) {
              setBrushSize((pv) => (pv - 1 > 0 ? pv - 1 : 1));
              brushSizeRef.current--;
            }
          }}
        >
          -
        </button>
        <button
          type="button"
          onClick={() => {
            setBrushSize((pv) => pv + 1);
            brushSizeRef.current++;
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            updateScrollPositions("image");
            setCurrentLayer("image");
          }}
        >
          image
        </button>
        <button
          type="button"
          onClick={() => {
            updateScrollPositions("mask");
            setCurrentLayer("mask");
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
      <div className={styles.toolbar}></div>
    </>
  );
}
