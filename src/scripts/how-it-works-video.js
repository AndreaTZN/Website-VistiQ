/**
 * "How it works" background video.
 *
 * The markup carries no `autoplay`: playback starts here so it can be gated on
 * two things the attribute cannot express —
 * - `prefers-reduced-motion`: the video stays on its first frame, so the
 *   section keeps its visual instead of collapsing to the empty sage block;
 * - visibility: the pair of sources weighs ~16 MB, so nothing is fetched
 *   beyond the metadata until the section is close, and playback pauses again
 *   once it scrolls away.
 *
 * No-ops when the section is absent, like every other module.
 */
export function initHowItWorksVideo() {
  const video = document.querySelector("[data-how-it-works-video]");
  if (!video) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Load the first frame so the frame is never an empty box, then stop there.
  if (reduceMotion) {
    video.preload = "metadata";
    return;
  }

  // Older Safari has no IntersectionObserver-driven autoplay path: just play.
  if (!("IntersectionObserver" in window)) {
    video.play().catch(() => {});
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // `play()` rejects if the tab is backgrounded — harmless, retried on
          // the next intersection.
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: "200px 0px" },
  );

  observer.observe(video);
}
