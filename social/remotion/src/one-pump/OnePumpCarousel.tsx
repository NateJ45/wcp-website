// The same joke as five Instagram feed slides (1080x1350). Each frame of this
// composition is one slide: `npx remotion still OnePumpCarousel --frame=N`.
// Everything is frozen at a settled moment, so the stills use the exact same
// components as the reel with their animations finished.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../brand';
import {Doodle} from '../components/Doodle';
import {PaperBackground} from '../components/PaperBackground';
import {Placed} from '../components/Placed';
import {PrintCard} from '../components/PrintCard';
import {StampText} from '../components/StampText';
import {Sticker} from '../components/Sticker';
import type {ReelTimeline} from './timeline';

export const CAROUSEL_SLIDES = 5;
const SETTLED = 200; // any frame after every entrance has finished
// Freeze clamps to the composition's length, so the composition must be longer
// than SETTLED. Frames 0-4 are the slides; later frames just repeat slide 5.
export const CAROUSEL_FRAMES = 250;

const Heading: React.FC<{text: string; x?: number; y: number; size: number; color: string; rotate?: number; regular?: boolean}> = ({text, x = 540, y, size, color, rotate = 0, regular}) => (
	<Placed x={x} y={y} rotate={rotate}>
		<div style={{fontFamily: regular ? FONTS.displayRegular : FONTS.display, fontSize: size, color, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'pre'}}>{text}</div>
	</Placed>
);

const SwipeHint: React.FC<{color?: string}> = ({color = COLORS.white}) => (
	<>
		<Heading text="swipe" x={880} y={1250} size={40} color={color} rotate={-6} regular />
		<Placed x={985} y={1232} rotate={-18}>
			<Doodle kind="arrow" width={90} height={70} progress={1} color={color} strokeWidth={8} seed="swipe" />
		</Placed>
	</>
);

const Slide1: React.FC<{tl: ReelTimeline}> = ({tl}) => (
	<>
		<PaperBackground color={COLORS.sky} seed={2} doodles="light" />
		<Placed x={540} y={120} rotate={-3}>
			<div style={{fontFamily: FONTS.display, fontSize: 40, color: COLORS.white, background: COLORS.navy, padding: '10px 24px', borderRadius: 14, boxShadow: '0 6px 12px rgba(0,0,0,0.25)'}}>PRE-K PM</div>
		</Placed>
		<Heading text="Hand-washing 101" y={228} size={96} color={COLORS.navy} />
		<Heading text="(harder than it looks)" y={322} size={48} color={COLORS.navy} regular />
		<Placed x={560} y={360} rotate={-1}>
			<Doodle kind="underline" width={540} height={40} progress={1} color={COLORS.amber} strokeWidth={9} seed="hook-u" />
		</Placed>
		<Placed x={548} y={715} rotate={2}>
			<PrintCard width={960} height={540} border={18} bottom={18} tape="corners" tapeSeed={1}>
				<Freeze frame={Math.round(7.6 * 30)}>
					<OffthreadVideo src={staticFile(tl.video.src)} muted style={{width: 960, height: 540, display: 'block'}} />
				</Freeze>
			</PrintCard>
		</Placed>
		<Sticker text="So... how many times?" size={62} x={540} y={1090} rotate={-1.5} />
		<SwipeHint />
	</>
);

const Slide2: React.FC = () => (
	<>
		<PaperBackground color={COLORS.amber} seed={3} />
		<Placed x={540} y={590} rotate={4}>
			<Doodle kind="burst" width={936} height={612} progress={1} color={COLORS.white} strokeWidth={13} seed="burst-ONE." />
		</Placed>
		<Placed x={540} y={590} rotate={4}>
			<div style={{fontFamily: FONTS.display, fontSize: 360, lineHeight: 1, color: COLORS.navy, textShadow: '0 10px 0 rgba(0,0,0,0.10)'}}>ONE.</div>
		</Placed>
		<Heading text="pump. just one." y={960} size={86} color={COLORS.navy} rotate={-2} />
		<SwipeHint color={COLORS.navy} />
	</>
);

const Slide3: React.FC<{tl: ReelTimeline}> = ({tl}) => (
	<>
		<PaperBackground color={COLORS.sky} seed={4} doodles="light" />
		<Placed x={540} y={745} rotate={3}>
			<PrintCard
				width={660}
				height={880}
				photo={tl.photos.IMG_9196}
				zoom={1.2}
				fx={0.27}
				fy={0.55}
				tape="top"
				tapeSeed={2}
				overlay={
					<div style={{position: 'absolute', left: '2%', top: '49%', width: '30%', height: '26%'}}>
						<Doodle kind="circle" width={300} height={260} progress={1} color={COLORS.amber} strokeWidth={11} seed="pump-c" fluid />
					</div>
				}
			/>
		</Placed>
		<Sticker text="One pump." size={100} x={540} y={165} rotate={3} />
		<Sticker text="pumps used: 1 of 1" size={48} check x={660} y={1160} rotate={-4} />
	</>
);

const Slide4: React.FC<{tl: ReelTimeline}> = ({tl}) => (
	<>
		<PaperBackground color={COLORS.sky} seed={5} doodles="light" />
		<Placed x={540} y={760} rotate={-2.5}>
			<PrintCard
				width={660}
				height={880}
				photo={tl.photos.IMG_9195}
				zoom={3.14}
				fx={0.675}
				fy={0.135}
				tape="corners"
				tapeSeed={3}
				overlay={
					<div style={{position: 'absolute', left: '60%', top: '8.5%', width: '22%', height: '15%'}}>
						<Doodle kind="circle" width={693} height={630} progress={1} color={COLORS.orange} strokeWidth={12} seed="book-c" fluid />
					</div>
				}
			/>
		</Placed>
		<Sticker text="The whole class, supervising." size={46} x={540} y={112} rotate={-1.5} />
		<Sticker text="Required reading:" size={74} bg={COLORS.amber} x={540} y={218} rotate={2} />
	</>
);

const Slide5: React.FC = () => (
	<>
		<PaperBackground color={COLORS.navy} seed={6} doodles="dark" />
		<Heading text={'Pumps our friends\nwanted:'} y={185} size={80} color={COLORS.white} />
		<Placed x={540} y={480} rotate={-3}>
			<div style={{fontFamily: FONTS.display, fontSize: 330, lineHeight: 1, color: COLORS.amber, textShadow: '0 12px 0 rgba(0,0,0,0.18)'}}>99+</div>
		</Placed>
		<Placed x={540} y={485} rotate={-3}>
			<Doodle kind="strike" width={500} height={220} progress={1} color={COLORS.orange} strokeWidth={15} seed="cross" />
		</Placed>
		<StampText text="PUMPS ALLOWED: 1" x={540} y={790} size={76} rotate={8} at={0} />
		<Placed x={540} y={1020}>
			<Img src={staticFile('brand/wcp-logo-white.png')} style={{width: 350, display: 'block'}} />
		</Placed>
		<Heading text="Wash well, friends." y={1185} size={60} color={COLORS.amber} rotate={2} />
		<Heading text="Love, Pre-K PM" y={1250} size={42} color={COLORS.white} regular />
	</>
);

export const OnePumpCarousel: React.FC<{tl: ReelTimeline | null}> = ({tl}) => {
	const slide = useCurrentFrame();
	if (!tl) {
		return <AbsoluteFill style={{background: COLORS.navy}} />;
	}
	const slides = [<Slide1 tl={tl} />, <Slide2 />, <Slide3 tl={tl} />, <Slide4 tl={tl} />, <Slide5 />];
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Freeze frame={SETTLED}>{slides[Math.min(slide, slides.length - 1)]}</Freeze>
		</AbsoluteFill>
	);
};
