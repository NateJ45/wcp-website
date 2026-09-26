import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../brand';
import {clamp01} from '../motion';
import {Placed} from './Placed';

// Uneven ink: a turbulence mask knocks small holes out of the stamp so it
// reads as rubber on paper rather than a vector box.
const INK_MASK = `url("data:image/svg+xml,${encodeURIComponent(
	"<svg xmlns='http://www.w3.org/2000/svg' width='600' height='260'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.06' numOctaves='3' seed='4'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>",
)}")`;

// A rubber stamp: comes down from ~1.9x, lands hard at `at`, slightly rotated.
export const StampText: React.FC<{
	text: string;
	x: number;
	y: number;
	size?: number;
	color?: string;
	rotate?: number;
	at: number; // frame of impact
	lead?: number; // frames of travel before impact
}> = ({text, x, y, size = 84, color = COLORS.orange, rotate = 8, at, lead = 5}) => {
	const frame = useCurrentFrame();
	const scale = interpolate(frame, [at - lead, at], [1.9, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.quad),
	});
	const opacity = clamp01((frame - (at - lead)) / 2);
	// ink "spreads" a touch right after impact
	const spread = frame >= at ? 1 + 0.015 * clamp01((frame - at) / 3) : 1;
	return (
		<Placed x={x} y={y} scale={scale * spread} rotate={rotate} opacity={opacity * 0.94}>
			<div
				style={{
					padding: '18px 40px',
					border: `14px solid ${color}`,
					borderRadius: 26,
					fontFamily: FONTS.display,
					fontSize: size,
					lineHeight: 1.1,
					color,
					whiteSpace: 'pre',
					WebkitMaskImage: INK_MASK,
					maskImage: INK_MASK,
					WebkitMaskSize: 'cover',
					maskSize: 'cover',
				}}
			>
				{text}
			</div>
		</Placed>
	);
};
