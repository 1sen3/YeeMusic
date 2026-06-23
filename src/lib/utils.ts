import { clsx, type ClassValue } from "clsx";
import { Area } from "react-easy-crop";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
	if (isNaN(seconds) || seconds < 0) return "00:00";

	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts = [];
	if (hrs > 0) parts.push(hrs.toString().padStart(2, "0"));
	parts.push(mins.toString().padStart(2, "0"));
	parts.push(secs.toString().padStart(2, "0"));

	return parts.join(":");
}

export function formatFileSize(size: number): string {
	if (size < 1024) return `${size}B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`;
	return `${(size / (1024 * 1024)).toFixed(2)}MB`;
}

export function foramtBitrate(bitrate: number): string {
	return `${bitrate / 1000} kbps`;
}

export function isEnWord(str: string) {
	return /^[A-Za-z'-]+$/.test(str);
}

export function formateDate(timestamp: number) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString();
	const day = date.getDate().toString();

	return `${year} 年 ${month} 月 ${day} 日`;
}

export async function getCropppedImg(imageSrc: string, pixelCrop: Area) {
	const image = new Image();
	image.src = imageSrc;

	await new Promise((resolve) => (image.onload = resolve));

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	ctx?.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		pixelCrop.width,
		pixelCrop.height,
	);

	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			resolve(blob);
		}, "image/jpeg");
	});
}

export function GetThumbnail(url: string, w: number = 200, h?: number) {
	if (url.startsWith("data:")) return url;

	return `${url}?param=${w}y${h ? h : w}`;
}
