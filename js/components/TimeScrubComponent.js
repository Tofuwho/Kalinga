/**
 * TimeScrubComponent
 * Interactive time scrubbing across 24 hours with orientation-aware pointer dragging.
 * Computes live dates, clocks, and independent sky brightness for Manila (UTC+8) and Riyadh (UTC+3).
 */
export default class TimeScrubComponent {
  constructor({
    timeService,
    heroSelector = '.hero',
    sliderSelector = '.time-scrub',
    thumbId = 'scrub-thumb',
    backToNowId = 'back-to-now',
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
    this.thumbEl = document.getElementById(thumbId);
    this.backToNowEl = document.getElementById(backToNowId);
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
   * Renders Manila and Riyadh clocks, dates, sky brightness, and scrub thumb position for any Manila minute (0..1439).
   * @param {number} manilaMinutes
   */
  render(manilaMinutes) {
    const offsetMinutes = (this.dayOffset - this.nightOffset) * 60;
    const riyadhMinutes = (manilaMinutes - offsetMinutes + 1440) % 1440;

    // 1. Sky brightness calculation
    if (this.hero) {
      const manilaB = this.brightnessAt(manilaMinutes).toFixed(2);
      const riyadhB = this.brightnessAt(riyadhMinutes).toFixed(2);
      this.hero.style.setProperty('--day-brightness', manilaB);
      this.hero.style.setProperty('--night-brightness', riyadhB);
    }

    // 2. Position scrub thumb handle along the seam line
    if (this.thumbEl) {
      const pct = ((manilaMinutes / 1439) * 100).toFixed(2);
      const isVertical = window.matchMedia('(min-width: 641px)').matches;
      this.thumbEl.style.top = isVertical ? `${pct}%` : '50%';
      this.thumbEl.style.left = isVertical ? '50%' : `${pct}%`;
    }

    // 3. Compute live date objects for calendar day boundary changes
    const now = new Date();
    const manilaDate = new Date(now);
    manilaDate.setHours(Math.floor(manilaMinutes / 60), Math.floor(manilaMinutes % 60), 0);

    const riyadhDate = new Date(manilaDate.getTime() - (offsetMinutes * 60000));

    // 4. Format clocks and date labels
    const manilaTime = this.minutesToTimeString(manilaMinutes);
    const riyadhTime = this.minutesToTimeString(riyadhMinutes);

    if (this.clockDayEl) this.clockDayEl.textContent = manilaTime;
    if (this.clockNightEl) this.clockNightEl.textContent = riyadhTime;

    if (this.dateDayEl) this.dateDayEl.textContent = this.timeService.formatDate(manilaDate);
    if (this.dateNightEl) this.dateNightEl.textContent = this.timeService.formatDate(riyadhDate);

    if (this.navTimeEl) {
      this.navTimeEl.textContent = `${manilaTime.slice(0, 5)} MNL`;
    }
  }

  /**
   * Converts minutes (0..1439) into 12-hour formatted time string (HH:MM AM/PM).
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
    return `${hStr}:${mins} ${ampm}`;
  }

  /**
   * Updates real-time clock when in live mode.
   */
  tickLive() {
    if (!this.liveMode) return;
    const manilaObj = this.timeService.getTimeAtOffset(this.dayOffset);
    const d = manilaObj.date;
    const manilaMinutes = (d.getHours() * 60) + d.getMinutes() + (d.getSeconds() / 60);
    this.render(manilaMinutes);
  }

  /**
   * Initializes pointer drag handlers and real-time interval.
   */
  init() {
    this.tickLive();
    this.timerId = setInterval(() => this.tickLive(), 1000);

    if (!this.slider || !this.hero) return;

    let dragging = false;

    const getValueFromEvent = (e) => {
      const rect = this.hero.getBoundingClientRect();
      const isVertical = window.matchMedia('(min-width: 641px)').matches;
      const clientPos = e.touches ? e.touches[0] : e;

      const ratio = isVertical
        ? (clientPos.clientY - rect.top) / rect.height
        : (clientPos.clientX - rect.left) / rect.width;

      return Math.min(1439, Math.max(0, Math.round(ratio * 1439)));
    };

    const onMove = (e) => {
      if (!dragging) return;
      this.liveMode = false;
      if (this.backToNowEl) this.backToNowEl.hidden = false;
      this.render(getValueFromEvent(e));
    };

    this.slider.addEventListener('pointerdown', (e) => {
      dragging = true;
      onMove(e);
    });

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', () => {
      dragging = false;
    });

    if (this.backToNowEl) {
      this.backToNowEl.addEventListener('click', () => {
        this.liveMode = true;
        this.backToNowEl.hidden = true;
        this.tickLive();
      });
    }
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
