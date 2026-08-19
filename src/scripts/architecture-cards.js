import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, ScrollTrigger);

/**
 * Architecture — every card visual in the section lives here.
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
  const rows = gsap.utils.toArray(card.querySelectorAll(".architecture_source"));
  if (!rows.length) return;

  const checks = gsap.utils.toArray(
    card.querySelectorAll(".architecture_source-check path"),
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
 * Both cards use the same `.architecture_agents-card` stack, so they share one
 * builder. `delay` offsets the signals card so the two columns don't animate
 * in lockstep when they enter the viewport together.
 */
function initStackCard(card, { delay = 0 } = {}) {
  const notifications = gsap.utils.toArray(
    card.querySelectorAll(".architecture_agents-card"),
  );
  if (!notifications.length) return;

  const head = card.querySelector(".architecture_agents-head");
  const ghost = card.querySelector(".architecture_agents-ghost");

  if (head) gsap.set(head, { autoAlpha: 0, y: -8 });
  if (ghost) gsap.set(ghost, { autoAlpha: 0, y: 10, scale: 0.95 });
  gsap.set(notifications, { autoAlpha: 0, y: 18 });
  // Unread dots pop in after their card has settled.
  gsap.set(card.querySelectorAll(".architecture_agents-unread"), { scale: 0 });

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
        card.querySelectorAll(".architecture_agents-unread"),
        { scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.12 },
        "-=0.5",
      );
    },
    { delay },
  );

  // The "Running 24/7" dot keeps breathing once the card is in — it signals
  // live activity, so it is not part of the entrance timeline.
  const liveDot = card.querySelector(".architecture_agents-live-dot");
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
  const chip = root.querySelector(".architecture_memory-chip");
  const tentacle = root.querySelector(".architecture_memory-tentacle");
  const tags = gsap.utils.toArray(
    root.querySelectorAll(".architecture_memory-tag"),
  );
  const spinners = root.querySelectorAll(".architecture_memory-spinner img");

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
    root.querySelectorAll(".architecture_memory-line"),
  );

  // Paused here, played from the entrance's onComplete — the drops only make
  // sense once the lines they ride are fully drawn.
  const dropLoops = [];

  root.querySelectorAll(".architecture_memory-drop").forEach((drop) => {
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
  gsap.set(root.querySelectorAll(".architecture_memory-drop"), { autoAlpha: 0 });

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
 * 5. One workforce — the deal thread writes itself, step by step
 * ------------------------------------------------------------------ */

/**
 * The card reads as a thread being filled in, so the steps run sequentially
 * rather than as one stagger: each connector line grows down to the next
 * bullet, the bullet pops, then the step's text and comment slide in.
 *
 * The lines are plain divs (not SVG), so they scale on scaleY rather than
 * drawSVG — same downward growth, no extra plugin.
 */
function initWorkforceCard(card) {
  const steps = gsap.utils.toArray(
    card.querySelectorAll(".architecture_workforce-step"),
  );
  if (!steps.length) return;

  const head = card.querySelector(".architecture_workforce-head");
  const divider = card.querySelector(".architecture_workforce-divider");
  const ghosts = gsap.utils.toArray(
    card.querySelectorAll(".architecture_workforce-ghost"),
  );

  const bullets = steps.map((s) =>
    s.querySelector(".architecture_workforce-bullet"),
  );
  const lines = steps.map((s) =>
    s.querySelector(".architecture_workforce-line"),
  );
  const bodies = steps.map((s) =>
    s.querySelector(".architecture_workforce-step-head"),
  );
  const comments = steps.map((s) =>
    s.querySelector(".architecture_workforce-comment"),
  );

  if (head) gsap.set(head, { autoAlpha: 0, y: -8 });
  // scaleY/scaleX are set explicitly on both: the reveal guard collapses these
  // on one axis, and GSAP would otherwise leave the other at the CSS value.
  if (divider)
    gsap.set(divider, { scaleX: 0, scaleY: 1, transformOrigin: "left center" });
  gsap.set(ghosts, { autoAlpha: 0, y: 14, scale: 0.97 });
  gsap.set(bullets, { autoAlpha: 0, scale: 0 });
  gsap.set(lines, { scaleY: 0, scaleX: 1, transformOrigin: "top center" });
  gsap.set([bodies, comments], { autoAlpha: 0, y: 10 });

  onEnter(card, (tl) => {
    if (head) tl.to(head, { autoAlpha: 1, y: 0, duration: 0.5 });
    if (divider)
      tl.to(divider, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, "-=0.3");

    steps.forEach((_, i) => {
      // Each step overlaps the previous one so the thread keeps moving
      // instead of stopping between rows.
      const at = i === 0 ? "-=0.2" : "-=0.45";

      tl.to(
        bullets[i],
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" },
        at,
      )
        .to(
          [bodies[i], comments[i]],
          { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08 },
          "-=0.2",
        )
        .to(lines[i], { scaleY: 1, duration: 0.45 }, "-=0.4");
    });

    // The stacked deals settle in behind once the thread is under way.
    tl.to(
      ghosts,
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 },
      0.35,
    );
  });
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export function initArchitectureCards() {
  const section = document.querySelector(".architecture_section");
  if (!section) return;

  // Same guard as the other modules: the cards simply stay static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sources = section.querySelector(".architecture_card.is-sources");
  const agents = section.querySelector(".architecture_card.is-agents");
  const signals = section.querySelector(".architecture_card.is-informations");
  // Triggered on the visual itself, not the card — it sits lower in the card,
  // so using the card would start the fan before it is actually on screen.
  const memory = section.querySelector(".architecture_memory");
  const workforce = section.querySelector(".architecture_card.is-workforce");

  if (sources) initSourcesCard(sources);
  if (agents) initStackCard(agents);
  if (signals) initStackCard(signals, { delay: 0.15 });
  if (memory) initMemoryCard(memory);
  if (workforce) initWorkforceCard(workforce);
}
