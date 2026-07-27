/**
 * ============================================================
 * STORAGE SERVICE
 * ============================================================
 *
 * A unified, asynchronous key-value storage handler with a 3-tier
 * fallback chain to ensure data is never silently lost:
 *
 *   Tier 1: window.storage (platform-specific API)
 *     → Used when the app runs inside a native wrapper or PWA shell
 *       that provides a custom storage API (e.g., Capacitor, Electron).
 *     → Async by nature, so the entire service is async.
 *
 *   Tier 2: localStorage (browser built-in)
 *     → Standard web storage. Works in all modern browsers.
 *     → Can fail in private/incognito mode on some browsers,
 *       or when storage quota is exceeded.
 *
 *   Tier 3: In-memory Map (last resort)
 *     → Data lives only for the current page session.
 *     → Ensures the app never crashes due to storage errors,
 *       even in the most restricted environments.
 *
 * WHY ASYNC?
 * Even though localStorage is synchronous, the service uses async/await
 * throughout so that Tier 1 (which IS async) can be swapped in without
 * changing any calling code. This is a forward-compatible design choice.
 *
 * USAGE:
 * The `shared` parameter is passed to Tier 1's API when available.
 * For Tiers 2-3, it's ignored. It exists to support future multi-user
 * or cross-device storage scenarios.
 */
export default class StorageService {
  constructor() {
    /** @type {Map<string, string>} In-memory fallback store (Tier 3) */
    this._memoryFallback = new Map();
  }

  /**
   * Gets a value by key, trying each storage tier in order.
   *
   * @param {string} key — The storage key to retrieve
   * @param {boolean} [shared=true] — Whether this key is shared across contexts (Tier 1 only)
   * @returns {Promise<string|null>} — The stored value, or null if not found
   */
  async get(key, shared = true) {
    // Tier 1: Platform-specific storage API (if available)
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
      try {
        const res = await window.storage.get(key, shared);
        return res && res.value !== undefined ? res.value : null;
      } catch (err) {
        // Tier 1 failed — fall through to Tier 2
      }
    }

    // Tier 2: Browser localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        // Tier 2 failed (private mode, quota exceeded) — fall through to Tier 3
      }
    }

    // Tier 3: In-memory Map (always works, but data is lost on page reload)
    return this._memoryFallback.has(key) ? this._memoryFallback.get(key) : null;
  }

  /**
   * Sets a value by key, trying each storage tier in order.
   * All values are converted to strings for consistency across tiers.
   *
   * @param {string} key — The storage key to set
   * @param {string} value — The value to store
   * @param {boolean} [shared=true] — Whether this key is shared across contexts (Tier 1 only)
   * @returns {Promise<boolean>} — true if the value was stored (in any tier)
   */
  async set(key, value, shared = true) {
    // Tier 1: Platform-specific storage API (if available)
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
      try {
        await window.storage.set(key, String(value), shared);
        return true;
      } catch (err) {
        // Tier 1 failed — fall through to Tier 2
      }
    }

    // Tier 2: Browser localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch (err) {
        // Tier 2 failed — fall through to Tier 3
      }
    }

    // Tier 3: In-memory Map (always succeeds)
    this._memoryFallback.set(key, String(value));
    return true;
  }
}

