// Moteur d'animation (passation §4 bis).
//
// - GSAP + ScrollTrigger : chargés à la demande, seulement si la page
//   contient [data-gsap], et jamais en reduced-motion.
// - Lenis : ordinateur seulement ((pointer: fine)), hors reduced-motion,
//   synchronisé avec ScrollTrigger et le ticker de GSAP.
// - Les scènes de la page s'enregistrent avec registerScene() ; elles
//   reçoivent gsap, ScrollTrigger et le contexte de gsap.matchMedia().
//
// Uniquement transform et opacity. Tout est lisible sans ce fichier.

import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

export type MotionConditions = { desktop: boolean; mobile: boolean; reduce: boolean };
export type Scene = (tools: {
  gsap: typeof GSAP;
  ScrollTrigger: typeof ST;
  conditions: MotionConditions;
}) => void | (() => void);

// Les trois cas de gsap.matchMedia(). Une seule source, utilisée aussi par
// le CSS des composants (900 px = bascule mobile / ordinateur).
export const MEDIA = {
  desktop: "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 899px), (pointer: coarse)",
  reduce: "(prefers-reduced-motion: reduce)",
};

const scenes: Scene[] = [];
export function registerScene(scene: Scene) {
  scenes.push(scene);
}

const reduce = window.matchMedia(MEDIA.reduce).matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

async function start() {
  if (reduce) return;

  const wantsGsap = document.querySelector("[data-gsap]") !== null;
  const wantsLenis = finePointer;

  const [gsapMod, stMod, lenisMod] = await Promise.all([
    wantsGsap ? import("gsap") : null,
    wantsGsap ? import("gsap/ScrollTrigger") : null,
    wantsLenis ? import("lenis") : null,
  ]);

  const gsap = gsapMod?.gsap;
  const ScrollTrigger = stMod?.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (lenisMod) {
    const Lenis = lenisMod.default;
    const lenis = new Lenis({
      anchors: true,
      // Inertie légère : on garde la main de l'utilisateur, on arrondit
      // seulement les angles.
      lerp: 0.12,
      wheelMultiplier: 1,
      autoRaf: !gsap,
    });
    if (gsap && ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    // Si l'utilisateur active reduced-motion en cours de route : on rend
    // le défilement natif.
    window.matchMedia(MEDIA.reduce).addEventListener("change", (e) => {
      if (e.matches) lenis.destroy();
    });
  }

  if (gsap && ScrollTrigger) {
    const mm = gsap.matchMedia();
    mm.add(MEDIA, (context) => {
      const conditions = context.conditions as MotionConditions;
      // En reduced-motion, gsap.matchMedia annule tout ce qui a été créé
      // dans les autres cas : la page revient à sa version statique.
      if (conditions.reduce) return;
      const root = document.documentElement.classList;
      root.add("has-motion");
      root.toggle("motion-desktop", conditions.desktop);
      const cleanups = scenes.map((scene) => scene({ gsap, ScrollTrigger, conditions }));
      return () => {
        root.remove("has-motion", "motion-desktop");
        cleanups.forEach((fn) => typeof fn === "function" && fn());
      };
    });
  }
}

// Après le premier rendu : le chargement des bibliothèques ne retarde
// jamais l'affichage. Safari n'a pas requestIdleCallback.
function whenIdle(fn: () => void) {
  if ("requestIdleCallback" in window) requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 200);
}
if (document.readyState === "complete") whenIdle(start);
else window.addEventListener("load", () => whenIdle(start), { once: true });
