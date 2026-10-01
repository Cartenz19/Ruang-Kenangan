import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Eye,
  Search,
  Heart,
  Calendar,
  MapPin,
  AlertTriangle,
  X,
} from 'lucide-react';
import { playSound } from '../services/audio';
import type { SavedMemory } from '../types';

interface MemoryGalleryProps {
  memories: SavedMemory[];
  onDeleteMemory: (memory: SavedMemory) => Promise<void>;
  soundEnabled: boolean;
  onOpenStudio: () => void;
}

export const MemoryGallery: React.FC<MemoryGalleryProps> = ({
  memories,
  onDeleteMemory,
  soundEnabled,
  onOpenStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMemory, setSelectedMemory] = useState<SavedMemory | null>(null);
  
  // Custom confirmation modal for deleting
  const [memoryToDelete, setMemoryToDelete] = useState<SavedMemory | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const filteredMemories = memories.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.coupleNames.toLowerCase().includes(q) ||
      m.caption.toLowerCase().includes(q) ||
      (m.city1 && m.city1.toLowerCase().includes(q)) ||
      (m.city2 && m.city2.toLowerCase().includes(q))
    );
  });

  const confirmDelete = async () => {
    if (!memoryToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteMemory(memoryToDelete);
      playSound('pop', soundEnabled);
      setMemoryToDelete(null);
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 py-2">
      
      {/* Gallery Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              Galeri Memori Cinta 💖
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold text-xs">
              {memories.length} Strip Tersimpan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Koleksi foto photobox cinta yang tersimpan indah di galeri memori Anda.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama / caption..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400"
          />
        </div>
      </div>

      {/* Empty State */}
      {memories.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-12 rounded-3xl border border-rose-100 dark:border-rose-950/60 text-center flex flex-col items-center justify-center space-y-4 transition-colors">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center text-3xl shadow-sm">
            <Heart className="w-8 h-8 fill-rose-400 text-rose-400 animate-heartbeat" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Belum Ada Memori Tersimpan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mulai foto bersama di Photobox Studio untuk membuat strip foto pertama Anda!
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-200 dark:shadow-none transition active:scale-95 cursor-pointer"
          >
            Mulai Ambil Foto Photobox ✨
          </button>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/60 p-8 rounded-3xl border border-rose-100 dark:border-rose-950/60 text-center text-slate-500 dark:text-slate-400 text-xs transition-colors">
          Tidak ditemukan foto yang cocok dengan pencarian "{searchTerm}".
        </div>
      ) : (
        /* Memories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              {/* Image Preview Container */}
              <div
                onClick={() => {
                  setSelectedMemory(memory);
                  playSound('pop', soundEnabled);
                }}
                className="relative bg-slate-100 dark:bg-slate-800 aspect-[3/4] overflow-hidden cursor-pointer flex items-center justify-center p-3"
              >
                <img
                  src={memory.imageDataUrl}
                  alt={memory.title}
                  className="w-full h-full object-contain rounded-xl transition duration-300 group-hover:scale-[1.02]"
                />

                {/* Hover Quick Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white gap-2">
                  <span className="p-2.5 rounded-full bg-white/20 backdrop-blur-md">
                    <Eye className="w-5 h-5 text-white" />
                  </span>
                </div>
              </div>

              {/* Details & Actions Footer */}
              <div className="p-4 space-y-2.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {memory.coupleNames || 'Pasangan Bahagia'}
                  </h4>
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-hand text-base truncate">
                    "{memory.caption || 'Cinta Tanpa Jarak'}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                    <span>{memory.dateStr}</span>
                  </span>
                  {memory.distanceKm && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-rose-400">
                      <MapPin className="w-3 h-3" />
                      <span>{memory.distanceKm} KM</span>
                    </span>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <a
                      href={memory.imageDataUrl}
                      download={`AmourSnap_${memory.id}.png`}
                      onClick={() => playSound('pop', soundEnabled)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                      title="Unduh PNG"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>

                  <button
                    onClick={() => setMemoryToDelete(memory)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Hapus Memori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedMemory && (
        <div
          onClick={() => setSelectedMemory(null)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950/60 flex flex-col items-center space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="w-full flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {selectedMemory.coupleNames || 'Photo Strip'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedMemory.dateStr}
                </p>
              </div>
              <button
                onClick={() => setSelectedMemory(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 p-2 sm:p-4 rounded-2xl flex items-center justify-center">
              <img
                src={selectedMemory.imageDataUrl}
                alt={selectedMemory.title}
                className="max-h-[55vh] object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="w-full flex items-center justify-between gap-2 pt-2">
              <a
                href={selectedMemory.imageDataUrl}
                download={`AmourSnap_${selectedMemory.id}.png`}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Foto HD</span>
              </a>

              <button
                onClick={() => {
                  setMemoryToDelete(selectedMemory);
                  setSelectedMemory(null);
                }}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      {memoryToDelete && (
        <div
          onClick={() => setMemoryToDelete(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/60 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Hapus Foto Strip Ini?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Foto kenangan ini akan dihapus dari galeri memori dan cloud Anda.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setMemoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
