import { useRef } from "react";
import { CanvasBase } from "./CanvasBase";

export default function CanvasP5({ gridRef, params }) {
  const trailRef = useRef([]);
  const deltaRef = useRef(0);

  const drawP5 = (p, w, h, frame) => {
    // Fade-out progressif
    p.fill(0, 60);
    p.rect(0, 0, w, h);

    // time
    const t = frame * 0.02;

    deltaRef.current += 0.01; // plus petit = plus lent, plus fluide
    const delta = deltaRef.current;

    // paramètres Lissajous
    const a = 3;
    const b = 2;

    // amplitude
    const Ax = w * 0.4;
    const Ay = h * 0.4;

    // centre
    const cx = w / 2;
    const cy = h / 2;

    // point
    const x = cx + Ax * Math.sin(a * t + delta);
    const y = cy + Ay * Math.sin(b * t);

    // trail update
    trailRef.current.push({ x, y });
    if (trailRef.current.length > 200) trailRef.current.shift();

    // trail drawing
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);

    for (let i = 1; i < trailRef.current.length; i++) {
      const p1 = trailRef.current[i - 1];
      const p2 = trailRef.current[i];
      p.line(p1.x, p1.y, p2.x, p2.y);
    }

    // point
    p.noStroke();
    p.fill(255);
    p.circle(x, y, 1);
  };

  return (
    <CanvasBase gridRef={gridRef} params={params} mode="p5" drawP5={drawP5} />
  );
}
