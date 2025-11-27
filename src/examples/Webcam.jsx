// examples/VideoWebcamExample.jsx
import { useEffect, useRef } from "react";

export default function VideoWebcamExample({ gridRef, params }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { gridCols, gridRows, colsPerGrid, rowsPerGrid } = params;
  const totalCols = gridCols * colsPerGrid;
  const totalRows = gridRows * rowsPerGrid;

  useEffect(() => {
    let stream;
    let raf;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = totalCols;
    canvas.height = totalRows;

    // --- 1) Request webcam ---
    navigator.mediaDevices
      .getUserMedia({
        video: { width: totalCols, height: totalRows },
        audio: false,
      })
      .then((mediaStream) => {
        stream = mediaStream;
        video.srcObject = mediaStream;
        video.play();
      })
      .catch((err) => console.error("Webcam error:", err));

    // --- 2) Frame → FlipDot ---
    const loop = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, totalCols, totalRows);
        const data = ctx.getImageData(0, 0, totalCols, totalRows).data;

        const grid = gridRef.current;
        if (grid) {
          for (let y = 0; y < totalRows; y++) {
            for (let x = 0; x < totalCols; x++) {
              const i = (y * totalCols + x) * 4;
              const threshold = params.threshold ?? 128; // valeur par défaut 128
              const brightness = data[i];
              grid.setCell(x, y, brightness > threshold ? 1 : 0);
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [gridRef, params]);

  return (
    <>
      {/* webcam video (hidden) */}
      <video ref={videoRef} hidden playsInline muted />

      {/* canvas interne pour extraction pixels */}
      <canvas ref={canvasRef} hidden />
    </>
  );
}
