/**
 * TimeService
 * Responsible for computing date and time values across time zones.
 *
 * NOTE ON DST: Uses fixed UTC hour offsets suitable for time zones without Daylight Saving Time transitions
 * (e.g. Riyadh UTC+3 and Manila UTC+8).
 */
export default class TimeService {
  /**
   * Returns Date object for a given UTC offset in hours.
   * @param {number} offsetHours
   * @returns {{ date: Date }}
   */
  getTimeAtOffset(offsetHours) {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetDate = new Date(utcMs + (3600000 * offsetHours));

    return {
      date: targetDate
    };
  }

  /**
   * Formats a Date object into a readable date string.
   * @param {Date} dateObj
   * @returns {string}
   */
  formatDate(dateObj) {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
}
