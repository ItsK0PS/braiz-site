// Scènes GSAP de /labo. Enregistrées auprès du moteur (motion.ts), qui ne
// les lance qu'une fois GSAP chargé, hors reduced-motion, et les annule si
// les conditions changent (gsap.matchMedia).
import { registerScene } from "./motion";

// Glows en parallaxe : data-parallax = amplitude en % de leur taille.
// Plus faible sur mobile.
registerScene(({ gsap, conditions }) => {
  const factor = conditions.desktop ? 1 : 0.5;
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
    const amount = Number(el.dataset.parallax || 20) * factor;
    gsap.fromTo(
      el,
      { yPercent: amount },
      {
        yPercent: -amount,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
});

// Récit : sur ordinateur, l'iPhone pivote très légèrement pendant qu'il
// est épinglé. Le changement d'écran, lui, est géré par Story.astro.
registerScene(({ gsap, conditions }) => {
  if (!conditions.desktop) return;
  const story = document.querySelector<HTMLElement>("[data-story]");
  const device = story?.querySelector<HTMLElement>("[data-story-device]");
  if (!story || !device) return;
  gsap.fromTo(
    device,
    { rotationY: -10, rotationX: 4, scale: 0.94, transformPerspective: 1200 },
    {
      rotationY: 8,
      rotationX: -2,
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: story, start: "top 70%", end: "bottom 30%", scrub: 0.6 },
    },
  );
});

// Trophée : inclinaison en perspective ±12° au maximum (charte) et reflet
// qui balaie, liés au scroll.
registerScene(({ gsap, conditions }) => {
  const max = conditions.desktop ? 12 : 9;
  gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((trophy) => {
    const card = trophy.querySelector<HTMLElement>(".trophy__card");
    const band = trophy.querySelector<HTMLElement>("[data-sheen]");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: trophy, start: "top 90%", end: "bottom 10%", scrub: 0.5 },
    });
    if (card) {
      tl.fromTo(
        card,
        { rotationY: -max, rotationX: max / 2, transformPerspective: 900 },
        { rotationY: max, rotationX: -max / 2, ease: "none" },
        0,
      );
    }
    if (band) tl.fromTo(band, { xPercent: -120 }, { xPercent: 260, ease: "none" }, 0);
  });
});
