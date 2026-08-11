/**
 * Splits button labels into per-character spans so CSS can stagger them on
 * hover (see components/button-animate.css).
 */
export function initButtonCharacterStagger() {
  const offsetIncrement = 0.01;

  document.querySelectorAll("[data-button-animate-chars]").forEach((button) => {
    const text = button.textContent ?? "";
    button.replaceChildren();

    [...text].forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.transitionDelay = `${index * offsetIncrement}s`;
      // Preserve the width of spaces, which collapse in inline-block spans.
      if (char === " ") span.style.whiteSpace = "pre";
      button.append(span);
    });
  });
}
