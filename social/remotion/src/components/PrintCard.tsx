import React from 'react';
import {Img, staticFile} from 'remotion';
import {COLORS} from '../brand';

export type PhotoRef = {src: string; w: number; h: number};

/** reelkit.kb_crop: crop box of the source for a given aspect, zoom (>=1) and focus point. */
export const kbCrop = (sw: number, sh: number, aspect: number, zoom: number, fx: number, fy: number) => {
	let cw: number;
	let ch: number;
	if (sw / sh > aspect) {
		ch = sh;
		cw = ch * aspect;
	} else {
		cw = sw;
		ch = cw / aspect;
	}
	cw /= zoom;
	ch /= zoom;
	const x = Math.max(0, Math.min(sw - cw, fx * sw - cw / 2));
	const y = Math.max(0, Math.min(sh - ch, fy * sh - ch / 2));
	return {x, y, cw, ch};
};

// Jagged-ended strip of washi tape.
export const Tape: React.FC<{x: number; y: number; rotate?: number; width?: number; color?: string}> = ({x, y, rotate = 0, width = 190, color = 'rgba(255, 236, 200, 0.78)'}) => {
	const teeth = 7;
	const pts: string[] = [];
	for (let i = 0; i <= teeth; i++) {
		pts.push(`${i % 2 ? 4 : 0}% ${(i / teeth) * 100}%`);
	}
	for (let i = teeth; i >= 0; i--) {
		pts.push(`${i % 2 ? 96 : 100}% ${(i / teeth) * 100}%`);
	}
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width,
				height: 54,
				transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
				background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.0) 0 14px, rgba(255,255,255,0.22) 14px 18px), ${color}`,
				clipPath: `polygon(${pts.join(',')})`,
				boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
				mixBlendMode: 'normal',
				zIndex: 3,
			}}
		/>
	);
};

// A white-bordered photo print (reelkit.print_card) with an optional Ken Burns
// crop. `overlay` is drawn in SOURCE-IMAGE percent coordinates, so doodles
// stay pinned to the photo while it zooms.
export const PrintCard: React.FC<{
	width: number; // image area
	height: number;
	border?: number;
	bottom?: number;
	photo?: PhotoRef;
	zoom?: number;
	fx?: number;
	fy?: number;
	children?: React.ReactNode; // alternative content (e.g. video) filling the image area
	overlay?: React.ReactNode;
	tape?: 'top' | 'corners' | 'none';
	tapeSeed?: number;
}> = ({width, height, border = 22, bottom = 70, photo, zoom = 1, fx = 0.5, fy = 0.5, children, overlay, tape = 'none', tapeSeed = 0}) => {
	let inner: React.ReactNode = children;
	let overlayLayer: React.ReactNode = null;
	if (photo) {
		const {x, y, cw} = kbCrop(photo.w, photo.h, width / height, zoom, fx, fy);
		const s = width / cw;
		const box: React.CSSProperties = {position: 'absolute', left: -x * s, top: -y * s, width: photo.w * s, height: photo.h * s};
		inner = <Img src={staticFile(photo.src)} style={{...box, maxWidth: 'none'}} />;
		overlayLayer = overlay ? <div style={box}>{overlay}</div> : null;
	}
	const tilt = (tapeSeed % 2 ? 1 : -1) * 4;
	return (
		<div
			style={{
				position: 'relative',
				width: width + border * 2,
				height: height + border + bottom,
				background: COLORS.paperWhite,
				boxShadow: '0 2px 4px rgba(0,0,0,0.16), 14px 26px 44px rgba(0,0,0,0.30)',
			}}
		>
			<div style={{position: 'absolute', left: border, top: border, width, height, overflow: 'hidden', background: '#ddd'}}>
				{inner}
				{overlayLayer}
				{/* faint print sheen so the photo reads as paper, not a screen */}
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 40%, rgba(0,0,0,0.05))'}} />
			</div>
			{tape === 'top' ? <Tape x={(width + border * 2) / 2} y={4} rotate={tilt} /> : null}
			{tape === 'corners' ? (
				<>
					<Tape x={30} y={18} rotate={-38 + tilt} width={150} />
					<Tape x={width + border * 2 - 30} y={18} rotate={38 + tilt} width={150} />
				</>
			) : null}
		</div>
	);
};
