type layer = "image" | "mask";

type action = { type: "transferImageData"; to: layer; rect: rect };
// | { type: "layerSwitch"; to: layer }
// | { type: "brushSize"; incrementValue: number }
// | { type: "zoom"; incrementValue: number };

type coord = { x: number; y: number };

type size = { width: number; height: number };

type rect = coord & size;

export { layer, action, coord, rect, size };
