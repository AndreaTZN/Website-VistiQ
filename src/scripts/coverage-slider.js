import gsap from "gsap";

/**
 * Coverage lifecycle slider (Figma 1709:71258).
 *
 * The design lays the six lifecycle steps out in one row. At the container
 * width that leaves ~11rem per step, which wraps every bullet onto two-word
 * lines, so the CSS gives each step a readable minimum width instead and this
 * module pages the overflow horizontally.
 *
 * It is progressive enhancement: the track is a plain grid that already scrolls
 * natively, and the controls stay `hidden` until we measure a real overflow. A
 * viewport wide enough for all six steps therefore keeps a static grid with no
 * content hidden behind an interaction.
 */
export function initCoverageSlider() {
  document.querySelectorAll("[data-coverage-slider]").forEach((root) => {
    const viewport = root.querySelector("[data-coverage-viewport]");
    const track = root.querySelector("[data-coverage-track]");
    const controls = root.querySelector("[data-coverage-controls]");
    const dotsWrap = root.querySelector("[data-coverage-dots]");
    const prev = root.querySelector("[data-coverage-prev]");
    const next = root.querySelector("[data-coverage-next]");
    const steps = Array.from(root.querySelectorAll("[data-coverage-step]"));
    if (!viewport || !track || steps.length < 2) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** Page index, and how many pages the current width yields. */
    let page = 0;
    let pages = 1;
    /** Horizontal offset of each page, in px. */
    let offsets = [0];

    /**
     * Measures the pages for the current width.
     *
     * Pages are built from real element positions rather than a steps-per-page
     * constant, so a page always starts flush with a step regardless of how many
     * fit. The last page is clamped to the maximum scroll so it never leaves a
     * gap on the right.
     */
    function measure() {
      const max = Math.max(0, track.scrollWidth - viewport.clientWidth);

      if (max < 1) {
        // Everything fits: no paging, no controls.
        pages = 1;
        offsets = [0];
        page = 0;
        gsap.set(track, { x: 0 });
        if (controls) controls.hidden = true;
        return;
      }

      const width = viewport.clientWidth;
      const left = steps[0].offsetLeft;
      const starts = [];

      // Walk the steps, opening a new page each time one would overflow it.
      let pageStart = 0;
      steps.forEach((step, i) => {
        const x = step.offsetLeft - left;
        if (i > 0 && x + step.offsetWidth - pageStart > width + 1) {
          pageStart = x;
          starts.push(x);
        }
      });
      offsets = [0, ...starts].map((x) => Math.min(x, max));

      // Two steps landing on the same clamped offset would be one dead page.
      offsets = offsets.filter((x, i) => i === 0 || x - offsets[i - 1] > 1);

      pages = offsets.length;
      page = Math.min(page, pages - 1);

      if (controls) controls.hidden = pages < 2;
      buildDots();
      apply(false);
    }

    /** Rebuilds the dots so their count matches the measured pages. */
    function buildDots() {
      if (!dotsWrap) return;
      if (dotsWrap.children.length === pages) return;

      dotsWrap.textContent = "";
      for (let i = 0; i < pages; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "coverage_dot";
        dot.setAttribute("aria-label", `Go to step group ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.append(dot);
      }
    }

    /** Writes the current page to the track, the arrows and the dots. */
    function apply(animate) {
      const x = -offsets[page];
      if (animate && !reduced) {
        gsap.to(track, { x, duration: 0.6, ease: "power3.out", overwrite: true });
      } else {
        gsap.set(track, { x });
      }

      if (prev) prev.disabled = page === 0;
      if (next) next.disabled = page === pages - 1;

      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((dot, i) => {
          dot.classList.toggle("is-active", i === page);
        });
      }

      // Offscreen steps stay in the DOM and in the a11y tree, but must not take
      // focus from a keyboard user who cannot see them.
      steps.forEach((step) => {
        const x0 = step.offsetLeft - steps[0].offsetLeft + offsets[page];
        const visible =
          x0 + step.offsetWidth > offsets[page] - 1 &&
          x0 < offsets[page] + viewport.clientWidth + 1;
        step
          .querySelectorAll("a, button")
          .forEach((el) => el.toggleAttribute("inert", !visible));
      });
    }

    function goTo(index) {
      const clamped = Math.max(0, Math.min(index, pages - 1));
      if (clamped === page) return;
      page = clamped;
      apply(true);
    }

    prev?.addEventListener("click", () => goTo(page - 1));
    next?.addEventListener("click", () => goTo(page + 1));

    // Keyboard paging when the slider itself has focus.
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        goTo(page - 1);
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        goTo(page + 1);
        event.preventDefault();
      }
    });

    measure();

    // Fonts land after first paint and change how the bullets wrap, which moves
    // every step's offset — remeasure once they are ready.
    document.fonts?.ready.then(measure);

    let resizeId;
    window.addEventListener("resize", () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(measure, 150);
    });
  });
}
