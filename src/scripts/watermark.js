import gsap from "gsap";

/**
 * Footer watermark — the emboss light follows the cursor.
 *
 * The watermark letters carry a two-pass inner shadow (feOffset dy=2 and
 * dy=1). Instead of moving the letters, the cursor slightly shifts those
 * offsets so the emboss looks re-lit from the pointer's direction. The
 * watermark is pointer-events:none, so the footer is the listening surface.
 */

// Max offset shift in SVG filter units — the rest offsets are 1-2, so ±3
// stays a subtle relight rather than a visible displacement.
const MAX_SHIFT = 3;

export function initWatermark() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const footer = document.querySelector(".footer-v2");
  const svg = footer?.querySelector(".footer-v2_watermark");
  if (!footer || !svg) return;

  const offsets = Array.from(svg.querySelectorAll("feOffset")).map((el) => {
    const rest = {
      dx: Number(el.getAttribute("dx")) || 0,
      dy: Number(el.getAttribute("dy")) || 0,
    };
    // The dy=1 pass is the subtle half of the emboss: shift it half as much.
    const strength = rest.dy >= 2 ? 1 : 0.5;
    const state = { ...rest };
    const apply = () => {
      el.setAttribute("dx", state.dx.toFixed(2));
      el.setAttribute("dy", state.dy.toFixed(2));
    };
    return {
      rest,
      strength,
      dxTo: gsap.quickTo(state, "dx", {
        duration: 0.6,
        ease: "power3.out",
        onUpdate: apply,
      }),
      dyTo: gsap.quickTo(state, "dy", {
        duration: 0.6,
        ease: "power3.out",
        onUpdate: apply,
      }),
    };
  });
  if (!offsets.length) return;

  footer.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;

    // Direction from the logo centre to the cursor, clamped to [-1, 1]. The
    // shadow shifts away from the cursor, as if the pointer were a light.
    const nx = gsap.utils.clamp(
      -1,
      1,
      (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
    );
    const ny = gsap.utils.clamp(
      -1,
      1,
      (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
    );

    offsets.forEach((o) => {
      o.dxTo(o.rest.dx - nx * MAX_SHIFT * o.strength);
      o.dyTo(o.rest.dy - ny * MAX_SHIFT * o.strength);
    });
  });

  footer.addEventListener("mouseleave", () => {
    offsets.forEach((o) => {
      o.dxTo(o.rest.dx);
      o.dyTo(o.rest.dy);
    });
  });
}
