/**
 * Time and Date formatting utilities for Al-Fajr Foundation
 */

export function getCurrentTime12h(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const isPm = hours >= 12;

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const period = isPm ? 'مساءً' : 'صباحاً';

  return `${hh}:${mm}:${ss} ${period}`;
}

export function getCurrentTime24h(date: Date = new Date()): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatDateNumeric(date: Date = new Date()): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateIso(date: Date = new Date()): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatDateArabicLong(date: Date = new Date()): string {
  const dayName = ARABIC_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}، ${dayNum} ${monthName} ${year}`;
}

/**
 * Converts a time string "HH:mm:ss" or "HH:mm" to total seconds of the day
 */
export function timeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds into Arabic text, e.g.
 * 1055s -> "17 دقيقة و35 ثانية"
 * 6138s -> "01 ساعة و42 دقيقة و18 ثانية"
 * 19601s -> "05 ساعات و26 دقيقة و41 ثانية"
 */
export function formatSecondsToArabic(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'لا يوجد تأخر';

  const hours = Math.floor(totalSeconds / 3600);
  const remaining = totalSeconds % 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const parts: string[] = [];

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    if (hours === 1) {
      parts.push('01 ساعة');
    } else if (hours === 2) {
      parts.push('02 ساعتان');
    } else if (hours >= 3 && hours <= 10) {
      parts.push(`${hh} ساعات`);
    } else {
      parts.push(`${hh} ساعة`);
    }
  }

  if (minutes > 0 || hours > 0) {
    const mm = minutes.toString().padStart(2, '0');
    if (minutes === 1) {
      parts.push('دقيقة واحدة');
    } else if (minutes === 2) {
      parts.push('دقيقتان');
    } else if (minutes >= 3 && minutes <= 10) {
      parts.push(`${mm} دقائق`);
    } else {
      parts.push(`${mm} دقيقة`);
    }
  }

  const ss = seconds.toString().padStart(2, '0');
  if (seconds === 1) {
    parts.push('ثانية واحدة');
  } else if (seconds === 2) {
    parts.push('ثانيتان');
  } else if (seconds >= 3 && seconds <= 10) {
    parts.push(`${ss} ثوانٍ`);
  } else {
    parts.push(`${ss} ثانية`);
  }

  return parts.join(' و ');
}

/**
 * Short representation for tables, e.g. "17:35" or "01:42:18"
 */
export function formatSecondsDigital(totalSeconds: number): string {
  if (totalSeconds <= 0) return '—';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Calculates late seconds given official work start and actual arrival
 */
export function calculateLateSeconds(
  actualArrival: string,
  workStart: string = '08:00:00',
  gracePeriodMinutes: number = 0
): number {
  const arrivalSec = timeStringToSeconds(actualArrival);
  const startSec = timeStringToSeconds(workStart);
  const graceSec = gracePeriodMinutes * 60;

  // If arrived within grace period, check if late
  if (arrivalSec > startSec + graceSec) {
    // If exceeded grace period, count from workStart
    return arrivalSec - startSec;
  }
  return 0;
}

/**
 * Calculates early departure seconds
 */
export function calculateEarlyDepartureSeconds(
  actualDeparture: string,
  workEnd: string = '14:00:00'
): number {
  const departureSec = timeStringToSeconds(actualDeparture);
  const endSec = timeStringToSeconds(workEnd);

  if (departureSec < endSec) {
    return endSec - departureSec;
  }
  return 0;
}
