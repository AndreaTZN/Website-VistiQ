import gsap from "gsap";

/**
 * Hero v2 — floating product cards.
 *
 * The cards are hidden from the first paint by the reveal guard in
 * BaseLayout (`.has-reveals:not(.is-ready)`); the fromTo below writes the
 * hidden state as inline styles immediately, so the guard can be lifted right
 * after this runs without any flash — see revealPage() in reveal.js, which the
 * page entry calls once every such module has had its turn. Each card then
 * fades/scales in and drifts on an endless randomized loop. The entrance only
 * touches autoAlpha/scale while the drift owns x/y/rotation, so the two never
 * fight over the same properties.
 */
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

    gsap.fromTo(
      card,
      { autoAlpha: 0, scale: 0.94 },
      {
        autoAlpha: targetOpacity,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.5 + i * 0.15,
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
