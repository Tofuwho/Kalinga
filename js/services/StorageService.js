/**
 * StorageService
 * Unified asynchronous storage handler supporting window.storage, localStorage, and in-memory fallback.
 */
export default class StorageService {
  constructor() {
    this._memoryFallback = new Map();
  }

  /**
   * Gets a value by key.
   * @param {string} key
   * @param {boolean} shared
   * @returns {Promise<string|null>}
   */
  async get(key, shared = true) {
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
      try {
        const res = await window.storage.get(key, shared);
        return res && res.value !== undefined ? res.value : null;
      } catch (err) {
        // Fallback to localStorage
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        // Fallback to memory
      }
    }

    return this._memoryFallback.has(key) ? this._memoryFallback.get(key) : null;
  }

  /**
   * Sets a value by key.
   * @param {string} key
   * @param {string} value
   * @param {boolean} shared
   * @returns {Promise<boolean>}
   */
  async set(key, value, shared = true) {
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
      try {
        await window.storage.set(key, String(value), shared);
        return true;
      } catch (err) {
        // Fallback to localStorage
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch (err) {
        // Fallback to memory
      }
    }

    this._memoryFallback.set(key, String(value));
    return true;
  }
}
