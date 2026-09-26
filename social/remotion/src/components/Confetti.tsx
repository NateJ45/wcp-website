import React, {useMemo} from 'react';
import {AbsoluteFill, random} from 'remotion';
import {COLORS} from '../brand';
import {FPS} from '../motion';

const PALETTE = [COLORS.orange, COLORS.amber, COLORS.sky, COLORS.green, COLORS.white, '#ec4899'];

// Paper confetti. Seeded, and a pure function of time, so it is identical in
// preview, stills and render. Each piece flips in 3D (scaleY by cos) and
// flutters sideways, which is what separates paper from glitter.
export const Confetti: React.FC<{
	t: number; // seconds since the drop started (may be negative)
	count?: number;
	seed?: string;
	width?: number;
	height?: number;
}> = ({t, count = 140, seed = 'confetti', width = 1080, height = 1920}) => {
	const pieces = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => {
				const r = (k: string) => random(`${seed}-${k}-${i}`);
				return {
					x: r('x') * width,
					y: -40 - r('y') * 1900,
					vy: 380 + r('vy') * 320,
					vx: -60 + r('vx') * 120,
					rot: r('r') * 360,
					vr: -400 + r('vr') * 800,
					flip: 4 + r('f') * 8,
					phase: r('p') * Math.PI * 2,
					c: PALETTE[Math.floor(r('c') * PALETTE.length)],
					w: 14 + r('w') * 12,
					h: 8 + r('h') * 6,
				};
			}),
		[count, seed, width],
	);
	if (t <= 0) {
		return null;
	}
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{pieces.map((p, i) => {
				const y = p.y + p.vy * t;
				if (y < -40 || y > height + 40) {
					return null;
				}
				const x = p.x + p.vx * t + 30 * Math.sin(t * 3 + p.rot);
				const flip = Math.cos(t * p.flip + p.phase);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: p.w,
							height: p.h,
							background: p.c,
							borderRadius: 2,
							transform: `translate(-50%, -50%) rotate(${p.rot + p.vr * t}deg) scaleY(${flip.toFixed(3)})`,
							filter: `brightness(${(0.82 + 0.18 * Math.abs(flip)).toFixed(3)})`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

export const confettiT = (frame: number, startFrame: number) => (frame - startFrame) / FPS;
