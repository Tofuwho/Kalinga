/**
 * ============================================================
 * SCROLL REVEAL COMPONENT
 * ============================================================
 *
 * Handles scroll-triggered reveal animations for the feature rows section.
 * Uses IntersectionObserver (no scroll event listeners) for performance.
 *
 * TWO ANIMATION TYPES:
 *
 * 1. FADE-UP ENTRANCE
 *    Each .feature-row starts invisible (opacity: 0) and shifted down
 *    28px (translateY: 28). When the element scrolls 25% into the
 *    viewport, it animates to full opacity and original position.
 *
 * 2. SVG LINE-DRAW
 *    Each feature icon is an SVG using stroke outlines. The technique:
 *    a. On init, set stroke-dashoffset to the total path length
 *       (this makes the entire stroke invisible — it's "offset" fully)
 *    b. When the element scrolls into view, animate stroke-dashoffset to 0
 *       (the stroke gradually "draws" itself from start to end)
 *    c. anime.setDashoffset is a helper that measures the path length
 *       automatically so we don't need to calculate it manually.
 *
 * GRACEFUL DEGRADATION:
 * If Anime.js fails to load (CDN down), the constructor detects this
 * and immediately sets all elements to their final visible state.
 * No animations play, but all content is fully visible and readable.
 *
 * OBSERVER BEHAVIOR:
 * Each element is unobserved after its animation fires (observer.unobserve),
 * so the animation only plays once — it won't re-trigger if the user
 * scrolls back up and down again. This is intentional for a landing page.
 */
export default class ScrollRevealComponent {
  /**
   * @param {Object} config
   * @param {Function} [config.anime] — Anime.js instance (null = no animations)
   * @param {string} [config.selector='.feature-row'] — CSS selector for elements to reveal
   */
  constructor({ anime = (typeof window !== 'undefined' ? window.anime : null), selector = '.feature-row' } = {}) {
    this.anime = anime || (typeof window !== 'undefined' ? window.anime : null);
    this.elements = Array.from(document.querySelectorAll(selector));
  }

  /**
   * Sets up IntersectionObservers and initial hidden state.
   * Safe to call even if no matching elements exist or Anime.js is missing.
   */
  init() {
    if (!this.elements.length) return;

    // FALLBACK: If Anime.js isn't available, show all elements immediately
    if (!this.anime) {
      this.elements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Set initial hidden state: invisible and shifted down 28px
    this.anime.set(this.elements, { opacity: 0, translateY: 28 });

    // Set initial SVG state: stroke fully "hidden" via dashoffset
    this.elements.forEach((el) => {
      const paths = el.querySelectorAll('.feature-icon path, .feature-icon rect, .feature-icon circle');
      if (paths.length) {
        // setDashoffset measures each path's total length and sets
        // stroke-dasharray + stroke-dashoffset to that value
        this.anime.set(paths, { strokeDashoffset: this.anime.setDashoffset });
      }
    });

    // Create an IntersectionObserver that fires when 25% of an element is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const paths = el.querySelectorAll('.feature-icon path, .feature-icon rect, .feature-icon circle');

          // Build an animation timeline: fade-up first, then line-draw
          const tl = this.anime.timeline({ easing: 'easeOutCubic' });

          // Step 1: Fade in the entire row and slide it up
          tl.add({ targets: el, opacity: [0, 1], translateY: [28, 0], duration: 700 });

          // Step 2: Animate the SVG icon's stroke (starts 500ms before step 1 finishes)
          if (paths.length) {
            tl.add({
              targets: paths,
              strokeDashoffset: [this.anime.setDashoffset, 0],
              duration: 900,
              delay: this.anime.stagger(80)  // Each path element starts 80ms after the previous
            }, '-=500');  // Overlap with the fade-in by 500ms for a smooth combined effect
          }

          // Don't re-animate if the user scrolls past and back
          observer.unobserve(el);
        });
      },
      { threshold: 0.25 }  // Trigger when 25% of the element is visible
    );

    // Start observing each feature row
    this.elements.forEach((el) => observer.observe(el));
  }
}

