import { useRef, useState, useEffect } from "react";
import ControlsPanel from "./ControlsPanel";
import Grid from "./Grid";

import { MODES, DEFAULT_PARAMS } from "./config";

import "./App.css";

export default function App() {
  const gridRef = useRef(null);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const ActiveMode = MODES[params.mode] || null;

  // Clear grid on mode change
  useEffect(() => {
    if (gridRef.current?.clear) {
      gridRef.current.clear();
    }
  }, [params.mode]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <ControlsPanel params={params} setParams={setParams} modes={MODES} />
      <Grid ref={gridRef} params={params} setParams={setParams} />
      {ActiveMode && (
        <ActiveMode gridRef={gridRef} params={params} setParams={setParams} />
      )}
    </div>
  );
}
