"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeElements, type ThreeEvent, useFrame } from "@react-three/fiber";
import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Ids must match COMPONENTS in api/app/cases.py.
export const PART_IDS = ["gantry", "xray_tube", "bowtie_filter", "detector", "das_slip_ring", "table"] as const;
export type PartId = (typeof PART_IDS)[number];

// "fault" = coral (broken part), "info" = teal (part being explained).
export type HighlightTone = "fault" | "info";

type SceneState = {
  hovered: PartId | null;
  selected: PartId | null;
  highlight: PartId | null;
  tone: HighlightTone;
  setHovered: (id: PartId | null) => void;
  onSelect?: (id: PartId) => void;
};

const SceneContext = createContext<SceneState | null>(null);

function Part({
  part: id,
  color,
  opacity = 1,
  children,
  ...meshProps
}: {
  part: PartId;
  color: string;
  opacity?: number;
  children?: ReactNode;
} & Omit<ThreeElements["mesh"], "children" | "id">) {
  const scene = useContext(SceneContext)!;
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const active = scene.highlight === id || scene.selected === id;

  useFrame(({ clock }) => {
    if (!material.current) return;
    // The highlighted (faulty) part pulses so it is obvious on a projector.
    const pulse = scene.highlight === id ? 0.55 + 0.45 * Math.sin(clock.elapsedTime * 4) : 0.6;
    material.current.emissiveIntensity = active ? pulse : scene.hovered === id ? 0.25 : 0;
  });

  return (
    <mesh
      {...meshProps}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        scene.setHovered(id);
      }}
      onPointerOut={() => scene.setHovered(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        scene.onSelect?.(id);
      }}
    >
      {children}
      <meshStandardMaterial
        ref={material}
        color={color}
        emissive={scene.highlight === id && scene.tone === "fault" ? "#ff5a3c" : "#2ee6c0"}
        emissiveIntensity={0}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
        roughness={0.45}
        metalness={0.15}
      />
    </mesh>
  );
}

function housingGeometry() {
  // Square housing with rounded corners and a circular bore.
  const w = 4.4;
  const r = 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -w / 2);
  shape.lineTo(w / 2 - r, -w / 2);
  shape.quadraticCurveTo(w / 2, -w / 2, w / 2, -w / 2 + r);
  shape.lineTo(w / 2, w / 2 - r);
  shape.quadraticCurveTo(w / 2, w / 2, w / 2 - r, w / 2);
  shape.lineTo(-w / 2 + r, w / 2);
  shape.quadraticCurveTo(-w / 2, w / 2, -w / 2, w / 2 - r);
  shape.lineTo(-w / 2, -w / 2 + r);
  shape.quadraticCurveTo(-w / 2, -w / 2, -w / 2 + r, -w / 2);
  const bore = new THREE.Path();
  bore.absarc(0, 0, 0.95, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 });
  geo.translate(0, 0, -0.6);
  return geo;
}

function Rotor({ spinning }: { spinning: boolean }) {
  // Tube, filter and detector sit on the rotating part of the gantry.
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current && spinning) group.current.rotation.z += delta * 0.8;
  });
  return (
    <group ref={group}>
      <Part part="xray_tube" color="#c9d2d9" position={[0, 1.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.9, 32]} />
      </Part>
      <Part part="bowtie_filter" color="#e0b341" position={[0, 1.15, 0]}>
        <boxGeometry args={[0.55, 0.12, 0.5]} />
      </Part>
      <Part part="detector" color="#3b7dd8" rotation={[0, 0, -Math.PI / 2 - Math.PI * 0.3]}>
        <torusGeometry args={[1.55, 0.14, 16, 64, Math.PI * 0.6]} />
      </Part>
      {/* X-ray fan from the tube to the detector (decorative, not clickable). */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.1, 2.7, 32, 1, true]} />
        <meshBasicMaterial color="#4fd1b5" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scanner({ xray, spinning }: { xray: boolean; spinning: boolean }) {
  const housing = useMemo(() => housingGeometry(), []);

  return (
    <group>
      <Part part="gantry" color="#e8edf0" opacity={xray ? 0.12 : 1} geometry={housing} />
      <Part part="gantry" color="#d5dde2" opacity={xray ? 0.12 : 1} position={[0, -2.6, 0]}>
        <boxGeometry args={[3.2, 0.8, 1.4]} />
      </Part>
      <Part part="das_slip_ring" color="#9aa7b1" opacity={0.9}>
        <torusGeometry args={[1.85, 0.07, 16, 96]} />
      </Part>
      <Rotor spinning={spinning} />
      <Part part="table" color="#f4f6f5" position={[0, -0.6, 1.4]}>
        <boxGeometry args={[0.9, 0.12, 4.4]} />
      </Part>
      <Part part="table" color="#b9c3ca" position={[0, -1.85, 2.6]}>
        <boxGeometry args={[0.7, 2.4, 1.2]} />
      </Part>
    </group>
  );
}

export type CtScannerProps = {
  highlight?: PartId | null;
  selected?: PartId | null;
  onSelect?: (id: PartId) => void;
  xray?: boolean;
  spinning?: boolean;
  labels?: Partial<Record<PartId, string>>;
  tone?: HighlightTone;
  showLabel?: boolean;
};

export default function CtScanner({
  highlight = null,
  selected = null,
  onSelect,
  xray = true,
  spinning = false,
  labels,
  tone = "fault",
  showLabel = true,
}: CtScannerProps) {
  const [hovered, setHovered] = useState<PartId | null>(null);
  const state = useMemo(
    () => ({ hovered, selected, highlight, tone, setHovered, onSelect }),
    [hovered, selected, highlight, tone, onSelect],
  );

  // The part label is a plain HTML overlay: drei's <Html> mounts a separate
  // React root per label, which races with React when labels change.
  const labelled = showLabel ? (hovered ?? highlight ?? selected) : null;
  const faultLabel = labelled === highlight && tone === "fault";

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [7.5, 3.5, 9.5], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={["#0F1B2D"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 6]} intensity={1.2} />
        <directionalLight position={[-6, -2, -4]} intensity={0.4} />
        <SceneContext.Provider value={state}>
          <Scanner xray={xray} spinning={spinning} />
        </SceneContext.Provider>
        <OrbitControls enablePan={false} minDistance={5} maxDistance={14} />
      </Canvas>
      {labelled && (
        <div
          className={`pointer-events-none absolute bottom-3 right-3 rounded-full border px-3 py-1 font-mono text-xs backdrop-blur ${
            faultLabel ? "border-coral/60 bg-coral/15 text-coral" : "border-teal/40 bg-bg/80 text-teal"
          }`}
        >
          {labels?.[labelled] ?? labelled}
        </div>
      )}
    </div>
  );
}
