/**
 * Bangladesh Standard Time (BST) & Server Time Utilities
 * Timezone: Asia/Dhaka (UTC+06:00)
 */

export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';
export const BST_OFFSET_MINUTES = 360; // UTC+6 is +360 minutes
export const BST_OFFSET_MS = BST_OFFSET_MINUTES * 60 * 1000;

// Global server time offset in milliseconds (serverNow - localNow)
let serverTimeOffsetMs = 0;

export function setServerTimeOffset(serverTimestamp: number) {
  if (typeof serverTimestamp === 'number' && !isNaN(serverTimestamp)) {
    serverTimeOffsetMs = serverTimestamp - Date.now();
  }
}

export function getServerTimeOffset(): number {
  return serverTimeOffsetMs;
}

export function getEstimatedServerTime(): number {
  return Date.now() + serverTimeOffsetMs;
}

/**
 * Parses a Date string (YYYY-MM-DD or DD/MM/YYYY) and Time string (HH:MM or HH:MM AM/PM)
 * assumed to be in Bangladesh Local Time (UTC+06:00), and returns the canonical UTC Epoch Timestamp (ms).
 */
export function bangladeshTimeToUtcTimestamp(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return NaN;

  // Normalize date string (support YYYY-MM-DD or DD/MM/YYYY)
  let year = 2026, month = 1, day = 1;
  const cleanDate = dateStr.trim();

  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-').map(p => parseInt(p, 10));
    if (parts.length >= 3) {
      if (parts[0] > 1000) {
        // YYYY-MM-DD
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        // DD-MM-YYYY
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
    }
  } else if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/').map(p => parseInt(p, 10));
    if (parts.length >= 3) {
      if (parts[0] > 1000) {
        // YYYY/MM/DD
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        // DD/MM/YYYY
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
    }
  }

  // Parse time (e.g. "07:30 PM", "7:30 pm", "19:30", "07:30")
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

  // Construct UTC timestamp by calculating epoch ms in UTC+06:00
  // Date.UTC returns UTC milliseconds for the given components
  const utcForBst = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  // Subtract 6 hours (UTC+6) to get true UTC timestamp
  return utcForBst - BST_OFFSET_MS;
}

/**
 * Converts a UTC timestamp or ISO string into Bangladesh Local Date & Time components.
 */
export function getBangladeshDateTime(timestampOrIso: number | string): {
  year: number;
  month: number; // 1-12
  monthName: string;
  monthNameUpper: string;
  day: number;
  formattedDate: string; // e.g. "21 August 2026"
  formattedDateUpper: string; // e.g. "21 AUGUST 2026"
  formattedTime12: string; // e.g. "07:30 PM"
  formattedTime24: string; // e.g. "19:30"
  isoDate: string; // "2026-08-21"
  displayFull: string; // "21 August 2026, 07:30 PM (BST)"
} {
  let ts = typeof timestampOrIso === 'number' ? timestampOrIso : new Date(timestampOrIso).getTime();
  if (isNaN(ts)) {
    ts = Date.now();
  }

  // Add BST offset to get Bangladesh Local Time in UTC coordinate space
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
  const monthNameUpper = monthName.toUpperCase();

  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  const padHours12 = hours12.toString().padStart(2, '0');
  const padHours24 = rawHours.toString().padStart(2, '0');
  const padMinutes = minutes.toString().padStart(2, '0');
  const padDay = day.toString().padStart(2, '0');
  const padMonth = month.toString().padStart(2, '0');

  const formattedDate = `${day} ${monthName} ${year}`;
  const formattedDateUpper = `${day} ${monthNameUpper} ${year}`;
  const formattedTime12 = `${padHours12}:${padMinutes} ${ampm}`;
  const formattedTime24 = `${padHours24}:${padMinutes}`;
  const isoDate = `${year}-${padMonth}-${padDay}`;

  return {
    year,
    month,
    monthName,
    monthNameUpper,
    day,
    formattedDate,
    formattedDateUpper,
    formattedTime12,
    formattedTime24,
    isoDate,
    displayFull: `${formattedDate}, ${formattedTime12} (BST)`
  };
}

/**
 * Calculates real server-synchronized countdown from target timestamp.
 */
export function calculateCountdown(targetTimestamp: number): {
  hours: string;
  minutes: string;
  seconds: string;
  totalSeconds: number;
  isExpired: boolean;
  formatted: string;
} {
  const currentServerTime = getEstimatedServerTime();
  const difference = targetTimestamp - currentServerTime;

  if (difference <= 0 || isNaN(difference)) {
    return {
      hours: '00',
      minutes: '00',
      seconds: '00',
      totalSeconds: 0,
      isExpired: true,
      formatted: '00:00:00'
    };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const hoursStr = h.toString().padStart(2, '0');
  const minStr = m.toString().padStart(2, '0');
  const secStr = s.toString().padStart(2, '0');

  return {
    hours: hoursStr,
    minutes: minStr,
    seconds: secStr,
    totalSeconds,
    isExpired: false,
    formatted: `${hoursStr}:${minStr}:${secStr}`
  };
}
