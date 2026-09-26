import React from 'react';
import {AbsoluteFill} from 'remotion';

// The site's faint classroom doodles (globals.css --wcp-doodles): sun, star,
// crayon, block, heart, squiggle, dots, moon. Stroke colour is set per use.
const DOODLES = (stroke: string, opacity: number) =>
	`url("data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340' fill='none' stroke='${stroke}' stroke-opacity='${opacity}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='42' cy='48' r='11'/><path d='M42 26v-7M42 77v-7M64 48h7M13 48h7M58 32l5-5M21 69l5-5M58 64l5 5M21 27l5 5'/><path d='M160 22l4.5 9.5 10.5 1.2-7.8 7.2 2.1 10.3-9.3-5.2-9.3 5.2 2.1-10.3-7.8-7.2 10.5-1.2z'/><g transform='rotate(32 262 78)'><rect x='255' y='58' width='14' height='34' rx='3'/><path d='M255 58l7-12 7 12'/></g><rect x='44' y='158' width='27' height='27' rx='4'/><rect x='52' y='166' width='11' height='11' rx='2'/><path d='M168 200c-6-7-17-4-17 4 0 7 9 12 17 18 8-6 17-11 17-18 0-8-11-11-17-4z'/><path d='M234 226q9-9 18 0t18 0'/><circle cx='92' cy='272' r='4'/><circle cx='109' cy='266' r='4'/><circle cx='124' cy='276' r='4'/><path d='M292 300a13 13 0 1 0 4 24 11 11 0 0 1-4-24z'/></svg>`,
	)}")`;

export const PaperBackground: React.FC<{
	color: string;
	/** Changes the grain pattern so consecutive scenes don't share one sheet. */
	seed?: number;
	/** Faint doodle wallpaper, like the website's section backgrounds. */
	doodles?: 'light' | 'dark' | false;
	/** Slow drift of the doodle layer, in px per frame (0 = still). */
	drift?: number;
	frame?: number;
}> = ({color, seed = 1, doodles = false, drift = 0, frame = 0}) => {
	const id = `paper-${seed}`;
	return (
		<AbsoluteFill style={{backgroundColor: color, overflow: 'hidden'}}>
			{doodles ? (
				<AbsoluteFill
					style={{
						backgroundImage: DOODLES(doodles === 'dark' ? '#ffffff' : '#01457E', doodles === 'dark' ? 0.07 : 0.08),
						backgroundSize: '420px 420px',
						backgroundPosition: `${(seed * 97) % 420}px ${((seed * 53) % 420) - frame * drift}px`,
					}}
				/>
			) : null}
			{/* paper grain: coarse fibre blotches + fine tooth, fixed seed per sheet */}
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
				<filter id={`${id}-coarse`} x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={3} seed={seed} />
					<feColorMatrix type="saturate" values="0" />
					<feComponentTransfer>
						<feFuncA type="table" tableValues="0 0.10" />
					</feComponentTransfer>
				</filter>
				<filter id={`${id}-fine`} x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed + 11} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
					<feComponentTransfer>
						<feFuncA type="table" tableValues="0 0.16" />
					</feComponentTransfer>
				</filter>
				<rect width="100%" height="100%" filter={`url(#${id}-coarse)`} style={{mixBlendMode: 'multiply'}} />
				<rect width="100%" height="100%" filter={`url(#${id}-fine)`} style={{mixBlendMode: 'overlay'}} />
			</svg>
			{/* soft vignette, like light falling on a table */}
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse 75% 60% at 50% 48%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.16) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};
