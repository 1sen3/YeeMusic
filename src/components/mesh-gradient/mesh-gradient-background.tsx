/**
 * @MeshGradientBackground
 *
 * 致谢:
 * 本文件中的的网格计算逻辑参考自以下开源项目：
 *
 * - 项目名称: applemusic-like-lyrics
 * - 原作者: amll-dev
 * - 项目地址: https://github.com/amll-dev/applemusic-like-lyrics
 *
 * - 特此向原作者表示感谢。
 */

import React, { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { corePlayer } from "@/lib/player/corePlayer";
import { fsSource, vsSource } from "./shaders";

function padColors(colors: [number, number, number][]) {
  const result = colors.slice(0, 5);
  while (result.length < 5) {
    result.push(result[result.length - 1] || [0.1, 0.1, 0.18]);
  }
  return result;
}

function makeColors(arr: [number, number, number][]) {
  const padded = padColors(arr);
  const layout = [
    padded[0],
    padded[1],
    padded[2],
    padded[3],
    padded[4],
    padded[0],
    padded[1],
    padded[2],
    padded[3],
  ];
  return layout.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
}

const BackgroundPlane: React.FC<{ colors: [number, number, number][] }> = ({
  colors,
}) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(() => {
    return {
      uPoints: { value: Array.from({ length: 9 }, () => new THREE.Vector2()) },
      uColors: { value: Array.from({ length: 9 }, () => new THREE.Vector3()) },
      uTangentsU: {
        value: Array.from({ length: 9 }, () => new THREE.Vector2()),
      },
      uTangentsV: {
        value: Array.from({ length: 9 }, () => new THREE.Vector2()),
      },
      uAspect: { value: 1.0 },
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0.0 },
      uVolume: { value: 0.0 },
    };
  }, []);

  useEffect(() => {
    const newColors = makeColors(colors);
    for (let i = 0; i < 9; i++) {
      uniforms.uColors.value[i].copy(newColors[i]);
    }
  }, [colors, uniforms]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.elapsedTime * 0.05;
    const vol = corePlayer.getReactVolume();
    const aspect = size.width / size.height;
    const aspectX = Math.max(1.0, aspect);
    const aspectY = Math.max(1.0, 1.0 / aspect);
    for (let i = 0; i < 9; i++) {
      const xIndex = i % 3;
      const yIndex = Math.floor(i / 3);
      const isBorder =
        xIndex === 0 || xIndex === 2 || yIndex === 0 || yIndex === 2;
      const baseX = (xIndex - 1) * 1.5 * aspectX;
      const baseY = (yIndex - 1) * 1.5 * aspectY;

      const seed = i * 1.618033988;
      const driftX =
        (Math.sin(t * 1.3 + seed * 3.7) * 0.08 +
          Math.sin(t * 0.7 + seed * 2.3) * 0.06 +
          Math.sin(t * 2.1 + seed * 5.1) * 0.03) *
        aspectX;
      const driftY =
        (Math.cos(t * 1.1 + seed * 4.1) * 0.08 +
          Math.cos(t * 0.5 + seed * 1.9) * 0.06 +
          Math.cos(t * 1.7 + seed * 6.3) * 0.03) *
        aspectY;

      const driftScale = isBorder ? 0.4 : 1.0;
      uniforms.uPoints.value[i].set(
        baseX + driftX * driftScale,
        baseY + driftY * driftScale,
      );

      let rotU: number, rotV: number, scaleStrength: number;
      if (!isBorder) {
        const twist1 = Math.sin(t * 1.3 + seed * 2.7) * Math.PI * 0.4;
        const twist2 = Math.sin(t * 0.7 + seed * 4.3) * Math.PI * 0.25;
        const twist3 = Math.sin(t * 2.3 + seed * 1.1) * Math.PI * 0.1;
        rotU = twist1 + twist2 + twist3;
        rotV = rotU + Math.PI / 2.0;
        scaleStrength = 2.0 + Math.sin(t * 0.9 + seed) * 0.5 + vol * 0.8;
      } else {
        const w1 = Math.sin(t * 0.8 + seed * 3.1) * (Math.PI / 20);
        const w2 = Math.sin(t * 1.5 + seed * 5.7) * (Math.PI / 30);
        rotU = w1 + w2;
        rotV = Math.PI / 2.0 + w1 * 0.5 + w2 * 0.3;
        scaleStrength = 1.2 + vol * 0.15;
      }
      uniforms.uTangentsU.value[i].set(
        Math.cos(rotU) * scaleStrength * aspectX,
        Math.sin(rotU) * scaleStrength * aspectY,
      );
      uniforms.uTangentsV.value[i].set(
        Math.cos(rotV) * scaleStrength * aspectX,
        Math.sin(rotV) * scaleStrength * aspectY,
      );
    }
    uniforms.uAspect.value = aspect;
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uTime.value = clock.elapsedTime * 0.05;
    uniforms.uVolume.value = vol;
    matRef.current.uniformsNeedUpdate = true;
  });

  return (
    <mesh scale={[size.width * 1.2, size.height * 1.2, 1]}>
      <planeGeometry args={[1, 1, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vsSource}
        fragmentShader={fsSource}
        uniforms={uniforms}
        depthTest={false}
      />
    </mesh>
  );
};

export const MeshGradient: React.FC<{
  colors: [number, number, number][];
}> = ({ colors }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    >
      <Canvas orthographic dpr={[1, 1]} gl={{ antialias: false, alpha: false }}>
        <BackgroundPlane colors={colors} />
      </Canvas>
    </div>
  );
};
