import React, { useState, useRef, useEffect, useCallback } from 'react';
import Peer, { type DataConnection, type MediaConnection } from 'peerjs';
import {
  Camera,
  RotateCcw,
  Upload,
  Heart,
  Layers,
  SlidersHorizontal,
  Video,
  VideoOff,
  Link as LinkIcon,
  Check,
  Radio,
  Wifi,
  Share2,
  Copy,
  X,
} from 'lucide-react';
import { playSound } from '../services/audio';
import type { PhotoFilter, PhotoLayout, CapturedFrame } from '../types';

// Robust helper to copy text across browsers, webviews, and iframes
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  // 1. Try modern navigator.clipboard
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText blocked or failed:', err);
    }
  }

  // 2. Fallback to execCommand with textarea element
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) return true;
  } catch (err) {
    console.warn('document.execCommand copy failed:', err);
  }

  return false;
};

interface PhotoboxStudioProps {
  onPhotosCaptured: (frames: CapturedFrame[], layout: PhotoLayout) => void;
  soundEnabled: boolean;
}

// Robust helper to extract clean Peer ID even if user pasted full URL or query string
const extractCleanPeerId = (input: string): string => {
  if (!input) return '';
  let clean = input.trim();

  if (clean.includes('partner=') || clean.includes('room=')) {
    try {
      const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
      const val = url.searchParams.get('partner') || url.searchParams.get('room');
      if (val) return val.trim();
    } catch {
      const match = clean.match(/[?&](partner|room)=([^&#]+)/);
      if (match && match[2]) {
        return decodeURIComponent(match[2]).trim();
      }
    }
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const url = new URL(clean);
      const val = url.searchParams.get('partner') || url.searchParams.get('room');
      if (val) return val.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].trim();
    } catch {
      // ignore
    }
  }

  return clean;
};

export const PhotoboxStudio: React.FC<PhotoboxStudioProps> = ({
  onPhotosCaptured,
  soundEnabled,
}) => {
  // Format Strip
  const [photoCount, setPhotoCount] = useState<3 | 4>(3);
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('warm');
  
  // Local Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Real-time 2-Device WebRTC State
  const [myPeerId, setMyPeerId] = useState<string>(() => {
    return 'rk-' + Math.random().toString(36).substring(2, 8);
  });
  const [partnerIdInput, setPartnerIdInput] = useState<string>('');
  const [isPartnerConnected, setIsPartnerConnected] = useState<boolean>(false);
  const [partnerStream, setPartnerStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Partner upload fallback if offline
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string | null>(null);

  // Countdown & Capturing State
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(1);
  const [flash, setFlash] = useState<boolean>(false);

  // Video Refs & P2P Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const partnerVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const mediaCallRef = useRef<MediaConnection | null>(null);

  // Filter styles dictionary
  const filterStyles: Record<PhotoFilter, string> = {
    normal: 'filter-none',
    warm: 'sepia(20%) saturate(135%) brightness(104%) hue-rotate(-8deg)',
    softglow: 'brightness(110%) contrast(94%) saturate(120%)',
    vintage: 'sepia(45%) contrast(108%) brightness(96%) saturate(110%)',
    bw: 'grayscale(100%) contrast(115%)',
    rose: 'contrast(115%) saturate(130%) hue-rotate(-15deg) brightness(102%)',
  };

  // Start Camera with resilient fallback
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      setCameraError(null);

      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errFirst) {
        console.warn('Initial camera constraint failed, trying basic video...', errFirst);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (errSecond) {
          console.warn('Generic camera access failed:', errSecond);
        }
      }

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        return stream;
      } else {
        throw new Error('Requested device not found');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Kamera tidak aktif atau izin belum diberikan. Anda dapat mencoba lagi atau mengunggah foto langsung.');
      setIsCameraActive(false);
      return null;
    }
  }, [facingMode]);

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera]);

  // Setup Data Connection for synchronization between 2 devices
  const setupDataConnection = useCallback((conn: DataConnection) => {
    dataConnRef.current = conn;

    conn.on('open', () => {
      setIsPartnerConnected(true);
      setIsConnecting(false);
      setConnectionMessage('Terhubung dengan kamera pasangan secara langsung! 💖');
      playSound('sparkle', soundEnabled);
    });

    conn.on('data', (data: any) => {
      if (data?.type === 'START_CAPTURE') {
        triggerCaptureSequenceLocally(data.photoCount || 3);
      } else if (data?.type === 'SYNC_FILTER') {
        setActiveFilter(data.filter);
      }
    });

    conn.on('close', () => {
      setIsPartnerConnected(false);
      setPartnerStream(null);
      setConnectionMessage('Koneksi pasangan terputus.');
    });

    conn.on('error', (err) => {
      console.warn('Peer connection error:', err);
      setIsConnecting(false);
      setConnectionMessage('Gagal terhubung dengan pasangan.');
    });
  }, [soundEnabled]);

  // Connect to partner using clean ID
  const connectToPartner = useCallback(async (targetId?: string) => {
    const rawTarget = targetId || partnerIdInput;
    const cleanId = extractCleanPeerId(rawTarget);

    if (!cleanId) {
      setConnectionMessage('Silakan masukkan ID Pasangan atau tempel link undangan.');
      return;
    }
    if (cleanId === myPeerId) {
      setConnectionMessage('Tidak bisa menghubungkan ke ID perangkat sendiri.');
      return;
    }

    const peer = peerRef.current;
    if (!peer || peer.destroyed) return;

    setIsConnecting(true);
    setConnectionMessage('Menghubungkan ke kamera pasangan...');

    try {
      const conn = peer.connect(cleanId);
      setupDataConnection(conn);

      let localStream = streamRef.current;
      if (!localStream) {
        localStream = await startCamera();
      }

      if (localStream) {
        const call = peer.call(cleanId, localStream);
        mediaCallRef.current = call;
        call.on('stream', (remoteStream) => {
          setPartnerStream(remoteStream);
          if (partnerVideoRef.current) {
            partnerVideoRef.current.srcObject = remoteStream;
          }
        });
        call.on('error', (e) => {
          console.warn('Call error:', e);
        });
      }
    } catch (err) {
      console.warn('Connect to partner error:', err);
      setIsConnecting(false);
      setConnectionMessage('Gagal terhubung. Pastikan pasangan sudah membuka link di perangkatnya.');
    }
  }, [myPeerId, partnerIdInput, setupDataConnection, startCamera]);

  // Initialize WebRTC Peer
  useEffect(() => {
    let peer: Peer;
    try {
      peer = new Peer(myPeerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });
    } catch {
      peer = new Peer();
    }
    peerRef.current = peer;

    peer.on('open', (id) => {
      setMyPeerId(id);

      const params = new URLSearchParams(window.location.search);
      const urlPartnerRaw = params.get('partner') || params.get('room');
      if (urlPartnerRaw) {
        const cleanPartner = extractCleanPeerId(urlPartnerRaw);
        if (cleanPartner && cleanPartner !== id) {
          setPartnerIdInput(cleanPartner);
          setTimeout(() => {
            connectToPartner(cleanPartner);
          }, 800);
        }
      }
    });

    peer.on('connection', (conn) => {
      setupDataConnection(conn);
    });

    peer.on('call', (call) => {
      mediaCallRef.current = call;
      call.answer(streamRef.current || undefined);
      call.on('stream', (remoteStream) => {
        setPartnerStream(remoteStream);
        if (partnerVideoRef.current) {
          partnerVideoRef.current.srcObject = remoteStream;
        }
      });
      call.on('error', (e) => {
        console.warn('Incoming call error:', e);
      });
    });

    peer.on('error', (err: any) => {
      console.warn('PeerJS notice:', err);
      setIsConnecting(false);
      if (err?.type === 'peer-unavailable') {
        setConnectionMessage('Perangkat pasangan belum online atau belum membuka link studio.');
      } else if (err?.type === 'invalid-id') {
        setConnectionMessage('Format ID Pasangan tidak sesuai.');
      } else {
        setConnectionMessage('Koneksi belum terhubung. Pastikan link dibuka oleh pasangan.');
      }
    });

    return () => {
      peer.destroy();
      peerRef.current = null;
    };
  }, [connectToPartner, setupDataConnection]);

  useEffect(() => {
    if (partnerVideoRef.current && partnerStream) {
      partnerVideoRef.current.srcObject = partnerStream;
    }
  }, [partnerStream]);

  // Compute invite URL dynamically
  const getInviteUrl = useCallback(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?partner=${myPeerId}`;
  }, [myPeerId]);

  // Copy link with multi-layer fallback & instant feedback
  const handleCopyInviteLink = async () => {
    const url = getInviteUrl();
    const copied = await copyTextToClipboard(url);

    setIsCopiedLink(true);
    playSound('pop', soundEnabled);
    setTimeout(() => setIsCopiedLink(false), 2500);

    // If browser/iframe blocked writing to clipboard, open modal so user can view/copy manually
    if (!copied) {
      setShowInviteModal(true);
    }
  };

  // Flip camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    playSound('pop', soundEnabled);
  };

  // Select filter
  const handleSelectFilter = (filter: PhotoFilter) => {
    setActiveFilter(filter);
    playSound('pop', soundEnabled);

    if (dataConnRef.current && isPartnerConnected) {
      dataConnRef.current.send({ type: 'SYNC_FILTER', filter });
    }
  };

  // Partner Photo Upload fallback
  const handlePartnerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPartnerPhotoUrl(event.target.result as string);
          playSound('sparkle', soundEnabled);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper: Draw image/video with aspect ratio cover into a 1:1 square without stretching or heavy cropping
  const drawAspectCover = (
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    sourceW: number,
    sourceH: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    mirror: boolean
  ) => {
    const targetRatio = dw / dh; // 1.0 (exact square)
    const sourceRatio = sourceW / sourceH;
    let sw = sourceW;
    let sh = sourceH;
    let sx = 0;
    let sy = 0;

    if (sourceRatio > targetRatio) {
      sw = sourceH * targetRatio;
      sx = (sourceW - sw) / 2;
    } else {
      sh = sourceW / targetRatio;
      sy = (sourceH - sh) / 2;
    }

    ctx.save();
    if (mirror) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    ctx.restore();
  };

  // Snapshot: Bilah 1 (1:1 Square 1080x1080) and Bilah 2 (1:1 Square 1080x1080) Side by Side!
  const captureSingleFrame = (): string => {
    const canvas = document.createElement('canvas');
    // Total Width: 2160 (two 1080x1080 square panes), Height: 1080
    canvas.width = 2160;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const panelSize = 1080; // Each camera visual is a pristine 1:1 square (1080x1080)

    ctx.filter = filterStyles[activeFilter];

    // 1. Bilah Pertama (Kamera Kamu) - 1:1 Square (1080x1080)
    if (videoRef.current && isCameraActive) {
      const vw = videoRef.current.videoWidth || 1280;
      const vh = videoRef.current.videoHeight || 720;
      drawAspectCover(ctx, videoRef.current, vw, vh, 0, 0, panelSize, panelSize, true);
    } else {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, panelSize, panelSize);
      ctx.fillStyle = '#be185d';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Kamu 💖', panelSize / 2, panelSize / 2);
    }

    // 2. Bilah Kedua (Kamera Pasangan) - 1:1 Square (1080x1080)
    if (partnerVideoRef.current && partnerStream) {
      const pw = partnerVideoRef.current.videoWidth || 1280;
      const ph = partnerVideoRef.current.videoHeight || 720;
      drawAspectCover(ctx, partnerVideoRef.current, pw, ph, panelSize, 0, panelSize, panelSize, true);
    } else if (partnerPhotoUrl) {
      const partnerImg = new Image();
      partnerImg.src = partnerPhotoUrl;
      const nw = partnerImg.naturalWidth || 800;
      const nh = partnerImg.naturalHeight || 800;
      drawAspectCover(ctx, partnerImg, nw, nh, panelSize, 0, panelSize, panelSize, false);
    } else if (videoRef.current && isCameraActive) {
      const vw = videoRef.current.videoWidth || 1280;
      const vh = videoRef.current.videoHeight || 720;
      drawAspectCover(ctx, videoRef.current, vw, vh, panelSize, 0, panelSize, panelSize, false);
    } else {
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(panelSize, 0, panelSize, panelSize);
      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pasangan 💌', panelSize + panelSize / 2, panelSize / 2);
    }

    // Delicate vertical center line separator
    ctx.filter = 'none';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(panelSize, 0);
    ctx.lineTo(panelSize, panelSize);
    ctx.stroke();

    return canvas.toDataURL('image/png', 0.95);
  };

  // Run Capture Sequence
  const triggerCaptureSequenceLocally = async (totalShots: number) => {
    if (isCapturing) return;
    setIsCapturing(true);

    const captured: CapturedFrame[] = [];

    for (let shot = 1; shot <= totalShots; shot++) {
      setCurrentShotIndex(shot);

      for (let count = 3; count >= 1; count--) {
        setCountdown(count);
        playSound('beep', soundEnabled);
        await new Promise((res) => setTimeout(res, 900));
      }

      setCountdown(null);
      playSound('shutter', soundEnabled);

      setFlash(true);
      const frameDataUrl = captureSingleFrame();
      captured.push({
        id: `shot_${Date.now()}_${shot}`,
        canvasDataUrl: frameDataUrl,
        timestamp: Date.now(),
      });

      await new Promise((res) => setTimeout(res, 120));
      setFlash(false);

      if (shot < totalShots) {
        await new Promise((res) => setTimeout(res, 850));
      }
    }

    setIsCapturing(false);
    playSound('sparkle', soundEnabled);

    const layout: PhotoLayout = totalShots === 3 ? 'strip3' : 'strip4';
    onPhotosCaptured(captured, layout);
  };

  // Start Capture
  const handleStartCapture = () => {
    if (dataConnRef.current && isPartnerConnected) {
      dataConnRef.current.send({
        type: 'START_CAPTURE',
        photoCount,
      });
    }
    triggerCaptureSequenceLocally(photoCount);
  };

  // Bulk Upload fallback
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, photoCount);
      const promises = files.map((file, idx) => {
        return new Promise<CapturedFrame>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: `upload_${Date.now()}_${idx}`,
              canvasDataUrl: (event.target?.result as string) || '',
              timestamp: Date.now(),
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((frames) => {
        playSound('sparkle', soundEnabled);
        const layout: PhotoLayout = photoCount === 3 ? 'strip3' : 'strip4';
        onPhotosCaptured(frames, layout);
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 py-1">
      
      {/* 2-DEVICE REAL-TIME CONNECTION BAR */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-rose-200/80 dark:border-rose-950/60 shadow-xs rounded-3xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                Koneksi 2 HP / Laptop Live:
              </span>
              {isPartnerConnected ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Terhubung Live 🟢</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                  Belum Terhubung
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Bagikan link ke pasangan di kota lain agar muncul di kamera berdampingan.
            </p>
          </div>
        </div>

        {/* Action Connect Box */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/70 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            title="Salin Link Undangan Pasangan"
          >
            {isCopiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">Link Tersalin! 💌</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Salin Link Undangan</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowInviteModal(true);
              playSound('pop', soundEnabled);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/70 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            title="Kirim Link via WhatsApp / Buka Detail Undangan"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {!isPartnerConnected && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="text"
                value={partnerIdInput}
                onChange={(e) => setPartnerIdInput(extractCleanPeerId(e.target.value))}
                placeholder="ID Pasangan / Tempel Link..."
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono w-full sm:w-44 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400"
              />
              <button
                onClick={() => connectToPartner()}
                disabled={isConnecting || !partnerIdInput.trim()}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Koneksi...' : 'Hubungkan'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {connectionMessage && (
        <div className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400 -mt-2">
          {connectionMessage}
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Camera Box - Two 1:1 Squares Side by Side (Aspect 2:1 Total, No Cropping!) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Dual Frame Viewport: 2:1 Aspect Ratio (Bilah 1 is 1:1, Bilah 2 is 1:1) */}
          <div className="relative w-full aspect-[2/1] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/95 dark:border-slate-800">
            
            {/* Flash Effect */}
            {flash && (
              <div className="absolute inset-0 bg-white z-40 transition-opacity duration-100 pointer-events-none" />
            )}

            {/* Countdown Overlay (Crystal clear, NO BLUR) */}
            {countdown !== null && (
              <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center text-white select-none">
                <span className="text-8xl sm:text-[11rem] font-black text-white filter drop-shadow-[0_4px_24px_rgba(244,63,94,0.9)] animate-pulse">
                  {countdown}
                </span>
                <div className="mt-2 px-4 py-1.5 rounded-full bg-rose-600/90 text-white text-xs sm:text-sm font-extrabold border border-white/50 shadow-xl backdrop-blur-xs">
                  Foto {currentShotIndex} dari {photoCount} 📸
                </div>
              </div>
            )}

            {/* DUAL CAMERA VIEW (Two 1:1 Square Panes Side-by-Side: Bilah 1 is 1:1, Bilah 2 is 1:1) */}
            <div className="w-full h-full grid grid-cols-2">
              
              {/* BILAH 1: KAMERA KAMU (1:1 SQUARE) */}
              <div className="relative w-full h-full aspect-square bg-slate-900 flex items-center justify-center overflow-hidden border-r-2 border-white/40">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: filterStyles[activeFilter] }}
                  className={`w-full h-full object-cover transform -scale-x-100 transition duration-300 ${
                    isCameraActive ? 'block' : 'hidden'
                  }`}
                />

                {!isCameraActive && (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-slate-300 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-lg">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white">Kamera Kamu</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1 bg-rose-500/80 hover:bg-rose-500 text-white rounded-xl text-[11px] font-semibold transition cursor-pointer"
                    >
                      Buka Kamera
                    </button>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-semibold">
                  <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>Kamu</span>
                </div>
              </div>

              {/* BILAH 2: KAMERA PASANGAN */}
              <div className="relative w-full h-full aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                <video
                  ref={partnerVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: filterStyles[activeFilter] }}
                  className={`w-full h-full object-cover transform -scale-x-100 transition duration-300 ${
                    partnerStream ? 'block' : 'hidden'
                  }`}
                />

                {!partnerStream && partnerPhotoUrl && (
                  <img
                    src={partnerPhotoUrl}
                    alt="Foto Pasangan"
                    style={{ filter: filterStyles[activeFilter] }}
                    className="w-full h-full object-cover transition duration-300"
                  />
                )}

                {!partnerStream && !partnerPhotoUrl && (
                  <div className="flex flex-col items-center justify-center p-3 text-center text-slate-300 space-y-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-lg">
                      <Heart className="w-5 h-5 fill-rose-300 text-rose-300 animate-heartbeat" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Pasangan</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-[140px]">
                        Hubungkan ID di atas atau upload foto
                      </p>
                    </div>
                    <label className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[11px] font-medium cursor-pointer transition border border-white/20">
                      <Upload className="w-3 h-3" />
                      <span>Upload Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePartnerPhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-semibold">
                  <span className={`w-2 h-2 rounded-full ${partnerStream ? 'bg-emerald-400' : 'bg-pink-400'}`} />
                  <span>
                    {partnerStream
                      ? 'Pasangan (Live)'
                      : partnerPhotoUrl
                      ? 'Pasangan (Galeri)'
                      : 'Pasangan (Menunggu)'}
                  </span>
                </div>
              </div>
            </div>

            {/* IN-CAMERA FLOATING BOTTOM CONTROLS (Center-aligned, comfortable thumb reach) */}
            <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex items-center justify-center gap-5 px-4 pointer-events-auto">
              
              {/* Rotate Camera Button */}
              <button
                onClick={toggleFacingMode}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md text-white border border-white/30 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                title="Putar Kamera Depan / Belakang"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>

              {/* Primary Shutter Button */}
              <button
                onClick={handleStartCapture}
                disabled={isCapturing}
                className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/25 backdrop-blur-md p-1 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 border-2 border-white/80"
                title="Ambil Foto Sekarang"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center shadow-inner">
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
                </div>
              </button>

            </div>

            {/* Camera Notice */}
            {cameraError && (
              <div className="absolute top-3 inset-x-4 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between gap-2 text-white z-30 border border-white/20">
                <div className="flex items-center gap-2">
                  <VideoOff className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-[11px] text-slate-200">{cameraError}</span>
                </div>
                <button
                  onClick={startCamera}
                  className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                >
                  Coba Akses
                </button>
              </div>
            )}
          </div>

          {/* Preset Filters Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-xs transition-colors">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
              <span>Filter Warna Studio Romantis</span>
            </span>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(
                [
                  { id: 'normal', name: 'Asli', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' },
                  { id: 'warm', name: 'Warm Romance', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' },
                  { id: 'softglow', name: 'Soft Blush', bg: 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300' },
                  { id: 'vintage', name: 'Vintage Film', bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300' },
                  { id: 'bw', name: 'Classic B&W', bg: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
                  { id: 'rose', name: 'Rose Bloom', bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectFilter(f.id)}
                  className={`py-2 px-1 rounded-2xl text-xs font-bold text-center transition cursor-pointer border-2 ${
                    activeFilter === f.id
                      ? 'border-rose-500 shadow-xs bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold'
                      : 'border-transparent ' + f.bg
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Studio Control Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Format Selection Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-xs space-y-4 transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span>Pilihan Jumlah Pose Strip</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPhotoCount(3);
                  playSound('pop', soundEnabled);
                }}
                className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border-2 ${
                  photoCount === 3
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-rose-50/50'
                }`}
              >
                <span className="text-base font-black">3 Pose</span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">Strip Klasik Booth</span>
              </button>

              <button
                onClick={() => {
                  setPhotoCount(4);
                  playSound('pop', soundEnabled);
                }}
                className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border-2 ${
                  photoCount === 4
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-rose-50/50'
                }`}
              >
                <span className="text-base font-black">4 Pose</span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">Strip Panjang Estetik</span>
              </button>
            </div>

            {/* Bulk Upload Option */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <label className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer inline-flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Atau pilih {photoCount} foto dari galeri HP</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBulkUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL UNDANGAN LINK STUDIO PASANGAN */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💌</span>
                <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  Undang Pasangan ke Studio
                </h4>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bagikan link ini ke pasangan Anda agar kamera HP-nya langsung muncul berdampingan di bilah kanan secara <i>real-time</i>:
            </p>

            {/* Link Input Box with Auto-select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Link Khusus Studio Kamu:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getInviteUrl()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none select-all"
                />
                <button
                  onClick={async () => {
                    await copyTextToClipboard(getInviteUrl());
                    setIsCopiedLink(true);
                    playSound('pop', soundEnabled);
                    setTimeout(() => setIsCopiedLink(false), 2500);
                  }}
                  className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {isCopiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedLink ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Direct WhatsApp Share Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Yuk foto bareng di Studio Photobox Ruang Kenangan! Buka link ini di HP kamu: ${getInviteUrl()}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('pop', soundEnabled)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span className="text-base">💬</span>
              <span>Kirim Langsung ke WhatsApp Pasangan</span>
            </a>

            <div className="text-[11px] text-slate-400 dark:text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
              ID Kamera Perangkat Kamu: <code className="font-mono text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md">{myPeerId}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
