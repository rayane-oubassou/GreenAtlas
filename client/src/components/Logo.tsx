import React from 'react';

interface LogoProps {
  size?: number;
  withText?: boolean;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 36, withText = true, textColor = 'text-white' }) => (
  <div className="flex items-center gap-2.5">
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Globe circle */}
      <circle cx="24" cy="24" r="22" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
      {/* Meridian lines */}
      <ellipse cx="24" cy="24" rx="10" ry="22" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <line x1="2" y1="24" x2="46" y2="24" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="2" y1="16" x2="46" y2="16" stroke="#4ade80" strokeWidth="0.75" strokeOpacity="0.3" />
      <line x1="2" y1="32" x2="46" y2="32" stroke="#4ade80" strokeWidth="0.75" strokeOpacity="0.3" />
      {/* Mountain */}
      <path d="M14 34 L24 14 L34 34 Z" fill="#22c55e" />
      <path d="M20 34 L28 20 L36 34 Z" fill="#166534" />
      {/* Snow cap */}
      <path d="M24 14 L27 20 L21 20 Z" fill="white" opacity="0.9" />
      {/* Tree */}
      <path d="M12 34 L16 26 L20 34 Z" fill="#4ade80" />
      <path d="M11 31 L16 22 L21 31 Z" fill="#22c55e" />
      <rect x="15" y="34" width="2" height="3" fill="#92400e" />
    </svg>
    {withText && (
      <div className="flex flex-col leading-tight">
        <span className={`font-bold text-base tracking-tight ${textColor}`}>GreenAtlas</span>
        <span className={`text-xs opacity-75 ${textColor}`}>Ifrane Province</span>
      </div>
    )}
  </div>
);

export default Logo;
