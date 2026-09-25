"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Low-poly patient in a hospital gown: walks to the couch, sits on its edge
// and lies down supine with the head toward the gantry, then the loop repeats.

const SKIN = new THREE.MeshStandardMaterial({ color: "#d6a384", roughness: 0.7 });
const GOWN = new THREE.MeshStandardMaterial({ color: "#8fb8d4", roughness: 0.85 });
const HAIR = new THREE.MeshStandardMaterial({ color: "#2b211c", roughness: 0.9 });
const SOCK = new THREE.MeshStandardMaterial({ color: "#e8ecef", roughness: 0.9 });

const SCALE = 0.9;
const FLOOR_Y = -2.74; // world floor under the scanner
const STAND_Y = FLOOR_Y + SCALE * 2.18; // pelvis height when standing
const PELVIS_Z = 2.9; // head ends up at the bore entrance when lying

type Pose = { x: number; y: number; z: number; yaw: number; pitch: number; hip: number; knee: number; shoulder: number; elbow: number };

const START: [number, number] = [4.6, 6.2];
const BESIDE: [number, number] = [1.25, PELVIS_Z];
const WALK_YAW = Math.atan2(BESIDE[0] - START[0], BESIDE[1] - START[1]);
const BACK_TO_COUCH = -1.5 * Math.PI; // facing +x, back toward the couch

const STAND: Pose = { x: BESIDE[0], y: STAND_Y, z: BESIDE[1], yaw: BACK_TO_COUCH, pitch: 0, hip: 0, knee: 0, shoulder: 0, elbow: 0 };
const SIT: Pose = { x: 0.3, y: -0.12, z: PELVIS_Z, yaw: BACK_TO_COUCH, pitch: 0, hip: -Math.PI / 2, knee: Math.PI / 2, shoulder: -0.35, elbow: -0.7 };
const LIE: Pose = { x: 0, y: -0.09, z: PELVIS_Z, yaw: -2 * Math.PI, pitch: -Math.PI / 2, hip: 0, knee: 0, shoulder: 0.05, elbow: 0 };

// Timeline in seconds.
const T_WALK = 7;
const T_TURN = 8.2;
const T_SIT = 9.8;
const T_LIE = 12;
const T_HOLD = 17;
const T_LOOP = 18;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const phase = (t: number, a: number, b: number) => smooth(clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Pose, b: Pose, t: number): Pose =>
  Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k as keyof Pose], b[k as keyof Pose], t)])) as Pose;

function pose(t: number): { p: Pose; stride: number } {
  if (t < T_WALK) {
    const k = phase(t, 0, T_WALK);
    const x = lerp(START[0], BESIDE[0], k);
    const z = lerp(START[1], BESIDE[1], k);
    const dist = Math.hypot(START[0] - BESIDE[0], START[1] - BESIDE[1]) * k;
    const stride = Math.sin(dist * 2.4) * Math.min(1, t * 2, (T_WALK - t) * 1.5); // ease the gait in and out
    return { p: { ...STAND, x, z, yaw: WALK_YAW, y: STAND_Y + 0.04 * Math.abs(stride) }, stride };
  }
  if (t < T_TURN) return { p: { ...STAND, yaw: lerp(WALK_YAW, BACK_TO_COUCH, phase(t, T_WALK, T_TURN)) }, stride: 0 };
  if (t < T_SIT) return { p: mix(STAND, SIT, phase(t, T_TURN, T_SIT)), stride: 0 };
  return { p: mix(SIT, LIE, phase(t, T_SIT, T_LIE)), stride: 0 };
}

function Limb({ length, radius, material }: { length: number; radius: number; material: THREE.Material }) {
  return (
    <mesh position={[0, -length / 2, 0]} material={material} castShadow>
      <capsuleGeometry args={[radius, length - 2 * radius, 4, 12]} />
    </mesh>
  );
}

export default function Patient() {
  const root = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const hipL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const shL = useRef<THREE.Group>(null);
  const shR = useRef<THREE.Group>(null);
  const elL = useRef<THREE.Group>(null);
  const elR = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const r = root.current;
    if (!r) return;
    const t = clock.elapsedTime % T_LOOP;
    r.visible = t < T_HOLD + 0.6;
    const { p, stride } = pose(t);

    r.position.set(p.x, p.y, p.z);
    r.rotation.set(p.pitch, p.yaw, 0, "YXZ");

    // Gait: legs swing in opposition, the knee bends on the forward swing,
    // arms swing opposite to the legs.
    hipL.current!.rotation.x = p.hip - 0.45 * stride;
    hipR.current!.rotation.x = p.hip + 0.45 * stride;
    kneeL.current!.rotation.x = p.knee + 0.55 * Math.max(0, stride);
    kneeR.current!.rotation.x = p.knee + 0.55 * Math.max(0, -stride);
    shL.current!.rotation.x = p.shoulder + 0.35 * stride;
    shR.current!.rotation.x = p.shoulder - 0.35 * stride;
    elL.current!.rotation.x = p.elbow - 0.2 * Math.abs(stride);
    elR.current!.rotation.x = p.elbow - 0.2 * Math.abs(stride);

    // Calm breathing while lying on the couch.
    const breathe = t > T_LIE ? 1 + 0.025 * Math.sin((t - T_LIE) * 2.2) : 1;
    chest.current!.scale.set(1, 1, breathe);
  });

  return (
    <group ref={root} scale={SCALE}>
      {/* Pelvis */}
      <mesh material={GOWN} castShadow>
        <boxGeometry args={[0.8, 0.36, 0.46]} />
      </mesh>

      {/* Torso, neck and head */}
      <group ref={chest}>
        <mesh position={[0, 0.78, 0]} material={GOWN} castShadow>
          <capsuleGeometry args={[0.36, 0.72, 6, 16]} />
        </mesh>
        <mesh position={[0, 0.78, 0]} scale={[1.18, 1, 0.72]} material={GOWN}>
          <capsuleGeometry args={[0.36, 0.72, 6, 16]} />
        </mesh>
      </group>
      <mesh position={[0, 1.6, 0]} material={SKIN}>
        <cylinderGeometry args={[0.11, 0.13, 0.22, 12]} />
      </mesh>
      <group position={[0, 1.96, 0.02]}>
        <mesh material={SKIN} castShadow>
          <sphereGeometry args={[0.28, 24, 18]} />
        </mesh>
        <mesh position={[0, 0.06, -0.04]} scale={[1.04, 0.92, 1.02]} material={HAIR}>
          <sphereGeometry args={[0.28, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, -0.02, 0.27]} material={SKIN}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
      </group>

      {/* Arms */}
      {(
        [
          [-1, shL, elL],
          [1, shR, elR],
        ] as const
      ).map(([side, sh, el]) => (
        <group key={side} ref={sh} position={[side * 0.5, 1.36, 0]} rotation={[0, 0, side * 0.08]}>
          <Limb length={0.66} radius={0.11} material={GOWN} />
          <group ref={el} position={[0, -0.66, 0]}>
            <Limb length={0.62} radius={0.085} material={SKIN} />
          </group>
        </group>
      ))}

      {/* Legs */}
      {(
        [
          [-1, hipL, kneeL],
          [1, hipR, kneeR],
        ] as const
      ).map(([side, hip, knee]) => (
        <group key={side} ref={hip} position={[side * 0.21, -0.1, 0]}>
          <Limb length={1.02} radius={0.15} material={GOWN} />
          <group ref={knee} position={[0, -1.02, 0]}>
            <Limb length={0.98} radius={0.11} material={SKIN} />
            <mesh position={[0, -1.02, 0.1]} material={SOCK} castShadow>
              <boxGeometry args={[0.2, 0.12, 0.42]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
