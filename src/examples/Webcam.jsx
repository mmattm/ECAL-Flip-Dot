// examples/VideoWebcamExample.jsx
import { useEffect, useRef } from "react";

export default function Webcam({ gridRef, params }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { gridCols, gridRows, colsPerGrid, rowsPerGrid } = params;

  const totalCols = gridCols * colsPerGrid;
  const totalRows = gridRows * rowsPerGrid;

  useEffect(() => {
    let stream = null;
    let raf = null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // --- Canvas interne ---
    canvas.width = totalCols;
    canvas.height = totalRows;

    // --- Constraints webcam dynamiques ---
    const videoConstraints = {
      width: totalCols,
      height: totalRows,
    };

    // Si l'utilisateur a choisi une caméra → on la force
    if (params.selectedCameraId) {
      videoConstraints.deviceId = { exact: params.selectedCameraId };
    }

    // --- 1) Request / switch webcam ---
    navigator.mediaDevices
      .getUserMedia({
        video: videoConstraints,
        audio: false,
      })
      .then((mediaStream) => {
        stream = mediaStream;
        video.srcObject = mediaStream;
        video.play();
      })
      .catch((err) => console.error("Webcam error:", err));

    // --- 2) Loop → draw webcam → send to FlipDot ---
    const loop = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, totalCols, totalRows);

        const data = ctx.getImageData(0, 0, totalCols, totalRows).data;
        const grid = gridRef.current;
        const threshold = params.threshold ?? 128;

        if (grid) {
          for (let y = 0; y < totalRows; y++) {
            for (let x = 0; x < totalCols; x++) {
              const i = (y * totalCols + x) * 4;
              const brightness = data[i]; // canal R suffit (grayscale naturel)
              grid.setCell(x, y, brightness > threshold ? 1 : 0);
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    loop();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [
    gridRef,
    params.threshold,
    params.selectedCameraId,
    gridCols,
    gridRows,
    colsPerGrid,
    rowsPerGrid,
  ]);

  return (
    <>
      <video ref={videoRef} hidden playsInline muted />
      <canvas ref={canvasRef} hidden />
    </>
  );
}
