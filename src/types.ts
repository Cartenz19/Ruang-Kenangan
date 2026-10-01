export type PhotoLayout = 'strip3' | 'strip4' | 'polaroid';

export type FrameTheme = 
  | 'blush'
  | 'airmail'
  | 'minimal'
  | 'noir'
  | 'lavender'
  | 'champagne';

export type PhotoFilter = 
  | 'normal'
  | 'warm'
  | 'softglow'
  | 'vintage'
  | 'bw'
  | 'rose';

export interface CapturedFrame {
  id: string;
  canvasDataUrl: string;
  timestamp: number;
}

export interface SavedMemory {
  id: string;
  title: string;
  caption: string;
  coupleNames: string;
  city1?: string;
  city2?: string;
  distanceKm?: number;
  dateStr: string;
  imageDataUrl: string;
  layout: PhotoLayout;
  theme: FrameTheme;
  createdAt: number;
}
