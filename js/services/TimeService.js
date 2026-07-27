/**
 * ============================================================
 * TIME SERVICE
 * ============================================================
 *
 * A stateless utility service for computing date and time values
 * across different timezones. Used by TimeScrubComponent to
 * calculate the current time in Riyadh (UTC+3) and Manila (UTC+8).
 *
 * HOW THE UTC OFFSET MATH WORKS:
 * JavaScript's Date object always stores time in UTC internally.
 * To get the time in a specific timezone:
 *   1. Get the current UTC timestamp: now.getTime() + (now.getTimezoneOffset() * 60000)
 *      - getTimezoneOffset() returns the LOCAL timezone offset in minutes
 *      - Adding it cancels out the local offset, giving us pure UTC milliseconds
 *   2. Add the target timezone's offset: + (offsetHours * 3600000)
 *      - This shifts UTC to the target timezone
 *
 * WHY FIXED OFFSETS (not Intl.DateTimeFormat)?
 * Both Riyadh (Asia/Riyadh, UTC+3) and Manila (Asia/Manila, UTC+8)
 * observe fixed standard time year-round — neither uses Daylight
 * Saving Time. So simple arithmetic is accurate and faster than
 * the Intl API. If you add a timezone that observes DST in the
 * future, switch to Intl.DateTimeFormat with IANA timezone IDs.
 */
export default class TimeService {
  /**
   * Returns a Date object set to the current time at a given UTC offset.
   *
   * @param {number} offsetHours — The UTC offset in hours (e.g., 3 for Riyadh, 8 for Manila)
   * @returns {{ date: Date }} — Object containing the computed Date
   *
   * @example
   * const manila = timeService.getTimeAtOffset(8);
   * console.log(manila.date.getHours()); // → current hour in Manila
   */
  getTimeAtOffset(offsetHours) {
    const now = new Date();
    // Step 1: Convert local time to UTC milliseconds
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Step 2: Apply the target timezone offset
    const targetDate = new Date(utcMs + (3600000 * offsetHours));

    return {
      date: targetDate
    };
  }

  /**
   * Formats a Date object into a human-readable date string.
   * Example output: "Sunday, Jul 27"
   *
   * @param {Date} dateObj — The date to format
   * @returns {string} — Formatted date string
   */
  formatDate(dateObj) {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
}

