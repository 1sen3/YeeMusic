import React, { MouseEvent } from "react";

export interface ChromaGridItem {
	image?: string;
	title?: React.ReactNode;
	subtitle?: React.ReactNode;
	handle?: string | number;
	borderColor?: string;
	gradient?: string;
	url?: string;
	onClick?: (e: MouseEvent<Element>) => void;
}

export interface ChromaGridProps {
	items?: ChromaGridItem[];
	className?: string;
	radius?: number;
	columns?: number;
	rows?: number;
	itemsPerPage?: number;
	gap?: string;
	damping?: number;
	fadeOut?: number;
	ease?: string;
}

export const ChromaGrid: React.FC<ChromaGridProps>;
export default ChromaGrid;
