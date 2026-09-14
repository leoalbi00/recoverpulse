import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = true }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-square"
      >
        <defs>
          <linearGradient id="omnirev-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path
          d="M 20 6 A 14 14 0 1 0 34 20"
          stroke="url(#omnirev-grad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M 27 10 L 34 20 L 34 11"
          stroke="url(#omnirev-grad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-sans text-xl tracking-tight text-slate-900 dark:text-white">
          <span className="font-extrabold">Omni</span>
          <span className="font-medium text-emerald-500">Rev</span>
        </span>
      )}
    </div>
  );
};
