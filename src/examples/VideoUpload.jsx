import { useEffect, useRef } from "react";

export default function VideoUpload({ gridRef, params, setParams }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const { gridCols, gridRows, colsPerGrid, rowsPerGrid } = params;
  const totalCols = gridCols * colsPerGrid;
  const totalRows = gridRows * rowsPerGrid;

  // --- Expose triggerUpload to ControlsPanel ---
  useEffect(() => {
    setParams((p) => ({
      ...p,
      triggerUpload: () => fileInputRef.current?.click(),
    }));
  }, [setParams]);

  // --- Lecture frame par frame ---
  useEffect(() => {
    if (!gridRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = totalCols;
    canvas.height = totalRows;

    let raf;

    const loop = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, totalCols, totalRows);
        const data = ctx.getImageData(0, 0, totalCols, totalRows).data;

        const grid = gridRef.current;
        const threshold = params.threshold ?? 128;

        for (let y = 0; y < totalRows; y++) {
          for (let x = 0; x < totalCols; x++) {
            const i = (y * totalCols + x) * 4;
            const brightness = data[i];
            grid.setCell(x, y, brightness > threshold ? 1 : 0);
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, [gridRef, params]);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const video = videoRef.current;

    video.src = URL.createObjectURL(file);
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.play();
  };

  return (
    <>
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      <video ref={videoRef} hidden loop muted playsInline preload="auto" />

      <canvas ref={canvasRef} hidden />
    </>
  );
}
