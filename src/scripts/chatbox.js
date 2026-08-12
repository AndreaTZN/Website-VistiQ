import gsap from "gsap";

/**
 * Hero v2 chatbox — functional feel, wired to nothing.
 *
 * The send button wakes up as soon as the input has text; sending (click or
 * Enter) clears the input and plays a small "message away" flight on the
 * arrow. No request is made anywhere — it is a product teaser.
 */
export function initChatbox() {
  const box = document.querySelector("[data-chatbox]");
  if (!box) return;

  const input = box.querySelector("[data-chatbox-input]");
  const send = box.querySelector("[data-chatbox-send]");
  if (!input || !send) return;

  const arrow = send.querySelector("svg");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  input.addEventListener("input", () => {
    send.classList.toggle("is-active", input.value.trim().length > 0);
  });

  function sendMessage() {
    if (!input.value.trim()) return;

    input.value = "";
    send.classList.remove("is-active");
    input.focus();

    if (reduceMotion || !arrow) return;

    // Arrow escapes through the top of the button, then pops back in from
    // below — the button's overflow:hidden clips the flight.
    gsap
      .timeline()
      .to(arrow, { y: -28, autoAlpha: 0, duration: 0.25, ease: "power2.in" })
      .set(arrow, { y: 28 })
      .to(arrow, { y: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out" });
  }

  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}
