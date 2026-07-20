import TimeService from './services/TimeService.js';
import StorageService from './services/StorageService.js';
import DualClockComponent from './components/DualClockComponent.js';
import WaitlistComponent from './components/WaitlistComponent.js';
import ScrollRevealComponent from './components/ScrollRevealComponent.js';

/**
 * App Class
 * Master orchestrator class for initializing application services and components.
 */
class App {
  constructor() {
    this.timeService = new TimeService();
    this.storageService = new StorageService();
    this.anime = typeof window !== 'undefined' ? window.anime : null;

    this.dualClock = new DualClockComponent({
      timeService: this.timeService
    });

    this.waitlist = new WaitlistComponent({
      storageService: this.storageService,
      anime: this.anime
    });

    this.scrollReveal = new ScrollRevealComponent({
      anime: this.anime,
      selector: '.feature-row'
    });
  }

  /**
   * Initializes all application components.
   */
  init() {
    this.dualClock.start();
    this.waitlist.init();
    this.scrollReveal.init();
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
