import { initAccordions } from "./accordion";
import { initAnimations } from "./animations";
import { initChatbox } from "./chatbox";
import { initGlobeParticles } from "./globe-particles";
import { initHeroCards } from "./hero-cards";
import { initMenu } from "./menu";
import { initSmoothScroll } from "./smooth-scroll";
import { initTestimonials } from "./testimonials";

/** Sets the current year on any [data-el="year"] element. */
function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-el="year"]').forEach((el) => {
    el.textContent = year;
  });
}

// Smooth scroll first: the other modules register ScrollTriggers that must
// read positions after Lenis has taken over scrolling.
initSmoothScroll();
initMenu();
initAccordions();
initTestimonials();
initAnimations();
initGlobeParticles();
initHeroCards();
initChatbox();
initYear();
