/**
 * Server-side Bangladesh Standard Time (BST) & Canonical Timestamp conversion
 * Asia/Dhaka (UTC+06:00)
 */

export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';
export const BST_OFFSET_MINUTES = 360; // UTC+6
export const BST_OFFSET_MS = BST_OFFSET_MINUTES * 60 * 1000;

/**
 * Converts a Bangladesh local Date string (YYYY-MM-DD or DD/MM/YYYY) and Time string (HH:MM or HH:MM AM/PM)
 * into a canonical UTC timestamp (epoch ms).
 */
export function bangladeshTimeToUtcTimestamp(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return NaN;

  let year = 2026, month = 1, day = 1;
  const cleanDate = dateStr.trim();

  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-').map(p => parseInt(p, 10));
    if (parts.length >= 3) {
      if (parts[0] > 1000) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
    }
  } else if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/').map(p => parseInt(p, 10));
    if (parts.length >= 3) {
      if (parts[0] > 1000) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
    }
  }

  let hours = 20;
  let minutes = 0;
  const timeUpper = timeStr.trim().toUpperCase();
  const isPM = timeUpper.includes('PM');
  const isAM = timeUpper.includes('AM');

  const match = timeUpper.match(/(\d+)\s*[:.]\s*(\d+)/);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }

  const utcForBst = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  return utcForBst - BST_OFFSET_MS;
}

/**
 * Formats a UTC timestamp into Bangladesh Date, Time & Year components
 */
export function formatBangladeshDateTime(timestamp: number | string): {
  year: number;
  month: number;
  monthName: string;
  day: number;
  formattedDate: string; // e.g. "21 August 2026"
  formattedDateUpper: string; // e.g. "21 AUGUST 2026"
  formattedTime12: string; // e.g. "07:30 PM"
  formattedTime24: string; // e.g. "19:30"
  isoDate: string; // "2026-08-21"
  displayFull: string; // "21 August 2026, 07:30 PM (BST)"
} {
  let ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(ts)) {
    ts = Date.now();
  }

  const bstDate = new Date(ts + BST_OFFSET_MS);

  const year = bstDate.getUTCFullYear();
  const month = bstDate.getUTCMonth() + 1;
  const day = bstDate.getUTCDate();
  const rawHours = bstDate.getUTCHours();
  const minutes = bstDate.getUTCMinutes();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[month - 1] || 'August';

  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  const padHours12 = hours12.toString().padStart(2, '0');
  const padHours24 = rawHours.toString().padStart(2, '0');
  const padMinutes = minutes.toString().padStart(2, '0');
  const padDay = day.toString().padStart(2, '0');
  const padMonth = month.toString().padStart(2, '0');

  const formattedDate = `${day} ${monthName} ${year}`;
  const formattedDateUpper = `${day} ${monthName.toUpperCase()} ${year}`;
  const formattedTime12 = `${padHours12}:${padMinutes} ${ampm}`;
  const formattedTime24 = `${padHours24}:${padMinutes}`;
  const isoDate = `${year}-${padMonth}-${padDay}`;

  return {
    year,
    month,
    monthName,
    day,
    formattedDate,
    formattedDateUpper,
    formattedTime12,
    formattedTime24,
    isoDate,
    displayFull: `${formattedDate}, ${formattedTime12} (BST)`
  };
}
