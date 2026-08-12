import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, ScrollTrigger);

/**
 * Bloc04 "Memory" visual — IQ chip fanning out to capability tags.
 *
 * Two layers of motion:
 * - the little arc in each tag spins forever, at a slightly different speed
 *   per tag so the row never looks mechanical;
 * - on first scroll into view, the chip pops in, the fan of lines unfolds
 *   downwards from it, then the tags rise in with a stagger.
 */
export function initMemoryIllu() {
  const root = document.querySelector(".home-bloc04_memory");
  if (!root) return;

  // Same guard as the other modules: the visual simply stays static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const chip = root.querySelector(".home-bloc04_memory-chip");
  const tentacle = root.querySelector(".home-bloc04_memory-tentacle");
  const tags = gsap.utils.toArray(
    root.querySelectorAll(".home-bloc04_memory-tag"),
  );
  const spinners = root.querySelectorAll(".home-bloc04_memory-spinner img");

  spinners.forEach((spinner) => {
    gsap.to(spinner, {
      rotation: "+=360",
      duration: gsap.utils.random(1.2, 2.2),
      ease: "none",
      repeat: -1,
    });
  });

  // Fluid pouring from the chip: droplets ride each fan line with
  // motionPath. The paths are drawn tag → chip, so travelling start:1 → end:0
  // moves the drops downwards; power1.in gives them a slight gravity feel,
  // and the fades keep them from popping in/out at the extremities. Two
  // drops per line with random phase/speed keep the streams out of sync.
  const lines = gsap.utils.toArray(
    root.querySelectorAll(".home-bloc04_memory-line"),
  );
  root.querySelectorAll(".home-bloc04_memory-drop").forEach((drop) => {
    const line = lines[Number(drop.dataset.line)];
    if (!line) return;

    const duration = gsap.utils.random(1.5, 2.4);
    gsap
      .timeline({
        repeat: -1,
        delay: gsap.utils.random(0, 2),
        repeatDelay: gsap.utils.random(0.2, 1),
      })
      .to(
        drop,
        {
          motionPath: {
            path: line,
            align: line,
            alignOrigin: [0.5, 0.5],
            start: 1,
            end: 0,
          },
          duration,
          ease: "power1.in",
        },
        0,
      )
      .fromTo(
        drop,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: duration * 0.15 },
        0,
      )
      .to(drop, { autoAlpha: 0, duration: duration * 0.2 }, duration * 0.8);
  });

  // Initial states are set here (not via .from) so nothing flashes when the
  // ScrollTrigger timeline starts mid-scroll.
  gsap.set(chip, { autoAlpha: 0, scale: 0.85 });
  gsap.set(tentacle, { autoAlpha: 1 });
  // Paths are drawn tag → chip, so collapsing them to "100% 100%" parks the
  // dash at the chip end and lets the stroke grow back down towards the tags.
  gsap.set(lines, { drawSVG: "100% 100%" });
  gsap.set(tags, { autoAlpha: 0, y: 14 });

  gsap
    .timeline({
      scrollTrigger: { trigger: root, start: "top 80%", once: true },
      defaults: { ease: "power3.out" },
    })
    .to(chip, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" })
    .to(
      lines,
      {
        drawSVG: "0% 100%",
        duration: 0.9,
        ease: "power2.inOut",
        stagger: 0.06,
      },
      "-=0.25",
    )
    .to(tags, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, "-=0.5");
}
