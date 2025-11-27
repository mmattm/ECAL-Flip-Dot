import { useState, useEffect } from "react";
import { useControls, folder, Leva, button } from "leva";
import { levaTheme } from "./levaTheme";
import { SERVER_CONFIG } from "./config";

export default function ControlsPanel({ params, setParams, modes }) {
  const [serverIP, setServerIP] = useState("loading...");
  const [videoDevices, setVideoDevices] = useState([]);

  // --- Récupération IP serveur ---
  useEffect(() => {
    const { IP, HTTP_PORT } = SERVER_CONFIG;
    fetch(`http://${IP}:${HTTP_PORT}/ip`)
      .then((res) => res.json())
      .then((data) => setServerIP(data.ip))
      .catch(() => setServerIP("error"));
  }, []);

  useEffect(() => {
    set({ "Server IP": serverIP });
  }, [serverIP]);

  // --- Récupération liste webcams ---
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const cams = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
      })
      .catch((err) => console.error("Device error:", err));
  }, []);

  const isConnected =
    serverIP && serverIP !== "loading..." && serverIP !== "error";
  const color = isConnected ? "#4ade80" : "#ef4444";

  const ipLabel = (
    <div className="flex items-center gap-1">
      <div
        className="w-2.5 h-2.5 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      <span>Server</span>
    </div>
  );

  // --- Fonction Fit to Window ---
  const fitToWindow = () => {
    const { layout, gridCols, gridRows, colsPerGrid, rowsPerGrid } = params;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const totalCols =
      layout === "Portrait" ? gridRows * rowsPerGrid : gridCols * colsPerGrid;
    const totalRows =
      layout === "Portrait" ? gridCols * colsPerGrid : gridRows * rowsPerGrid;

    const cellSize = Math.floor(Math.min(w / totalCols, h / totalRows) - 1);

    setParams((p) => ({ ...p, cellSize, resetOffset: true }));
    set({ cellSize });
  };

  const [, set] = useControls(() => {
    const config = {
      "Server IP": {
        value: serverIP,
        editable: false,
        label: ipLabel,
      },

      mode: {
        label: "Mode",
        options: Object.keys(modes),
        value: params.mode,
        onChange: (v) => setParams((p) => ({ ...p, mode: v })),
      },

      layout: {
        label: "Orientation",
        options: ["Landscape", "Portrait"],
        value: params.layout || "Landscape",
        onChange: (v) => setParams((p) => ({ ...p, layout: v })),
      },

      // --- Nouveau dossier Transform ---
      Transform: folder(
        {
          mirrorH: {
            label: "Mirror H",
            value: params.mirrorH ?? false,
            onChange: (v) => setParams((p) => ({ ...p, mirrorH: v })),
          },

          mirrorV: {
            label: "Mirror V",
            value: params.mirrorV ?? false,
            onChange: (v) => setParams((p) => ({ ...p, mirrorV: v })),
          },

          invert: {
            label: "Invert",
            value: params.invert ?? false,
            onChange: (v) => setParams((p) => ({ ...p, invert: v })),
          },
        },
        { collapsed: true }
      ),

      cellSize: {
        label: "Zoom",
        value: params.cellSize,
        min: 8,
        max: 80,
        step: 1,
        onChange: (v) => setParams((p) => ({ ...p, cellSize: v })),
      },

      "Fit to Window": button(() => fitToWindow()),
    };

    // --- Mode Video Upload ---
    if (params.mode === "Video Upload") {
      config["Video settings"] = folder(
        {
          threshold: {
            label: "Threshold",
            value: params.threshold ?? 128,
            min: 0,
            max: 255,
            step: 1,
            onChange: (v) => setParams((p) => ({ ...p, threshold: v })),
          },
          uploadVideo: button(() => {
            params.triggerUpload?.();
          }),
        },
        { collapsed: false }
      );
    }

    // --- Mode Webcam ---
    if (params.mode === "Webcam") {
      config["Webcam Settings"] = folder(
        {
          camera: {
            label: "Camera",
            options: Object.fromEntries(
              videoDevices.map((d) => [
                d.label || `Camera ${d.deviceId}`,
                d.deviceId,
              ])
            ),
            value: params.selectedCameraId ?? videoDevices[0]?.deviceId,
            onChange: (v) => setParams((p) => ({ ...p, selectedCameraId: v })),
          },

          threshold: {
            label: "Threshold",
            value: params.threshold ?? 128,
            min: 0,
            max: 255,
            step: 1,
            onChange: (v) => setParams((p) => ({ ...p, threshold: v })),
          },
        },
        { collapsed: false }
      );
    }

    // --- Réglages grille ---
    config["Grid Settings"] = folder(
      {
        gridCols: {
          value: params.gridCols,
          min: 1,
          max: 4,
          step: 1,
          label: "Cols",
          onChange: (v) => setParams((p) => ({ ...p, gridCols: v })),
        },
        gridRows: {
          value: params.gridRows,
          min: 1,
          max: 4,
          step: 1,
          label: "Rows",
          onChange: (v) => setParams((p) => ({ ...p, gridRows: v })),
        },
        colsPerGrid: {
          value: params.colsPerGrid,
          min: 4,
          max: 60,
          step: 1,
          label: "Cols / Grid",
          onChange: (v) => setParams((p) => ({ ...p, colsPerGrid: v })),
        },
        rowsPerGrid: {
          value: params.rowsPerGrid,
          min: 2,
          max: 40,
          step: 1,
          label: "Rows / Grid",
          onChange: (v) => setParams((p) => ({ ...p, rowsPerGrid: v })),
        },
      },
      { collapsed: true }
    );

    return config;
  }, [params, serverIP, videoDevices, modes]);

  // --- Fit auto si layout ou grid change ---
  useEffect(() => {
    fitToWindow();
  }, [
    params.layout,
    params.gridCols,
    params.gridRows,
    params.colsPerGrid,
    params.rowsPerGrid,
  ]);

  return (
    <div className="fixed top-4 left-4 z-50">
      <Leva
        theme={levaTheme}
        titleBar={{ title: "DOTFLIP ECAL", drag: false }}
        collapsed={false}
        hideCopyButton
      />
    </div>
  );
}
