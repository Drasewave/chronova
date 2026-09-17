"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { METALS } from "./palette";
import { DEFAULT_TIME, handAngles } from "./geometry";
import { WatchSvg } from "./watch-svg";
import type { WatchRender } from "./types";

export interface Watch3DProps {
  render: WatchRender;
  label: string;
  className?: string;
}

/**
 * Vue 3D, en complément des trois vues SVG (face / profil / dos). Géométrie
 * procédurale — aucun modèle chargé — pilotée par le même `WatchRender` que le
 * moteur SVG : les deux moteurs partagent la donnée, jamais le dessin.
 *
 * Se replie sur le rendu SVG face si WebGL est indisponible.
 */
export function Watch3D({ render, label, className }: Watch3DProps) {
  const webgl = useWebglSupport();

  if (webgl === false) {
    return <WatchSvg id="3d-repli" render={render} view="face" label={label} className={className} />;
  }

  return (
    <div className={className} role="img" aria-label={`${label} — vue 3D, glisser pour tourner`}>
      {webgl === true && (
        <Canvas
          dpr={[1, isMobile() ? 1.5 : 2]}
          camera={{ position: [0, 0.1, 3.2], fov: 30 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene render={render} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

function Scene({ render }: { render: WatchRender }) {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (reducedMotion || !group.current) return;
    group.current.rotation.y += delta * 0.25;
  });

  const caseMetal = METALS[render.caseMetal];
  const handMetal = METALS[render.handMetal];
  const crownMetal = METALS[render.crownMetal];
  const angles = useMemo(() => handAngles(render.time ?? DEFAULT_TIME), [render.time]);

  const caseR = 1;
  const caseH = 0.36;
  const front = caseH / 2;
  const bezelIn = 0.82;
  const bezelOut = 0.98;
  const dialR = 0.8;

  const isBracelet = render.strapKind === "acier-3-maillons" || render.strapKind === "acier-jubile";
  const strapColor = isBracelet ? caseMetal.mid : render.strapColor;
  const strapMetalness = isBracelet ? 0.85 : 0.04;
  const strapRoughness = isBracelet ? 0.3 : render.strapKind === "caoutchouc" ? 0.8 : 0.55;

  const dialMetalness = render.dialTexture === "mat" ? 0.02 : 0.18;
  const dialRoughness = render.dialTexture === "mat" ? 0.9 : render.dialTexture === "emaille" ? 0.3 : 0.42;

  const bezelColor = render.insertColor && render.bezelStyle === "plongee" ? render.insertColor : caseMetal.light;
  const bezelMetalness = render.insertMaterial === "ceramique" ? 0.15 : 0.85;
  const bezelRoughness = render.insertMaterial === "ceramique" ? 0.35 : 0.22;

  const domed = render.crystal === "bombe";

  return (
    <group ref={group}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2.2, 3, 3.5]} intensity={1.4} />
      <directionalLight position={[-3, -1.5, 1.5]} intensity={0.3} />
      <pointLight position={[0, 1.5, 2.5]} intensity={0.2} />

      {/* Studio procédural, neutre — un cube de panneaux clairs/sombres, jamais
          une image chargée par le réseau — qui donne aux métaux et au verre des
          reflets crédibles sans dépendre d'un HDRI externe ni teinter les
          matières avec une couleur qui n'est pas la leur. */}
      <Environment resolution={256}>
        <mesh scale={12}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#cfc8ba" side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 4, 2]} scale={[8, 4, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#fbf8f3" />
        </mesh>
        <mesh position={[0, -4, -2]} rotation={[Math.PI, 0, 0]} scale={[8, 4, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#3a352c" />
        </mesh>
        <mesh position={[-5, 0, 3]} rotation={[0, Math.PI / 2, 0]} scale={[6, 6, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#eee7da" />
        </mesh>
      </Environment>

      {/* Brins du bracelet, au-dessus et en dessous du boîtier. */}
      {[1, -1].map((sens) => (
        <mesh key={sens} position={[0, sens * 1.32, -0.02]}>
          <boxGeometry args={[0.4, 0.86, 0.13]} />
          <meshStandardMaterial color={strapColor} metalness={strapMetalness} roughness={strapRoughness} />
        </mesh>
      ))}

      {/* Boîtier. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[caseR, caseR, caseH, 64]} />
        <meshStandardMaterial color={caseMetal.mid} metalness={0.9} roughness={0.28} />
      </mesh>

      {/* Couronne. */}
      <mesh position={[caseR + 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.15, 24]} />
        <meshStandardMaterial color={crownMetal.mid} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Lunette. */}
      <mesh position={[0, 0, front]}>
        <torusGeometry args={[(bezelOut + bezelIn) / 2, (bezelOut - bezelIn) / 2, 24, 64]} />
        <meshStandardMaterial color={bezelColor} metalness={bezelMetalness} roughness={bezelRoughness} />
      </mesh>

      {/* Cadran. `circleGeometry`, pas `cylinderGeometry` : le capuchon d'un
          cylindre triangule le disque en éventail depuis son centre et
          produit un artefact de bandes sous éclairage direct, même en
          matériau mat — un disque plat n'a pas cette couture. */}
      <mesh position={[0, 0, front - 0.02]}>
        <circleGeometry args={[dialR, 64]} />
        <meshStandardMaterial color={render.dialColor} metalness={dialMetalness} roughness={dialRoughness} />
      </mesh>

      {/* Index, aux douze heures. */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = dialR * 0.82;
        return (
          <mesh key={i} position={[Math.sin(angle) * r, Math.cos(angle) * r, front + 0.01]} rotation={[0, 0, -angle]}>
            <boxGeometry args={[0.026, i % 3 === 0 ? 0.09 : 0.05, 0.015]} />
            <meshStandardMaterial color={caseMetal.light} metalness={0.6} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Aiguilles, figées à l'heure par défaut du site (10 h 10). */}
      <Hand length={0.34} width={0.05} angleDeg={angles.hour} z={front + 0.03} color={handMetal.mid} />
      <Hand length={0.55} width={0.035} angleDeg={angles.minute} z={front + 0.04} color={handMetal.mid} />

      {/* Verre : une ellipsoïde aplatie, bombée ou plate selon l'option. Pas de
          transmission — la réfraction déformerait cadran et aiguilles en une
          loupe peu lisible une fois la montre agrandie ; une transparence
          simple avec reflet suffit à lire « verre ». `meshStandardMaterial`,
          pas `meshPhysicalMaterial` : sa couche `clearcoat` ignore
          `envMapIntensity` et garde un reflet plein pot quel que soit le
          réglage, ce qui donnait une boule miroir en facettes. */}
      <mesh position={[0, 0, front + (domed ? 0.14 : 0.05)]} scale={[bezelIn, bezelIn, domed ? 0.08 : 0.025]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial
          color="#eef3f5"
          roughness={0.15}
          metalness={0.1}
          envMapIntensity={0.3}
          transparent
          opacity={0.22}
        />
      </mesh>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.7}
        rotateSpeed={0.6}
      />
    </group>
  );
}

function Hand({
  length,
  width,
  angleDeg,
  z,
  color,
}: {
  length: number;
  width: number;
  angleDeg: number;
  z: number;
  color: string;
}) {
  return (
    <group rotation={[0, 0, -THREE.MathUtils.degToRad(angleDeg)]} position={[0, 0, z]}>
      <mesh position={[0, length / 2 - 0.05, 0]}>
        <boxGeometry args={[width, length, 0.02]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** `null` pendant la détection, pour ne rendre le canevas qu'une fois sûr. */
function useWebglSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setSupported(Boolean(gl));
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
