import React, { useState, useEffect } from 'react';
import {
  CalendarHeart,
  Heart,
  Sparkles,
  Award,
  Clock,
  Send,
  Check,
} from 'lucide-react';
import { playSound } from '../services/audio';

interface LoveCounterProps {
  soundEnabled: boolean;
}

export const LoveCounter: React.FC<LoveCounterProps> = ({ soundEnabled }) => {
  // Load saved anniversary info from localStorage
  const [partner1, setPartner1] = useState<string>(() => {
    return localStorage.getItem('amour_partner1') || 'Raka';
  });
  const [partner2, setPartner2] = useState<string>(() => {
    return localStorage.getItem('amour_partner2') || 'Aulia';
  });
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    return localStorage.getItem('amour_start_date') || '2024-02-14';
  });

  const [loveNote, setLoveNote] = useState<string>(() => {
    return (
      localStorage.getItem('amour_love_note') ||
      'Terima kasih sudah selalu ada di setiap langkah dan tawa kita. Setiap hari bersamamu selalu terasa istimewa 💖'
    );
  });
  const [isSavedNote, setIsSavedNote] = useState<boolean>(false);

  // Time diff state
  const [timeDiff, setTimeDiff] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCounter = () => {
      const start = new Date(startDateStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, now - start);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeDiff({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [startDateStr]);

  const handleSaveInfo = () => {
    localStorage.setItem('amour_partner1', partner1);
    localStorage.setItem('amour_partner2', partner2);
    localStorage.setItem('amour_start_date', startDateStr);
    localStorage.setItem('amour_love_note', loveNote);
    setIsSavedNote(true);
    playSound('chime', soundEnabled);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  const milestones = [
    { target: 100, label: '100 Hari Cinta', icon: '💖' },
    { target: 365, label: '1 Tahun Kebersamaan', icon: '🌹' },
    { target: 500, label: '500 Hari Indah', icon: '✨' },
    { target: 730, label: '2 Tahun Penuh Kasih', icon: '💍' },
    { target: 1000, label: '1000 Hari Bahagia', icon: '👑' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-2">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-400 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-200/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left z-10">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider text-rose-100 inline-flex items-center gap-1.5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kisah Cinta Kita</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {partner1} & {partner2} 💕
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-md font-medium">
            Setiap detik yang terlewat adalah kenangan manis yang telah kita rajut bersama.
          </p>
        </div>

        {/* Big Day Counter Pill */}
        <div className="bg-white/15 backdrop-blur-md border border-white/30 p-5 rounded-3xl text-center min-w-[200px] z-10 shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-widest text-rose-100">
            Sudah Bersama Selama
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">
            {timeDiff.days}
          </div>
          <span className="text-xs font-bold text-rose-100">Hari Penuh Cinta</span>
        </div>

        {/* Decorative Blurred Bubbles */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-44 h-44 bg-rose-600/30 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Live Clocks Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: timeDiff.days, label: 'Hari', icon: CalendarHeart },
          { value: timeDiff.hours, label: 'Jam', icon: Clock },
          { value: timeDiff.minutes, label: 'Menit', icon: Sparkles },
          { value: timeDiff.seconds, label: 'Detik', icon: Heart },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-rose-100 text-center shadow-xs space-y-1"
          >
            <div className="flex items-center justify-center gap-1 text-rose-500 mb-1">
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {item.value}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Settings & Love Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Settings Box */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Pengaturan Tanggal Jadian / Menikah</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Tanggal Awal Kisah Cinta:
              </label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Nama Kamu:
                </label>
                <input
                  type="text"
                  value={partner1}
                  onChange={(e) => setPartner1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Nama Pasangan:
                </label>
                <input
                  type="text"
                  value={partner2}
                  onChange={(e) => setPartner2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <button
              onClick={handleSaveInfo}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              {isSavedNote ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSavedNote ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Secret Love Note */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Catatan Cinta Rahasia 💌</span>
          </h3>

          <div className="space-y-3">
            <textarea
              rows={4}
              value={loveNote}
              onChange={(e) => setLoveNote(e.target.value)}
              placeholder="Tuliskan ungkapan sayang atau impian masa depan kalian..."
              className="w-full p-3 bg-rose-50/50 border border-rose-200/80 rounded-2xl text-sm font-hand text-lg focus:outline-none focus:border-rose-400 resize-none leading-relaxed"
            />

            <button
              onClick={handleSaveInfo}
              className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              {isSavedNote ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 fill-white" />}
              <span>{isSavedNote ? 'Tersimpan di Perangkat!' : 'Simpan Surat Cinta'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Love Milestones Badges */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-extrabold text-slate-800">
            Pencapaian & Tonggak Cinta Kita (Milestones)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {milestones.map((m, i) => {
            const isAchieved = timeDiff.days >= m.target;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border text-center space-y-1 transition duration-200 ${
                  isAchieved
                    ? 'bg-rose-50/80 border-rose-300 text-rose-800 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="text-2xl">{m.icon}</div>
                <div className="text-xs font-bold leading-tight">{m.label}</div>
                <div className="text-[10px] font-semibold text-slate-400">
                  {isAchieved ? 'Tercapai! 🎉' : `${m.target} Hari`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
