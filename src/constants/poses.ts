export interface PoseGuide {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const POSE_GUIDES: PoseGuide[] = [
  {
    id: 'half_heart',
    emoji: '🫶',
    title: 'Setengah Hati Cinta',
    description: 'Bentuk setengah hati dengan satu tangan di tepi frame agar bersatu dengan pasangan!',
  },
  {
    id: 'blowing_kiss',
    emoji: '💋',
    title: 'Kirim Ciuman Manis',
    description: 'Dekatkan tangan ke bibir dan tiup ciuman sayang ke arah kamera.',
  },
  {
    id: 'finger_heart',
    emoji: '🫰',
    title: 'Finger Heart Korea',
    description: 'Silangkan jempol dan telunjuk membentuk hati mini yang imut.',
  },
  {
    id: 'pinky_promise',
    emoji: '🤙',
    title: 'Pinky Promise Abadi',
    description: 'Arahkan jari kelingking ke tengah kamera seperti sedang berjanji setia.',
  },
  {
    id: 'cheeky_smile',
    emoji: '🥰',
    title: 'Pipi Gemas Senyum',
    description: 'Sentuh kedua pipi dengan telapak tangan sambil tersenyum paling manis.',
  },
  {
    id: 'virtual_hug',
    emoji: '🤗',
    title: 'Pelukan Hangat Virtual',
    description: 'Rentangkan kedua tangan seolah sedang memeluk pasangan di layar.',
  },
  {
    id: 'peace_v',
    emoji: '✌️',
    title: 'Double V Peace',
    description: 'Pose peace klasik di samping mata dengan senyuman paling ceria!',
  },
  {
    id: 'love_letter',
    emoji: '💌',
    title: 'Pegang Catatan Cinta',
    description: 'Pegang secarik kertas kecil berisi pesan manis untuk pasanganmu.',
  },
];
