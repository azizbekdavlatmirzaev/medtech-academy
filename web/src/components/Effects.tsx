"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type EffectKind = "smoke" | "fire" | "sparks" | "overheat";

type Particles = { pos: Float32Array; vel: Float32Array; life: Float32Array; ttl: Float32Array };

type Config = {
  count: number;
  size: [number, number]; // sprite size at birth and at death
  colors: [string, string]; // colour at birth and at death
  opacity: number;
  additive: boolean;
  ttl: [number, number];
  spread: number;
  velocity: (out: [number, number, number]) => void;
  gravity: number;
  growth?: number; // how far particles drift apart as they age
};

const CONFIGS: Record<EffectKind, Config> = {
  smoke: {
    count: 90,
    size: [0.35, 1.6],
    colors: ["#4a5058", "#23282e"],
    opacity: 0.5,
    additive: false,
    ttl: [2.2, 3.6],
    spread: 0.25,
    velocity: (v) => {
      v[0] = (Math.random() - 0.5) * 0.25;
      v[1] = 0.55 + Math.random() * 0.35;
      v[2] = (Math.random() - 0.5) * 0.25;
    },
    gravity: 0,
    growth: 0.35,
  },
  fire: {
    count: 120,
    size: [0.55, 0.12],
    colors: ["#ffd27a", "#b3200a"],
    opacity: 0.9,
    additive: true,
    ttl: [0.45, 0.9],
    spread: 0.3,
    velocity: (v) => {
      v[0] = (Math.random() - 0.5) * 0.35;
      v[1] = 1.1 + Math.random() * 0.9;
      v[2] = (Math.random() - 0.5) * 0.35;
    },
    gravity: 0,
  },
  sparks: {
    count: 110,
    size: [0.14, 0.05],
    colors: ["#fff4c2", "#ff8a2a"],
    opacity: 1,
    additive: true,
    ttl: [0.25, 0.7],
    spread: 0.05,
    velocity: (v) => {
      const a = Math.random() * Math.PI * 2;
      const s = 1.2 + Math.random() * 1.8;
      v[0] = Math.cos(a) * s;
      v[1] = Math.abs(Math.sin(a)) * s * 0.8;
      v[2] = (Math.random() - 0.5) * s;
    },
    gravity: -6,
  },
  overheat: {
    count: 50,
    size: [0.4, 1.0],
    colors: ["#ff4a2a", "#401008"],
    opacity: 0.5,
    additive: true,
    ttl: [1.2, 2.2],
    spread: 0.35,
    velocity: (v) => {
      v[0] = (Math.random() - 0.5) * 0.1;
      v[1] = 0.45 + Math.random() * 0.3;
      v[2] = (Math.random() - 0.5) * 0.1;
    },
    gravity: 0,
    growth: 0.2,
  },
};

function spriteTexture() {
  // Soft round particle drawn on a canvas: no image download needed.
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function respawn(p: Particles, i: number, cfg: Config, origin: THREE.Vector3, stagger: boolean) {
  const v: [number, number, number] = [0, 0, 0];
  cfg.velocity(v);
  p.pos[i * 3] = origin.x + (Math.random() - 0.5) * cfg.spread;
  p.pos[i * 3 + 1] = origin.y + (Math.random() - 0.5) * cfg.spread * 0.5;
  p.pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * cfg.spread;
  p.vel.set(v, i * 3);
  p.ttl[i] = cfg.ttl[0] + Math.random() * (cfg.ttl[1] - cfg.ttl[0]);
  p.life[i] = 0;
  if (stagger) {
    // Start mid-flight along the particle's path so the plume is full from
    // the very first frame.
    const age = Math.random() * p.ttl[i];
    p.life[i] = age;
    p.pos[i * 3] += v[0] * age;
    p.pos[i * 3 + 1] += v[1] * age + 0.5 * cfg.gravity * age * age;
    p.pos[i * 3 + 2] += v[2] * age;
    p.vel[i * 3 + 1] += cfg.gravity * age;
  }
}

function createParticles(cfg: Config, origin: THREE.Vector3): Particles {
  const p: Particles = {
    pos: new Float32Array(cfg.count * 3),
    vel: new Float32Array(cfg.count * 3),
    life: new Float32Array(cfg.count),
    ttl: new Float32Array(cfg.count),
  };
  for (let i = 0; i < cfg.count; i++) respawn(p, i, cfg, origin, true);
  return p;
}

const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const birth = new THREE.Color();
const death = new THREE.Color();

// Camera-facing instanced sprites: unlike GL points, their size is not capped
// by the GPU, so the effect looks the same on every device.
function Emitter({ kind, origin }: { kind: EffectKind; origin: THREE.Vector3 }) {
  const cfg = CONFIGS[kind];
  const mesh = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => createParticles(cfg, origin), [cfg, origin]);
  const texture = useMemo(() => spriteTexture(), []);

  useFrame(({ camera }, delta) => {
    const m = mesh.current;
    if (!m) return;
    const p = m.userData as Particles;
    const dt = Math.min(delta, 0.05);
    birth.set(cfg.colors[0]);
    death.set(cfg.colors[1]);
    for (let i = 0; i < cfg.count; i++) {
      p.life[i] += dt;
      if (p.life[i] >= p.ttl[i]) respawn(p, i, cfg, origin, false);
      const k = i * 3;
      const t = p.life[i] / p.ttl[i];
      p.vel[k + 1] += cfg.gravity * dt;
      const drift = cfg.growth ? cfg.growth * t : 0;
      p.pos[k] += (p.vel[k] + (p.pos[k] - origin.x) * drift) * dt;
      p.pos[k + 1] += p.vel[k + 1] * dt;
      p.pos[k + 2] += (p.vel[k + 2] + (p.pos[k + 2] - origin.z) * drift) * dt;

      dummy.position.set(p.pos[k], p.pos[k + 1], p.pos[k + 2]);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(cfg.size[0] + (cfg.size[1] - cfg.size[0]) * t);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      // Additive sprites fade by darkening; the fade-in avoids popping.
      const fade = Math.min(1, t * 6) * (1 - t);
      tint.copy(birth).lerp(death, t).multiplyScalar(cfg.additive ? fade * 1.6 : 1);
      m.setColorAt(i, tint);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, cfg.count]} userData={particles} frustumCulled={false} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={cfg.opacity}
        depthWrite={false}
        blending={cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// Where each emergency shows up on the scanner (world coordinates), placed
// just outside the covers so the effect is visible.
const ORIGINS: Record<string, [number, number, number]> = {
  xray_tube: [0.35, 1.45, 1.05],
  table: [0.75, -2.3, 3.2],
  das_slip_ring: [2.35, 0.9, 0.2],
  gantry: [0, 2.6, 0.9],
  detector: [0, -1.4, 0.9],
  bowtie_filter: [0.2, 2.6, 0.9],
};

export default function EmergencyEffect({ kind, part }: { kind: EffectKind; part: string }) {
  const origin = useMemo(() => new THREE.Vector3(...(ORIGINS[part] ?? ORIGINS.gantry)), [part]);
  const smokeOrigin = useMemo(() => origin.clone().add(new THREE.Vector3(0, kind === "fire" ? 0.8 : 0.3, 0)), [origin, kind]);
  const alarm = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Rotating-beacon style red alarm light.
    if (alarm.current) alarm.current.intensity = 6 * Math.max(0, Math.sin(t * 5));
    // Flickering glow from the fire or sparks.
    if (flame.current) flame.current.intensity = kind === "fire" ? 8 + Math.random() * 6 : kind === "sparks" ? Math.random() * 10 : 3;
  });

  return (
    <group>
      <pointLight ref={alarm} color="#ff2a1a" position={[0, 3.6, 2.5]} distance={14} decay={1.5} />
      {kind !== "smoke" && <pointLight ref={flame} color={kind === "sparks" ? "#ffd98a" : "#ff6a1a"} position={origin} distance={5} decay={2} />}
      <Emitter kind={kind} origin={origin} />
      {(kind === "fire" || kind === "overheat") && <Emitter kind="smoke" origin={smokeOrigin} />}
    </group>
  );
}
