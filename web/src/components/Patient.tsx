"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Smooth white mannequin patient: walks to the couch, sits on its edge
// and lies down supine with the head toward the gantry, then the loop repeats.

// One glossy white material: a neutral mannequin, like a training dummy.
const BODY = new THREE.MeshPhysicalMaterial({ color: "#eef1f3", roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3 });

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

// How far the couch slides into the bore to bring the head into the scan plane.
export const TABLE_TRAVEL = 1.15;

// Frame-rate independent easing towards a target; the couch and the patient
// both use it so they move together.
export const approach = (current: number, target: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-delta * 1.6));

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

// Tapered limb segment hanging down from its joint, with a ball at the joint
// so segments blend like a smooth mannequin.
function Limb({ length, top, bottom }: { length: number; top: number; bottom: number }) {
  return (
    <>
      <mesh material={BODY} castShadow>
        <sphereGeometry args={[top, 20, 14]} />
      </mesh>
      <mesh position={[0, -length / 2, 0]} material={BODY} castShadow>
        <cylinderGeometry args={[top, bottom, length, 20]} />
      </mesh>
    </>
  );
}

function torsoGeometry() {
  // Smooth lathe profile from the hips to the neck: (radius, height).
  const profile = new THREE.SplineCurve(
    [
      [0.0, -0.24],
      [0.26, -0.2],
      [0.36, -0.02],
      [0.33, 0.35],
      [0.29, 0.65],
      [0.35, 1.05],
      [0.37, 1.3],
      [0.26, 1.48],
      [0.11, 1.58],
      [0.1, 1.76],
      [0.0, 1.78],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
  );
  const geo = new THREE.LatheGeometry(profile.getPoints(48), 40);
  geo.scale(1.08, 1, 0.66);
  return geo;
}

const TORSO = torsoGeometry();

// Default: the walk-in loop of the landing page. "lying": the patient stays
// on the couch and rides with it into the bore (operator console).
export default function Patient({ lying = false, travel = 0 }: { lying?: boolean; travel?: number }) {
  const root = useRef<THREE.Group>(null);
  const slide = useRef(0);
  const chest = useRef<THREE.Group>(null);
  const hipL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const shL = useRef<THREE.Group>(null);
  const shR = useRef<THREE.Group>(null);
  const elL = useRef<THREE.Group>(null);
  const elR = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const r = root.current;
    if (!r) return;
    slide.current = approach(slide.current, travel * TABLE_TRAVEL, delta);
    const t = lying ? T_LIE + clock.elapsedTime : clock.elapsedTime % T_LOOP;
    r.visible = lying || t < T_HOLD + 0.6;
    const { p, stride } = lying ? { p: LIE, stride: 0 } : pose(t);

    r.position.set(p.x, p.y, p.z - slide.current);
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
      {/* Torso with neck, and head */}
      <group ref={chest}>
        <mesh geometry={TORSO} material={BODY} castShadow />
      </group>
      <mesh position={[0, 1.98, 0]} scale={[0.95, 1.05, 1]} material={BODY} castShadow>
        <sphereGeometry args={[0.27, 32, 24]} />
      </mesh>

      {/* Arms */}
      {(
        [
          [-1, shL, elL],
          [1, shR, elR],
        ] as const
      ).map(([side, sh, el]) => (
        <group key={side} ref={sh} position={[side * 0.43, 1.33, 0]} rotation={[0, 0, side * 0.1]}>
          <Limb length={0.66} top={0.1} bottom={0.08} />
          <group ref={el} position={[0, -0.66, 0]}>
            <Limb length={0.6} top={0.08} bottom={0.06} />
            <mesh position={[0, -0.68, 0]} scale={[0.75, 1.1, 0.4]} material={BODY} castShadow>
              <sphereGeometry args={[0.11, 16, 12]} />
            </mesh>
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
        <group key={side} ref={hip} position={[side * 0.19, -0.1, 0]}>
          <Limb length={1.02} top={0.15} bottom={0.1} />
          <group ref={knee} position={[0, -1.02, 0]}>
            <Limb length={0.98} top={0.1} bottom={0.065} />
            <mesh position={[0, -1.03, 0.1]} scale={[0.6, 0.38, 1.25]} material={BODY} castShadow>
              <sphereGeometry args={[0.17, 20, 14]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
