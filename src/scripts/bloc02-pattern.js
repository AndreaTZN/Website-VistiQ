import gsap from "gsap";

/**
 * Bloc02 background pattern — the crosses turn to face the cursor.
 *
 * The pattern is one <svg> holding a real cross per grid cell, built on init so
 * the crosses are the pattern itself, not an enhancement layered over a tiled
 * background image.
 *
 * The pattern is pointer-events:none and sits at z-index -1, so the section is
 * the listening surface.
 */

// Grid step in px. Also the cross box, so arms stay proportional to the gap.
// Close to the original CSS tile (20.48px) without the node count that implies:
// a full-bleed section at that density is ~3000 crosses, too many to transform
// every frame. Only the crosses inside INFLUENCE are written, so this holds.
const STEP = 32;
// Beyond this distance a cross ignores the cursor and eases back to rest.
const INFLUENCE = 260;
// How far a cross turns when the cursor is right on it. A cross has 4-fold
// symmetry, so 45° is the most it can visibly rotate — past that it starts
// looking like it is turning back toward its rest position.
const MAX_ANGLE = 45;

/** Builds the <svg> grid and returns one entry per cross. */
function buildGrid(pattern, width, height) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "home-bloc02_pattern-svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("aria-hidden", "true");

  const cols = Math.ceil(width / STEP) + 1;
  const rows = Math.ceil(height / STEP) + 1;
  // Centre the grid so the crosses do not cling to one edge when the section
  // width is not a whole number of steps.
  const offsetX = (width - (cols - 1) * STEP) / 2;
  const offsetY = (height - (rows - 1) * STEP) / 2;
  // Arm length matches the original tile's ratio (10.48 drawn in 20.48).
  const arm = (STEP * 10.48) / 20.48 / 2;

  const crosses = [];
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = offsetX + col * STEP;
      const cy = offsetY + row * STEP;

      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("class", "home-bloc02_pattern-cross");
      path.setAttribute(
        "d",
        `M${cx} ${cy - arm}V${cy + arm}M${cx - arm} ${cy}H${cx + arm}`,
      );
      path.setAttribute("stroke", "#1D1E21");
      path.setAttribute("stroke-width", "0.6");

      fragment.appendChild(path);
      crosses.push({ el: path, cx, cy, angle: 0, target: 0 });
    }
  }

  svg.appendChild(fragment);
  pattern.replaceChildren(svg);

  return crosses;
}

export function initBloc02Pattern() {
  const section = document.querySelector(".home-bloc02_section");
  const pattern = section?.querySelector(".home-bloc02_pattern");
  if (!section || !pattern) return;

  let crosses = [];
  // Pointer position in pattern-local coordinates; null while not hovering.
  let pointer = null;
  let running = false;

  const build = () => {
    const box = pattern.getBoundingClientRect();
    if (!box.width || !box.height) return;
    crosses = buildGrid(pattern, box.width, box.height);
  };

  // The crosses are the pattern, so they are drawn up front rather than on
  // first hover — including under reduced motion, where only the rotation is
  // dropped and the static grid still has to render.
  build();

  // The grid is sized in px, so it has to be rebuilt when the section resizes.
  let resizeId;
  window.addEventListener("resize", () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(build, 200);
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const tick = () => {
    let moving = false;

    for (const cross of crosses) {
      if (pointer) {
        const dx = pointer.x - cross.cx;
        const dy = pointer.y - cross.cy;
        const distance = Math.hypot(dx, dy);

        if (distance < INFLUENCE) {
          // Fade the effect out with distance so the rotation stays a local
          // pool around the cursor instead of the whole grid swinging. The
          // exponent is deliberately below 1: a linear or squared falloff left
          // the near crosses barely turning, because the cursor always lands
          // between grid points and never right on one.
          const strength = Math.pow(1 - distance / INFLUENCE, 0.6);

          // Signed angle from the cross's nearest arm to the cursor. Taking it
          // modulo 90° (the cross's symmetry) and centring on 0 keeps the value
          // continuous — a plain fold would jump sign across the diagonals and
          // send neighbouring crosses opposite ways.
          const raw = (Math.atan2(dy, dx) * 180) / Math.PI;
          const offset = raw - Math.round(raw / 90) * 90;

          cross.target = offset * strength * (MAX_ANGLE / 45);
        } else {
          cross.target = 0;
        }
      } else {
        cross.target = 0;
      }

      const delta = cross.target - cross.angle;
      if (Math.abs(delta) < 0.01) {
        cross.angle = cross.target;
        continue;
      }

      // Exponential ease toward the target: one lerp for the whole grid is far
      // cheaper than a tween per cross, and reads the same at this amplitude.
      cross.angle += delta * 0.12;
      // CSS rotation, not the SVG transform attribute: it composites instead of
      // invalidating layout. The centre comes from transform-box in the CSS.
      cross.el.style.rotate = `${cross.angle.toFixed(2)}deg`;
      moving = true;
    }

    // Idle out once everything is back at rest and the cursor is gone.
    if (!moving && !pointer) {
      gsap.ticker.remove(tick);
      running = false;
    }
  };

  const start = () => {
    if (running) return;
    gsap.ticker.add(tick);
    running = true;
  };

  section.addEventListener("mousemove", (e) => {
    if (!crosses.length) return;
    // Re-read the box every move: the section travels with the scroll, so a
    // cached rect would offset the pointer as soon as the page moves.
    const box = pattern.getBoundingClientRect();
    pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
    start();
  });

  section.addEventListener("mouseleave", () => {
    pointer = null;
    start();
  });
}
