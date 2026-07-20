/**
 * TimeScrubComponent
 * Enables interactive dragging across 24 hours (0..1439 minutes).
 * Live-computes time for Manila (UTC+8) and Riyadh (UTC+3), updates clocks,
 * and dynamically calculates independent day/night sky brightness for both cities.
 */
export default class TimeScrubComponent {
  constructor({
    timeService,
    heroSelector = '.hero',
    sliderSelector = '.time-scrub',
    clockNightId = 'clock-night',
    dateNightId = 'date-night',
    clockDayId = 'clock-day',
    dateDayId = 'date-day',
    navTimeId = 'nav-time',
    nightOffset = 3,
    dayOffset = 8
  } = {}) {
    this.timeService = timeService;
    this.hero = document.querySelector(heroSelector);
    this.slider = document.querySelector(sliderSelector);
    this.nightOffset = nightOffset;
    this.dayOffset = dayOffset;
    this.liveMode = true;

    this.clockNightEl = document.getElementById(clockNightId);
    this.dateNightEl = document.getElementById(dateNightId);
    this.clockDayEl = document.getElementById(clockDayId);
    this.dateDayEl = document.getElementById(dateDayId);
    this.navTimeEl = document.getElementById(navTimeId);

    this.timerId = null;
  }

  /**
   * Cosine curve: 1.0 at local noon (720 min), 0.0 at local midnight (0 or 1440 min)
   * @param {number} minutes
   * @returns {number} 0.0 to 1.0
   */
  brightnessAt(minutes) {
    const hourAngle = ((minutes / 1440) * Math.PI * 2) - Math.PI / 2;
    return (Math.sin(hourAngle) + 1) / 2;
  }

  /**
   * Renders Manila and Riyadh clocks + sky brightness at specific Manila minute (0..1439)
   * @param {number} manilaMinutes
   */
  render(manilaMinutes) {
    // Offset calculation: Manila is UTC+8, Riyadh is UTC+3 (5 hours = 300 minutes behind Manila)
    const offsetMinutes = (this.dayOffset - this.nightOffset) * 60;
    const riyadhMinutes = (manilaMinutes - offsetMinutes + 1440) % 1440;

    // Set brightness variables on .hero container
    if (this.hero) {
      const manilaB = this.brightnessAt(manilaMinutes).toFixed(2);
      const riyadhB = this.brightnessAt(riyadhMinutes).toFixed(2);
      this.hero.style.setProperty('--day-brightness', manilaB);
      this.hero.style.setProperty('--night-brightness', riyadhB);
    }

    // Format time strings
    const manilaTime = this.minutesToTimeString(manilaMinutes);
    const riyadhTime = this.minutesToTimeString(riyadhMinutes);

    if (this.clockDayEl) this.clockDayEl.textContent = manilaTime;
    if (this.clockNightEl) this.clockNightEl.textContent = riyadhTime;

    if (this.navTimeEl) {
      this.navTimeEl.textContent = `${manilaTime.slice(0, 5)} MNL`;
    }

    // Sync slider value without triggering re-render
    if (this.slider && parseInt(this.slider.value, 10) !== Math.floor(manilaMinutes)) {
      this.slider.value = Math.floor(manilaMinutes);
    }
  }

  /**
   * Converts minutes (0..1439) into 12-hour formatted time string.
   * @param {number} totalMinutes
   * @returns {string}
   */
  minutesToTimeString(totalMinutes) {
    let hours = Math.floor(totalMinutes / 60);
    const mins = String(Math.floor(totalMinutes % 60)).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12;

    const hStr = String(hours).padStart(2, '0');
    return `${hStr}:${mins}:00 ${ampm}`;
  }

  /**
   * Updates real-time clock when in live mode.
   */
  tickLive() {
    if (!this.liveMode) return;
    const manilaObj = this.timeService.getTimeAtOffset(this.dayOffset);
    const riyadhObj = this.timeService.getTimeAtOffset(this.nightOffset);

    if (this.dateDayEl) this.dateDayEl.textContent = this.timeService.formatDate(manilaObj.date);
    if (this.dateNightEl) this.dateNightEl.textContent = this.timeService.formatDate(riyadhObj.date);

    const d = manilaObj.date;
    const manilaMinutes = (d.getHours() * 60) + d.getMinutes() + (d.getSeconds() / 60);
    this.render(manilaMinutes);
  }

  /**
   * Initializes event listeners and starts tick loop.
   */
  init() {
    this.tickLive();
    this.timerId = setInterval(() => this.tickLive(), 1000);

    if (!this.slider) return;

    this.slider.addEventListener('input', (e) => {
      this.liveMode = false;
      this.render(parseInt(e.target.value, 10));
    });

    // Double-click to resume live ticking time
    this.slider.addEventListener('dblclick', () => {
      this.liveMode = true;
      this.tickLive();
    });
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
