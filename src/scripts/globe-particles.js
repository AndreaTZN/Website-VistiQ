import * as THREE from "three";
import gsap from "gsap";

/**
 * Hero background — WebGL particle ring.
 *
 * Scattered "stars" fade in, pulse once, then converge onto a diffuse ring:
 * a thick, grainy annulus with uneven angular density and sparse outliers,
 * slowly swirling. The mouse locally thickens the ring while hovering it.
 */
export function initGlobeParticles() {
  // Same guard as the other modules: no background animation for users who
  // prefer reduced motion — the hero simply keeps its static backdrop.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const el = document.querySelector(".hero-v2_section");
  if (!el) return;

  const canvas = el.querySelector(".hero-v2_anim-canvas");
  if (!canvas) return;

  const isMobile = window.innerWidth < 992;
  const DPR = Math.min(window.devicePixelRatio, 2);
  // The diffuse ring reads sparse and grainy — far fewer points than the old
  // 5-ellipse globe needed.
  const COUNT = isMobile ? 4500 : 9000;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(DPR);
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.domElement.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
  canvas.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  let W = canvas.offsetWidth;
  let H = canvas.offsetHeight;

  const camera = new THREE.OrthographicCamera(
    -W / 2,
    W / 2,
    H / 2,
    -H / 2,
    0.1,
    10,
  );
  camera.position.z = 1;

  // Mobile: fit to 90% of the height, no forced minimum.
  // Desktop: max 90% H / 85% W, with a minimum diameter of 800px.
  // 380 is kept as the reference diameter so the sizing rules stay unchanged.
  const globeScale = isMobile
    ? (H * 0.9) / 380
    : Math.max(Math.min(W * 0.85, H * 0.9) / 380, 800 / 380);
  const ringR = 190 * globeScale;
  // Gaussian thickness of the ring body; outliers scatter much further out.
  const ringSigma = ringR * 0.13;

  const startPos = new Float32Array(COUNT * 3);
  const shapePos = new Float32Array(COUNT * 3);
  const aPhases = new Float32Array(COUNT);
  const aSpeeds = new Float32Array(COUNT);
  const aAmpX = new Float32Array(COUNT);
  const aAmpY = new Float32Array(COUNT);
  const aSizes = new Float32Array(COUNT);
  const aColors = new Float32Array(COUNT * 3);
  const aHidden = new Float32Array(COUNT);
  const aOrbitRx = new Float32Array(COUNT);
  const aOrbitRy = new Float32Array(COUNT);
  const aOrbitAngle = new Float32Array(COUNT);
  const aOrbitDir = new Float32Array(COUNT);
  const shapeRadii = new Float32Array(COUNT);
  const shapeAngles = new Float32Array(COUNT);

  const PALETTE = [new THREE.Color("#C0C0C0")];

  // Approximate gaussian in [-1, 1] (sum of 3 uniforms) — soft ring edges.
  const gauss = () =>
    (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  // Uneven angular density: low-frequency harmonics with random phases give
  // the ring its clumpy, hand-drawn look (denser arcs, near-gaps).
  const ph1 = Math.random() * Math.PI * 2;
  const ph2 = Math.random() * Math.PI * 2;
  const angularDensity = (a) =>
    0.35 + 0.65 * (0.5 + 0.35 * Math.sin(a * 3 + ph1) + 0.3 * Math.sin(a * 5 + ph2));

  for (let i = 0; i < COUNT; i++) {
    // Start position: stars scattered across the whole canvas
    const sAngle = Math.random() * Math.PI * 2;
    const sR = Math.sqrt(Math.random()) * Math.min(W, H) * 0.55;
    startPos[i * 3] = Math.cos(sAngle) * sR;
    startPos[i * 3 + 1] = Math.sin(sAngle) * sR;
    startPos[i * 3 + 2] = 0;

    // Destination: a point on the diffuse ring. Rejection-sample the angle
    // against the density function so some arcs are denser than others.
    let t = Math.random() * Math.PI * 2;
    for (let tries = 0; tries < 8; tries++) {
      if (Math.random() < angularDensity(t)) break;
      t = Math.random() * Math.PI * 2;
    }
    // Ring body is gaussian around ringR; ~7% of points scatter as outliers.
    let r = ringR + gauss() * ringSigma * 2.0;
    if (Math.random() < 0.07) r = ringR * (1 + (Math.random() * 2 - 1) * 0.5);
    shapePos[i * 3] = r * Math.cos(t);
    shapePos[i * 3 + 1] = -r * Math.sin(t);
    shapePos[i * 3 + 2] = 0;
    shapeRadii[i] = r;
    shapeAngles[i] = t;

    aPhases[i] = Math.random() * Math.PI * 2;
    aSpeeds[i] = Math.random() * 0.3 + 0.06;
    aAmpX[i] = (Math.random() * 0.5 + 0.5) * 30;
    aAmpY[i] = (Math.random() * 0.5 + 0.5) * 30;
    aSizes[i] = (Math.random() * 1.2 + 0.8) * DPR;
    aHidden[i] = Math.random() < 0.7 ? 1.0 : 0.0;
    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    aColors[i * 3] = c.r;
    aColors[i * 3 + 1] = c.g;
    aColors[i * 3 + 2] = c.b;
  }

  // Angular pairing: each particle flies to the shape point at the closest
  // angle, so the convergence reads as a swirl instead of a random shuffle.
  const sortedStart = Array.from({ length: COUNT }, (_, i) => i).sort(
    (a, b) =>
      Math.atan2(startPos[a * 3 + 1], startPos[a * 3]) -
      Math.atan2(startPos[b * 3 + 1], startPos[b * 3]),
  );
  const sortedShape = Array.from({ length: COUNT }, (_, i) => i).sort(
    (a, b) =>
      Math.atan2(shapePos[a * 3 + 1], shapePos[a * 3]) -
      Math.atan2(shapePos[b * 3 + 1], shapePos[b * 3]),
  );

  const remappedShape = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const di = sortedStart[i];
    const si = sortedShape[i];
    remappedShape[di * 3] = shapePos[si * 3];
    remappedShape[di * 3 + 1] = shapePos[si * 3 + 1];
    remappedShape[di * 3 + 2] = 0;
    // Each particle keeps its own radius on the ring; everyone swirls the
    // same way, the per-particle speeds are enough to keep it organic.
    aOrbitRx[di] = shapeRadii[si];
    aOrbitRy[di] = shapeRadii[si];
    aOrbitAngle[di] = shapeAngles[si];
    aOrbitDir[di] = 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(startPos, 3));
  geometry.setAttribute("aShape", new THREE.BufferAttribute(remappedShape, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(aPhases, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeeds, 1));
  geometry.setAttribute("aAmpX", new THREE.BufferAttribute(aAmpX, 1));
  geometry.setAttribute("aAmpY", new THREE.BufferAttribute(aAmpY, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(aSizes, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(aColors, 3));
  geometry.setAttribute("aHidden", new THREE.BufferAttribute(aHidden, 1));
  geometry.setAttribute("aOrbitRx", new THREE.BufferAttribute(aOrbitRx, 1));
  geometry.setAttribute("aOrbitRy", new THREE.BufferAttribute(aOrbitRy, 1));
  geometry.setAttribute(
    "aOrbitAngle",
    new THREE.BufferAttribute(aOrbitAngle, 1),
  );
  geometry.setAttribute("aOrbitDir", new THREE.BufferAttribute(aOrbitDir, 1));

  const vertexShader = /* glsl */ `
    attribute vec3  aShape;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aAmpX;
    attribute float aAmpY;
    attribute float aSize;
    attribute vec3  aColor;
    attribute float aHidden;
    attribute float aOrbitRx;
    attribute float aOrbitRy;
    attribute float aOrbitAngle;
    attribute float aOrbitDir;

    uniform float uTime;
    uniform float uGatherStart;
    uniform float uOpacity;
    uniform float uGather;
    uniform float uSettle;
    uniform float uPulse;
    uniform vec2  uMouse;
    uniform float uMouseActivity;
    uniform vec3  uTargetColor;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      float drag   = 2.5 + (1.0 - aSpeed * 1.8) * 3.5;
      float tEased = 1.0 - pow(1.0 - uGather, drag);

      // Slow rotation of the starting star cloud
      float rotSpeed = 0.06 + aSpeed * 0.02;
      float rotAngle = uTime * rotSpeed;
      float cosR = cos(rotAngle);
      float sinR = sin(rotAngle);
      vec3 rotatedStart = vec3(
        position.x * cosR - position.y * sinR,
        position.x * sinR + position.y * cosR,
        0.0
      );

      // Destination = orbital position — time relative to the gather start
      float orbitSpeed = 0.02 + aSpeed * 0.01;
      float orbitT     = aOrbitAngle + aOrbitDir * (uTime - uGatherStart) * orbitSpeed;
      float spreadPx = sin(aPhase * 5.3) * 3.5;
      vec3  orbitPos = vec3(
        (aOrbitRx + spreadPx) * cos(orbitT),
       -(aOrbitRy + spreadPx) * sin(orbitT),
        0.0
      );

      // Magnifier effect: radial thickening of the ring near the mouse
      float distToMouse = distance(orbitPos.xy, uMouse);
      float proximity   = 1.0 - smoothstep(20.0, 220.0, distToMouse);
      // Radial direction from the ellipse centre = thickening direction
      vec2  radialDir   = length(orbitPos.xy) > 0.001 ? normalize(orbitPos.xy) : vec2(cos(aPhase), sin(aPhase));
      // Per-particle spread in both directions (inwards + outwards)
      float thickness   = proximity * sin(aPhase * 4.7) * 55.0 * uMouseActivity;
      orbitPos.xy      += radialDir * thickness;

      vec3 pos = mix(rotatedStart, orbitPos, tEased);

      // Heartbeat: radial impulse + per-particle turbulence
      float pulseLen  = length(rotatedStart.xy);
      vec2  pulseDir  = pulseLen > 0.001 ? normalize(rotatedStart.xy) : vec2(0.0);
      float pulseMod  = 0.4 + sin(aPhase * 3.7) * 0.6;
      float pulseForce = uPulse * pulseMod * (1.0 - tEased);
      pos.x += pulseDir.x * pulseLen * 1.6 * pulseForce;
      pos.y += pulseDir.y * pulseLen * 1.6 * pulseForce;
      pos.x += cos(aPhase * 7.3 + 1.2) * pulseLen * 0.35 * pulseForce;
      pos.y += sin(aPhase * 5.1 + 0.8) * pulseLen * 0.35 * pulseForce;

      // Star drift before convergence
      float floatAmt = 1.0 - tEased * 0.85;
      pos.x += sin(uTime * aSpeed * 0.4 + aPhase)       * aAmpX * floatAmt * uSettle;
      pos.y += cos(uTime * aSpeed * 0.3 + aPhase * 1.2) * aAmpY * floatAmt * uSettle;

      float revealT = clamp((tEased - 0.90) / 0.10, 0.0, 1.0);
      float particleOpacity = mix(1.0, revealT, aHidden);
      vAlpha = uOpacity * particleOpacity;
      vColor = mix(aColor, uTargetColor, tEased * 0.7);

      gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = max(aSize, 1.5);
    }
  `;

  const fragmentShader = /* glsl */ `
    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec2  uv = gl_PointCoord - 0.5;
      float d  = length(uv);
      float a  = 1.0 - smoothstep(0.25, 0.5, d);
      gl_FragColor = vec4(vColor, a * vAlpha);
    }
  `;

  const uniforms = {
    uTime: { value: 0 },
    uGatherStart: { value: 0 },
    uOpacity: { value: 0 },
    uGather: { value: 0 },
    uSettle: { value: 0 },
    uPulse: { value: 0 },
    uMouse: { value: new THREE.Vector2(99999, 99999) },
    uMouseActivity: { value: 0 },
    uTargetColor: { value: new THREE.Color("#C0C0C0") },
  };

  scene.add(
    new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
      }),
    ),
  );

  const targetMouse = new THREE.Vector2(99999, 99999);
  const frozenMouse = new THREE.Vector2(99999, 99999);
  const globeZoneR = ringR + 220;
  let inGlobeZone = false;

  function startFade(duration) {
    gsap.killTweensOf(uniforms.uMouseActivity);
    gsap.to(uniforms.uMouseActivity, {
      value: 0,
      duration,
      ease: "power2.out",
    });
  }

  gsap.ticker.add(function () {
    uniforms.uTime.value = gsap.ticker.time;
    uniforms.uMouse.value.lerp(targetMouse, 0.07);
    renderer.render(scene, camera);
  });

  el.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = -(e.clientY - rect.top - rect.height / 2);
    const dist = Math.sqrt(mx * mx + my * my);

    if (dist < globeZoneR) {
      targetMouse.set(mx, my);
      frozenMouse.set(mx, my);
      if (!inGlobeZone) inGlobeZone = true;
      gsap.killTweensOf(uniforms.uMouseActivity);
      gsap.to(uniforms.uMouseActivity, {
        value: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });
      gsap.to(uniforms.uMouseActivity, {
        value: 0,
        duration: 1.4,
        ease: "power2.out",
        delay: 0.35,
      });
    } else if (inGlobeZone) {
      inGlobeZone = false;
      targetMouse.set(frozenMouse.x, frozenMouse.y);
      startFade(2.2);
    }
  });
  el.addEventListener("mouseenter", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = -(e.clientY - rect.top - rect.height / 2);
    targetMouse.set(mx, my);
    uniforms.uMouse.value.set(mx, my);
  });
  el.addEventListener("mouseleave", () => {
    inGlobeZone = false;
    startFade(2.2);
  });

  window.addEventListener(
    "resize",
    () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      camera.left = -W / 2;
      camera.right = W / 2;
      camera.top = H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    },
    { passive: true },
  );

  // Phase 1 (t=0s)   : stars fade in and drift
  // Phase 2 (t=1.3s) : heartbeat pulse, then convergence onto the globe
  const globeGradient = el.querySelector(".hero-v2_anim-globe-gradient");
  if (globeGradient) gsap.set(globeGradient, { opacity: 0 });

  const ptl = gsap.timeline();
  ptl
    .to(uniforms.uOpacity, { value: 1, duration: 1.0, ease: "power2.out" })
    .to(uniforms.uSettle, { value: 1, duration: 1.0, ease: "power2.out" }, 0)
    .to(uniforms.uPulse, { value: 1.0, duration: 0.55, ease: "sine.out" }, 1.3)
    .to(uniforms.uPulse, { value: 0, duration: 2.5, ease: "sine.in" })
    .call(
      () => {
        uniforms.uGatherStart.value = gsap.ticker.time;
      },
      null,
      1.3,
    )
    .to(uniforms.uGather, { value: 1, duration: 5.0, ease: "power3.out" }, 1.3)
    .to(globeGradient, { opacity: 1, duration: 1.0, ease: "power2.out" }, 1.3);
}
