// config.js
import ClickOnDrag from "./examples/ClickOnDrag";
import CanvasCube from "./examples/CanvasCube";
import ServerListener from "./examples/ServerListener";
import CanvasP5 from "./examples/CanvasP5";
import VideoUpload from "./examples/VideoUpload";
import Webcam from "./examples/Webcam";

export const SERVER_CONFIG = {
  IP: "localhost",
  HTTP_PORT: 3000,
  WS_PORT: 3000,
};

// 🔧 Modes centralisés
export const MODES = {
  "Click & Drag": ClickOnDrag,
  "Canvas Cube": CanvasCube,
  "Server Listener": ServerListener,
  "Canvas P5": CanvasP5,
  "Video Upload": VideoUpload,
  Webcam: Webcam,
};

// 🔩 Paramètres initiaux centralisés
export const DEFAULT_PARAMS = {
  layout: "Landscape",
  cellSize: 16,
  gridCols: 3,
  gridRows: 3,
  colsPerGrid: 28,
  rowsPerGrid: 14,
  mode: Object.keys(MODES)[0],
};
