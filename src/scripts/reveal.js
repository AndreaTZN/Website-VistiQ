/**
 * Lifts the reveal guard set by BaseLayout (`.has-reveals:not(.is-ready)`).
 *
 * The guard hides every animated target from the first paint, so *something*
 * must always add `.is-ready` — otherwise the page stays invisible. Owning
 * that here rather than inside a section module means a page can drop any
 * section (or all of them) without the reveal going missing.
 *
 * Call it after the entrance tweens have written their hidden state as inline
 * styles: those tweens keep the elements hidden on their own, so dropping the
 * CSS guard at that point cannot flash. Modules that animate reveal targets
 * are therefore initialised before this runs.
 */
export function revealPage() {
  document.documentElement.classList.add("is-ready");
}
