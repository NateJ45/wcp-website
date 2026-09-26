import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Confetti} from '../components/Confetti';
import {EndCard} from '../components/EndCard';
import {FPS, sec} from '../motion';
import {BookScene, CounterScene, COUNTER_TICKS, MONT_FIRST, MONT_STEP, MontageScene, OneScene, PumpPhotoScene, VideoScene} from './scenes';
import {ReelTimeline, segFrames} from './timeline';

export type OnePumpProps = {tl: ReelTimeline | null; withMusic: boolean};

// Mix levels mirror reelkit.build_audio (dialogue peak 0.9, sfx x0.8, music
// x0.9) with a common trim for headroom; loudness is normalized after render.
const TRIM = 0.62;
const LEVEL = {dialogue: 1.0 * TRIM, sfx: 0.8 * TRIM, music: 0.9 * TRIM};

type Cue = [number, string]; // seconds (absolute), sfx kind

/** The SFX schedule from reel.py, verbatim. */
export const sfxSchedule = (tl: ReelTimeline): Cue[] => {
	const s = (n: string) => tl.segments.find((x) => x.name === n)!.start;
	const out: Cue[] = [[2.38, 'pop']];
	out.push([s('freeze') + 0.1, 'pop'], [s('freeze') + 0.12, 'drumroll']);
	out.push([s('one'), 'slam'], [s('one') + 0.45, 'pop']);
	out.push([s('p1') + 0.2, 'pop'], [s('p1') + 1.2, 'ding']);
	out.push([s('p2') + 0.2, 'pop'], [s('p2') + 1.5, 'whoosh'], [s('p2') + 2.0, 'pop']);
	for (const t of COUNTER_TICKS) {
		out.push([s('counter') + t, 'tick']);
	}
	out.push([s('counter') + 2.0, 'stamp']);
	out.push([s('montage') + 0.05, 'pop']);
	for (let i = 0; i < 4; i++) {
		out.push([s('montage') + MONT_FIRST + i * MONT_STEP, 'whoosh']);
		out.push([s('montage') + 0.55 + i * MONT_STEP, i < 3 ? 'ding' : 'party']);
	}
	out.push([s('end') + 0.55, 'pop'], [s('end') + 1.0, 'pop']);
	return out;
};

const ConfettiLayer: React.FC = () => {
	const frame = useCurrentFrame();
	return <Confetti t={frame / FPS} />;
};

export const OnePump: React.FC<OnePumpProps> = ({tl, withMusic}) => {
	if (!tl) {
		return <AbsoluteFill style={{background: '#01457e'}} />;
	}
	const video = segFrames(tl, 'video');
	const freeze = segFrames(tl, 'freeze');
	const one = segFrames(tl, 'one');
	const p1 = segFrames(tl, 'p1');
	const p2 = segFrames(tl, 'p2');
	const counter = segFrames(tl, 'counter');
	const montage = segFrames(tl, 'montage');
	const end = segFrames(tl, 'end');
	const confettiFrom = montage.from + sec(MONT_FIRST + 3 * MONT_STEP + 0.2);
	return (
		<AbsoluteFill style={{backgroundColor: '#40aaed'}}>
			<Sequence from={video.from} durationInFrames={video.dur + freeze.dur} name="Hook + dialogue">
				<VideoScene tl={tl} />
			</Sequence>
			<Sequence from={one.from} durationInFrames={one.dur} name="ONE.">
				<OneScene />
			</Sequence>
			<Sequence from={p1.from} durationInFrames={p1.dur} name="One pump.">
				<PumpPhotoScene tl={tl} />
			</Sequence>
			<Sequence from={p2.from} durationInFrames={p2.dur} name="Required reading">
				<BookScene tl={tl} />
			</Sequence>
			<Sequence from={counter.from} durationInFrames={counter.dur} name="Counter">
				<CounterScene />
			</Sequence>
			<Sequence from={montage.from} durationInFrames={montage.dur} name="Montage">
				<MontageScene tl={tl} />
			</Sequence>
			<Sequence from={end.from} name="End card">
				<EndCard signoff="Wash well, friends." from="Love, Pre-K PM" />
			</Sequence>
			<Sequence from={confettiFrom} name="Confetti">
				<ConfettiLayer />
			</Sequence>

			{/* ---- audio ---- */}
			<Html5Audio src={staticFile(tl.audio.dialogue)} volume={LEVEL.dialogue} />
			{sfxSchedule(tl).map(([t, kind], i) => (
				<Sequence key={`sfx-${i}`} from={Math.round(t * FPS)} name={`sfx ${kind}`} layout="none">
					<Html5Audio src={staticFile(tl.audio.sfx[kind])} volume={LEVEL.sfx} />
				</Sequence>
			))}
			{withMusic ? (
				<Sequence from={Math.round(tl.musicStart * FPS)} name="music" layout="none">
					<Html5Audio src={staticFile(tl.audio.music)} volume={LEVEL.music} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};
