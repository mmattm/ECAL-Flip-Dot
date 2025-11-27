import { useEffect, useRef, useState } from "react";
import p5 from "p5";

export function CanvasBase({
  gridRef,
  params,
  mode = "2d",
  setup,
  drawFrame,
  drawP5,
  allowFull = true,
  className = "",
  style = {},
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const [isFull, setIsFull] = useState(false);

  const { gridCols, gridRows, colsPerGrid, rowsPerGrid } = params;
  const totalCols = gridCols * colsPerGrid;
  const totalRows = gridRows * rowsPerGrid;

  // P5 MODE
  useEffect(() => {
    if (mode !== "p5") return;
    if (!gridRef?.current) return;

    let isActive = true;

    const sketch = (p) => {
      p.setup = () => {
        const c = p.createCanvas(totalCols, totalRows);
        c.style("image-rendering", "pixelated");
        c.style("display", "block");
        c.style("width", "100%");
        c.style("height", "auto");
        p.pixelDensity(1);

        if (setup) setup(p, totalCols, totalRows);
      };

      let frame = 0;

      p.draw = () => {
        if (!isActive) return;
        if (drawP5) drawP5(p, totalCols, totalRows, frame);

        const img = p.drawingContext.getImageData(
          0,
          0,
          totalCols,
          totalRows
        ).data;
        const grid = gridRef.current;

        for (let y = 0; y < totalRows; y++) {
          for (let x = 0; x < totalCols; x++) {
            const i = (y * totalCols + x) * 4;
            grid.setCell(x, y, img[i] > 32 ? 1 : 0);
          }
        }

        frame++;
      };
    };

    containerRef.current.innerHTML = "";
    const instance = new p5(sketch, containerRef.current);
    p5InstanceRef.current = instance;

    return () => {
      isActive = false;
      instance.remove();
      p5InstanceRef.current = null;
    };
  }, [mode, params]);

  // 2D CANVAS MODE
  useEffect(() => {
    if (mode !== "2d") return;

    const canvas = canvasRef.current;
    if (!canvas || !drawFrame || !gridRef?.current) return;

    canvas.width = totalCols;
    canvas.height = totalRows;

    const ctx = canvas.getContext("2d");
    let frame = 0;

    const loop = () => {
      drawFrame(ctx, totalCols, totalRows, frame);

      const img = ctx.getImageData(0, 0, totalCols, totalRows).data;
      const grid = gridRef.current;

      for (let y = 0; y < totalRows; y++) {
        for (let x = 0; x < totalCols; x++) {
          const i = (y * totalCols + x) * 4;
          grid.setCell(x, y, img[i] > 32 ? 1 : 0);
        }
      }

      frame++;
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, params, drawFrame]);

  const toggleFull = () => allowFull && setIsFull((v) => !v);

  // Apply full-screen layout to the P5 canvas (#defaultCanvas0)
  useEffect(() => {
    if (mode !== "p5") return;

    const cnv = containerRef.current?.querySelector("canvas"); // defaultCanvas0
    if (!cnv) return;

    if (isFull) {
      cnv.style.width = "100%";
      cnv.style.height = "auto";
    } else {
      // reset to default size (pixel-perfect)
      cnv.style.width = `${totalCols}px`;
      cnv.style.height = `${totalRows}px`;
    }
  }, [isFull, mode, totalCols, totalRows]);

  return (
    <div
      ref={containerRef}
      onClick={toggleFull}
      className={`
        fixed z-50 cursor-pointer border border-white bg-black 
        transition-all duration-300 ease-out
        ${
          isFull
            ? "inset-x-0 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] mx-auto top-1/2 -translate-y-1/2"
            : "top-4 left-4"
        }
        ${className}
      `}
      style={{
        ...style,
        width: isFull ? "100%" : undefined,
        height: isFull ? "auto" : undefined, // important en mode P5
      }}
    >
      {mode === "2d" && (
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "auto",
          }}
        />
      )}
    </div>
  );
}
