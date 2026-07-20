/**
 * ScrollRevealComponent
 * Handles staggered scroll reveal animations and SVG icon line-draws using Anime.js and IntersectionObserver.
 */
export default class ScrollRevealComponent {
  constructor({ anime = (typeof window !== 'undefined' ? window.anime : null), selector = '.feature-row' } = {}) {
    this.anime = anime || (typeof window !== 'undefined' ? window.anime : null);
    this.elements = Array.from(document.querySelectorAll(selector));
  }

  init() {
    if (!this.elements.length) return;

    // Fallback if anime is not available
    if (!this.anime) {
      this.elements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    this.anime.set(this.elements, { opacity: 0, translateY: 28 });

    this.elements.forEach((el) => {
      const paths = el.querySelectorAll('.feature-icon path, .feature-icon rect, .feature-icon circle');
      if (paths.length) {
        this.anime.set(paths, { strokeDashoffset: this.anime.setDashoffset });
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const paths = el.querySelectorAll('.feature-icon path, .feature-icon rect, .feature-icon circle');

          const tl = this.anime.timeline({ easing: 'easeOutCubic' });
          tl.add({ targets: el, opacity: [0, 1], translateY: [28, 0], duration: 700 });
          if (paths.length) {
            tl.add({ targets: paths, strokeDashoffset: [this.anime.setDashoffset, 0], duration: 900, delay: this.anime.stagger(80) }, '-=500');
          }

          observer.unobserve(el);
        });
      },
      { threshold: 0.25 }
    );

    this.elements.forEach((el) => observer.observe(el));
  }
}
