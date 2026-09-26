import React from 'react';

// Absolutely position a child by its CENTRE (like reelkit.place), with scale,
// rotation (degrees, clockwise-positive like CSS) and opacity.
export const Placed: React.FC<{
	x: number;
	y: number;
	scale?: number;
	rotate?: number;
	opacity?: number;
	z?: number;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({x, y, scale = 1, rotate = 0, opacity = 1, z, children, style}) => {
	if (opacity <= 0.001 || scale <= 0.001) {
		return null;
	}
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
				opacity,
				zIndex: z,
				willChange: 'transform',
				...style,
			}}
		>
			{children}
		</div>
	);
};
