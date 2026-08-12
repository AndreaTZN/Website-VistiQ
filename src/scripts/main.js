import { initAccordions } from "./accordion";
import { initAnimations } from "./animations";
import { initBloc04Cards } from "./bloc04-cards";
import { initChatbox } from "./chatbox";
import { initGlobeParticles } from "./globe-particles";
import { initHeroCards } from "./hero-cards";
import { initMenu } from "./menu";
import { initSmoothScroll } from "./smooth-scroll";
import { initTestimonials } from "./testimonials";
import { initWatermark } from "./watermark";

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
// Before initHeroCards(): that module lifts the reveal guard by adding
// `.is-ready`, so these targets must already be hidden inline or they flash
// in their final state.
initBloc04Cards();
initHeroCards();
initChatbox();
initWatermark();
initYear();
