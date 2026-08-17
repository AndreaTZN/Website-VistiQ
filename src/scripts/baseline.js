import { initButtonCharacterStagger } from "./buttons";
import { initMenu } from "./menu";
import { initSmoothScroll } from "./smooth-scroll";

/** Sets the current year on any [data-el="year"] element. */
function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-el="year"]').forEach((el) => {
    el.textContent = year;
  });
}

/**
 * Behaviour every page gets: smooth scroll, nav/menu, button hovers, footer
 * year. Deliberately free of section modules — and of three.js — so a page
 * that only needs the chrome doesn't pay for the home page's WebGL.
 *
 * Smooth scroll goes first: the section modules a page adds on top register
 * ScrollTriggers that must read positions after Lenis has taken over.
 */
export function initBaseline() {
  initSmoothScroll();
  initMenu();
  initButtonCharacterStagger();
  initYear();
}
