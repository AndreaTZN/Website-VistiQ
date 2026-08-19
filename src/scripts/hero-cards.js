import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(Draggable, InertiaPlugin);

/**
 * Hero v2 — floating product cards.
 */

/** Longest entrance: delay of the last card + its duration. */
const INTRO_DURATION = 1.2;

/** Base entrance delay, and the stagger between two cards. */
const INTRO_DELAY = 0.5;
const INTRO_STAGGER = 0.15;

/**
 * Widest overhang in the resting composition (.is-deal sits at
 * right: -13.14rem). The drag box has to clear it, otherwise Draggable counts
 * the cards as out of bounds and relocates them the instant it attaches.
 */
const OVERHANG_REM = 13.14;

/**
 * The draggable area: the hero grown on every side by the resting overhang.
 *
 * Measured in page coordinates, and in rem so the box tracks the fluid root
 * font-size like the card positions themselves do.
 */
function dragBounds(section) {
  const slack =
    OVERHANG_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);
  const r = section.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const left = r.left + window.scrollX;
  return {
    top: top - slack,
    left: left - slack,
    width: r.width + slack * 2,
    height: r.height + slack * 2,
  };
}

export function initHeroCards() {
  const cards = gsap.utils.toArray(".hero-v2_card");
  if (!cards.length) return;

  // Same guard as the other modules: the cards show immediately, static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const bounds = document.querySelector(".hero-v2_section");

  /** Per-card setup, all run together once the last entrance has finished. */
  const makeDraggable = [];

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

    /**
     * Randomized per card so the drifts never synchronize. Recreated after
     * every drop, so the card keeps floating from its new position instead of
     * snapping back to the coordinates the first tween was built around.
     */
    let drift;
    const startDrift = (delay = gsap.utils.random(0, 1.5)) => {
      drift = gsap.to(card, {
        y: `+=${gsap.utils.random(10, 18)}`,
        x: `+=${gsap.utils.random(-8, 8)}`,
        rotation: `+=${gsap.utils.random(-1.5, 1.5)}`,
        duration: gsap.utils.random(3.5, 5.5),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay,
      });
    };

    startDrift();

    // Dragging only makes sense once the card has finished arriving, and only
    // where the cards are actually visible (they are hidden below 991px).
    makeDraggable.push(() => {
      if (!bounds || !window.matchMedia("(min-width: 61.9375rem)").matches) {
        return;
      }

      card.classList.add("is-draggable");

      Draggable.create(card, {
        type: "x,y",
        // Not the section itself: the cards deliberately overhang it (negative
        // left/right in the CSS), and a bounds box tighter than the resting
        // composition makes Draggable shove every card inside on init. This
        // box is the section grown by the widest overhang, so nothing moves
        // until the user actually drags, and a card still cannot be lost.
        bounds: dragBounds(bounds),
        inertia: true,
        // The cards overlap; the one being held has to come to the front.
        zIndexBoost: true,
        onPress() {
          // Drift owns x/y too — let go of them for the duration of the drag.
          drift?.kill();
          card.classList.add("is-dragging");
        },
        onRelease() {
          card.classList.remove("is-dragging");
          // A drop with no velocity never starts a throw, so onThrowComplete
          // would not fire and the drift would stay dead — resume it here.
          if (!this.isThrowing) startDrift(0);
        },
        // Fires once the inertia throw settles, so a flung card only starts
        // drifting again after it has come to rest.
        onThrowComplete() {
          startDrift(0);
        },
      });
    });
  });

  // One pass, after the last card has landed. Staggering the attachment made
  // each card settle at a different moment, which read as a stutter.
  gsap.delayedCall(
    INTRO_DELAY + (cards.length - 1) * INTRO_STAGGER + INTRO_DURATION,
    () => makeDraggable.forEach((attach) => attach()),
  );
}
