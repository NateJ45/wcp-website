import {evolvePath} from '@remotion/paths';
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../brand';
import {clamp01, popIn, ramp, SLAP} from '../motion';
import {Placed} from './Placed';

// A hand-drawn check: slightly uneven two-stroke tick.
const CHECK_PATH = 'M 4 30 C 10 34, 15 41, 20 48 C 28 30, 38 16, 54 4';

export const StickerFace: React.FC<{
	text: string;
	size: number;
	fg?: string;
	bg?: string;
	check?: boolean;
	checkProgress?: number;
	padX?: number;
	padY?: number;
	radius?: number;
	lift?: number; // 0 = pressed flat on the paper, 1 = held just above it
	weight?: 'bold' | 'regular';
	words?: number; // how many words are revealed (Infinity = all)
}> = ({text, size, fg = COLORS.navy, bg = COLORS.white, check = false, checkProgress = 1, padX = 34, padY = 20, radius = 22, lift = 0, weight = 'bold', words = Infinity}) => {
	const shadowY = 7 + lift * 22;
	const blur = 10 + lift * 26;
	const alpha = 0.3 - lift * 0.1;
	const cw = check ? size * 0.95 : 0;
	const {strokeDasharray, strokeDashoffset} = evolvePath(clamp01(checkProgress), CHECK_PATH);
	let wi = 0;
	return (
		<div
			style={{
				position: 'relative',
				display: 'inline-flex',
				alignItems: 'center',
				padding: `${padY}px ${padX}px ${padY}px ${padX + cw}px`,
				background: bg,
				borderRadius: radius,
				boxShadow: `0 ${shadowY}px ${blur}px rgba(0,0,0,${alpha}), 0 1px 0 rgba(0,0,0,0.06)`,
				whiteSpace: 'pre',
			}}
		>
			{check ? (
				<svg
					viewBox="0 0 58 52"
					style={{position: 'absolute', left: padX * 0.75, top: '50%', width: size * 0.72, height: size * 0.65, transform: 'translateY(-50%)', overflow: 'visible'}}
				>
					<path d={CHECK_PATH} fill="none" stroke={COLORS.greenInk} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
				</svg>
			) : null}
			<span
				style={{
					fontFamily: weight === 'bold' ? FONTS.display : FONTS.displayRegular,
					fontSize: size,
					lineHeight: 1.08,
					color: fg,
					textAlign: 'center',
					display: 'block',
				}}
			>
				{text.split('\n').map((line, li) => (
					<div key={li}>
						{line.split(' ').map((w, i) => {
							const shown = wi++ < words;
							return (
								<span key={i} style={{opacity: shown ? 1 : 0}}>
									{w}
									{i < line.split(' ').length - 1 ? ' ' : ''}
								</span>
							);
						})}
					</div>
				))}
			</span>
		</div>
	);
};

// A sticker slapped onto the paper: it arrives lifted and turned, rotates into
// place on a spring, and its shadow tightens as it presses down.
export const Sticker: React.FC<
	React.ComponentProps<typeof StickerFace> & {
		x: number;
		y: number;
		rotate?: number;
		delay?: number; // frames
		from?: 'left' | 'right';
		/** reveal words one at a time, n frames apart (0 = all at once) */
		wordStagger?: number;
		exitAt?: number; // frame at which the sticker peels away
	}
> = ({x, y, rotate = 0, delay = 0, from = 'right', wordStagger = 0, exitAt, ...face}) => {
	const frame = useCurrentFrame();
	const p = popIn(frame, delay, SLAP);
	const dir = from === 'right' ? 1 : -1;
	let scale = interpolate(p, [0, 1], [0.6, 1]);
	let rot = rotate + (1 - p) * 16 * dir;
	let opacity = clamp01((frame - delay) / 3);
	let lift = clamp01(1 - p) * 1.2 + (p > 1 ? 0 : 0);
	let ty = 0;
	if (exitAt !== undefined && frame >= exitAt) {
		const e = ramp(frame, exitAt, exitAt + 7);
		scale *= 1 + e * 0.08;
		rot += e * 10 * dir;
		ty = -e * 60;
		opacity *= 1 - e;
		lift = e;
	}
	const words = wordStagger > 0 ? Math.floor((frame - delay) / wordStagger) + 1 : Infinity;
	const checkProgress = ramp(frame, delay + 5, delay + 13);
	return (
		<Placed x={x} y={y + ty} scale={scale} rotate={rot} opacity={opacity}>
			<StickerFace {...face} lift={lift} words={words} checkProgress={checkProgress} />
		</Placed>
	);
};
