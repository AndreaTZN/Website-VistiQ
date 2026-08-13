import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { initButtonCharacterStagger } from "./buttons";

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

export function initAnimations() {
  const mm = gsap.matchMedia();

  /*   initNavScroll(mm); */

  initButtonCharacterStagger();
}
