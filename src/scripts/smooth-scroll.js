import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);

/** @type {import('lenis').default | null} */
export let lenis = null;

/**
 * Lenis smooth scrolling, driven by the GSAP ticker so ScrollTrigger stays in
 * sync. Skipped when the user prefers reduced motion, so native scrolling and
 * `scroll-behavior` remain untouched.
 */
export function initSmoothScroll() {
  lenis = new Lenis({ anchors: true });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}
