// flip-test.js
import WebSocket from "ws";

// Adresse du serveur Flipdot
const WS_URL = "ws://10.189.8.53:3000";

// Dimensions de la matrice (à adapter si besoin)
const WIDTH = 84; // 28 * 3 panneaux
const HEIGHT = 42; // 7 * 6 panneaux

console.log("🔌 Connecting to", WS_URL);
const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("🟢 Connected to Flipdot server!");

  let state = false;

  setInterval(() => {
    // Crée une matrice HEIGHT × WIDTH remplie de 0 ou 1
    const matrix = Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => (state ? 1 : 0))
    );

    state = !state;

    const msg = {
      type: "matrix",
      payload: matrix,
    };

    ws.send(JSON.stringify(msg));
    console.log("➡️  Sent frame:", state ? "ON" : "OFF");
  }, 1000);
});

ws.on("message", (msg) => {
  console.log("📩 Message from server:", msg.toString());
});

ws.on("close", () => {
  console.log("🔴 Disconnected from server");
});

ws.on("error", (err) => {
  console.error("❌ WebSocket error:", err);
});
