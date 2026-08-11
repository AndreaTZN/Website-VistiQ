import gsap from "gsap";

import { lenis } from "./smooth-scroll";

/**
 * Mobile menu. Replaces the Webflow IX2 "Menu [OPEN]" / "Menu [CLOSE]" action
 * lists, keeping their original timings: container slides in from x:100% over
 * 500ms, shadow fades over 600ms (in) / 400ms (out).
 */
export function initMenu() {
  const menu = document.querySelector(".menu");
  if (!menu) return;

  const container = menu.querySelector(".menu_container");
  const shadow = menu.querySelector(".menu_shadow");
  const openTriggers = document.querySelectorAll("[data-menu-open]");
  const closeTriggers = document.querySelectorAll("[data-menu-close]");
  if (!container || !shadow) return;

  let isOpen = false;

  // Initial state matches the IX2 "useFirstGroupAsInitialState" group.
  gsap.set(menu, { display: "none" });
  gsap.set(container, { xPercent: 100, opacity: 0 });
  gsap.set(shadow, { opacity: 0 });

  function open() {
    if (isOpen) return;
    isOpen = true;
    lenis?.stop();
    menu.setAttribute("aria-hidden", "false");

    gsap.set(menu, { display: "flex" });
    gsap.to(container, {
      xPercent: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    });
    gsap.to(shadow, { opacity: 1, duration: 0.4, ease: "power1.inOut" });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    menu.setAttribute("aria-hidden", "true");

    gsap.to(container, {
      xPercent: 100,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
    });
    gsap.to(shadow, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(menu, { display: "none" });
        lenis?.start();
      },
    });
  }

  openTriggers.forEach((el) => el.addEventListener("click", open));
  closeTriggers.forEach((el) => el.addEventListener("click", close));

  // Anchor links inside the menu should dismiss it before scrolling.
  menu.querySelectorAll(".menu_link_title").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) close();
  });
}
