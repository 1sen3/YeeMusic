/**
 * @MeshGradientBackground
 *
 * Credits:
 * The mesh interpolation idea in this file references:
 * - Project: applemusic-like-lyrics
 * - Author: amll-dev
 * - URL: https://github.com/amll-dev/applemusic-like-lyrics
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fsSource, vsSource } from "./shaders";

const GRID_SIZE = 5;
const POINT_COUNT = GRID_SIZE * GRID_SIZE;

function padColors(colors: [number, number, number][]) {
	const result = colors.slice(0, 5);
	while (result.length < 5) {
		result.push(result[result.length - 1] || [0.1, 0.1, 0.18]);
	}
	return result;
}

function makeColors(arr: [number, number, number][]) {
	const padded = padColors(arr);
	const result: THREE.Vector3[] = [];
	for (let y = 0; y < GRID_SIZE; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			const primary = padded[(x + y * 2) % padded.length];
			const secondary = padded[(x * 2 + y + 2) % padded.length];
			const color = new THREE.Vector3(primary[0], primary[1], primary[2]);
			color.lerp(
				new THREE.Vector3(secondary[0], secondary[1], secondary[2]),
				0.18 + ((x + y) % 3) * 0.08,
			);
			result.push(color);
		}
	}
	return result;
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
			uPoints: {
				value: Array.from({ length: POINT_COUNT }, () => new THREE.Vector2()),
			},
			uColors: {
				value: Array.from({ length: POINT_COUNT }, () => new THREE.Vector3()),
			},
			uTangentsU: {
				value: Array.from({ length: POINT_COUNT }, () => new THREE.Vector2()),
			},
			uTangentsV: {
				value: Array.from({ length: POINT_COUNT }, () => new THREE.Vector2()),
			},
			uAspect: { value: 1.0 },
			uResolution: { value: new THREE.Vector2() },
			uTime: { value: 0.0 },
		};
	}, []);

	useEffect(() => {
		targetColorsRef.current = makeColors(colors);
	}, [colors]);

	useFrame(({ clock }, delta) => {
		if (!matRef.current) return;

		const elapsed = clock.elapsedTime;
		const t = elapsed * 0.22;
		const aspect = size.width / size.height;
		const aspectX = Math.max(1.0, aspect);
		const aspectY = Math.max(1.0, 1.0 / aspect);
		const transitionEase = 1 - 0.035 ** delta;
		const globalDriftX =
			(Math.sin(t * 0.42) * 0.22 + Math.sin(t * 0.16 + 1.4) * 0.14) * aspectX;
		const globalDriftY =
			(Math.cos(t * 0.36 + 0.8) * 0.2 + Math.sin(t * 0.14 + 2.1) * 0.12) *
			aspectY;
		const eddyA = {
			x: Math.sin(t * 0.19 + 0.6) * 0.36,
			y: Math.cos(t * 0.16 + 1.8) * 0.32,
		};
		const eddyB = {
			x: Math.sin(t * 0.14 + 3.2) * 0.42,
			y: Math.cos(t * 0.21 + 2.4) * 0.34,
		};

		for (let i = 0; i < POINT_COUNT; i++) {
			displayColorsRef.current[i].lerp(
				targetColorsRef.current[i],
				transitionEase,
			);

			const xIndex = i % GRID_SIZE;
			const yIndex = Math.floor(i / GRID_SIZE);
			const isBorder =
				xIndex === 0 ||
				xIndex === GRID_SIZE - 1 ||
				yIndex === 0 ||
				yIndex === GRID_SIZE - 1;
			const gridX = (xIndex / (GRID_SIZE - 1)) * 2 - 1;
			const gridY = (yIndex / (GRID_SIZE - 1)) * 2 - 1;
			const baseRange = 1.62;
			const baseX = gridX * baseRange * aspectX;
			const baseY = gridY * baseRange * aspectY;

			const seed = i * 1.618033988;
			const fq = 0.48 + ((seed * 0.618) % 0.46);
			const orbital =
				Math.sin(t * 0.34 + gridX * 0.7 + gridY * 0.45 + seed) * 0.28;
			const localAX = gridX - eddyA.x;
			const localAY = gridY - eddyA.y;
			const localBX = gridX - eddyB.x;
			const localBY = gridY - eddyB.y;
			const swirlA =
				Math.exp(-(localAX * localAX + localAY * localAY) * 1.8) *
				(0.34 + Math.sin(t * 0.16 + seed) * 0.08);
			const swirlB =
				Math.exp(-(localBX * localBX + localBY * localBY) * 2.2) *
				(-0.28 + Math.cos(t * 0.13 + seed) * 0.07);
			const driftX =
				globalDriftX +
				(Math.sin(t * (0.42 * fq) + seed * 3.7) * 0.3 +
					Math.sin(t * (0.18 * fq) + seed * 2.3) * 0.2 -
					gridY * orbital -
					localAY * swirlA -
					localBY * swirlB) *
					aspectX;
			const driftY =
				globalDriftY +
				(Math.cos(t * (0.38 * fq) + seed * 4.1) * 0.3 +
					Math.cos(t * (0.16 * fq) + seed * 1.9) * 0.2 +
					gridX * orbital +
					localAX * swirlA +
					localBX * swirlB) *
					aspectY;

			const driftScale = isBorder ? 0.34 : 0.72;
			uniforms.uPoints.value[i].set(
				baseX + driftX * driftScale,
				baseY + driftY * driftScale,
			);

			let rotU: number, rotV: number, scaleStrength: number;
			if (!isBorder) {
				const twist1 = Math.sin(t * (0.38 * fq) + seed * 2.7) * Math.PI * 0.32;
				const twist2 = Math.sin(t * (0.18 * fq) + seed * 4.3) * Math.PI * 0.16;
				const swirlTwist = (swirlA + swirlB) * Math.PI * 0.5;
				rotU = twist1 + twist2 + swirlTwist;
				rotV = rotU + Math.PI / 2.0 + Math.sin(t * 0.11 + seed) * 0.18;
				scaleStrength = 0.84 + Math.sin(t * (0.26 * fq) + seed) * 0.2;
			} else {
				const w1 = Math.sin(t * (0.28 * fq) + seed * 3.1) * (Math.PI / 18);
				const w2 = Math.sin(t * (0.13 * fq) + seed * 5.7) * (Math.PI / 28);
				rotU = w1 + w2;
				rotV = Math.PI / 2.0 + w1 * 0.5 + w2 * 0.3;
				scaleStrength = 0.62;
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
				Math.sin(elapsed * (0.085 + fq * 0.024) + seed * 1.7) * 0.5 + 0.5;
			const colorMix = 0.055 + colorPhase * 0.13;
			uniforms.uColors.value[i]
				.copy(displayColorsRef.current[i])
				.lerp(displayColorsRef.current[(i + 1) % POINT_COUNT], colorMix);
		}

		uniforms.uAspect.value = aspect;
		uniforms.uResolution.value.set(size.width, size.height);
		uniforms.uTime.value = elapsed * 0.065;
		matRef.current.uniformsNeedUpdate = true;
	});

	return (
		<mesh scale={[size.width * 1.2, size.height * 1.2, 1]}>
			<planeGeometry args={[1, 1, 64, 64]} />
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
