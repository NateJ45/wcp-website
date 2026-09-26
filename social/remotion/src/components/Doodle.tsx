import {evolvePath} from '@remotion/paths';
import React from 'react';
import {random} from 'remotion';
import {COLORS} from '../brand';
import {clamp01} from '../motion';

export type DoodleKind = 'circle' | 'underline' | 'scribble' | 'strike' | 'burst' | 'arrow';

const j = (seed: string, i: number, amt: number) => (random(`${seed}-${i}`) * 2 - 1) * amt;

// Build a marker path inside a w x h box. Every shape is a little uneven on
// purpose (seeded, so it is the same every render).
export const doodlePath = (kind: DoodleKind, w: number, h: number, seed = 'd'): string[] => {
	if (kind === 'circle') {
		// ~1.12 turns so the loop overshoots its start, like a real marker circle.
		const n = 72;
		const pts: string[] = [];
		for (let i = 0; i <= n; i++) {
			const t = (i / n) * Math.PI * 2 * 1.12 - Math.PI * 0.62;
			const wob = 1 + 0.035 * Math.sin(t * 3 + random(seed) * 6) + (i / n) * 0.06;
			const x = w / 2 + Math.cos(t) * (w / 2 - 8) * wob;
			const y = h / 2 + Math.sin(t) * (h / 2 - 8) * wob * (1 - (i / n) * 0.05);
			pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
		}
		return [pts.join(' ')];
	}
	if (kind === 'underline') {
		// a quick swoosh with a small return flick
		const y = h * 0.55;
		return [
			`M ${w * 0.02} ${y + j(seed, 1, 4)} C ${w * 0.3} ${y - h * 0.25}, ${w * 0.65} ${y + h * 0.18}, ${w * 0.97} ${y - h * 0.22} ` +
				`Q ${w * 0.85} ${y + h * 0.05}, ${w * 0.7} ${y + h * 0.3}`,
		];
	}
	if (kind === 'scribble') {
		// a zig-zag cross-out, drawn left to right
		const n = 9;
		const pts: string[] = [];
		for (let i = 0; i <= n; i++) {
			const x = (w * (i + 0.5)) / (n + 1) + j(seed, i, 10);
			const y = i % 2 ? h * 0.12 + j(seed, i + 40, 12) : h * 0.88 + j(seed, i + 80, 12);
			pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
		}
		return [pts.join(' ')];
	}
	if (kind === 'strike') {
		// two quick, slightly bowed slashes: crossed out, but still readable
		return [
			`M ${w * 0.04} ${h * 0.62 + j(seed, 1, 6)} Q ${w * 0.5} ${h * 0.5 + j(seed, 2, 10)}, ${w * 0.97} ${h * 0.34 + j(seed, 3, 6)}`,
			`M ${w * 0.08} ${h * 0.78 + j(seed, 4, 6)} Q ${w * 0.52} ${h * 0.64 + j(seed, 5, 10)}, ${w * 0.93} ${h * 0.5 + j(seed, 6, 6)}`,
		];
	}
	if (kind === 'burst') {
		// comic impact strokes radiating from the centre of the box
		const n = 12;
		const out: string[] = [];
		for (let i = 0; i < n; i++) {
			const a = (i / n) * Math.PI * 2 + j(seed, i, 0.12);
			const r0 = 0.78 + j(seed, i + 20, 0.05);
			const r1 = r0 + 0.14 + random(`${seed}-l-${i}`) * 0.08;
			const cx = w / 2;
			const cy = h / 2;
			out.push(
				`M ${(cx + Math.cos(a) * r0 * (w / 2)).toFixed(1)} ${(cy + Math.sin(a) * r0 * (h / 2)).toFixed(1)} L ${(cx + Math.cos(a) * r1 * (w / 2)).toFixed(1)} ${(cy + Math.sin(a) * r1 * (h / 2)).toFixed(1)}`,
			);
		}
		return out;
	}
	// arrow: curved shaft from bottom-left to top-right + head
	return [
		`M ${w * 0.04} ${h * 0.92} C ${w * 0.2} ${h * 0.4}, ${w * 0.55} ${h * 0.2}, ${w * 0.94} ${h * 0.12}`,
		`M ${w * 0.72} ${h * 0.02} L ${w * 0.95} ${h * 0.12} L ${w * 0.78} ${h * 0.32}`,
	];
};

// A marker doodle that draws itself as `progress` goes 0 -> 1. Multi-stroke
// shapes draw their strokes in sequence.
export const Doodle: React.FC<{
	kind: DoodleKind;
	width: number;
	height: number;
	progress: number;
	color?: string;
	strokeWidth?: number;
	seed?: string;
	style?: React.CSSProperties;
	/** keep stroke width constant when the svg is stretched (photo overlays) */
	fluid?: boolean;
}> = ({kind, width, height, progress, color = COLORS.orange, strokeWidth = 11, seed = 'd', style, fluid = false}) => {
	const paths = doodlePath(kind, width, height, seed);
	const n = paths.length;
	if (progress <= 0) {
		return null;
	}
	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			preserveAspectRatio={fluid ? 'none' : 'xMidYMid meet'}
			style={{overflow: 'visible', width: fluid ? '100%' : width, height: fluid ? '100%' : height, ...style}}
		>
			{paths.map((d, i) => {
				const local = clamp01(progress * n - i);
				const {strokeDasharray, strokeDashoffset} = evolvePath(local, d);
				return (
					<path
						key={i}
						d={d}
						fill="none"
						stroke={color}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeDasharray={strokeDasharray}
						strokeDashoffset={strokeDashoffset}
						vectorEffect={fluid ? 'non-scaling-stroke' : undefined}
						opacity={local > 0 ? 0.95 : 0}
					/>
				);
			})}
		</svg>
	);
};
