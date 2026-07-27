/**
 * ============================================================
 * TIME SCRUB COMPONENT
 * ============================================================
 *
 * The most complex component in the app. It powers the hero section's
 * interactive dual-clock display and the time scrub slider.
 *
 * WHAT IT DOES:
 * 1. Displays live clocks for Manila (UTC+8) and Riyadh (UTC+3)
 * 2. Updates both clocks every second via setInterval
 * 3. Dynamically adjusts sky brightness via CSS custom properties
 * 4. Lets users drag along the seam to scrub through 24 hours
 * 5. Supports keyboard navigation (arrow keys, Home/End)
 * 6. Shows a "Back to live time" button after scrubbing
 *
 * CSS–JS BRIDGE:
 * This component writes two CSS custom properties on the .hero element:
 *   --day-brightness   (0.0 to 1.0)
 *   --night-brightness (0.0 to 1.0)
 * These are read by hero.css to control background gradients, star opacity,
 * and sunray opacity — making the sky respond to the time of day.
 *
 * TIME MODEL:
 * Time is represented as "minutes since midnight" (0–1439).
 * Manila minutes is the primary value; Riyadh is derived by subtracting
 * the 5-hour offset (300 minutes). This single-source approach ensures
 * both clocks always stay perfectly synchronized.
 *
 * ORIENTATION AWARENESS:
 * - Desktop (>640px): the seam is vertical, so dragging maps Y position
 * - Mobile (≤640px):  the seam is horizontal, so dragging maps X position
 * The component checks window.matchMedia on every pointer event to handle
 * orientation changes without requiring a page reload.
 *
 * DST NOTE:
 * Both Riyadh (Asia/Riyadh, UTC+3) and Manila (Asia/Manila, UTC+8) observe
 * fixed standard time year-round. The 5-hour offset arithmetic assumes no
 * DST transitions. If adding regions that observe DST in the future,
 * switch to Intl.DateTimeFormat with explicit IANA timeZone identifiers.
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
    this._lastMinutes = 0;

    this.clockNightEl = document.getElementById(clockNightId);
    this.dateNightEl = document.getElementById(dateNightId);
    this.clockDayEl = document.getElementById(clockDayId);
    this.dateDayEl = document.getElementById(dateDayId);
    this.navTimeEl = document.getElementById(navTimeId);

    this.timerId = null;
  }

  /**
   * Calculates sky brightness for a given time of day using a sine curve.
   *
   * Returns 1.0 at local noon (720 minutes) and 0.0 at midnight (0 or 1440 minutes).
   * This maps naturally to sky appearance: bright at noon, dark at midnight,
   * with smooth dawn/dusk transitions.
   *
   * The math:
   * 1. Convert minutes to an angle (0–2π over 24 hours)
   * 2. Shift by -π/2 so that midnight = 0 brightness (sin trough)
   * 3. Normalize sin output from [-1, 1] to [0, 1]
   *
   * @param {number} minutes — Minutes since midnight (0–1439)
   * @returns {number} Brightness value from 0.0 (midnight) to 1.0 (noon)
   */
  brightnessAt(minutes) {
    const hourAngle = ((minutes / 1440) * Math.PI * 2) - Math.PI / 2;
    return (Math.sin(hourAngle) + 1) / 2;
  }

  /**
   * Renders Manila and Riyadh clocks, dates, sky brightness, ARIA slider attributes, and scrub thumb position.
   * @param {number} manilaMinutes
   */
  render(manilaMinutes) {
    this._lastMinutes = manilaMinutes;
    const roundedMin = Math.round(manilaMinutes);
    // Check current layout to determine slider orientation
    const isVertical = window.matchMedia('(min-width: 641px)').matches;

    // Update ARIA attributes for screen reader accessibility
    if (this.slider) {
      this.slider.setAttribute('aria-valuemin', '0');
      this.slider.setAttribute('aria-valuemax', '1439');
      this.slider.setAttribute('aria-valuenow', String(roundedMin));
      this.slider.setAttribute('aria-valuetext', `${this.minutesToTimeString(manilaMinutes)} Manila time`);
      this.slider.setAttribute('aria-orientation', isVertical ? 'vertical' : 'horizontal');
    }

    // Derive Riyadh time from Manila time by subtracting the timezone difference.
    // offsetMinutes = (8 - 3) * 60 = 300 minutes = 5 hours
    // The +1440 and %1440 handle day-boundary wrapping (e.g., Manila 2:00 AM → Riyadh 9:00 PM previous day)
    const offsetMinutes = (this.dayOffset - this.nightOffset) * 60;
    const riyadhMinutes = (manilaMinutes - offsetMinutes + 1440) % 1440;

    // 1. Sky brightness → writes CSS custom properties read by hero.css
    //    These drive the background gradient blending, star opacity, and sunray opacity
    if (this.hero) {
      const manilaB = this.brightnessAt(manilaMinutes).toFixed(2);
      const riyadhB = this.brightnessAt(riyadhMinutes).toFixed(2);
      this.hero.style.setProperty('--day-brightness', manilaB);   // 0.0 = night sky, 1.0 = day sky
      this.hero.style.setProperty('--night-brightness', riyadhB); // 0.0 = dark, 1.0 = bright
    }

    // 2. Position the visible scrub thumb dot along the seam line.
    //    Desktop: moves vertically (top). Mobile: moves horizontally (left).
    if (this.thumbEl) {
      const pct = ((manilaMinutes / 1439) * 100).toFixed(2);
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
   * Initializes pointer drag handlers, keyboard navigation, and real-time interval.
   */
  init() {
    // Immediately render the current time, then update every second
    this.tickLive();
    this.timerId = setInterval(() => this.tickLive(), 1000);

    if (!this.slider || !this.hero) return;

    let dragging = false;

    /**
     * Maps a pointer event's position to a minute value (0–1439).
     * Desktop: maps Y position within the hero to minutes (top=0, bottom=1439)
     * Mobile: maps X position within the hero to minutes (left=0, right=1439)
     */
    const getValueFromEvent = (e) => {
      const rect = this.hero.getBoundingClientRect();
      const isVertical = window.matchMedia('(min-width: 641px)').matches;
      const clientPos = e.touches ? e.touches[0] : e;  // Support both mouse and touch

      // Calculate ratio: 0.0 at top/left edge, 1.0 at bottom/right edge
      const ratio = isVertical
        ? (clientPos.clientY - rect.top) / rect.height
        : (clientPos.clientX - rect.left) / rect.width;

      // Clamp to valid minute range and round to nearest integer
      return Math.min(1439, Math.max(0, Math.round(ratio * 1439)));
    };

    // Handler for drag movement — exits live mode and renders the scrubbed time
    const onMove = (e) => {
      if (!dragging) return;
      this.liveMode = false;  // Stop the 1-second interval from overwriting our scrubbed time
      if (this.backToNowEl) this.backToNowEl.hidden = false;  // Show "Back to live time" button
      this.render(getValueFromEvent(e));
    };

    // Start dragging on pointer down (mouse click or touch start)
    this.slider.addEventListener('pointerdown', (e) => {
      dragging = true;
      onMove(e);
    });

    // Listen on window (not just the slider) so dragging continues even if
    // the pointer moves outside the slider bounds during a fast drag
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', () => {
      dragging = false;
    });

    // KEYBOARD ACCESSIBILITY for role="slider"
    // Arrow keys move ±15 minutes. Home/End jump to midnight/end of day.
    // This makes the slider fully usable without a mouse or touch screen.
    this.slider.addEventListener('keydown', (e) => {
      // Map arrow keys to minute increments (+15 or -15 minutes)
      const step = { ArrowUp: 15, ArrowRight: 15, ArrowDown: -15, ArrowLeft: -15 }[e.key];
      if (step === undefined && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      this.liveMode = false;
      if (this.backToNowEl) this.backToNowEl.hidden = false;

      const current = this._lastMinutes ?? 0;
      // Home = 00:00 (minute 0), End = 23:59 (minute 1439)
      // Arrow keys wrap around: 23:45 + 15min = 00:00
      let next = e.key === 'Home' ? 0 : e.key === 'End' ? 1439 : (Math.round(current) + step + 1440) % 1440;
      this.render(next);
    });

    // "Back to live time" button — resets to real-time mode
    if (this.backToNowEl) {
      this.backToNowEl.addEventListener('click', () => {
        this.liveMode = true;
        this.backToNowEl.hidden = true;
        this.tickLive();  // Immediately render current time
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
