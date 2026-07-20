/**
 * WaitlistComponent
 * Manages waitlist form submit events, validation, state feedback, and signup count updates.
 */
export default class WaitlistComponent {
  /**
   * @param {Object} config
   * @param {StorageService} config.storageService
   * @param {string} config.formId
   * @param {string} config.emailInputId
   * @param {string} config.submitBtnId
   * @param {string} config.statusId
   * @param {string} config.countId
   * @param {string} [config.storageKey='kalinga-waitlist-count']
   */
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

  /**
   * Initializes event listeners and fetches initial signup count.
   */
  init() {
    this.refreshCount();
    if (this.formEl) {
      this.formEl.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  /**
   * Fetches and displays the current waitlist signup count.
   */
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

  /**
   * Handles form submit event.
   * @param {Event} e
   */
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
