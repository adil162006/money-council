import { format, parseISO, addDays, startOfWeek } from 'date-fns';

/**
 * Returns 7 days of the week starting from Monday, relative to the selected date.
 */
export function getWeekDays(selectedDate: Date): Date[] {
  const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
export function formatDateToYMD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats YYYY-MM-DD or ISO string to a human-readable date.
 * E.g., "Wednesday, 27 May"
 */
export function formatReadableDate(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'EEEE, d MMMM');
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Formats Date to abbreviation of day. E.g., "Mon"
 */
export function formatDayName(date: Date): string {
  return format(date, 'EEE');
}

/**
 * Formats Date to day number. E.g., "27"
 */
export function formatDayNum(date: Date): string {
  return format(date, 'd');
}
