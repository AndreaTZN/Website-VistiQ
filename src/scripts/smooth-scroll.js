import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);

/** @type {import('lenis').default | null} */
export let lenis = null;

export function initSmoothScroll() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  lenis = new Lenis({ anchors: true });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.clearScrollMemory("manual");

  // Media settling changes every trigger position, so recompute once loaded.
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
