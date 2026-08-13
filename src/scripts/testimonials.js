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
 *
 * The markup keeps texts and portraits in two parallel lists (the dots sit in
 * the content panel, so they cannot live inside a slide); both are indexed the
 * same way and cross-faded together.
 */
export function initTestimonials() {
  document.querySelectorAll("[data-testimonials]").forEach((root) => {
    // Text panel and portraits are two parallel lists sharing one index.
    const texts = Array.from(root.querySelectorAll("[data-testimonial-text]"));
    const pictures = Array.from(
      root.querySelectorAll("[data-testimonial-picture]"),
    );
    const dots = Array.from(root.querySelectorAll("[data-testimonial-dot]"));
    const fills = Array.from(
      root.querySelectorAll("[data-testimonial-dot-fill]"),
    );
    if (texts.length < 2) {
      // A single slide still needs its bar filled so the design looks complete.
      gsap.set(fills, { scaleX: 1 });
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /** Words of each quote, split once so the stagger can target them. */
    const splits = texts.map((text) => {
      const quote = text.querySelector("[data-testimonial-quote]");
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

    /** Hides every text and portrait but `index`, without animating. */
    function reset(index) {
      [texts, pictures].forEach((list) => {
        list.forEach((el, i) => {
          const isActive = i === index;
          gsap.set(el, { autoAlpha: isActive ? 1 : 0 });
          el.setAttribute("aria-hidden", String(!isActive));
        });
      });
      gsap.set(fills, { scaleX: 0 });
    }

    /** Cross-fades both lists to `index` and replays the word stagger. */
    function goTo(index) {
      if (index === active) return;

      const duration = reduced ? 0 : 1;
      const tl = gsap.timeline();

      // Both columns cross-fade on the same beat, hence the shared "<".
      [texts, pictures].forEach((list) => {
        const next = list[index];
        const prev = list[active];
        if (!next || !prev) return;

        prev.setAttribute("aria-hidden", "true");
        next.setAttribute("aria-hidden", "false");

        tl.to(prev, { autoAlpha: 0, duration, ease: "power2.inOut" }, "<");
        tl.to(next, { autoAlpha: 1, duration, ease: "power2.inOut" }, "<");
      });

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
        onComplete: () => goTo((active + 1) % texts.length),
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
