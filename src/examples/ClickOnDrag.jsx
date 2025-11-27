import { useEffect, useRef } from "react";

export default function ClickOnDrag({ gridRef, params }) {
  const isMouseDown = useRef(false);

  useEffect(() => {
    if (!gridRef.current) return;

    const canvas = gridRef.current.getCanvas();
    const gridAPI = gridRef.current;

    const { cellSize, gridCols, gridRows, colsPerGrid, rowsPerGrid, layout } =
      params;

    const totalCols = gridCols * colsPerGrid;
    const totalRows = gridRows * rowsPerGrid;

    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();

      // ⭐ offset lu depuis Grid (lecture seule)
      const offset = gridAPI.getOffset();

      const { width: w, height: h } = canvas;
      const contentWidth = totalCols * cellSize;
      const contentHeight = totalRows * cellSize;

      // 🔥 position souris → grille + offset
      let x = e.clientX - rect.left - (w / 2 + offset.x);
      let y = e.clientY - rect.top - (h / 2 + offset.y);

      // rotation portrait
      if (layout === "Portrait") {
        const rx = y;
        const ry = -x;
        x = rx;
        y = ry;
      }

      // translate vers le coin (0,0)
      x += contentWidth / 2;
      y += contentHeight / 2;

      return {
        gx: Math.floor(x / cellSize),
        gy: Math.floor(y / cellSize),
      };
    };

    const activateCell = (x, y, duration = 1000) => {
      gridAPI.setCell(x, y, 1);
      setTimeout(() => gridAPI.setCell(x, y, 0), duration);
    };

    const handleMouseMove = (e) => {
      if (!isMouseDown.current) return;

      const { gx, gy } = getCoords(e);
      if (gx >= 0 && gx < totalCols && gy >= 0 && gy < totalRows) {
        activateCell(gx, gy);
      }
    };

    const handleMouseDown = (e) => {
      isMouseDown.current = true;
      handleMouseMove(e);
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gridRef, params]);

  return null;
}
