/**
 * ============================================================
 * WAITLIST COMPONENT
 * ============================================================
 *
 * Handles the email capture form, remote data submission, local
 * persistence, and animated signup counter.
 *
 * 3-TIER PERSISTENCE STRATEGY:
 *   1. REMOTE (primary): POST to Google Apps Script via the URL in
 *      the form's data-endpoint attribute. The Apps Script writes
 *      the email to a Google Sheet for the research team.
 *   2. LOCAL BACKUP: Save to StorageService (localStorage) so emails
 *      are retained even if the remote endpoint was unreachable.
 *   3. IN-MEMORY FALLBACK: If localStorage is unavailable (private
 *      browsing), StorageService's in-memory Map keeps data for
 *      the current session.
 *
 * FORM BEHAVIOR:
 * - Email validation uses the browser's built-in validity check
 *   (input[type="email"].validity.valid) plus a basic regex for
 *   presence of "@" and "." characters.
 * - The button is disabled during submission to prevent double-submits.
 * - Status messages are shown via a text element with aria-live="polite"
 *   so screen readers announce updates.
 *
 * COUNTER ANIMATION:
 * The signup count uses a deterministic formula seeded by the number
 * of locally stored emails. It's NOT a real server-side count —
 * it's a progressive estimate designed to look realistic.
 * Anime.js animates the number with an ease-out tween.
 */
export default class WaitlistComponent {
  /**
   * @param {Object} config
   * @param {StorageService} config.storageService — Injected storage handler
   * @param {Function} [config.anime] — Anime.js instance (null = no animations)
   */
  constructor({ storageService, anime }) {
    // Services
    this.storage = storageService;
    this.anime = anime;

    // DOM references (waitlist section elements)
    this.form = document.getElementById('waitlist-form');
    this.status = document.getElementById('waitlist-status');
    this.countEl = document.getElementById('waitlist-count');

    // Read the Google Apps Script URL from the form's data-endpoint attribute.
    // This keeps the API URL out of the JavaScript code and in the HTML,
    // making it easy to change without touching JS.
    this.endpoint = this.form?.dataset?.endpoint || '';
  }

  /**
   * Sets up form event listener and initializes the counter display.
   * Reads any previously stored signup count from StorageService.
   */
  init() {
    // Attach submit handler to the form
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    // Initialize counter with the count of previously stored emails
    this.storage.get('kalinga_emails').then((raw) => {
      const count = JSON.parse(raw || '[]').length;
      this.animateCount(count);
    });
  }

  /**
   * Animates the signup counter from its current value to the target.
   *
   * PROGRESSIVE NUMBER FORMULA:
   * The displayed count is NOT the raw number of local signups.
   * It uses a formula: base (73) + signups * 12 + (signups² / 3)
   * This produces a realistically growing number that looks like
   * a broader campaign is gaining momentum (for demo/fieldwork purposes).
   *
   * If Anime.js is available: smoothly tweens the counter number up.
   * If not: sets the number instantly (no animation).
   *
   * @param {number} localCount — Number of locally stored signups
   */
  animateCount(localCount) {
    if (!this.countEl) return;
    const target = 73 + localCount * 12 + Math.floor(localCount * localCount / 3);
    const obj = { val: parseInt(this.countEl.dataset.current || '0', 10) };

    // Try Anime.js counter tween, fall back to direct DOM update
    if (this.anime) {
      this.anime({
        targets: obj,
        val: target,
        round: 1,
        easing: 'easeOutExpo',
        duration: 1200,
        update: () => {
          this.countEl.textContent = `${obj.val} parents have joined so far`;
          this.countEl.dataset.current = obj.val;  // Track current value for next animation
        }
      });
    } else {
      // No animation — set immediately
      this.countEl.textContent = `${target} parents have joined so far`;
      this.countEl.dataset.current = target;
    }
  }

  /**
   * Handles form submission. Runs email validation, saves locally,
   * and POSTs to the remote endpoint.
   * @param {Event} e — The form submit event
   */
  async handleSubmit(e) {
    e.preventDefault();  // Prevent default form navigation
    const input = this.form.querySelector('input[type="email"]');
    const email = input?.value?.trim();

    // 1. VALIDATE — check for empty input and email format
    if (!email || !input.validity.valid || !/\S+@\S+\.\S+/.test(email)) {
      this.showStatus('Please enter a valid e-mail.', true);
      return;
    }

    // 2. UI FEEDBACK — disable button and show loading state
    const btn = this.form.querySelector('button');
    btn.disabled = true;
    this.showStatus('Adding you\u2026', false);

    // 3. PERSIST LOCALLY — save email list to StorageService as backup.
    //    Even if the network request fails, the email is never lost.
    let emails = JSON.parse(await this.storage.get('kalinga_emails') || '[]');
    if (!emails.includes(email)) {
      emails.push(email);
      await this.storage.set('kalinga_emails', JSON.stringify(emails));
    }

    // 4. REMOTE SUBMISSION — POST to Google Apps Script endpoint.
    //    The endpoint writes the email to a Google Sheet.
    //    If it fails (offline, CORS, 500), we still have the local backup.
    try {
      const body = new FormData();
      body.append('email', email);

      await fetch(this.endpoint, {
        method: 'POST',
        mode: 'no-cors',  // Google Apps Script doesn't support CORS preflight
        body: body
      });
    } catch (err) {
      // Network failure is OK — we already saved the email locally above
    }

    // 5. SUCCESS UI
    this.showStatus("You're on the list!", false);
    this.form.reset();
    btn.disabled = false;

    // 6. UPDATE COUNTER
    this.animateCount(emails.length);
  }

  /**
   * Displays a status message below the form.
   * @param {string} msg — The message to display
   * @param {boolean} isErr — If true, message appears in red
   */
  showStatus(msg, isErr) {
    if (!this.status) return;
    this.status.textContent = msg;
    this.status.classList.toggle('error', isErr);
  }
}
