/**
 * 12-Hour Time & Date Utilities
 */

/**
 * Returns time formatted in 12-hour format with Arabic AM/PM indicator:
 * e.g. "08:15:30 ص" or "02:45:10 م"
 */
export function formatTime12Hour(dateInput: Date | number | string = new Date(), includeSeconds: boolean = true): string {
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  
  const period = hours >= 12 ? 'م' : 'ص'; // م = مساءً, ص = صباحاً
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour converts to 12

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (includeSeconds) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ${period}`;
  }
  return `${pad(hours)}:${pad(minutes)} ${period}`;
}

/**
 * Format date in Arabic localized standard: "الثلاثاء 22 سبتمبر 2026"
 */
export function formatDateArabic(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dayName = days[d.getDay()];
  const day = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName}، ${day} ${monthName} ${year}`;
}

/**
 * Get current date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate late minutes based on work start time (e.g. "08:00") and grace period
 */
export function calculateLateMinutes(checkInTimeStr: string, workStartTimeStr: string = "08:00", gracePeriodMinutes: number = 15): number {
  // checkInTimeStr might be "08:25:10 ص" or standard Date
  const d = new Date();
  const [startHourStr, startMinStr] = workStartTimeStr.split(':');
  const expectedStartTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), parseInt(startHourStr, 10), parseInt(startMinStr, 10), 0);
  
  const actualTime = new Date();
  const diffMs = actualTime.getTime() - expectedStartTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins > gracePeriodMinutes) {
    return diffMins;
  }
  return 0;
}
