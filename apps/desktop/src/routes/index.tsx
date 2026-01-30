import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="flex h-full items-center justify-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.96 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className="flex flex-col items-center gap-6"
			>
				{/* Kintsugi Symbol */}
				<motion.div
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
				>
					<KintsugiSymbol />
				</motion.div>

				{/* Text */}
				<motion.p
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
					className="text-[12px] text-white/30 tracking-wide"
				>
					Select a task to begin
				</motion.p>
			</motion.div>
		</div>
	);
}

function KintsugiSymbol() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 72 72"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="opacity-50"
			aria-hidden="true"
		>
			{/* Ceramic vessel outline */}
			<circle
				cx="36"
				cy="36"
				r="28"
				stroke="rgba(255,255,255,0.06)"
				strokeWidth="1"
			/>

			{/* Golden repair lines */}
			<path
				d="M 36 8 Q 42 20 38 28 Q 32 36 36 44 Q 42 52 36 64"
				stroke="url(#goldGradientHome)"
				strokeWidth="1"
				strokeLinecap="round"
				fill="none"
			/>
			<path
				d="M 14 28 Q 24 32 28 36 Q 32 40 36 36"
				stroke="url(#goldGradientHome)"
				strokeWidth="1"
				strokeLinecap="round"
				fill="none"
			/>
			<path
				d="M 58 44 Q 48 40 44 36 Q 40 32 36 36"
				stroke="url(#goldGradientHome)"
				strokeWidth="1"
				strokeLinecap="round"
				fill="none"
			/>

			{/* Center point */}
			<circle cx="36" cy="36" r="1.5" fill="#d4af37" opacity="0.4" />

			<defs>
				<linearGradient
					id="goldGradientHome"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stopColor="#d4af37" stopOpacity="0.2" />
					<stop offset="50%" stopColor="#f4d03f" stopOpacity="0.5" />
					<stop offset="100%" stopColor="#d4af37" stopOpacity="0.2" />
				</linearGradient>
			</defs>
		</svg>
	);
}
