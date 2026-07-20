/**
 * DualClockComponent
 * Controls the real-time ticking clock UI for Riyadh (UTC+3) and Manila (UTC+8).
 */
export default class DualClockComponent {
  /**
   * @param {Object} config
   * @param {TimeService} config.timeService
   * @param {string} config.clockNightId
   * @param {string} config.dateNightId
   * @param {string} config.clockDayId
   * @param {string} config.dateDayId
   * @param {string} config.navTimeId
   * @param {number} [config.nightOffset=3]
   * @param {number} [config.dayOffset=8]
   */
  constructor({
    timeService,
    clockNightId = 'clock-night',
    dateNightId = 'date-night',
    clockDayId = 'clock-day',
    dateDayId = 'date-day',
    navTimeId = 'nav-time',
    nightOffset = 3,
    dayOffset = 8
  }) {
    this.timeService = timeService;
    this.nightOffset = nightOffset;
    this.dayOffset = dayOffset;

    this.clockNightEl = document.getElementById(clockNightId);
    this.dateNightEl = document.getElementById(dateNightId);
    this.clockDayEl = document.getElementById(clockDayId);
    this.dateDayEl = document.getElementById(dateDayId);
    this.navTimeEl = document.getElementById(navTimeId);

    this.timerId = null;
  }

  /**
   * Starts the 1-second tick loop.
   */
  start() {
    this.updateClocks();
    this.timerId = setInterval(() => this.updateClocks(), 1000);
  }

  /**
   * Stops the tick loop.
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Performs a single DOM update tick.
   */
  updateClocks() {
    const riyadh = this.timeService.getTimeAtOffset(this.nightOffset);
    const manila = this.timeService.getTimeAtOffset(this.dayOffset);

    if (this.clockNightEl) this.clockNightEl.textContent = riyadh.time;
    if (this.dateNightEl) this.dateNightEl.textContent = this.timeService.formatDate(riyadh.date);

    if (this.clockDayEl) this.clockDayEl.textContent = manila.time;
    if (this.dateDayEl) this.dateDayEl.textContent = this.timeService.formatDate(manila.date);

    if (this.navTimeEl) {
      this.navTimeEl.textContent = `${manila.time.slice(0, 5)} MNL`;
    }
  }
}
