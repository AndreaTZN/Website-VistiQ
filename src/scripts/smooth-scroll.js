import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);

/** @type {import('lenis').default | null} */
export let lenis = null;

export function initSmoothScroll() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  lenis = new Lenis({
    anchors: true,

    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    /** Touch is already inertial — smoothing it fights the OS and feels laggy. */
    syncTouch: false,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.clearScrollMemory("manual");

  // Media settling changes every trigger position, so recompute once loaded.
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
