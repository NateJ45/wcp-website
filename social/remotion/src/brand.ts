// WCP brand tokens for video. Mirrors site/src/styles/globals.css (the
// --color-* and --font-* tokens) and reelkit.py's palette + CLASS_COLORS.
import {continueRender, delayRender, staticFile} from 'remotion';

export const COLORS = {
	navy: '#01457e', // --color-navy: text on light, big statements, end card
	sky: '#40aaed', // --color-sky: Pre-K PM
	orange: '#ff8c00', // --color-orange: Pre-K AM, stamps
	amber: '#ffa334', // --color-amber / --color-sunshine: Twos, highlight stickers
	green: '#22c55e', // --color-green: Threes
	greenInk: '#0e7b2e', // --color-green-ink: check marks
	cream: '#fff6e6', // reelkit CREAM (site --color-cream is #fff4e0)
	white: '#ffffff',
	paperWhite: '#fdfcf8', // print-card border
	ink: '#1a1a1a',
} as const;

export const CLASS_COLORS = {
	twos: COLORS.amber,
	threes: COLORS.green,
	'prek-am': COLORS.orange,
	'prek-pm': COLORS.sky,
	summer: COLORS.navy,
} as const;

export type ClassKey = keyof typeof CLASS_COLORS;

// Captain Comic renders as all caps. Quicksand is the site's body face; used
// here only for small print where caps would shout.
export const FONTS = {
	display: '"Captain Comic", system-ui, sans-serif',
	displayRegular: '"Captain Comic Regular", system-ui, sans-serif',
	body: '"Quicksand", system-ui, sans-serif',
} as const;

// Platform UI covers the top ~220 px and bottom ~300 px of a 1080x1920 reel.
export const SAFE = {top: 220, bottom: 300} as const;

const FONT_FILES: Array<[string, string, string]> = [
	['Captain Comic', 'fonts/captain-comic-bold.woff2', '700'],
	['Captain Comic Regular', 'fonts/captain-comic-regular.woff2', '400'],
	['Quicksand', 'fonts/quicksand-latin-wght-normal.woff2', '300 700'],
];

let fontsRequested = false;
// Load the brand faces from the public dir and hold the render until they are
// ready, so frame 0 never shows a fallback font.
export const loadBrandFonts = () => {
	if (fontsRequested || typeof document === 'undefined') {
		return;
	}
	fontsRequested = true;
	const handle = delayRender('Loading brand fonts');
	Promise.all(
		FONT_FILES.map(([family, file, weight]) => {
			const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {weight});
			return face.load().then((f) => {
				(document.fonts as unknown as {add: (f: FontFace) => void}).add(f);
			});
		}),
	)
		.then(() => continueRender(handle))
		.catch((err) => {
			// Quicksand is optional; Captain Comic is not.
			console.error('font load failed', err);
			continueRender(handle);
		});
};
