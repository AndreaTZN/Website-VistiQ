import gsap from "gsap";

/**
 * Hero v2 — floating product cards.
 */

/** Longest entrance: delay of the last card + its duration. */
const INTRO_DURATION = 1.2;

/** Base entrance delay, and the stagger between two cards. */
const INTRO_DELAY = 0.5;
const INTRO_STAGGER = 0.15;

export function initHeroCards() {
  const cards = gsap.utils.toArray(".hero-v2_card");
  if (!cards.length) return;

  // Same guard as the other modules: the cards show immediately, static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  cards.forEach((card, i) => {
    // Cards with a design-level opacity (e.g. .is-fund at 0.4) expose it as
    // --card-opacity; computed opacity can't be read here, the guard zeroes it.
    const targetOpacity =
      parseFloat(getComputedStyle(card).getPropertyValue("--card-opacity")) ||
      1;

    const introDelay = INTRO_DELAY + i * INTRO_STAGGER;

    gsap.fromTo(
      card,
      { autoAlpha: 0, scale: 0.94 },
      {
        autoAlpha: targetOpacity,
        scale: 1,
        duration: INTRO_DURATION,
        ease: "power3.out",
        delay: introDelay,
      },
    );

    // Randomized per card so the drifts never synchronize.
    gsap.to(card, {
      y: `+=${gsap.utils.random(10, 18)}`,
      x: `+=${gsap.utils.random(-8, 8)}`,
      rotation: `+=${gsap.utils.random(-1.5, 1.5)}`,
      duration: gsap.utils.random(3.5, 5.5),
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: gsap.utils.random(0, 1.5),
    });
  });
}
