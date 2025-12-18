import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { SERVER_CONFIG } from "./config";

const Grid = forwardRef(function Grid({ params, setParams }, ref) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const wsRef = useRef(null);

  // États persistants
  const isPanning = useRef(false);
  const spacePressed = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });
  const prevCellSize = useRef(params.cellSize);

  // Matrice interne
  const grid = useRef([]);

  // --- Classe de cellule ---
  class Cell {
    constructor() {
      this.active = 0;
    }
  }

  // --- API exposée ---
  useImperativeHandle(ref, () => ({
    setCell: (x, y, v) => {
      if (isPanning.current) return;
      if (grid.current[y] && grid.current[y][x] !== undefined) {
        grid.current[y][x].active = v;
      }
    },

    clear: () => {
      for (let y = 0; y < grid.current.length; y++) {
        for (let x = 0; x < grid.current[y].length; x++) {
          grid.current[y][x].active = 0;
        }
      }
    },

    getCanvas: () => canvasRef.current,
    getOffset: () => offset.current,
    getPanState: () => spacePressed.current,
  }));

  // --- Connexion WebSocket ---
  useEffect(() => {
    const { IP, WS_PORT } = SERVER_CONFIG;
    const ws = new WebSocket(`wss://${IP}:${WS_PORT}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket connected to", IP);
    ws.onclose = () => console.log("❌ WebSocket closed");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close();
  }, []);

  // --- Envoi périodique de la matrice ---
  useEffect(() => {
    const loop = setInterval(() => {
      if (wsRef.current?.readyState === 1) {
        const matrix = applyTransforms(grid.current, params);
        wsRef.current.send(JSON.stringify({ type: "matrix", payload: matrix }));
      }
    }, 40);
    return () => clearInterval(loop);
  }, [params]);

  function applyTransforms(matrix, params) {
    let m = matrix.map((row) => row.map((cell) => (cell.active ? 1 : 0)));

    // Mirror Horizontal
    if (params.mirrorH) {
      m = m.map((row) => [...row].reverse());
    }

    // Mirror Vertical
    if (params.mirrorV) {
      m = [...m].reverse();
    }

    // Invert
    if (params.invert) {
      m = m.map((row) => row.map((v) => (v ? 0 : 1)));
    }

    return m;
  }

  // --- Dessin + Pan + Gestion du curseur ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const {
      cellSize,
      gridCols,
      gridRows,
      colsPerGrid,
      rowsPerGrid,
      layout,
      resetOffset,
    } = params;

    const totalCols = gridCols * colsPerGrid;
    const totalRows = gridRows * rowsPerGrid;

    // Initialise la matrice
    grid.current = Array.from({ length: totalRows }, () =>
      Array.from({ length: totalCols }, () => new Cell())
    );

    // Ajuste l’offset si zoom
    const scale = cellSize / prevCellSize.current;
    offset.current.x *= scale;
    offset.current.y *= scale;
    prevCellSize.current = cellSize;

    // Réinitialise le décalage si demandé
    if (resetOffset) {
      offset.current.x = 0;
      offset.current.y = 0;
      setParams?.((p) => ({ ...p, resetOffset: false }));
    }

    // --- Fonction de dessin ---
    const draw = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w;
      canvas.height = h;

      const contentWidth = totalCols * cellSize;
      const contentHeight = totalRows * cellSize;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.save();

      // Position + rotation
      let tx = w / 2 + offset.current.x;
      let ty = h / 2 + offset.current.y;
      ctx.translate(Math.floor(tx) + 0.5, Math.floor(ty) + 0.5);

      if (layout === "Portrait") ctx.rotate(-Math.PI / 2);
      ctx.translate(-contentWidth / 2, -contentHeight / 2);

      const view = applyTransforms(grid.current, params);

      for (let y = 0; y < totalRows; y++) {
        for (let x = 0; x < totalCols; x++) {
          const cx = x * cellSize + cellSize / 2;
          const cy = y * cellSize + cellSize / 2;
          const r = cellSize / 2 - 2;

          ctx.beginPath();
          ctx.fillStyle = view[y][x] ? "#fff" : "#000";
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Grille fine
      ctx.strokeStyle = "#4D4D4D";
      ctx.lineWidth = 1;
      for (let x = 0; x <= totalCols; x++) {
        const px = x * cellSize;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, contentHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= totalRows; y++) {
        const py = y * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(contentWidth, py);
        ctx.stroke();
      }

      // Sous-grilles
      ctx.strokeStyle = "#999";
      for (let gx = 1; gx < gridCols; gx++) {
        const px = gx * colsPerGrid * cellSize;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, contentHeight);
        ctx.stroke();
      }
      for (let gy = 1; gy < gridRows; gy++) {
        const py = gy * rowsPerGrid * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(contentWidth, py);
        ctx.stroke();
      }

      // Cadre principal
      ctx.strokeStyle = "#FFF";
      ctx.strokeRect(0, 0, contentWidth, contentHeight);

      ctx.restore();
    };

    // --- Boucle d’animation ---
    const update = () => {
      draw();
      animationRef.current = requestAnimationFrame(update);
    };
    update();

    // --- Gestion du Pan + Curseur ---
    const updateCursor = () => {
      if (spacePressed.current) {
        if (isPanning.current) {
          canvas.style.cursor = "grabbing";
        } else {
          canvas.style.cursor = "grab";
        }
      } else {
        canvas.style.cursor = "crosshair";
      }
    };

    const handleMouseDown = (e) => {
      if (spacePressed.current) {
        isPanning.current = true;
        panStart.current = {
          x: e.clientX - offset.current.x,
          y: e.clientY - offset.current.y,
        };
        updateCursor();
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning.current) {
        offset.current.x = e.clientX - panStart.current.x;
        offset.current.y = e.clientY - panStart.current.y;
      }
    };

    const handleMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
        updateCursor();
      }
    };

    const handleKeyDown = (e) => {
      if (e.code === "Space" && !spacePressed.current) {
        spacePressed.current = true;
        updateCursor();
        e.preventDefault(); // évite le scroll
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        spacePressed.current = false;
        isPanning.current = false;
        updateCursor();
      }
    };

    // --- Listeners ---
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [params, params.mode]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full select-none"
      style={{ cursor: "crosshair" }}
    />
  );
});

export default Grid;
