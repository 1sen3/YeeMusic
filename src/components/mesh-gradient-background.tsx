import { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vsSource, fsSource } from "@/lib/utils/shaders";

interface MeshGradientBackgroundProps {
  colors: [number, number, number][];
  speed?: number;
}

function padColors(colors: [number, number, number][]) {
  const result = colors.slice(0, 5);
  while (result.length < 5) {
    result.push(result[result.length - 1] || [0.1, 0.1, 0.18]);
  }
  return result;
}

function makeColors(arr: [number, number, number][]) {
  return padColors(arr).map((c) => new THREE.Color(c[0], c[1], c[2]));
}

const BackgroundPlane: React.FC<
  MeshGradientBackgroundProps & { onReady: () => void }
> = ({ colors, speed = 1.0, onReady }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const accTime = useRef(0);
  const prevStamp = useRef(0);
  const prevColors = useRef(colors);
  const readySignaled = useRef(false);

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;

    if (!readySignaled.current) {
      readySignaled.current = true;
      onReady();
    }

    const now = performance.now();
    if (prevStamp.current === 0) prevStamp.current = now;
    const dt = (now - prevStamp.current) / 1000;
    prevStamp.current = now;
    accTime.current += dt * speedRef.current;

    const u = mat.uniforms as any;
    u.uTime.value = accTime.current;
    u.uSpeed.value = speedRef.current;
    u.uResolution.value.set(size.width, size.height);

    if (prevColors.current !== colorsRef.current) {
      prevColors.current = colorsRef.current;
      u.uColors.value = makeColors(colorsRef.current);
      mat.uniformsNeedUpdate = true;
    }
  });

  return (
    <mesh scale={[size.width, size.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vsSource}
        fragmentShader={fsSource}
        uniforms={{
          uTime: { value: 0 },
          uSpeed: { value: speed },
          uResolution: { value: new THREE.Vector2() },
          uColors: { value: makeColors(colors) },
        }}
        glslVersion={THREE.GLSL1}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export const MeshGradientBackground: React.FC<MeshGradientBackgroundProps> = (
  props,
) => {
  const [ready, setReady] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <Canvas orthographic gl={{ alpha: false }}>
        <BackgroundPlane {...props} onReady={() => setReady(true)} />
      </Canvas>
    </div>
  );
};
