"use client";

import ScannerView from "@/components/ScannerView";

const LABELS = [
  { text: "Rentgen trubkasi", className: "left-4 top-4" },
  { text: "Slip-ring", className: "right-4 top-1/2" },
  { text: "Detektor massivi", className: "bottom-4 left-6" },
];

// Live 3D scanner framed as a glass console with floating part labels.
export default function HeroScanner() {
  return (
    <div className="glass-strong relative aspect-[4/3.4] overflow-hidden">
      <ScannerView spinning xray patient />
      {LABELS.map((l) => (
        <span key={l.text} className={`chip pointer-events-none absolute bg-bg/80 backdrop-blur ${l.className}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-teal" /> {l.text}
        </span>
      ))}
    </div>
  );
}
