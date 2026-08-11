import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/** Seconds each slide stays on screen before advancing. */
const SLIDE_DURATION = 5;

/**
 * Testimonial carousel (Figma 1525:35336), reproducing the reference Webflow
 * interaction: the quote is split into words that rise in a stagger while the
 * portrait and logo cross-fade, and the progress bar of the active slide fills
 * over SLIDE_DURATION before handing over to the next one.
 */
export function initTestimonials() {
  document.querySelectorAll("[data-testimonials]").forEach((root) => {
    const slides = Array.from(root.querySelectorAll("[data-testimonial-slide]"));
    const dots = Array.from(root.querySelectorAll("[data-testimonial-dot]"));
    const fills = Array.from(
      root.querySelectorAll("[data-testimonial-dot-fill]"),
    );
    if (slides.length < 2) {
      // A single slide still needs its bar filled so the design looks complete.
      gsap.set(fills, { scaleX: 1 });
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /** Words of each quote, split once so the stagger can target them. */
    const splits = slides.map((slide) => {
      const quote = slide.querySelector("[data-testimonial-quote]");
      return quote
        ? SplitText.create(quote, {
            type: "lines,words",
            linesClass: "home-bloc05_quote-line",
            wordsClass: "home-bloc05_quote-word",
          })
        : null;
    });

    let active = 0;
    let autoplay;

    /** Hides every slide but `index`, without animating. */
    function reset(index) {
      slides.forEach((slide, i) => {
        const isActive = i === index;
        gsap.set(slide, { autoAlpha: isActive ? 1 : 0 });
        slide.setAttribute("aria-hidden", String(!isActive));
      });
      gsap.set(fills, { scaleX: 0 });
    }

    /** Cross-fades to `index` and replays the word stagger. */
    function goTo(index) {
      if (index === active) return;

      const next = slides[index];
      const prev = slides[active];
      const duration = reduced ? 0 : 1;

      prev.setAttribute("aria-hidden", "true");
      next.setAttribute("aria-hidden", "false");

      const tl = gsap.timeline();
      tl.to(prev, { autoAlpha: 0, duration, ease: "power2.inOut" });
      tl.to(next, { autoAlpha: 1, duration, ease: "power2.inOut" }, "<");

      const words = splits[index]?.words;
      if (words?.length && !reduced) {
        tl.fromTo(
          words,
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: 1,
            ease: "power2.out",
            stagger: { amount: 0.5 },
          },
          "<",
        );
      }

      active = index;
      play();
    }

    /** Fills the active bar, then advances. */
    function play() {
      autoplay?.kill();
      gsap.set(fills, { scaleX: 0 });
      // Bars before the active one stay full, like the Figma static state.
      fills.slice(0, active).forEach((fill) => gsap.set(fill, { scaleX: 1 }));

      autoplay = gsap.to(fills[active], {
        scaleX: 1,
        duration: SLIDE_DURATION,
        ease: "none",
        onComplete: () => goTo((active + 1) % slides.length),
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => goTo(i));
    });

    // Pause while the pointer rests on the carousel so quotes stay readable.
    root.addEventListener("mouseenter", () => autoplay?.pause());
    root.addEventListener("mouseleave", () => autoplay?.resume());

    reset(active);
    play();
  });
}
