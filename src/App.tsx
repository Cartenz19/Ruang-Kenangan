import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FloatingHearts } from './components/FloatingHearts';
import { PhotoboxStudio } from './components/PhotoboxStudio';
import { CustomizerStudio } from './components/CustomizerStudio';
import { MemoryGallery } from './components/MemoryGallery';
import { playSound } from './services/audio';
import type {
  SavedMemory,
  CapturedFrame,
  PhotoLayout,
} from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const MEMORIES_STORAGE_KEY = 'ruangkenangan_memories_storage';
const SOUND_STORAGE_KEY = 'amoursnap_sound_fx';
const THEME_STORAGE_KEY = 'amoursnap_theme';

export default function App() {
  // Navigation & Workflow (Photobox & Galeri Memori)
  const [currentTab, setCurrentTab] = useState<'studio' | 'gallery'>('studio');
  const [tabSlideDirection, setTabSlideDirection] = useState<'slide-right' | 'slide-left'>('slide-right');
  const [studioStep, setStudioStep] = useState<'capture' | 'customize'>('capture');
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [activeLayout, setActiveLayout] = useState<PhotoLayout>('strip3');

  // Smooth Tab Switcher Handler
  const handleTabChange = useCallback((nextTab: 'studio' | 'gallery') => {
    if (nextTab === currentTab) return;
    setTabSlideDirection(nextTab === 'gallery' ? 'slide-right' : 'slide-left');
    setCurrentTab(nextTab);
  }, [currentTab]);

  // Theme Mode: 'light' or 'dark'
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply dark mode class to document element
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const handleToggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    playSound('pop', soundEnabled);
  };

  // Memories Store - Pure LocalStorage (Offline Mode)
  const [memories, setMemories] = useState<SavedMemory[]>(() => {
    try {
      const saved =
        localStorage.getItem(MEMORIES_STORAGE_KEY) ||
        localStorage.getItem('amoursnap_memories_guest_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sound Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
  });

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Helper to persist memories locally
  const persistMemories = useCallback((updated: SavedMemory[]) => {
    setMemories(updated);
    try {
      localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local storage quota warning:', e);
    }
  }, []);

  // Toggle Sound FX
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_STORAGE_KEY, String(next));
    playSound('pop', next);
  };

  // Transition from Photo Capture to Customizer
  const handlePhotosCaptured = (frames: CapturedFrame[], layout: PhotoLayout) => {
    setCapturedFrames(frames);
    setActiveLayout(layout);
    setStudioStep('customize');
  };

  // Return to Camera Capture
  const handleRetake = () => {
    setStudioStep('capture');
    playSound('pop', soundEnabled);
  };

  // Save new Memory in Pure Offline / LocalStorage Mode
  const handleSaveMemory = async (newMemory: SavedMemory) => {
    const updated = [newMemory, ...memories];
    persistMemories(updated);
    showToast('Foto Strip berhasil disimpan ke Galeri Memori 💌', 'success');

    // Switch to Gallery tab with smooth right slide
    setTabSlideDirection('slide-right');
    setCurrentTab('gallery');
    setStudioStep('capture');
  };

  // Delete Memory from Local Storage
  const handleDeleteMemory = async (memory: SavedMemory) => {
    const updated = memories.filter((m) => m.id !== memory.id);
    persistMemories(updated);
    showToast('Memori telah dihapus.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-rose-200 dark:selection:bg-rose-900 transition-colors duration-300">
      
      {/* Animated Kawaii Dreamy Background (supports Dark & Light Mode) */}
      <FloatingHearts />

      {/* Navigation (Clean Header without Login buttons) */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        savedCount={memories.length}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-14 sm:top-16 right-4 z-50 pointer-events-auto animate-fade-in transition-all max-w-sm">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-400/40 shadow-emerald-200 dark:shadow-none'
                : toast.type === 'error'
                ? 'bg-rose-600/95 text-white border-rose-400/40 shadow-rose-200 dark:shadow-none'
                : 'bg-slate-900/95 text-white border-slate-700/40 shadow-slate-300 dark:shadow-none'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-1 text-white/60 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace with Fluid Fade & Slide Transition */}
      <main className="max-w-7xl mx-auto px-4 py-3 sm:py-6 w-full flex-1 z-10 pb-24 md:pb-6 overflow-hidden">
        <div
          key={currentTab}
          className={`w-full ${
            tabSlideDirection === 'slide-right'
              ? 'animate-tab-slide-right'
              : 'animate-tab-slide-left'
          }`}
        >
          {currentTab === 'studio' && (
            <div key={studioStep} className="animate-tab-fade-slide">
              {studioStep === 'capture' ? (
                <PhotoboxStudio
                  onPhotosCaptured={handlePhotosCaptured}
                  soundEnabled={soundEnabled}
                />
              ) : (
                <CustomizerStudio
                  frames={capturedFrames}
                  initialLayout={activeLayout}
                  onSaveMemory={handleSaveMemory}
                  onRetake={handleRetake}
                  soundEnabled={soundEnabled}
                />
              )}
            </div>
          )}

          {currentTab === 'gallery' && (
            <MemoryGallery
              memories={memories}
              onDeleteMemory={handleDeleteMemory}
              soundEnabled={soundEnabled}
              onOpenStudio={() => {
                handleTabChange('studio');
                setStudioStep('capture');
              }}
            />
          )}
        </div>
      </main>

      {/* Footer (Hidden on mobile, visible on desktop/laptop) */}
      <footer className="hidden md:block bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border-t border-rose-100/60 dark:border-rose-950/60 py-4 px-4 text-center text-xs text-slate-400 dark:text-slate-400 z-10 transition-colors">
        <p className="font-medium">
          Ruang Kenangan 💌 Studio Photobox & Galeri Memori &bull; 100% Mode Offline & Penyimpanan Lokal
        </p>
      </footer>

    </div>
  );
}
