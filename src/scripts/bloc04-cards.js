import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, ScrollTrigger);

/**
 * Bloc04 — every card visual in the section lives here.
 *
 *   1. "Data sources"   → rows pop from the middle out, each check draws itself
 *   2. "Agents"         → notification cards stack in, live dot keeps pulsing
 *   3. "Signal & event" → same stack, offset timing so the two don't mirror
 *   4. "Memory"         → IQ chip fans out to the capability tags
 *
 * Shared conventions:
 * - initial states are written with gsap.set() (not .from) so nothing flashes
 *   when a ScrollTrigger fires mid-scroll;
 * - the entrances are `once: true` — they are reveals, not scrubbed scenes.
 */

/** Fires the timeline built by `build` when `card` scrolls into view. */
function onEnter(card, build, { delay = 0 } = {}) {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: card, start: "top 80%", once: true },
    defaults: { ease: "power3.out" },
    delay,
  });
  build(tl);
  return tl;
}

/* ------------------------------------------------------------------ *
 * 1. Data sources — rows pop out from the middle, then each check draws
 * ------------------------------------------------------------------ */

function initSourcesCard(card) {
  const rows = gsap.utils.toArray(card.querySelectorAll(".home-bloc04_source"));
  if (!rows.length) return;

  const checks = gsap.utils.toArray(
    card.querySelectorAll(".home-bloc04_source-check path"),
  );

  gsap.set(rows, { autoAlpha: 0, scale: 0.8 });
  gsap.set(checks, { drawSVG: "0%" });

  // `from: "center"` ripples outwards from the middle row instead of running
  // top-to-bottom, so the list reads as one block settling into place.
  const fromCenter = { each: 0.03, from: "center" };

  onEnter(card, (tl) => {
    tl.to(rows, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.7)",
      stagger: fromCenter,
    }).to(
      checks,
      {
        drawSVG: "100%",
        duration: 0.35,
        ease: "power2.out",
        stagger: fromCenter,
      },
      "-=0.35",
    );
  });
}

/* ------------------------------------------------------------------ *
 * 2 & 3. Notification stacks (Agents + Signal & event)
 * ------------------------------------------------------------------ */

/**
 * Both cards use the same `.home-bloc04_agents-card` stack, so they share one
 * builder. `delay` offsets the signals card so the two columns don't animate
 * in lockstep when they enter the viewport together.
 */
function initStackCard(card, { delay = 0 } = {}) {
  const notifications = gsap.utils.toArray(
    card.querySelectorAll(".home-bloc04_agents-card"),
  );
  if (!notifications.length) return;

  const head = card.querySelector(".home-bloc04_agents-head");
  const ghost = card.querySelector(".home-bloc04_agents-ghost");

  if (head) gsap.set(head, { autoAlpha: 0, y: -8 });
  if (ghost) gsap.set(ghost, { autoAlpha: 0, y: 10, scale: 0.95 });
  gsap.set(notifications, { autoAlpha: 0, y: 18 });
  // Unread dots pop in after their card has settled.
  gsap.set(card.querySelectorAll(".home-bloc04_agents-unread"), { scale: 0 });

  onEnter(
    card,
    (tl) => {
      if (head) tl.to(head, { autoAlpha: 1, y: 0, duration: 0.5 });

      tl.to(
        notifications,
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12 },
        head ? "-=0.3" : 0,
      );

      if (ghost)
        tl.to(ghost, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.3");

      tl.to(
        card.querySelectorAll(".home-bloc04_agents-unread"),
        { scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.12 },
        "-=0.5",
      );
    },
    { delay },
  );

  // The "Running 24/7" dot keeps breathing once the card is in — it signals
  // live activity, so it is not part of the entrance timeline.
  const liveDot = card.querySelector(".home-bloc04_agents-live-dot");
  if (liveDot) {
    gsap.to(liveDot, {
      scale: 1.18,
      opacity: 0.65,
      duration: 0.9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "center center",
    });
  }
}

/* ------------------------------------------------------------------ *
 * 4. Memory — IQ chip fanning out to capability tags
 * ------------------------------------------------------------------ */

/**
 * Three layers of motion:
 * - the little arc in each tag spins forever, at a slightly different speed
 *   per tag so the row never looks mechanical;
 * - droplets pour down the fan lines on an endless randomized loop;
 * - on first scroll into view, the chip pops in, the fan lines draw
 *   downwards from it, then the tags rise in with a stagger.
 */
function initMemoryCard(root) {
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

  // Paused here, played from the entrance's onComplete — the drops only make
  // sense once the lines they ride are fully drawn.
  const dropLoops = [];

  root.querySelectorAll(".home-bloc04_memory-drop").forEach((drop) => {
    const line = lines[Number(drop.dataset.line)];
    if (!line) return;

    const duration = gsap.utils.random(1.5, 2.4);
    const loop = gsap
      .timeline({
        repeat: -1,
        delay: gsap.utils.random(0, 2),
        repeatDelay: gsap.utils.random(0.2, 1),
        paused: true,
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

    dropLoops.push(loop);
  });

  gsap.set(chip, { autoAlpha: 0, scale: 0.85 });
  gsap.set(tentacle, { autoAlpha: 1 });
  // Paths are drawn tag → chip, so collapsing them to "100% 100%" parks the
  // dash at the chip end and lets the stroke grow back down towards the tags.
  gsap.set(lines, { drawSVG: "100% 100%" });
  gsap.set(tags, { autoAlpha: 0, y: 14 });
  // The loops fade each drop in themselves; keep them hidden until then so
  // they don't sit parked at cx/cy once the reveal guard lifts.
  gsap.set(root.querySelectorAll(".home-bloc04_memory-drop"), { autoAlpha: 0 });

  onEnter(root, (tl) => {
    tl.to(chip, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.7,
      ease: "back.out(1.6)",
    })
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
      .to(tags, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, "-=0.5")
      // Slightly before the end: the lines are drawn by now, so the drops
      // overlap the tail of the tag stagger instead of waiting it out.
      .call(() => dropLoops.forEach((loop) => loop.play()), undefined, "-=1.3");
  });
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export function initBloc04Cards() {
  const section = document.querySelector(".home-bloc04_section");
  if (!section) return;

  // Same guard as the other modules: the cards simply stay static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sources = section.querySelector(".home-bloc04_card.is-sources");
  const agents = section.querySelector(".home-bloc04_card.is-agents");
  const signals = section.querySelector(".home-bloc04_card.is-informations");
  // Triggered on the visual itself, not the card — it sits lower in the card,
  // so using the card would start the fan before it is actually on screen.
  const memory = section.querySelector(".home-bloc04_memory");

  if (sources) initSourcesCard(sources);
  if (agents) initStackCard(agents);
  if (signals) initStackCard(signals, { delay: 0.15 });
  if (memory) initMemoryCard(memory);
}
