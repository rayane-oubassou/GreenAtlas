import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  withText?: boolean;
  textColor?: string;
  animateHover?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 36,
  withText = true,
  textColor = 'text-white',
  animateHover = true,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2.5"
      onMouseEnter={() => animateHover && setHovered(true)}
      onMouseLeave={() => animateHover && setHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ga-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D6A4F" />
            <stop offset="55%" stopColor="#1E7C59" />
            <stop offset="100%" stopColor="#48CAE4" />
          </linearGradient>
          <linearGradient id="ga-drop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
            <stop offset="100%" stopColor="rgba(200,240,255,0.92)" />
          </linearGradient>
          <filter id="ga-glow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Hexagon base */}
        <path
          d="M24,1.5 L44,13 L44,36 L24,47.5 L4,36 L4,13 Z"
          fill="url(#ga-bg)"
        />

        {/* Inner subtle geometry ring */}
        <path
          d="M24,7 L40,16.5 L40,34.5 L24,44 L8,34.5 L8,16.5 Z"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.6"
        />

        {/* Water drop — sharp geometric variant */}
        <path
          d="M24 11 C24 11 14 22 14 29 C14 35.08 18.48 40 24 40 C29.52 40 34 35.08 34 29 C34 22 24 11 24 11 Z"
          fill="url(#ga-drop)"
          filter="url(#ga-glow)"
        />

        {/* Wave divider across drop — forest meets water */}
        <path
          d="M14.5 27 C16.5 24.5 18.5 29.5 20.5 27 C22.5 24.5 24.5 29.5 26.5 27 C28.5 24.5 30.5 29.5 33.5 27"
          fill="none"
          stroke="#48CAE4"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Hover: stroke draw around hexagon */}
        <motion.path
          d="M24,1.5 L44,13 L44,36 L24,47.5 L4,36 L4,13 Z"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: hovered ? 1 : 0,
            opacity: hovered ? 1 : 0,
          }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
      </svg>

      {withText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-base tracking-tight ${textColor}`}>GreenAtlas</span>
          <span className={`text-xs opacity-55 ${textColor}`}>Ifrane Province</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
