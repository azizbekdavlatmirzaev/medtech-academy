"use client";

import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeElements, type ThreeEvent, useFrame } from "@react-three/fiber";
import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import EmergencyEffect, { type EffectKind } from "./Effects";

// Ids must match COMPONENTS in api/app/cases.py.
export const PART_IDS = ["gantry", "xray_tube", "bowtie_filter", "detector", "das_slip_ring", "table"] as const;
export type PartId = (typeof PART_IDS)[number];

// "fault" = coral (broken part), "info" = teal (part being explained).
export type HighlightTone = "fault" | "info";

const FAULT_GLOW = new THREE.Color("#ff5a3c");
const INFO_GLOW = new THREE.Color("#2ee6c0");

type SceneState = {
  hovered: PartId | null;
  selected: PartId | null;
  highlight: PartId | null;
  tone: HighlightTone;
  setHovered: (id: PartId | null) => void;
  onSelect?: (id: PartId) => void;
};

const SceneContext = createContext<SceneState | null>(null);

type Look = { color: string; opacity?: number; metalness?: number; roughness?: number; clearcoat?: number };
type PartCtx = { id: PartId; look: Look };
const PartContext = createContext<PartCtx | null>(null);

// A clickable device part made of one or more meshes (<M>) sharing a look.
function Part({
  part: id,
  children,
  color,
  opacity,
  metalness,
  roughness,
  clearcoat,
}: { part: PartId; children: ReactNode } & Look) {
  const scene = useContext(SceneContext)!;
  const ctx = useMemo(
    () => ({ id, look: { color, opacity, metalness, roughness, clearcoat } }),
    [id, color, opacity, metalness, roughness, clearcoat],
  );

  return (
    <group
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
      <PartContext.Provider value={ctx}>{children}</PartContext.Provider>
    </group>
  );
}

// A mesh that takes its look from the enclosing <Part> and glows with it when
// the part is hovered, selected or highlighted.
function M({ children, ...props }: Omit<ThreeElements["mesh"], "id">) {
  const scene = useContext(SceneContext)!;
  const { id, look } = useContext(PartContext)!;
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const opacity = look.opacity ?? 1;

  useFrame(({ clock }) => {
    if (!material.current) return;
    const highlighted = scene.highlight === id;
    const active = highlighted || scene.selected === id;
    // The highlighted part pulses so it is obvious on a projector.
    material.current.emissiveIntensity = active
      ? highlighted
        ? 0.55 + 0.45 * Math.sin(clock.elapsedTime * 4)
        : 0.6
      : scene.hovered === id
        ? 0.25
        : 0;
    material.current.emissive.copy(highlighted && scene.tone === "fault" ? FAULT_GLOW : INFO_GLOW);
  });

  return (
    <mesh castShadow receiveShadow {...props}>
      {children}
      <meshPhysicalMaterial
        ref={material}
        color={look.color}
        metalness={look.metalness ?? 0.1}
        roughness={look.roughness ?? 0.45}
        clearcoat={look.clearcoat ?? 0}
        clearcoatRoughness={0.25}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
        side={opacity < 1 ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}

const BORE_R = 1.05;

function housingGeometry() {
  // Squarish gantry cover with generous rounded corners and a circular bore.
  const w = 4.6;
  const r = 1.0;
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
  bore.absarc(0, 0, BORE_R, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.5,
    bevelEnabled: true,
    bevelSize: 0.14,
    bevelThickness: 0.14,
    bevelSegments: 6,
    curveSegments: 48,
  });
  geo.translate(0, 0, -0.75);
  return geo;
}

function bowtieGeometry() {
  // Thin in the middle, thick at the edges: less dose to the patient's periphery.
  const s = new THREE.Shape();
  s.moveTo(-0.34, -0.1);
  s.lineTo(0.34, -0.1);
  s.lineTo(0.34, 0.1);
  s.quadraticCurveTo(0, -0.08, -0.34, 0.1);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: false });
  geo.translate(0, 0, -0.21);
  return geo;
}

function fanGeometry() {
  // Fan beam from the focal spot to the detector arc, in the gantry plane.
  const half = (50 * Math.PI) / 180;
  const s = new THREE.Shape();
  s.moveTo(0, 1.2);
  s.lineTo(Math.sin(half) * -1.5, -Math.cos(half) * 1.5);
  s.absarc(0, 0, 1.5, -Math.PI / 2 - half, -Math.PI / 2 + half, false);
  s.lineTo(0, 1.2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 24 });
  geo.translate(0, 0, -0.015);
  return geo;
}

const rounded = (w: number, h: number, d: number, r = 0.08) => new RoundedBoxGeometry(w, h, d, 4, r);

function Rotor({ spinning }: { spinning: boolean }) {
  const group = useRef<THREE.Group>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const filter = useMemo(() => bowtieGeometry(), []);
  const fan = useMemo(() => fanGeometry(), []);
  const modules = useMemo(() => {
    const n = 21;
    const span = (100 * Math.PI) / 180;
    return Array.from({ length: n }, (_, i) => -Math.PI / 2 - span / 2 + (span * i) / (n - 1));
  }, []);
  const moduleGeo = useMemo(() => rounded(0.16, 0.24, 0.5, 0.02), []);
  const boardGeo = useMemo(() => rounded(0.3, 0.05, 0.4, 0.01), []);

  useFrame(({ clock }, delta) => {
    if (group.current && spinning) group.current.rotation.z += delta * 0.9;
    if (beam.current) beam.current.opacity = spinning ? 0.12 + 0.06 * Math.sin(clock.elapsedTime * 6) : 0.08;
  });

  return (
    <group ref={group}>
      {/* Rotor frame the parts are mounted on (decorative). */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[1.62, 0.05, 12, 128]} />
        <meshStandardMaterial color="#4a5663" metalness={0.6} roughness={0.4} />
      </mesh>

      <Part part="xray_tube" color="#c7cfd6" metalness={0.75} roughness={0.28}>
        <M position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1.0, 40]} />
        </M>
        <M position={[0, 1.7, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 40]} />
        </M>
        <M position={[0, 1.7, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 40]} />
        </M>
        {/* Collimator under the tube window. */}
        <M position={[0, 1.36, 0]} geometry={rounded(0.42, 0.14, 0.42, 0.03)} />
      </Part>

      <Part part="bowtie_filter" color="#d9a83a" metalness={0.5} roughness={0.35}>
        <M position={[0, 1.2, 0]} geometry={filter} />
      </Part>

      <Part part="detector" color="#2f6fd0" metalness={0.35} roughness={0.35} clearcoat={0.6}>
        {modules.map((a) => (
          <M key={a} position={[Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0]} rotation={[0, 0, a + Math.PI / 2]} geometry={moduleGeo} />
        ))}
        <M rotation={[0, 0, -Math.PI / 2 - (55 * Math.PI) / 180]}>
          <torusGeometry args={[1.66, 0.04, 8, 64, (110 * Math.PI) / 180]} />
        </M>
      </Part>

      {/* DAS electronics right behind the detector arc. */}
      <Part part="das_slip_ring" color="#2f7a55" metalness={0.3} roughness={0.5}>
        {modules
          .filter((_, i) => i % 5 === 0)
          .map((a) => (
            <M key={a} position={[Math.cos(a) * 1.82, Math.sin(a) * 1.82, 0]} rotation={[0, 0, a + Math.PI / 2]} geometry={boardGeo} />
          ))}
      </Part>

      {/* X-ray fan beam (decorative, not clickable). */}
      <mesh geometry={fan} raycast={() => null}>
        <meshBasicMaterial ref={beam} color="#4fd1b5" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scanner({ xray, spinning }: { xray: boolean; spinning: boolean }) {
  const housing = useMemo(() => housingGeometry(), []);
  const pedestal = useMemo(() => rounded(3.6, 0.9, 2.0, 0.2), []);
  const coverOpacity = xray ? 0.14 : 1;

  return (
    <group position={[0, 0.3, 0]}>
      <Part part="gantry" color="#eef2f4" opacity={coverOpacity} roughness={0.35} clearcoat={1}>
        <M geometry={housing} />
        <M geometry={pedestal} position={[0, -2.75, 0]} />
        {/* Front trim around the bore. */}
        <M position={[0, 0, 0.9]}>
          <torusGeometry args={[BORE_R + 0.1, 0.07, 16, 96]} />
        </M>
      </Part>

      {/* Bore liner and status LED ring (decorative). */}
      <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[BORE_R, BORE_R, 1.78, 64, 1, true]} />
        <meshStandardMaterial color="#d8dfe4" side={THREE.BackSide} transparent opacity={xray ? 0.1 : 1} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.93]} raycast={() => null}>
        <torusGeometry args={[BORE_R + 0.2, 0.018, 8, 128]} />
        <meshStandardMaterial color="#4fd1b5" emissive="#4fd1b5" emissiveIntensity={1.6} />
      </mesh>
      {/* Control panels on the gantry front. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.55, 1.15, 0.93]} raycast={() => null}>
          <boxGeometry args={[0.46, 0.28, 0.02]} />
          <meshStandardMaterial color="#0f1b2d" emissive="#123a4a" emissiveIntensity={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Slip-ring tracks at the back of the gantry. */}
      <Part part="das_slip_ring" color="#b8743e" metalness={0.9} roughness={0.25}>
        {[1.95, 2.02, 2.09].map((r) => (
          <M key={r} position={[0, 0, -0.62]}>
            <torusGeometry args={[r, 0.022, 8, 160]} />
          </M>
        ))}
      </Part>

      <Rotor spinning={spinning} />

      <Part part="table" color="#f1f4f5" roughness={0.4} clearcoat={0.6}>
        {/* Cradle that slides into the bore. */}
        <M geometry={rounded(1.0, 0.12, 5.4, 0.05)} position={[0, -0.78, 1.7]} />
        {/* Pedestal and foot. */}
        <M geometry={rounded(1.1, 1.9, 1.5, 0.12)} position={[0, -1.85, 3.4]} />
        <M geometry={rounded(1.7, 0.16, 2.3, 0.06)} position={[0, -2.95, 3.4]} />
      </Part>
      <Part part="table" color="#26374f" roughness={0.8}>
        <M geometry={rounded(0.84, 0.1, 4.3, 0.05)} position={[0, -0.67, 2.0]} />
        <M geometry={rounded(0.5, 0.14, 0.45, 0.06)} position={[0, -0.58, -0.25]} />
      </Part>

      {/* Floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.04, 1]} receiveShadow raycast={() => null}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color="#0c1829" roughness={0.9} />
      </mesh>
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
  effect?: { kind: EffectKind; part: PartId } | null;
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
  effect = null,
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
      <Canvas shadows="percentage" camera={{ position: [7.5, 3.2, 9.5], fov: 38 }} dpr={[1, 2]}>
        <color attach="background" args={["#0F1B2D"]} />
        <fog attach="fog" args={["#0F1B2D", 14, 26]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 9, 7]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#9fd8ff" />
        {/* Studio reflections built from local light panels: no HDR download. */}
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 5, 5]} scale={[10, 3, 1]} />
          <Lightformer intensity={1} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#bfefff" />
          <Lightformer intensity={0.8} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} color="#4fd1b5" />
        </Environment>
        <SceneContext.Provider value={state}>
          <Scanner xray={xray} spinning={spinning} />
        </SceneContext.Provider>
        {effect && <EmergencyEffect kind={effect.kind} part={effect.part} />}
        <ContactShadows position={[0, -2.73, 1]} opacity={0.55} scale={14} blur={2.4} far={4} />
        <OrbitControls enablePan={false} minDistance={5.5} maxDistance={15} target={[0, -0.3, 0.8]} maxPolarAngle={Math.PI / 1.9} />
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
