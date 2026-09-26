import React from 'react';
import {CalculateMetadataFunction, Composition} from 'remotion';
import {loadBrandFonts} from './brand';
import {FPS} from './motion';
import {OnePump, OnePumpProps} from './one-pump/OnePump';
import {CAROUSEL_FRAMES, OnePumpCarousel} from './one-pump/OnePumpCarousel';
import {loadTimeline, ReelTimeline} from './one-pump/timeline';

loadBrandFonts();

// Duration comes from timeline.json (exported by Python), so the reel always
// matches the media that was actually prepared.
const reelMetadata: CalculateMetadataFunction<OnePumpProps> = async ({props}) => {
	const tl = await loadTimeline();
	return {durationInFrames: Math.round(tl.total * FPS), props: {...props, tl}};
};

const carouselMetadata: CalculateMetadataFunction<{tl: ReelTimeline | null}> = async ({props}) => {
	const tl = await loadTimeline();
	return {props: {...props, tl}};
};

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="OnePump"
				component={OnePump}
				width={1080}
				height={1920}
				fps={FPS}
				durationInFrames={960}
				defaultProps={{tl: null, withMusic: true} as OnePumpProps}
				calculateMetadata={reelMetadata}
			/>
			<Composition
				id="OnePumpCarousel"
				component={OnePumpCarousel}
				width={1080}
				height={1350}
				fps={FPS}
				durationInFrames={CAROUSEL_FRAMES}
				defaultProps={{tl: null}}
				calculateMetadata={carouselMetadata}
			/>
		</>
	);
};
