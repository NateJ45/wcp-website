import React from 'react';
import {Sequence} from 'remotion';
import {sec} from '../motion';
import {Sticker} from './Sticker';

export type CaptionCue = {start: number; end: number; text: string};

// Real dialogue on screen: each cue is a white sticker that rotates in and
// reveals its words in quick succession, then peels away as the next arrives.
export const Captions: React.FC<{
	cues: CaptionCue[];
	x?: number;
	y: number;
	size?: number;
	maxEnd?: number; // seconds; clamp open-ended cues
}> = ({cues, x = 540, y, size = 62, maxEnd}) => {
	return (
		<>
			{cues.map((c, i) => {
				const from = sec(c.start);
				const end = Math.min(c.end, maxEnd ?? c.end);
				const dur = Math.max(1, sec(end) - from);
				const tilt = i % 2 ? 1.2 : -1.5;
				return (
					<Sequence key={i} from={from} durationInFrames={dur} layout="none">
						<Sticker text={c.text} size={size} x={x} y={y} rotate={tilt} from={i % 2 ? 'left' : 'right'} wordStagger={2} />
					</Sequence>
				);
			})}
		</>
	);
};
