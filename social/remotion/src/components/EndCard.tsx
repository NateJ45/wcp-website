import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../brand';
import {clamp01, popIn, ramp, sec, THUD} from '../motion';
import {Doodle} from './Doodle';
import {PaperBackground} from './PaperBackground';
import {Placed} from './Placed';

// Navy paper, white logo, amber sign-off with a marker underline, "Love, <class>".
export const EndCard: React.FC<{
	signoff: string;
	from: string; // e.g. "Love, Pre-K PM"
	logoWidth?: number;
	logoY?: number;
	signY?: number;
	children?: React.ReactNode; // e.g. confetti on top
}> = ({signoff, from, logoWidth = 820, logoY = 820, signY = 1240, children}) => {
	const frame = useCurrentFrame();
	const logoP = popIn(frame, 0, THUD);
	const logoScale = interpolate(logoP, [0, 1], [0.85, 1]);
	const s1 = popIn(frame, sec(0.55));
	const s2 = popIn(frame, sec(1.0));
	const underline = ramp(frame, sec(0.8), sec(1.15));
	return (
		<>
			<PaperBackground color={COLORS.navy} seed={8} doodles="dark" />
			<Placed x={540} y={logoY} scale={logoScale} opacity={clamp01(frame / sec(0.3))}>
				<Img src={staticFile('brand/wcp-logo-white.png')} style={{width: logoWidth, display: 'block'}} />
			</Placed>
			<Placed x={540} y={signY} scale={interpolate(s1, [0, 1], [0.4, 1])} rotate={2} opacity={clamp01(s1 * 3)}>
				<div style={{fontFamily: FONTS.display, fontSize: 92, color: COLORS.amber, whiteSpace: 'pre', lineHeight: 1.05}}>{signoff}</div>
			</Placed>
			<Placed x={560} y={signY + 72} rotate={1}>
				<Doodle kind="underline" width={760} height={60} progress={underline} color={COLORS.white} strokeWidth={9} seed="end-u" />
			</Placed>
			<Placed x={540} y={signY + 160} scale={interpolate(s2, [0, 1], [0.4, 1])} opacity={clamp01(s2 * 3)}>
				<div style={{fontFamily: FONTS.displayRegular, fontSize: 62, color: COLORS.white, whiteSpace: 'pre'}}>{from}</div>
			</Placed>
			{children}
		</>
	);
};
