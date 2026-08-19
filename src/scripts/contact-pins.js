import gsap from "gsap";

/**
 * Contact map pins — the halo pulses outward on a loop.
 *
 * The halo is a sibling of the dot rather than its parent, so scaling it
 * leaves the dot at a fixed size: only the ring reads as a ping. Each pin
 * gets a random offset so the two offices never pulse in lockstep.
 */

/** Gap between pulses — long enough that the ring reads as a beat, not a throb. */
const REPEAT_DELAY = 0.6;

export function initContactPins() {
  const halos = gsap.utils.toArray("[data-contact-pin-halo]");
  if (!halos.length) return;

  // Same guard as the other modules: the halo stays as designed, static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  halos.forEach((halo) => {
    gsap.fromTo(
      halo,
      { scale: 0, opacity: 1 },
      {
        scale: 1.5,
        opacity: 0,
        duration: 1.8,
        ease: "power2.out",
        repeat: -1,
        repeatDelay: REPEAT_DELAY,
      },
    );
  });
}
