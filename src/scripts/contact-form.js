import gsap from "gsap";

/**
 * Contact form submission.
 *
 * There is no backend in this repo, so the form has two modes:
 * - an `action` is set (PUBLIC_CONTACT_ENDPOINT) → POST the fields as JSON
 * - no `action`, or the POST fails → send the visitor to the Typeform in
 *   `data-fallback`, the same one every other CTA on the site points to.
 *
 * Validation is done here rather than by the browser (`novalidate` on the
 * form) so the invalid fields get the project's own `.is-invalid` styling
 * instead of the native bubbles.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Default required fields, in DOM order — first invalid one gets focus. */
const REQUIRED = ["name", "email", "category", "message"];

export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  // Each page declares its own fields; the contact form keeps the default.
  const required = form.dataset.required
    ? form.dataset.required.split(",").map((name) => name.trim())
    : REQUIRED;

  const status = form.querySelector("[data-contact-status]");
  const submit = form.querySelector("[data-contact-submit]");
  const submitLabel = form.querySelector("[data-contact-submit-label]");
  const fallback = form.dataset.fallback || "";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /** Writes the status line and, unless reduced, fades it in. */
  function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-error", "is-success");
    if (state) status.classList.add(`is-${state}`);
    if (message && !reduceMotion) {
      gsap.fromTo(
        status,
        { autoAlpha: 0, y: 4 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    }
  }

  /** Clears `.is-invalid` as soon as the visitor edits the field again. */
  const clearInvalid = (event) => {
    const field = event.target;
    if (field instanceof Element) field.classList.remove("is-invalid");
  };
  form.addEventListener("input", clearInvalid);
  form.addEventListener("change", clearInvalid);

  /** Returns the first invalid field, or null. */
  function findInvalid() {
    let firstInvalid = null;

    for (const name of required) {
      const field = form.elements.namedItem(name);
      if (!(field instanceof HTMLElement) || !("value" in field)) continue;

      // A checkbox is valid when ticked; everything else when non-empty.
      const invalid =
        field instanceof HTMLInputElement && field.type === "checkbox"
          ? !field.checked
          : String(field.value).trim().length === 0 ||
            (name === "email" && !EMAIL_PATTERN.test(String(field.value)));

      field.classList.toggle("is-invalid", invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    }

    return firstInvalid;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Honeypot filled → a bot. Pretend it worked and drop the message.
    if (String(form.elements.namedItem("companyWebsite")?.value || "").trim()) {
      setStatus("Thanks — your message is on its way.", "success");
      return;
    }

    const invalid = findInvalid();
    if (invalid) {
      setStatus("Please check the highlighted fields.", "error");
      invalid.focus();
      return;
    }

    const endpoint = form.getAttribute("action");
    if (!endpoint) {
      // No inbox wired up: hand the visitor over to the demo questionnaire.
      if (fallback) window.location.href = fallback;
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    delete payload.companyWebsite;

    submit?.setAttribute("disabled", "");
    if (submitLabel) submitLabel.textContent = "Sending…";
    setStatus("", null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(String(response.status));

      form.reset();
      setStatus(
        "Thanks — your message is on its way. We reply within one business day.",
        "success",
      );
    } catch {
      setStatus(
        fallback
          ? "Something went wrong. You can reach us through the demo form instead."
          : "Something went wrong. Please email us at hello@vistiq.ai.",
        "error",
      );
    } finally {
      submit?.removeAttribute("disabled");
      if (submitLabel) submitLabel.textContent = "Send message";
    }
  });
}
