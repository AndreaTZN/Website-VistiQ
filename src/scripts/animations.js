import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { initButtonCharacterStagger } from "./buttons";

gsap.registerPlugin(ScrollTrigger);

/**
 * Dashed SVG shapes that drift continuously and tilt toward the cursor.
 * Shared by the hero and the footer, which use identical artwork.
 */
function initDriftingShapes(section, shapesSelector) {
  const shapes = section.querySelector(shapesSelector);
  if (!shapes) return;

  shapes.querySelectorAll("path").forEach((path, i) => {
    gsap.to(path, {
      strokeDashoffset: "-=45",
      duration: 6,
      ease: "none",
      repeat: -1,
      // Negative delay offsets each path into the loop for a travelling effect.
      delay: -(i * 0.05),
    });
  });

  section.addEventListener("mouseenter", () => {
    gsap.to(shapes, {
      rotation: 3,
      transformOrigin: "50% 50%",
      duration: 1.2,
      ease: "power2.out",
    });
  });

  section.addEventListener("mousemove", (e) => {
    const rect = section.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const rotation = (xRatio - 0.5) * 6; // −3° to +3°
    gsap.to(shapes, {
      rotation,
      transformOrigin: "50% 50%",
      duration: 0.8,
      ease: "power2.out",
    });
  });

  section.addEventListener("mouseleave", () => {
    gsap.to(shapes, {
      rotation: 0,
      transformOrigin: "50% 50%",
      duration: 1.4,
      ease: "elastic.out(1, 0.5)",
    });
  });
}

function initHero(mm) {
  const section = document.querySelector(".hero2_section");
  if (!section) return;

  initDriftingShapes(section, ".hero_shapes");

  const tl = gsap.timeline();

  tl.to(section.querySelector(".hero2_text-wrap"), {
    opacity: 1,
    duration: 1,
    ease: "power1.inOut",
  });
  tl.to(
    section.querySelector(".hero2_illu-wrap"),
    { y: 0, opacity: 1, duration: 0.6, ease: "power1.inOut" },
    "-=0.4",
  );
  tl.to(section.querySelectorAll(".hero2_illu-tag"), {
    x: 0,
    opacity: 1,
    duration: 0.6,
    ease: "power1.inOut",
    stagger: 0.1,
  });

  const eyebrowSpans = Array.from(
    section.querySelectorAll(".hero2_eyebrow span"),
  );
  if (!eyebrowSpans.length) return;

  // Below 470px the eyebrow wraps, so the width-expansion reveal is skipped.
  mm.add("(min-width: 470px)", () => {
    const rest = eyebrowSpans.slice(1);

    gsap.set(eyebrowSpans, {
      display: "inline-block",
      verticalAlign: "bottom",
    });
    gsap.set(rest, {
      overflow: "hidden",
      width: 0,
      opacity: 0,
      filter: "blur(6px)",
      whiteSpace: "nowrap",
    });

    // Expand width first so the layout shift stays smooth...
    tl.to(
      rest,
      { width: "auto", duration: 0.6, ease: "power2.inOut", stagger: 0.35 },
      "+=0.2",
    );
    // ...then fade and unblur in sync with that expansion.
    tl.to(
      rest,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.5,
      },
      "<0.1",
    );
  });
}

function initNavScroll(mm) {
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
}

function initFooter() {
  const footer = document.querySelector(".footer");
  if (footer) initDriftingShapes(footer, ".footer_shapes");
}

export function initAnimations() {
  const mm = gsap.matchMedia();

  initHero(mm);
  initNavScroll(mm);
  initFooter();
  initButtonCharacterStagger();
}
