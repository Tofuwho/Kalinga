/**
 * TimeService
 * Responsible for computing date and time values across multiple UTC time zones.
 */
export default class TimeService {
  /**
   * Returns formatted time string and Date object for a given UTC offset in hours.
   * @param {number} offsetHours
   * @returns {{ time: string, date: Date, rawTime: string }}
   */
  getTimeAtOffset(offsetHours) {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetDate = new Date(utcMs + (3600000 * offsetHours));

    let hours = targetDate.getHours();
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    const seconds = String(targetDate.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12;

    const formattedHours = String(hours).padStart(2, '0');
    const timeString = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    const shortTimeString = `${formattedHours}:${minutes} ${ampm}`;

    return {
      time: timeString,
      shortTime: shortTimeString,
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
