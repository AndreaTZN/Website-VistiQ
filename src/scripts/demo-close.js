/**
 * Close button on the "request a demo" screen.
 *
 * The page is a dead end by design — no nav, no footer — so the button has to
 * put the visitor back where they were. `history.back()` alone is not safe: on
 * a direct hit (mail link, ad, pasted URL) there is nothing to go back to, and
 * it would either do nothing or push the visitor off the site entirely.
 *
 * So the referrer decides: same origin and a real history entry means the
 * visitor came from within the site and back is correct; anything else falls
 * through to the anchor's own href, which is the home page.
 */
export function initDemoClose() {
  const close = document.querySelector("[data-demo-close]");
  if (!close) return;

  close.addEventListener("click", (event) => {
    if (history.length <= 1 || !document.referrer) return;

    let sameOrigin = false;
    try {
      sameOrigin = new URL(document.referrer).origin === location.origin;
    } catch {
      // A malformed referrer is treated as external: the href fallback wins.
      return;
    }

    if (!sameOrigin) return;

    event.preventDefault();
    history.back();
  });
}
