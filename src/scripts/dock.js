import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { lenis } from "./smooth-scroll";

/**
 * Section dock — keeps the floating label in sync with the section on screen.
 *
 * One ScrollTrigger per section reports which one owns the viewport; the label
 * then cross-fades to the new name and the slot resizes to fit it. Clicks on the
 * arrows are plain anchors, so Lenis (`anchors: true`) already handles the
 * scrolling — the handlers below only exist to retarget them as the reader
 * moves, and to fall back to Lenis' own scrollTo when it is running.
 */

/** Must mirror DOCK_SECTIONS in components/ui/Dock.astro. */
const SECTIONS = [
  { id: "How-it-works", label: "How it works" },
  { id: "Lifecycle", label: "Lifecycle" },
  { id: "Solutions", label: "Solutions" },
  { id: "Data-layer", label: "Data layer" },
  { id: "Investors", label: "Investors" },
  { id: "Data", label: "Security" },
];

const SWAP_DURATION = 0.4;

export function initDock() {
  const dock = document.querySelector("[data-dock]");
  if (!dock) return;

  const labelSlot = dock.querySelector(".dock_label-slot");
  const indexEl = dock.querySelector("[data-dock-index]");
  const announce = dock.querySelector("[data-dock-announce]");
  const prev = dock.querySelector("[data-dock-prev]");
  const next = dock.querySelector("[data-dock-next]");
  let label = dock.querySelector("[data-dock-label]");
  if (!labelSlot || !label || !indexEl || !prev || !next) return;

  // Only keep the sections that actually exist in the page.
  const entries = SECTIONS.map((section) => ({
    ...section,
    el: document.getElementById(section.id),
  })).filter((entry) => entry.el);
  if (!entries.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = -1;

  /** Width the slot needs for a given label, measured off-screen. */
  const measure = (text) => {
    const probe = label.cloneNode(false);
    probe.textContent = text;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    labelSlot.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  };

  /** Points the arrows at the neighbours of the active section. */
  const retargetArrows = (index) => {
    const before = entries[index - 1];
    const after = entries[index + 1];
    prev.setAttribute("href", `#${(before ?? entries[index]).id}`);
    next.setAttribute("href", `#${(after ?? entries[index]).id}`);
    prev.classList.toggle("is-disabled", !before);
    next.classList.toggle("is-disabled", !after);
  };

  const setActive = (index) => {
    if (index === current || !entries[index]) return;
    const entry = entries[index];
    const goingDown = index > current;
    current = index;

    indexEl.textContent = String(index + 1).padStart(2, "0");
    retargetArrows(index);
    if (announce) announce.textContent = entry.label;

    if (reduced) {
      label.textContent = entry.label;
      labelSlot.style.width = `${measure(entry.label)}px`;
      return;
    }

    // Resize the slot alongside the swap so the dock never jumps.
    gsap.to(labelSlot, {
      width: measure(entry.label),
      duration: SWAP_DURATION,
      ease: "power3.out",
    });

    // The outgoing label leaves in the scroll direction, the new one follows it
    // in — so the motion reads as the page moving, not the text flickering.
    const incoming = label.cloneNode(false);
    incoming.textContent = entry.label;
    incoming.classList.add("is-incoming");
    labelSlot.appendChild(incoming);

    const outgoing = label;
    label = incoming;

    gsap.to(outgoing, {
      yPercent: goingDown ? -100 : 100,
      opacity: 0,
      duration: SWAP_DURATION,
      ease: "power3.out",
      onComplete: () => outgoing.remove(),
    });

    gsap.fromTo(
      incoming,
      { yPercent: goingDown ? 100 : -100, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: SWAP_DURATION,
        ease: "power3.out",
        onComplete: () => {
          // Hand the slot back to a static label: an absolutely positioned one
          // would no longer contribute its width.
          incoming.classList.remove("is-incoming");
          gsap.set(incoming, { clearProps: "transform,opacity" });
        },
      },
    );
  };

  entries.forEach((entry, index) => {
    ScrollTrigger.create({
      trigger: entry.el,
      // Whichever section covers the middle of the viewport owns the dock.
      start: "top center",
      end: "bottom center",
      onToggle: (self) => self.isActive && setActive(index),
    });
  });

  // The dock lists no hero, so it stays out of the way until the first section
  // and leaves again after the last one. The range spans both, rather than
  // toggling on a single section that scrolls past.
  gsap.set(dock, { yPercent: 150, opacity: 0 });
  ScrollTrigger.create({
    trigger: entries[0].el,
    start: "top 90%",
    endTrigger: entries[entries.length - 1].el,
    end: "bottom 10%",
    onToggle: (self) => {
      gsap.to(dock, {
        yPercent: self.isActive ? 0 : 150,
        opacity: self.isActive ? 1 : 0,
        duration: reduced ? 0 : 0.5,
        ease: "power3.out",
        overwrite: true,
      });
    },
  });

  // Lenis handles anchor clicks itself, but only when it is running; under
  // reduced motion it never starts, and the native jump is the right fallback.
  [prev, next].forEach((arrow) => {
    arrow.addEventListener("click", (event) => {
      const id = arrow.getAttribute("href")?.slice(1);
      const target = id && document.getElementById(id);
      if (!target || !lenis) return;
      event.preventDefault();
      lenis.scrollTo(target);
    });
  });

  setActive(0);
}
