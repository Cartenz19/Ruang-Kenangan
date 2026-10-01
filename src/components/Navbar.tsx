import React from 'react';
import {
  Camera,
  Images,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  HardDrive,
} from 'lucide-react';
import { RuangKenanganLogo } from './RuangKenanganLogo';

interface NavbarProps {
  currentTab: 'studio' | 'gallery';
  setCurrentTab: (tab: 'studio' | 'gallery') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  soundEnabled,
  onToggleSound,
  themeMode,
  onToggleTheme,
  savedCount,
}) => {
  return (
    <>
      {/* ========================================================
          DESKTOP / LAPTOP HEADER (Logo at Top-Left, Nav at Top-Right)
          ======================================================== */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-rose-100/80 dark:border-rose-950/60 shadow-xs px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Top-Left Corner: Logo & Name "Ruang Kenangan" */}
          <div
            onClick={() => setCurrentTab('studio')}
            className="cursor-pointer group select-none"
          >
            <RuangKenanganLogo size="md" showText={true} />
          </div>

          {/* Top-Right Corner: Navigation Tabs, Theme Toggle, Sound FX, & Offline Indicator */}
          <div className="flex items-center gap-2.5">
            {/* Nav Tabs */}
            <nav className="flex items-center gap-1.5 bg-rose-50/70 dark:bg-slate-800/80 p-1 rounded-2xl border border-rose-100/60 dark:border-slate-700/60 text-xs font-semibold">
              <button
                onClick={() => setCurrentTab('studio')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  currentTab === 'studio'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photobox</span>
              </button>

              <button
                onClick={() => setCurrentTab('gallery')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer relative ${
                  currentTab === 'gallery'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <Images className="w-3.5 h-3.5" />
                <span>Galeri Memori</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer"
              title={themeMode === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[11px]">Gelap</span>
                </>
              )}
            </button>

            {/* Sound FX Toggle */}
            <button
              onClick={onToggleSound}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer"
              title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px]">Suara On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-400">Suara Off</span>
                </>
              )}
            </button>

            {/* Offline Local Storage Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50/70 dark:bg-slate-800/80 border border-rose-100/60 dark:border-slate-700/60 text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none"
              title="Foto disimpan di memori peramban lokal perangkat Anda"
            >
              <HardDrive className="w-3.5 h-3.5 text-rose-400 dark:text-rose-400" />
              <span>Mode Offline</span>
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================
          MOBILE (HP) HEADER (Centered Ruang Kenangan Logo)
          ======================================================== */}
      <header className="md:hidden sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-rose-100/70 dark:border-rose-950/60 px-4 py-2.5 flex items-center justify-between shadow-xs transition-colors">
        <div
          onClick={() => setCurrentTab('studio')}
          className="cursor-pointer select-none"
        >
          <RuangKenanganLogo size="sm" showText={true} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-rose-50/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-rose-100/60 dark:border-slate-700/60">
          <HardDrive className="w-3 h-3 text-rose-400" />
          <span>Offline</span>
        </div>
      </header>

      {/* ========================================================
          MOBILE (HP) BOTTOM NAVBAR (Photobox, Galeri, Tema, Suara)
          ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-rose-100 dark:border-rose-950/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] px-3 py-1.5 flex items-center justify-around transition-colors">
        {/* Tab Photobox */}
        <button
          onClick={() => setCurrentTab('studio')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition cursor-pointer ${
            currentTab === 'studio'
              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
              : 'text-slate-400 dark:text-slate-400 font-medium hover:text-rose-500'
          }`}
        >
          <Camera className={`w-5 h-5 ${currentTab === 'studio' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Photobox</span>
        </button>

        {/* Tab Galeri */}
        <button
          onClick={() => setCurrentTab('gallery')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition cursor-pointer relative ${
            currentTab === 'gallery'
              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
              : 'text-slate-400 dark:text-slate-400 font-medium hover:text-rose-500'
          }`}
        >
          <div className="relative">
            <Images className={`w-5 h-5 ${currentTab === 'gallery' ? 'stroke-[2.5]' : ''}`} />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-extrabold">
                {savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Galeri</span>
        </button>

        {/* Toggle Tema Gelap / Terang */}
        <button
          onClick={onToggleTheme}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
          title="Ganti Tema"
        >
          {themeMode === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-amber-400" />
              <span className="text-[10px]">Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-slate-500" />
              <span className="text-[10px]">Gelap</span>
            </>
          )}
        </button>

        {/* Toggle Suara FX */}
        <button
          onClick={onToggleSound}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
          title="Toggle Suara"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-5 h-5 text-rose-500" />
              <span className="text-[10px]">Suara</span>
            </>
          ) : (
            <>
              <VolumeX className="w-5 h-5 text-slate-400" />
              <span className="text-[10px]">Bisu</span>
            </>
          )}
        </button>
      </nav>
    </>
  );
};
