import React from 'react';

export const FloatingHearts: React.FC = () => {
  // Rising cute particles
  const risingHearts = [
    { id: 1, left: '5%', delay: '0s', size: 16, color: 'text-pink-300 dark:text-pink-500' },
    { id: 2, left: '15%', delay: '4s', size: 22, color: 'text-rose-300 dark:text-rose-500' },
    { id: 3, left: '28%', delay: '8s', size: 14, color: 'text-purple-300 dark:text-purple-400' },
    { id: 4, left: '42%', delay: '2s', size: 20, color: 'text-pink-400 dark:text-rose-400' },
    { id: 5, left: '58%', delay: '10s', size: 18, color: 'text-rose-300 dark:text-pink-500' },
    { id: 6, left: '72%', delay: '5s', size: 24, color: 'text-purple-200 dark:text-purple-500' },
    { id: 7, left: '85%', delay: '12s', size: 16, color: 'text-pink-300 dark:text-rose-400' },
    { id: 8, left: '94%', delay: '7s', size: 20, color: 'text-rose-300 dark:text-pink-400' },
  ];

  // Twinkling cute stars and sparkles
  const sparkles = [
    { id: 1, left: '8%', top: '12%', symbol: '✨', delay: '0.2s', size: 'text-sm' },
    { id: 2, left: '88%', top: '16%', symbol: '💖', delay: '1.5s', size: 'text-xs' },
    { id: 3, left: '92%', top: '48%', symbol: '🌸', delay: '2.8s', size: 'text-sm' },
    { id: 4, left: '4%', top: '65%', symbol: '🎀', delay: '0.9s', size: 'text-sm' },
    { id: 5, left: '78%', top: '82%', symbol: '✨', delay: '2.1s', size: 'text-base' },
    { id: 6, left: '22%', top: '88%', symbol: '💖', delay: '3.4s', size: 'text-xs' },
    { id: 7, left: '50%', top: '5%', symbol: '✨', delay: '1.8s', size: 'text-xs' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-500">
      
      {/* 1. Atmospheric Gradient (Light pastel / Dark midnight velvet) */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/70 via-pink-50/40 to-purple-50/50 dark:from-slate-950 dark:via-slate-900/95 dark:to-rose-950/40 transition-colors duration-500" />

      {/* 2. Soft Animated Gradient Glow Blobs */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pink-200/35 dark:bg-rose-900/25 blur-3xl animate-blob-drift transition-colors"
        style={{ animationDuration: '18s' }}
      />
      <div
        className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-3xl animate-blob-drift transition-colors"
        style={{ animationDuration: '22s', animationDelay: '-5s' }}
      />
      <div
        className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-rose-200/35 dark:bg-pink-900/20 blur-3xl animate-blob-drift transition-colors"
        style={{ animationDuration: '20s', animationDelay: '-10s' }}
      />

      {/* 3. Rising Cute Floating Hearts */}
      {risingHearts.map((h) => (
        <div
          key={h.id}
          className={`absolute animate-float-up ${h.color}`}
          style={{
            left: h.left,
            animationDelay: h.delay,
          }}
        >
          <svg
            width={h.size}
            height={h.size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="filter drop-shadow-sm opacity-50 dark:opacity-60"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}

      {/* 4. Twinkling Kawaii Sparkles & Emojis */}
      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className={`absolute animate-twinkle ${sp.size} opacity-40 dark:opacity-50`}
          style={{
            left: sp.left,
            top: sp.top,
            animationDelay: sp.delay,
          }}
        >
          <span>{sp.symbol}</span>
        </div>
      ))}

    </div>
  );
};
