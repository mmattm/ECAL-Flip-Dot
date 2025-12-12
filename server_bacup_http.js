/* eslint-env node */
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import os from "os";

// 🔄 AUTO-FLIP MODE
let autoFlipEnabled = true;
let autoFlipState = false;

// 🔍 Obtenir l’adresse IP locale du serveur
const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
};

// ⬇️ Importation Flipdot
import Display from "./flipdisc/display.js";
import SegmentDisplay from "./flipdisc/segmentDisplay.js";
import * as Panels from "./flipdisc/panels/index.js";

// 🧩 Création du display matériel
const createDisplay = (layout, devicePath, options = {}) => {
  return options.panel?.type?.style === Panels.PanelStyles.segment
    ? new SegmentDisplay(layout, devicePath, options)
    : new Display(layout, devicePath, options);
};

let width, height;

// ⚙️ Serveur HTTP + WebSocket
const app = express();
app.use(cors({ origin: "*" }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 🔌 Configuration Flipdot
const layout = [
  [1, 7, 13],
  [2, 8, 14],
  [3, 9, 15],
  [4, 10, 16],
  [5, 11, 17],
  [6, 12, 18],
];

const dev = [
  {
    path: "/dev/tty.usbserial-BG00XYPR",
    addresses: [1, 2, 3, 4, 5, 6],
    baudRate: 57600,
  },
  {
    path: "/dev/tty.usbserial-BG00Q55A",
    addresses: [7, 8, 9, 10, 11, 12],
    baudRate: 57600,
  },
  {
    path: "/dev/tty.usbserial-B00008XX",
    addresses: [13, 14, 15, 16, 17, 18],
    baudRate: 57600,
  },
];

const opt = {
  isMirrored: true,
  rotation: 0,
  panel: {
    width: 28,
    height: 7,
    type: Panels.AlfaZetaPanel,
  },
};

const display = createDisplay(layout, dev, opt);

width = display.width;
height = display.height;
console.log(`Display size: ${width} x ${height}`);

// 🧠 Stockage du dernier payload
let previousPayload = null;

// 📡 Connexion WebSocket
wss.on("connection", (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`🟢 Client connected: ${clientIP}`);

  if (previousPayload) {
    ws.send(JSON.stringify({ type: "matrix", payload: previousPayload }));
  }

  ws.on("message", (data) => {
    try {
      const { type, payload } = JSON.parse(data);

      if (type === "matrix" && Array.isArray(payload)) {
        const changed =
          JSON.stringify(payload) !== JSON.stringify(previousPayload);

        if (changed) {
          previousPayload = payload;

          const rows = payload.length;
          const cols = payload[0]?.length || 0;

          if (rows !== height || cols !== width) {
            console.error("❌ MATRIX SIZE MISMATCH");
            console.error(`→ Payload received: ${cols} x ${rows}`);
            console.error(`→ Expected display : ${width} x ${height}`);
            return;
          }

          display.send(payload);
        }
      }
    } catch (err) {
      console.error("❌ JSON parsing error:", err);
    }
  });

  ws.on("close", () => {
    console.log(`🔴 Client disconnected: ${clientIP}`);
  });
});

// 🌐 Route /ip
app.get("/ip", (req, res) => {
  res.json({ ip: getLocalIPAddress() });
});

// 🚀 Lancement du serveur HTTP + WS
server.listen(3000, "0.0.0.0", () => {
  const ip = getLocalIPAddress();
  console.log("============================================");
  console.log("  🟡 Flipdot Server Running (HTTP + WS)");
  console.log("============================================");
  console.log(`🌐 HTTP available at:  http://${ip}:3000`);
  console.log(`🔌 WebSocket (WS):     ws://${ip}:3000`);
  console.log("============================================");
});

// AUTO FLIP (désactivé)
const startAutoFlip = () => {
  setInterval(() => {
    if (!autoFlipEnabled) return;

    const matrix = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => (autoFlipState ? 1 : 0))
    );

    autoFlipState = !autoFlipState;
    display.send(matrix);
  }, 1000);
};

//startAutoFlip();
