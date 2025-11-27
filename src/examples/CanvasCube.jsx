import { CanvasBase } from "./CanvasBase";

export default function CanvasCube({ gridRef, params }) {
  let angleX = 0;
  let angleY = 0;

  const cubeVertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];

  const cubeEdges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  const drawFrame = (ctx, w, h) => {
    const scale = Math.min(w, h) * 0.6;
    const distance = 3;

    const project = (x, y, z) => {
      const p = scale / (z + distance);
      return { x: x * p + w / 2, y: y * p + h / 2 };
    };

    // background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // rotate vertices
    const rotated = cubeVertices.map(([x, y, z]) => {
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      let dx = x * cosY - z * sinY;
      let dz = x * sinY + z * cosY;
      let dy = y * cosX - dz * sinX;
      dz = y * sinX + dz * cosX;

      return project(dx, dy, dz);
    });

    // draw cube
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;

    for (const [a, b] of cubeEdges) {
      const p1 = rotated[a];
      const p2 = rotated[b];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    angleX += 0.001;
    angleY += 0.005;
  };

  return <CanvasBase gridRef={gridRef} params={params} drawFrame={drawFrame} />;
}
