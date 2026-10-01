import React from 'react';
import emblemImg from '../assets/images/ruang_kenangan_emblem_1790838769058.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const RuangKenanganLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 bg-transparent select-none group ${className}`}>
      
      {/* Animated Camera + Golden Moon Emblem (NO background) */}
      <div className="relative shrink-0">
        
        {/* Subtle glowing aura animation */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-500/20 via-amber-400/25 to-pink-500/20 blur-xs opacity-75 group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

        {/* Emblem Image Container (Transparent, No white background box) */}
        <div
          className={`relative ${iconDimensions[size]} rounded-2xl overflow-hidden bg-transparent transform group-hover:scale-110 group-hover:-rotate-2 transition-all duration-300 ease-out`}
        >
          <img
            src={emblemImg}
            alt="Ruang Kenangan Logo"
            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-screen transition-transform duration-300"
          />
        </div>

        {/* Floating Sparkle Stars (Animated golden twinkle) */}
        <span
          className="absolute -top-1 -right-1 text-amber-400 text-xs sm:text-sm animate-bounce"
          style={{ animationDuration: '2.4s' }}
        >
          ✨
        </span>
        <span
          className="absolute -bottom-1 -left-0.5 text-pink-400 text-[10px] animate-pulse"
          style={{ animationDuration: '1.8s' }}
        >
          ✨
        </span>
      </div>

      {/* Brand Name on the RIGHT side of the logo */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black ${textSizes[size]} tracking-tight font-serif-display leading-tight bg-gradient-to-r from-rose-700 via-pink-700 to-amber-600 dark:from-rose-400 dark:via-pink-300 dark:to-amber-300 bg-clip-text text-transparent drop-shadow-xs transition-all duration-300 group-hover:brightness-110`}
            >
              Ruang Kenangan
            </span>
            <span
              className="text-amber-500 dark:text-amber-400 text-xs animate-spin"
              style={{ animationDuration: '6s' }}
            >
              ✦
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
