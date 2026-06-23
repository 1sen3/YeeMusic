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
	const targetColorsRef = useRef(makeColors(colors));
	const displayColorsRef = useRef(makeColors(colors));
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
		targetColorsRef.current = makeColors(colors);
	}, [colors]);

	useFrame(({ clock }, delta) => {
		if (!matRef.current) return;
		const elapsed = clock.elapsedTime;
		const t = elapsed * 0.26;
		const vol = corePlayer.getReactVolume();
		const volSq = vol * vol;
		const aspect = size.width / size.height;
		const aspectX = Math.max(1.0, aspect);
		const aspectY = Math.max(1.0, 1.0 / aspect);
		const transitionEase = 1 - Math.pow(0.035, delta);

		for (let i = 0; i < 9; i++) {
			displayColorsRef.current[i].lerp(
				targetColorsRef.current[i],
				transitionEase,
			);

			const xIndex = i % 3;
			const yIndex = Math.floor(i / 3);
			const isBorder =
				xIndex === 0 || xIndex === 2 || yIndex === 0 || yIndex === 2;
			const baseX = (xIndex - 1) * 1.5 * aspectX;
			const baseY = (yIndex - 1) * 1.5 * aspectY;

			const seed = i * 1.618033988;
			// Per-point frequency variation — each point oscillates at its own speed
			const fq = 0.7 + ((seed * 0.618) % 0.8); // range ~0.7–1.5
			const volDrift = 1.0 + volSq * 0.6;
			const driftX =
				(Math.sin(t * (1.1 * fq) + seed * 3.7) * 0.25 +
					Math.sin(t * (0.53 * fq) + seed * 2.3) * 0.16 +
					Math.sin(t * (1.9 * fq) + seed * 5.1) * 0.08) *
				aspectX *
				volDrift;
			const driftY =
				(Math.cos(t * (0.97 * fq) + seed * 4.1) * 0.25 +
					Math.cos(t * (0.41 * fq) + seed * 1.9) * 0.16 +
					Math.cos(t * (1.6 * fq) + seed * 6.3) * 0.08) *
				aspectY *
				volDrift;

			const driftScale = isBorder ? 0.62 : 1.0;
			uniforms.uPoints.value[i].set(
				baseX + driftX * driftScale,
				baseY + driftY * driftScale,
			);

			let rotU: number, rotV: number, scaleStrength: number;
			if (!isBorder) {
				// Limit total twist to ~±90° max to prevent patch self-intersection
				const twist1 = Math.sin(t * (1.2 * fq) + seed * 2.7) * Math.PI * 0.3;
				const twist2 = Math.sin(t * (0.6 * fq) + seed * 4.3) * Math.PI * 0.15;
				const twist3 = Math.sin(t * (2.1 * fq) + seed * 1.1) * Math.PI * 0.05;
				rotU = twist1 + twist2 + twist3;
				rotV = rotU + Math.PI / 2.0;
				scaleStrength =
					1.95 + Math.sin(t * (0.8 * fq) + seed) * 0.55 + volSq * 1.2;
			} else {
				const w1 = Math.sin(t * (0.7 * fq) + seed * 3.1) * (Math.PI / 14);
				const w2 = Math.sin(t * (1.3 * fq) + seed * 5.7) * (Math.PI / 22);
				rotU = w1 + w2;
				rotV = Math.PI / 2.0 + w1 * 0.5 + w2 * 0.3;
				scaleStrength = 1.35 + volSq * 0.35;
			}
			uniforms.uTangentsU.value[i].set(
				Math.cos(rotU) * scaleStrength * aspectX,
				Math.sin(rotU) * scaleStrength * aspectY,
			);
			uniforms.uTangentsV.value[i].set(
				Math.cos(rotV) * scaleStrength * aspectX,
				Math.sin(rotV) * scaleStrength * aspectY,
			);

			const colorPhase =
				Math.sin(elapsed * (0.22 + fq * 0.04) + seed * 1.7) * 0.5 + 0.5;
			const colorMix = 0.06 + colorPhase * (0.16 + volSq * 0.08);
			uniforms.uColors.value[i]
				.copy(displayColorsRef.current[i])
				.lerp(displayColorsRef.current[(i + 1) % 9], colorMix);
		}
		uniforms.uAspect.value = aspect;
		uniforms.uResolution.value.set(size.width, size.height);
		uniforms.uTime.value = elapsed * 0.09;
		uniforms.uVolume.value = vol;
		matRef.current.uniformsNeedUpdate = true;
	});

	return (
		<mesh scale={[size.width * 1.2, size.height * 1.2, 1]}>
			<planeGeometry args={[1, 1, 32, 32]} />
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
			<Canvas
				orthographic
				dpr={[1, 1]}
				gl={{
					antialias: false,
					alpha: false,
					powerPreference: "high-performance",
				}}
			>
				<BackgroundPlane colors={colors} />
			</Canvas>
		</div>
	);
};
