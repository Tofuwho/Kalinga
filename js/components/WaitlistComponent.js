/**
 * WaitlistComponent
 * Manages waitlist form submit events, email validation, persistent storage backup,
 * remote endpoint dispatch (Formspree/Webhook/API), and animated signup count updates.
 */
export default class WaitlistComponent {
  /**
   * @param {Object} config
   * @param {StorageService} config.storageService
   * @param {Function} [config.anime]
   * @param {string} [config.endpoint] Remote API / Formspree / Webhook endpoint URL
   * @param {string} [config.formId='waitlist-form']
   * @param {string} [config.emailInputId='waitlist-email']
   * @param {string} [config.submitBtnId='waitlist-submit']
   * @param {string} [config.statusId='waitlist-status']
   * @param {string} [config.countId='waitlist-count']
   * @param {string} [config.storageKey='kalinga-waitlist-count']
   * @param {string} [config.emailsKey='kalinga-waitlist-emails']
   */
  constructor({
    storageService,
    anime = (typeof window !== 'undefined' ? window.anime : null),
    endpoint = null,
    formId = 'waitlist-form',
    emailInputId = 'waitlist-email',
    submitBtnId = 'waitlist-submit',
    statusId = 'waitlist-status',
    countId = 'waitlist-count',
    storageKey = 'kalinga-waitlist-count',
    emailsKey = 'kalinga-waitlist-emails'
  } = {}) {
    this.storageService = storageService;
    this.anime = anime || (typeof window !== 'undefined' ? window.anime : null);
    this.endpoint = endpoint;
    this.storageKey = storageKey;
    this.emailsKey = emailsKey;
    this._lastCount = 0;

    this.formEl = document.getElementById(formId);
    this.emailInputEl = document.getElementById(emailInputId);
    this.submitBtnEl = document.getElementById(submitBtnId);
    this.statusEl = document.getElementById(statusId);
    this.countEl = document.getElementById(countId);
  }

  /**
   * Initializes event listeners and fetches initial signup count.
   */
  init() {
    this.refreshCount();
    if (this.formEl) {
      // Auto-detect endpoint from form action or data attribute if not passed in config
      if (!this.endpoint) {
        const action = this.formEl.getAttribute('action');
        const dataEndpoint = this.formEl.getAttribute('data-endpoint');
        if (dataEndpoint && dataEndpoint.trim() !== '') {
          this.endpoint = dataEndpoint.trim();
        } else if (action && action !== '#' && action.trim() !== '') {
          this.endpoint = action.trim();
        } else if (typeof window !== 'undefined' && window.KALINGA_WAITLIST_ENDPOINT) {
          this.endpoint = window.KALINGA_WAITLIST_ENDPOINT;
        }
      }

      this.formEl.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  /**
   * Retrieves all locally saved emails.
   * @returns {Promise<Array<{email: string, date: string}>>}
   */
  async getSavedEmails() {
    try {
      const raw = await this.storageService.get(this.emailsKey, true);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetches and displays the current waitlist signup count with animated count-up tween.
   */
  async refreshCount() {
    if (!this.countEl) return;
    try {
      const val = await this.storageService.get(this.storageKey, true);
      const count = val ? parseInt(val, 10) : 0;
      const from = this._lastCount ?? 0;
      const animeInstance = this.anime || (typeof window !== 'undefined' ? window.anime : null);

      if (count === 0) {
        this.countEl.textContent = 'Be the first to join';
      } else if (animeInstance) {
        const counter = { value: from };
        animeInstance({
          targets: counter,
          value: count,
          round: 1,
          duration: 600,
          easing: 'easeOutQuad',
          update: () => {
            const roundedVal = Math.round(counter.value);
            this.countEl.textContent = `${roundedVal} ${roundedVal === 1 ? 'parent has' : 'parents have'} joined so far`;
          }
        });
      } else {
        this.countEl.textContent = `${count} ${count === 1 ? 'parent has' : 'parents have'} joined so far`;
      }
      this._lastCount = count;
    } catch (err) {
      this.countEl.textContent = '';
    }
  }

  /**
   * Handles form submit event.
   * Validates, backs up email to local storage array, dispatches to endpoint if configured, and updates count.
   * @param {Event} e
   */
  async handleSubmit(e) {
    e.preventDefault();
    if (!this.emailInputEl) return;

    const email = this.emailInputEl.value.trim();
    if (!email || !email.includes('@')) {
      if (this.statusEl) {
        this.statusEl.classList.add('error');
        this.statusEl.textContent = 'Please enter a valid email address.';
      }
      return;
    }

    if (this.submitBtnEl) this.submitBtnEl.disabled = true;
    if (this.statusEl) {
      this.statusEl.classList.remove('error');
      this.statusEl.textContent = 'Adding you…';
    }

    try {
      // 1. Persistent backup: Save email record into storage array so no signup is ever lost
      const existingEmails = await this.getSavedEmails();
      const record = { email, date: new Date().toISOString() };
      existingEmails.push(record);
      await this.storageService.set(this.emailsKey, JSON.stringify(existingEmails), true);

      // 2. Dispatch to remote endpoint if configured (Formspree, Webhook, API)
      if (this.endpoint) {
        try {
          const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ email, timestamp: record.date })
          });

          if (!res.ok) {
            console.warn('[Kalinga] Remote endpoint rejected submission:', res.status, res.statusText);
          }
        } catch (fetchErr) {
          console.warn('[Kalinga] Remote endpoint dispatch failed, but email was backed up locally.', fetchErr);
        }
      }

      // 3. Increment signup count
      const currentVal = await this.storageService.get(this.storageKey, true);
      const current = currentVal ? parseInt(currentVal, 10) : 0;
      const next = current + 1;
      await this.storageService.set(this.storageKey, String(next), true);

      if (this.statusEl) {
        this.statusEl.classList.remove('error');
        this.statusEl.textContent = `You're on the list, #${next}.`;
      }
      if (this.formEl) this.formEl.reset();

      await this.refreshCount();
    } catch (err) {
      if (this.statusEl) {
        this.statusEl.classList.add('error');
        this.statusEl.textContent = "Couldn't save that — try again in a moment.";
      }
    } finally {
      if (this.submitBtnEl) this.submitBtnEl.disabled = false;
    }
  }
}
