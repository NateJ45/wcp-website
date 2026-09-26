import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../brand';
import {clamp01, shake} from '../motion';
import {Doodle} from './Doodle';
import {Placed} from './Placed';

// One huge word slammed onto the page: it drops from ~2.3x in four frames,
// the frame shakes on impact, and a ring of marker "impact" strokes flicks out.
export const SlamText: React.FC<{
	text: string;
	x: number;
	y: number;
	size: number;
	color?: string;
	rotate?: number;
	at?: number; // frame of impact
	burst?: boolean;
	burstColor?: string;
}> = ({text, x, y, size, color = COLORS.navy, rotate = 0, at = 4, burst = true, burstColor = COLORS.white}) => {
	const frame = useCurrentFrame();
	const t0 = at - 4;
	const scale = interpolate(frame, [t0, at], [2.3, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.cubic),
	});
	const opacity = clamp01((frame - t0 + 1) / 2);
	const s = shake(frame, at, 34, 12, `slam-${text}`);
	const burstP = clamp01((frame - at) / 5);
	const burstFade = 1 - clamp01((frame - at - 8) / 8);
	// a tiny squash on impact
	const squash = frame >= at && frame < at + 4 ? 1 - 0.05 * Math.sin(((frame - at) / 4) * Math.PI) : 1;
	return (
		<>
			{burst && frame >= at ? (
				<Placed x={x + s.x} y={y + s.y} rotate={rotate} opacity={burstFade}>
					<Doodle kind="burst" width={size * 2.6} height={size * 1.7} progress={burstP} color={burstColor} strokeWidth={13} seed={`burst-${text}`} />
				</Placed>
			) : null}
			<Placed x={x + s.x} y={y + s.y} scale={scale} rotate={rotate + s.r} opacity={opacity}>
				<div
					style={{
						fontFamily: FONTS.display,
						fontSize: size,
						lineHeight: 1,
						color,
						whiteSpace: 'pre',
						transform: `scale(${1 / squash}, ${squash})`,
						textShadow: '0 10px 0 rgba(0,0,0,0.10)',
					}}
				>
					{text}
				</div>
			</Placed>
		</>
	);
};
