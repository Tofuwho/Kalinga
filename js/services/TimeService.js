/**
 * TimeService
 * Responsible for computing date and time values across multiple UTC time zones.
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
