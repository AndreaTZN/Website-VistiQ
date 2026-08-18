import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);

/** @type {import('lenis').default | null} */
export let lenis = null;

export function initSmoothScroll() {
  lenis = new Lenis({ anchors: true });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.clearScrollMemory("manual");

  // après le restore navigateur + après le refresh de ScrollTrigger
  window.addEventListener("load", () => {
    lenis.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  });
}
