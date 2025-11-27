import { useEffect, useRef } from "react";
import { SERVER_CONFIG } from "../config";

export default function LiveFromServer({ gridRef }) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!gridRef?.current) return;

    const { IP, WS_PORT } = SERVER_CONFIG;
    const ws = new WebSocket(`ws://${IP}:${WS_PORT}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("🟢 Connected to server stream");
    ws.onclose = () => console.log("🔴 Disconnected from server stream");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type !== "matrix") return;
        if (!Array.isArray(payload)) return;

        // --- Mise à jour de la grille
        payload.forEach((row, y) => {
          row.forEach((value, x) => {
            gridRef.current.setCell(x, y, value);
          });
        });
      } catch (err) {
        console.error("❌ Parsing message failed:", err);
      }
    };

    return () => ws.close();
  }, [gridRef]);

  return null;
}
