/**
 * Kalinga Application Bundle
 * Standalone browser-ready OOP script supporting direct file:// launch and HTTP servers.
 */

// 1. TimeService
class TimeService {
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

  formatDate(dateObj) {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
}

// 2. StorageService
class StorageService {
  constructor() {
    this._memoryFallback = new Map();
  }

  async get(key, shared = true) {
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
      try {
        const res = await window.storage.get(key, shared);
        return res && res.value !== undefined ? res.value : null;
      } catch (err) {}
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {}
    }

    return this._memoryFallback.has(key) ? this._memoryFallback.get(key) : null;
  }

  async set(key, value, shared = true) {
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
      try {
        await window.storage.set(key, String(value), shared);
        return true;
      } catch (err) {}
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch (err) {}
    }

    this._memoryFallback.set(key, String(value));
    return true;
  }
}

// 3. DualClockComponent
class DualClockComponent {
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

  start() {
    this.updateClocks();
    this.timerId = setInterval(() => this.updateClocks(), 1000);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

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

// 4. WaitlistComponent
class WaitlistComponent {
  constructor({
    storageService,
    formId = 'waitlist-form',
    emailInputId = 'waitlist-email',
    submitBtnId = 'waitlist-submit',
    statusId = 'waitlist-status',
    countId = 'waitlist-count',
    storageKey = 'kalinga-waitlist-count'
  }) {
    this.storageService = storageService;
    this.storageKey = storageKey;

    this.formEl = document.getElementById(formId);
    this.emailInputEl = document.getElementById(emailInputId);
    this.submitBtnEl = document.getElementById(submitBtnId);
    this.statusEl = document.getElementById(statusId);
    this.countEl = document.getElementById(countId);
  }

  init() {
    this.refreshCount();
    if (this.formEl) {
      this.formEl.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async refreshCount() {
    if (!this.countEl) return;
    try {
      const val = await this.storageService.get(this.storageKey, true);
      const count = val ? parseInt(val, 10) : 0;

      if (count > 0) {
        this.countEl.textContent = `${count} ${count === 1 ? 'parent has' : 'parents have'} joined so far`;
      } else {
        this.countEl.textContent = 'Be the first to join';
      }
    } catch (err) {
      this.countEl.textContent = '';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.emailInputEl) return;

    const email = this.emailInputEl.value.trim();
    if (!email) return;

    if (this.submitBtnEl) this.submitBtnEl.disabled = true;
    if (this.statusEl) this.statusEl.textContent = 'Adding you…';

    try {
      const currentVal = await this.storageService.get(this.storageKey, true);
      const current = currentVal ? parseInt(currentVal, 10) : 0;
      const next = current + 1;

      await this.storageService.set(this.storageKey, String(next), true);

      if (this.statusEl) this.statusEl.textContent = `You're on the list, #${next}.`;
      if (this.formEl) this.formEl.reset();

      await this.refreshCount();
    } catch (err) {
      if (this.statusEl) this.statusEl.textContent = "Couldn't save that — try again in a moment.";
    } finally {
      if (this.submitBtnEl) this.submitBtnEl.disabled = false;
    }
  }
}

// 5. Main Application Orchestrator
class App {
  constructor() {
    this.timeService = new TimeService();
    this.storageService = new StorageService();

    this.dualClock = new DualClockComponent({
      timeService: this.timeService
    });

    this.waitlist = new WaitlistComponent({
      storageService: this.storageService
    });
  }

  init() {
    this.dualClock.start();
    this.waitlist.init();
  }
}

// Instantiate App when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}
