/**
 * ============================================================
 * APP.JS — Application Entry Point
 * ============================================================
 *
 * This is the main orchestrator that bootstraps all services and
 * components when the page loads. It's loaded as an ES module
 * (type="module" in index.html) so it can use import/export syntax.
 *
 * ARCHITECTURE:
 * The app follows a simple dependency injection pattern:
 *
 *   Services (stateless utilities):
 *     TimeService    — timezone math (UTC offset calculations)
 *     StorageService — persistent storage with fallback chain
 *
 *   Components (own their DOM elements):
 *     TimeScrubComponent    — hero section: live clocks + interactive slider
 *     WaitlistComponent     — waitlist section: form + email capture
 *     ScrollRevealComponent — feature section: scroll-triggered animations
 *
 * Each component receives its dependencies through its constructor
 * (dependency injection) rather than importing them directly.
 * This makes components testable and reusable.
 *
 * INITIALIZATION ORDER:
 * 1. DOMContentLoaded fires → new App() creates all instances
 * 2. app.init() calls each component's init() method
 * 3. TimeScrub starts a 1-second interval for live clock updates
 * 4. Waitlist reads the stored signup count and displays it
 * 5. ScrollReveal sets up IntersectionObservers on feature rows
 */

import TimeService from './services/TimeService.js';
import StorageService from './services/StorageService.js';
import TimeScrubComponent from './components/TimeScrubComponent.js';
import WaitlistComponent from './components/WaitlistComponent.js';
import ScrollRevealComponent from './components/ScrollRevealComponent.js';

/**
 * App Class
 * Master orchestrator — creates service instances, injects them
 * into components, and kicks off initialization.
 */
class App {
  constructor() {
    // --- Services (shared utilities, no DOM ownership) ---
    this.timeService = new TimeService();
    this.storageService = new StorageService();

    // Anime.js is loaded globally via <script> tag in index.html.
    // We grab the reference here so we can inject it into components.
    // If Anime.js failed to load (CDN down), this will be null and
    // components will use their no-animation fallbacks.
    this.anime = typeof window !== 'undefined' ? window.anime : null;

    // --- Components (each owns a section of the page) ---

    // Hero section: live dual clocks (Riyadh ↔ Manila) + interactive time scrub slider
    this.timeScrub = new TimeScrubComponent({
      timeService: this.timeService
    });

    // Waitlist section: email form + signup counter
    this.waitlist = new WaitlistComponent({
      storageService: this.storageService,
      anime: this.anime
    });

    // Features section: scroll-reveal fade-in + SVG line-draw animations
    this.scrollReveal = new ScrollRevealComponent({
      anime: this.anime,
      selector: '.feature-row'  // Each feature row is independently observed
    });
  }

  /**
   * Initializes all application components.
   * Each component's init() method sets up its own event listeners,
   * intervals, and IntersectionObservers.
   */
  init() {
    this.timeScrub.init();
    this.waitlist.init();
    this.scrollReveal.init();
  }
}

// Bootstrap: wait for the DOM to be fully parsed before initializing.
// We use DOMContentLoaded (not window.load) because we don't need to
// wait for images or fonts — we only need the HTML elements to exist.
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

