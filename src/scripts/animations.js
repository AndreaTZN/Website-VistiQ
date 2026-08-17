import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* function initNavScroll(mm) {
  const nav = document.querySelector(".nav_container");
  if (!nav) return;

  mm.add("(min-width: 992px)", () => {
    ScrollTrigger.create({
      trigger: "body",
      start: "20px top",
      onEnter: () => nav.classList.add("is-scroll"),
      onLeaveBack: () => nav.classList.remove("is-scroll"),
    });
  });
} */

/**
 * Scroll scenes. Currently a placeholder: the nav-scroll scene above is parked,
 * and the button stagger it used to trigger now lives in the baseline (every
 * page needs it, this module is home-only).
 */
export function initAnimations() {
  /*   initNavScroll(gsap.matchMedia()); */
}
