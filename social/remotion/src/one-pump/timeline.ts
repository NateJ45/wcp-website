// Shape of public/timeline.json, written by
// social/reels/2026-09-25-one-pump/export_assets.py.
import {staticFile} from 'remotion';
import {FPS} from '../motion';
import type {CaptionCue} from '../components/Caption';
import type {PhotoRef} from '../components/PrintCard';

export type Segment = {name: string; start: number; end: number; duration: number};

export type ReelTimeline = {
	slug: string;
	fps: number;
	width: number;
	height: number;
	total: number;
	segments: Segment[];
	musicStart: number;
	video: {src: string; duration: number};
	captions: CaptionCue[];
	photos: Record<string, PhotoRef & {blurred: boolean}>;
	audio: {dialogue: string; music: string; sfx: Record<string, string>};
};

export const loadTimeline = async (): Promise<ReelTimeline> => {
	const res = await fetch(staticFile('timeline.json'));
	if (!res.ok) {
		throw new Error(`timeline.json not found in the public dir (${res.status}). Run export_assets.py and pass --public-dir.`);
	}
	return res.json();
};

/** Segment start/duration in frames, rounded the same way everywhere. */
export const segFrames = (tl: ReelTimeline, name: string) => {
	const s = tl.segments.find((x) => x.name === name);
	if (!s) {
		throw new Error(`no segment ${name}`);
	}
	const from = Math.round(s.start * FPS);
	return {from, dur: Math.round(s.end * FPS) - from, start: s.start};
};
