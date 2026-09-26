"use client";

import dynamic from "next/dynamic";

// WebGL needs the browser: skip prerendering for the 3D canvas.
const ScannerView = dynamic(() => import("./CtScanner"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">3D model yuklanmoqda…</div>,
});

export default ScannerView;
