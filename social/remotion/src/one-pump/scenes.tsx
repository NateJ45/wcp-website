// One Pump, beat by beat. Same beats, captions, timings and blur sources as
// social/reels/2026-09-25-one-pump/reel.py. Rotations here are CSS degrees
// (clockwise-positive), i.e. the NEGATIVE of reel.py's PIL angles.
import React from 'react';
import {Freeze, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../brand';
import {Captions} from '../components/Caption';
import {Doodle} from '../components/Doodle';
import {PaperBackground} from '../components/PaperBackground';
import {Placed} from '../components/Placed';
import {PrintCard} from '../components/PrintCard';
import {SlamText} from '../components/SlamText';
import {StampText} from '../components/StampText';
import {Sticker} from '../components/Sticker';
import {clamp01, easeInOut, FPS, popIn, ramp, sec, shake, THUD} from '../motion';
import type {ReelTimeline} from './timeline';

// ---------------------------------------------------------------- hook + dialogue
export const VideoScene: React.FC<{tl: ReelTimeline}> = ({tl}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const vEnd = tl.video.duration;
	const lastFrame = Math.floor(vEnd * FPS) - 1;
	const frozen = frame > lastFrame;
	const lt = t - vEnd; // time into the freeze
	const zoom = frozen ? 1 + 0.06 * easeInOut(lt / 1.15) : 1;
	const tilt = frozen ? 2 + 1.2 * easeInOut(lt / 0.5) : 2;
	// shutter blink on the freeze so the pause reads as deliberate
	const blink = frozen ? 1 - clamp01((frame - lastFrame - 1) / 5) : 0;
	const underline = ramp(frame, sec(0.25), sec(0.75));
	const drumDelay = Math.ceil(vEnd * FPS) + sec(0.1);
	const drumWobble = frame > drumDelay ? Math.sin((frame - drumDelay) * 1.9) * Math.min(3, (frame - drumDelay) * 0.12) : 0;
	return (
		<>
			<PaperBackground color={COLORS.sky} seed={2} doodles="light" />
			<Placed x={554} y={1010} scale={zoom} rotate={tilt}>
				<PrintCard width={1000} height={563} border={18} bottom={18} tape="corners" tapeSeed={1}>
					<Freeze frame={lastFrame} active={frozen}>
						<OffthreadVideo src={staticFile(tl.video.src)} muted style={{width: 1000, height: 563, display: 'block'}} />
					</Freeze>
					<div style={{position: 'absolute', inset: 0, background: 'white', opacity: blink * 0.55}} />
				</PrintCard>
			</Placed>
			{/* header: visible from frame 0 so the hook is there on the first frame */}
			<Placed x={540} y={330} rotate={-3}>
				<div
					style={{
						fontFamily: FONTS.display,
						fontSize: 44,
						color: COLORS.white,
						background: COLORS.navy,
						padding: '12px 26px',
						borderRadius: 16,
						boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
					}}
				>
					PRE-K PM
				</div>
			</Placed>
			<Placed x={540} y={452}>
				<div style={{fontFamily: FONTS.display, fontSize: 100, color: COLORS.navy, whiteSpace: 'pre', textShadow: '0 5px 0 rgba(0,0,0,0.08)'}}>Hand-washing 101</div>
			</Placed>
			<Placed x={540} y={552}>
				<div style={{fontFamily: FONTS.displayRegular, fontSize: 50, color: COLORS.navy, whiteSpace: 'pre'}}>(harder than it looks)</div>
			</Placed>
			<Placed x={560} y={592} rotate={-1}>
				<Doodle kind="underline" width={560} height={40} progress={underline} color={COLORS.amber} strokeWidth={9} seed="hook-u" />
			</Placed>
			{/* the kids' shout */}
			<Sticker text="NO!" size={130} fg={COLORS.navy} bg={COLORS.amber} padX={40} padY={18} x={210} y={740} rotate={8} delay={sec(2.35)} from="left" exitAt={sec(3.7)} />
			<Captions cues={tl.captions} y={1420} maxEnd={tl.segments[1].end} />
			<Sticker text="drumroll please..." size={56} fg={COLORS.navy} bg={COLORS.amber} x={700} y={1560} rotate={-5 + drumWobble} delay={drumDelay} />
		</>
	);
};

// ---------------------------------------------------------------- ONE.
export const OneScene: React.FC = () => {
	const frame = useCurrentFrame();
	const sub = popIn(frame, sec(0.45));
	const s = shake(frame, 3, 34, 12, 'slam-ONE.');
	return (
		<>
			<PaperBackground color={COLORS.amber} seed={3} />
			<SlamText text="ONE." x={540} y={880} size={360} rotate={4} at={3} burstColor={COLORS.white} />
			<Placed x={540 + s.x} y={1230 + s.y} scale={interpolate(sub, [0, 1], [0.3, 1])} rotate={-2} opacity={clamp01(sub * 3)}>
				<div style={{fontFamily: FONTS.display, fontSize: 86, color: COLORS.navy, whiteSpace: 'pre'}}>pump. just one.</div>
			</Placed>
		</>
	);
};

// ---------------------------------------------------------------- One pump (photo)
const CARD_W = 800;
const CARD_H = 1067;
const CARD_Y = 1140;

const useCardDrop = (frame: number) => {
	const p = spring({frame, fps: FPS, config: THUD});
	return {y: CARD_Y - 170 * (1 - p), opacity: clamp01(p * 2.5), rot: (1 - p) * 4};
};

export const PumpPhotoScene: React.FC<{tl: ReelTimeline}> = ({tl}) => {
	const frame = useCurrentFrame();
	const lt = frame / FPS;
	const drop = useCardDrop(frame);
	const k = easeInOut(lt / 2.8);
	const circle = ramp(frame, sec(0.75), sec(1.2));
	return (
		<>
			<PaperBackground color={COLORS.sky} seed={4} doodles="light" />
			<Placed x={540} y={drop.y} rotate={3 + drop.rot} opacity={drop.opacity}>
				<PrintCard
					width={CARD_W}
					height={CARD_H}
					photo={tl.photos.IMG_9196}
					zoom={1 + 0.2 * k}
					fx={0.33 - 0.06 * k}
					fy={0.5 + 0.05 * k}
					tape="top"
					tapeSeed={2}
					overlay={
						// circle the pump + hands (source-image percent box)
						<div style={{position: 'absolute', left: '2%', top: '49%', width: '30%', height: '26%'}}>
							<Doodle kind="circle" width={300} height={260} progress={circle} color={COLORS.amber} strokeWidth={12} seed="pump-c" fluid />
						</div>
					}
				/>
			</Placed>
			<Sticker text="One pump." size={108} x={540} y={400} rotate={3} delay={sec(0.2)} />
			<Sticker text="pumps used: 1 of 1" size={52} check x={650} y={1560} rotate={-4} delay={sec(1.2)} />
		</>
	);
};

// ---------------------------------------------------------------- The whole class, supervising -> the book
export const BookScene: React.FC<{tl: ReelTimeline}> = ({tl}) => {
	const frame = useCurrentFrame();
	const lt = frame / FPS;
	const drop = useCardDrop(frame);
	const k = easeInOut((lt - 1.4) / 0.9);
	const zoom = 1 + 0.04 * clamp01(lt / 1.4) + 2.1 * k;
	const fx = 0.5 + (0.675 - 0.5) * k;
	const fy = 0.5 + (0.135 - 0.5) * k;
	const circle = ramp(frame, sec(2.35), sec(2.8));
	return (
		<>
			<PaperBackground color={COLORS.sky} seed={5} doodles="light" />
			<Placed x={540} y={drop.y} rotate={-2.5 - drop.rot} opacity={drop.opacity}>
				<PrintCard
					width={CARD_W}
					height={CARD_H}
					photo={tl.photos.IMG_9195}
					zoom={zoom}
					fx={fx}
					fy={fy}
					tape="corners"
					tapeSeed={3}
					overlay={
						<div style={{position: 'absolute', left: '60%', top: '8.5%', width: '22%', height: '15%'}}>
							<Doodle kind="circle" width={693} height={630} progress={circle} color={COLORS.orange} strokeWidth={13} seed="book-c" fluid />
						</div>
					}
				/>
			</Placed>
			<Sticker text={'The whole class,\nsupervising.'} size={78} x={540} y={420} rotate={2} delay={sec(0.2)} exitAt={sec(1.5)} />
			<Sticker text="Required reading:" size={78} bg={COLORS.amber} x={540} y={420} rotate={2} delay={sec(1.95)} from="left" />
		</>
	);
};

// ---------------------------------------------------------------- the counter
const CN_SEQ: Array<[number, string]> = [
	[0.25, '1'], [0.55, '2'], [0.8, '3'], [1.0, '5'], [1.15, '8'], [1.28, '12'], [1.4, '20'], [1.5, '35'], [1.6, '60'], [1.72, '99+'],
];
export const COUNTER_TICKS = CN_SEQ.map(([t]) => t);

export const CounterScene: React.FC = () => {
	const frame = useCurrentFrame();
	const lt = frame / FPS;
	const stampAt = sec(2.0);
	const s = shake(frame, stampAt, 30, 12, 'stamp');
	let cur: [number, string] | null = null;
	for (const c of CN_SEQ) {
		if (lt >= c[0]) {
			cur = c;
		}
	}
	const scribble = ramp(frame, sec(2.4), sec(2.75));
	return (
		<>
			<PaperBackground color={COLORS.navy} seed={6} doodles="dark" />
			<div style={{position: 'absolute', inset: 0, transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r * 0.4}deg)`}}>
				<Placed x={540} y={520}>
					<div style={{fontFamily: FONTS.display, fontSize: 92, color: COLORS.white, textAlign: 'center', lineHeight: 1.12, whiteSpace: 'pre'}}>
						{'Pumps our friends\nwanted:'}
					</div>
				</Placed>
				{cur ? <CounterNumber key={cur[1]} value={cur[1]} startFrame={sec(cur[0])} /> : null}
				<Placed x={540} y={940} rotate={-3}>
					<Doodle kind="strike" width={560} height={250} progress={scribble} color={COLORS.orange} strokeWidth={16} seed="cross" />
				</Placed>
				{frame >= stampAt - 5 ? <StampText text="PUMPS ALLOWED: 1" x={540} y={1330} size={84} rotate={8} at={stampAt} lead={5} /> : null}
			</div>
		</>
	);
};

const CounterNumber: React.FC<{value: string; startFrame: number}> = ({value, startFrame}) => {
	const frame = useCurrentFrame();
	const p = spring({frame: frame - startFrame, fps: FPS, config: {damping: 12, stiffness: 320, mass: 0.6}});
	const tilt = (random(`num-${value}`) * 2 - 1) * 5;
	const big = value === '99+';
	return (
		<Placed x={540} y={935} scale={interpolate(p, [0, 1], [0.7, 1])} rotate={tilt * (big ? 0.4 : 1)}>
			<div style={{fontFamily: FONTS.display, fontSize: 400, lineHeight: 1, color: COLORS.amber, whiteSpace: 'pre', textShadow: '0 12px 0 rgba(0,0,0,0.18)'}}>{value}</div>
		</Placed>
	);
};

// ---------------------------------------------------------------- montage
type MontItem = {stem: string; portrait: boolean; label: string; rot: number; dx: number; fx: number; fy: number};
const MONT: MontItem[] = [
	{stem: 'IMG_9245', portrait: true, label: 'play-doh', rot: 4, dx: -22, fx: 0.4, fy: 0.45},
	{stem: 'IMG_9203', portrait: true, label: 'painting', rot: -3.5, dx: 26, fx: 0.45, fy: 0.5},
	{stem: 'IMG_9204', portrait: false, label: 'race tracks', rot: 2.5, dx: -10, fx: 0.5, fy: 0.5},
	{stem: 'IMG_9237', portrait: false, label: 'dance party!', rot: -3, dx: 14, fx: 0.5, fy: 0.55},
];
export const MONT_STEP = 1.5;
export const MONT_FIRST = 0.25;

export const MontageScene: React.FC<{tl: ReelTimeline}> = ({tl}) => {
	const frame = useCurrentFrame();
	const head = popIn(frame, sec(0.05));
	return (
		<>
			<PaperBackground color={COLORS.cream} seed={7} doodles="light" />
			<Placed x={540} y={400} scale={interpolate(head, [0, 1], [0.5, 1])} opacity={clamp01(head * 3)}>
				<div style={{fontFamily: FONTS.display, fontSize: 100, color: COLORS.navy, textAlign: 'center', lineHeight: 1.12, whiteSpace: 'pre'}}>
					{'Clean hands,\nready for:'}
				</div>
			</Placed>
			{MONT.map((m, i) => {
				const st = sec(MONT_FIRST + i * MONT_STEP);
				if (frame < st) {
					return null;
				}
				const p = spring({frame: frame - st, fps: FPS, config: {damping: 13, stiffness: 150, mass: 0.9}});
				const w = m.portrait ? 760 : 920;
				const h = m.portrait ? 1013 : 690;
				const cy = m.portrait ? 1150 : 1110;
				const drift = ramp(frame, st, st + sec(2.5), (x) => x); // slow push-in while on top
				return (
					<Placed key={m.stem} x={540 + m.dx} y={cy - 900 * (1 - p)} rotate={m.rot - 12 * (1 - p)} z={i}>
						<PrintCard width={w} height={h} photo={tl.photos[m.stem]} zoom={1 + 0.05 * drift} fx={m.fx} fy={m.fy} tape={i % 2 ? 'top' : 'corners'} tapeSeed={i} />
					</Placed>
				);
			})}
			{MONT.map((m, i) => {
				const st = sec(MONT_FIRST + i * MONT_STEP);
				const last = i === MONT.length - 1;
				const cy = m.portrait ? 1150 : 1110;
				const ly = m.portrait ? 1600 : cy + 690 / 2 + 40;
				if (frame < st) {
					return null;
				}
				return (
					<div key={`l-${m.stem}`} style={{position: 'absolute', inset: 0, zIndex: 10}}>
						<Sticker text={m.label} size={70} check x={540 - m.dx * 2} y={ly} rotate={m.rot * 1.2} delay={st + sec(0.3)} from={i % 2 ? 'left' : 'right'} exitAt={last ? undefined : st + sec(MONT_STEP)} />
					</div>
				);
			})}
		</>
	);
};
