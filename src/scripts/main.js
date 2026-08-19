import { initAccordions } from "./accordion";
import { initAnimations } from "./animations";
import { initArchitectureCards } from "./architecture-cards";
import { initBaseline } from "./baseline";
import { initChatbox } from "./chatbox";
import { initCoveragePattern } from "./coverage-pattern";
import { initDock } from "./dock";
import { initGlobeParticles } from "./globe-particles";
import { initHeroCards } from "./hero-cards";
import { initHowItWorksVideo } from "./how-it-works-video";
import { revealPage } from "./reveal";
import { initTestimonials } from "./testimonials";
import { initWatermark } from "./watermark";

// Chrome first — smooth scroll has to own scrolling before the section modules
// register ScrollTriggers that read positions.
initBaseline();

// Home-page sections, in the order their scenes appear down the page.
initHowItWorksVideo();
initAccordions();
initTestimonials();
initAnimations();
initGlobeParticles();

initGlobeParticles(".sub-footer_section", { introOnEnter: true });
initCoveragePattern();
initArchitectureCards();
initHeroCards();
initChatbox();
initDock();
initWatermark();

// Last: every module above has inlined the hidden state on its own targets, so
// dropping the CSS guard here cannot flash.
revealPage();
