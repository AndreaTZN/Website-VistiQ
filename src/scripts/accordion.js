import gsap from "gsap";

/** Colour the visual takes for each open item, in item order. */
const VISUAL_COLORS = ["#ccd9d0", "#eef1f8", "#e6e3dd", "#e9e4ef", "#e3ebe6"];

const DURATION = 0.5;
const EASE = "power2.inOut";

/** Wires one accordion root. Only called at desktop widths. */
function setupAccordion(accordion) {
  const items = Array.from(accordion.querySelectorAll("[data-accordion-item]"));
  if (!items.length) return;

  const section = accordion.closest("section") ?? document;
  const visual = section.querySelector("[data-accordion-visual]");
  // Interface mockups stacked inside the visual, keyed by item index. Items
  // without one simply leave the coloured square bare.
  const illus = visual
    ? Array.from(visual.querySelectorAll("[data-accordion-illu]"))
    : [];

  // Honour the same reduced-motion guard the rest of the site uses.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let openIndex = -1;

  /** Opens `index`, closing whatever was open. `animate` off for the first paint. */
  function setOpen(index, animate = true) {
    if (index === openIndex) return;

    const duration = animate && !reduced ? DURATION : 0;

    items.forEach((item, i) => {
      const panel = item.querySelector("[data-accordion-panel]");
      const trigger = item.querySelector("[data-accordion-trigger]");
      const isOpen = i === index;

      item.classList.toggle("is-open", isOpen);
      trigger?.setAttribute("aria-expanded", String(isOpen));

      if (!panel) return;

      gsap.to(panel, {
        height: isOpen ? "auto" : 0,
        duration,
        ease: EASE,
        overwrite: true,
      });
    });

    if (visual) {
      gsap.to(visual, {
        backgroundColor: VISUAL_COLORS[index] ?? VISUAL_COLORS[0],
        duration: duration * 1.2,
        ease: EASE,
      });
    }

    illus.forEach((illu) => {
      const isActive = Number(illu.dataset.accordionIllu) === index;
      gsap.to(illu, {
        autoAlpha: isActive ? 1 : 0,
        duration,
        ease: EASE,
        overwrite: true,
      });
    });

    openIndex = index;
  }

  items.forEach((item, i) => {
    const trigger = item.querySelector("[data-accordion-trigger]");
    if (!trigger) return;

    // Items without a panel still switch the highlight and the visual.
    trigger.addEventListener("click", () => setOpen(i));
  });

  // Open the first item that already carries the expanded state in markup.
  const initial = items.findIndex(
    (item) =>
      item
        .querySelector("[data-accordion-trigger]")
        ?.getAttribute("aria-expanded") === "true",
  );
  setOpen(initial === -1 ? 0 : initial, false);
}

/**
 * Single-open accordion (Figma 1525:4699 / 1525:10472). Panels animate on
 * height, so they collapse to 0 without needing a fixed value in CSS.
 *
 * Below 768px the accordion becomes a scroll-snap slider with every panel
 * open (see benefits.css), so this behaviour is scoped to desktop through
 * matchMedia — it would otherwise animate those panels back to height: 0.
 * The revert on exit clears the inline heights GSAP left behind.
 */
export function initAccordions() {
  gsap.matchMedia().add("(min-width: 768px)", () => {
    document.querySelectorAll("[data-accordion]").forEach(setupAccordion);
  });
}
