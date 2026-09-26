// Shared, deterministic motion helpers. Everything is a pure function of the
// frame number so the Studio preview, a still, and the final render agree.
import {Easing, interpolate, random, spring, SpringConfig} from 'remotion';

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

// A sticker "slap": fast, one small overshoot, settles in ~0.35 s.
export const SLAP: Partial<SpringConfig> = {damping: 11, stiffness: 190, mass: 0.7};
// A heavy object landing (print cards, slams).
export const THUD: Partial<SpringConfig> = {damping: 15, stiffness: 230, mass: 1};
// Soft drift, no overshoot.
export const SOFT: Partial<SpringConfig> = {damping: 200, stiffness: 80, mass: 1};

export const popIn = (frame: number, delay: number, config: Partial<SpringConfig> = SLAP) =>
	spring({frame: frame - delay, fps: FPS, config});

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const easeInOut = (x: number) => {
	const t = clamp01(x);
	return 3 * t * t - 2 * t * t * t; // same smoothstep as reelkit.ease_in_out
};

export const ramp = (frame: number, from: number, to: number, easing = Easing.bezier(0.33, 0, 0.2, 1)) =>
	interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

// Decaying camera shake, seeded so every render is identical.
export const shake = (frame: number, start: number, amp = 26, durFrames = 11, seed = 'shake') => {
	const t = frame - start;
	if (t < 0 || t > durFrames) {
		return {x: 0, y: 0, r: 0};
	}
	const k = Math.pow(1 - t / durFrames, 1.6);
	return {
		x: (random(`${seed}-x-${t}`) * 2 - 1) * amp * k,
		y: (random(`${seed}-y-${t}`) * 2 - 1) * amp * k,
		r: (random(`${seed}-r-${t}`) * 2 - 1) * 1.6 * k,
	};
};
