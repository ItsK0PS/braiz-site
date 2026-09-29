// Animations de l'accueil (hors scène des virements, qui a son propre
// script). Enregistrées auprès du moteur (motion.ts) : lancées seulement
// quand GSAP est chargé, jamais en reduced-motion, annulées si les
// conditions changent.
//
// Règle commune : le HTML affiche déjà l'état final. Les apparitions ne
// cachent un élément que s'il est encore sous l'écran au moment où GSAP
// arrive ; ce qui est déjà visible ne clignote jamais.
// Uniquement transform, opacity et stroke-dashoffset (DrawSVG).
import { registerScene } from "./motion";
import { splitMasked, MASK_TRAVEL, SPLIT_TEXT } from "./split";

// Même logique que le compteur de la scène : colonnes 0→9 en translateY.
function roller(el: HTMLElement) {
  const decimals = Number(el.dataset.decimals || 0);
  const cols = Array.from(el.querySelectorAll<HTMLElement>(".roll__col")).map((col) => ({
    col,
    power: Number(col.dataset.power),
    strip: col.firstElementChild as HTMLElement,
  }));
  return (value: number) => {
    const v = Math.max(0, value);
    for (const c of cols) {
      const x = v / 10 ** c.power;
      const whole = Math.floor(x);
      const pos = c.power === 0 ? x % 10 : (whole % 10) + Math.max(0, (x - whole - 0.9) * 10);
      c.strip.style.transform = `translate3d(0, ${(-pos * 100) / 11}%, 0)`;
      c.col.style.opacity = c.power > decimals && v < 10 ** c.power - 0.5 ? "0" : "";
    }
  };
}

registerScene(({ gsap, ScrollTrigger, conditions, plugins }) => {
  const SplitText = plugins.split;
  const home = document.querySelector("[data-home]");
  if (!home || !SplitText) return;

  const mobile = !conditions.desktop;
  const splits: { revert: () => void }[] = [];
  const offs: (() => void)[] = [];

  // Apparition à l'entrée dans l'écran, une seule fois. Si l'élément est
  // déjà au-dessus du seuil (visible, ou page rechargée plus bas), on pose
  // directement l'état final : pas de clignotement.
  const onEnter = (trigger: Element, build: (tl: gsap.core.Timeline) => void, ratio = 0.8) => {
    const tl = gsap.timeline({ paused: true });
    build(tl);
    if (trigger.getBoundingClientRect().top < window.innerHeight * ratio) {
      tl.progress(1);
      return;
    }
    ScrollTrigger.create({ trigger, start: `top ${ratio * 100}%`, once: true, onEnter: () => tl.play() });
  };

  // ---------- Hero ----------
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const heroTitle = hero?.querySelector<HTMLElement>("[data-hero-title]");
  if (hero && heroTitle) {
    const split = new SplitText(heroTitle, { ...SPLIT_TEXT, type: "words", wordsClass: "hero-word" });
    splits.push(split);
    // La vague : les mots sautent l'un après l'autre et retombent en
    // ressort. Seulement si le hero est à l'écran.
    if (window.scrollY < window.innerHeight * 0.5) {
      gsap.timeline({ delay: 0.15 })
        .to(split.words, { y: -18, rotation: (i: number) => (i % 2 ? -5 : 5), duration: 0.22, ease: "power2.out", stagger: 0.05 })
        .to(split.words, { y: 0, rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.35)", stagger: 0.05 }, 0.22);
    }
    // En quittant le hero, les mots s'écartent (propriétés différentes de
    // la vague : yPercent / xPercent).
    gsap.to(split.words, {
      yPercent: (i: number) => -(20 + i * 16),
      xPercent: (i: number) => (i % 2 ? 6 : -6),
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.4 },
    });
    // Parallaxe : départ à 0 en haut de page, donc aucun saut au chargement.
    hero.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
      const depth = Number(el.dataset.depth) * (mobile ? 0.5 : 1);
      gsap.to(el, { y: depth * 7, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    });
  }

  // Parallaxe des autres lueurs (hors écran au chargement).
  document.querySelectorAll<HTMLElement>("[data-home] section:not([data-hero]) [data-depth]").forEach((el) => {
    const depth = Number(el.dataset.depth) * (mobile ? 0.5 : 1);
    gsap.fromTo(el, { y: -depth * 6 }, {
      y: depth * 6,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // ---------- Titres : mots qui sortent de leur masque ----------
  document.querySelectorAll<HTMLElement>("[data-home] [data-split-title]").forEach((title) => {
    onEnter(title, (tl) => {
      const split = splitMasked(SplitText, title);
      splits.push(split);
      tl.fromTo(
        split.words,
        { yPercent: MASK_TRAVEL, rotation: 8, opacity: 0 },
        { yPercent: 0, rotation: 0, opacity: 1, duration: 0.75, stagger: 0.06, ease: "back.out(1.9)" },
      );
    }, 0.85);
  });

  // ---------- Gratuit : « 0 € » et « 0 pub » avec impact ----------
  const free = document.querySelector<HTMLElement>("[data-free]");
  if (free) {
    const bigs = free.querySelectorAll<HTMLElement>("[data-free-big]");
    onEnter(bigs[0], (tl) => {
      tl.fromTo(bigs[0], { scale: 2.4, rotation: -14, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(2.2)" })
        .fromTo(bigs[1], { scale: 2.8, rotation: 12, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(2.2)" }, 0.18)
        // L'impact : le bloc encaisse le choc.
        .to(free.querySelector(".free__title"), {
          keyframes: [{ y: 10, rotation: 0.6 }, { y: -6, rotation: -0.4 }, { y: 3, rotation: 0.2 }, { y: 0, rotation: 0 }],
          duration: 0.45,
          ease: "none",
        }, 0.62)
        .fromTo(free.querySelector("[data-free-scribble]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8, ease: "power2.inOut" }, 0.8)
        .fromTo(free.querySelector("[data-free-lead]"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.9)
        .fromTo(free.querySelectorAll("[data-free-item]"), { opacity: 0, y: 40, rotation: (i: number) => (i % 2 ? 3 : -3) }, {
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: "back.out(1.8)",
        }, 1);
    }, 0.75);
  }

  // ---------- Ce que fait Braiz ----------
  document.querySelectorAll<HTMLElement>("[data-feat]").forEach((feat, i) => {
    const side = i % 2 ? 1 : -1;
    onEnter(feat, (tl) => {
      tl.fromTo(feat.querySelector("[data-feat-phone]"), { x: side * (mobile ? 60 : 140), rotation: side * 16, opacity: 0 }, {
        x: 0,
        rotation: 0,
        opacity: 1,
        duration: 0.9,
        ease: "back.out(1.5)",
      })
        .fromTo(feat.querySelector("[data-feat-body]"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.35)
        .fromTo(feat.querySelector("[data-feat-prop]"), { scale: 0, rotation: -side * 25, opacity: 0 }, {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.5)",
        }, 0.5);
      const rollEl = feat.querySelector<HTMLElement>("[data-feat-prop] [data-roller]");
      if (rollEl) {
        const set = roller(rollEl);
        const proxy = { v: 0 };
        set(0);
        tl.to(proxy, { v: Number(rollEl.dataset.roller), duration: 0.9, ease: "power2.out", onUpdate: () => set(proxy.v) }, 0.55);
      }
    }, 0.75);
  });

  // ---------- L'ambiance : le chat ----------
  document.querySelectorAll<HTMLElement>("[data-chat-line]").forEach((line) => {
    const sys = line.classList.contains("chat__sys");
    onEnter(line, (tl) => {
      tl.fromTo(line, { opacity: 0, y: 50, scale: 0.86, rotation: sys ? -5 : 0 }, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.65,
        ease: "back.out(2.2)",
      });
      const reacts = line.querySelectorAll("[data-chat-react]");
      if (reacts.length) {
        tl.fromTo(reacts, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.6, stagger: 0.14, ease: "elastic.out(1, 0.45)" }, 0.5);
      }
    }, 0.88);
  });

  // ---------- Trophées ----------
  const row = document.querySelector<HTMLElement>(".trophies__row");
  if (row) {
    const items = row.querySelectorAll<HTMLElement>("[data-trophy]");
    onEnter(row, (tl) => {
      tl.fromTo(items, { opacity: 0, y: 80, rotation: (i: number) => (i % 2 ? 10 : -10) }, {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: 0.75,
        stagger: 0.06,
        ease: "back.out(1.7)",
      });
    }, 0.85);

    // Inclinaison sous le pointeur, ±12° au maximum (charte). Souris et
    // trackpad seulement.
    if (window.matchMedia("(pointer: fine)").matches) {
      items.forEach((item) => {
        const card = item.querySelector<HTMLElement>("[data-trophy-tilt]")!;
        const move = (e: PointerEvent) => {
          const r = item.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotationY: px * 24, rotationX: -py * 24, scale: 1.06, transformPerspective: 600, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        };
        const leave = () => gsap.to(card, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
        item.addEventListener("pointermove", move);
        item.addEventListener("pointerleave", leave);
        offs.push(() => {
          item.removeEventListener("pointermove", move);
          item.removeEventListener("pointerleave", leave);
        });
      });
    }
  }

  // ---------- Kit de l'organisateur ----------
  const receipt = document.querySelector<HTMLElement>("[data-kit-receipt]");
  if (receipt) {
    // Le faisceau (CSS) ne tourne que lorsque le ticket est à l'écran.
    ScrollTrigger.create({ trigger: receipt, start: "top bottom", end: "bottom top", toggleClass: { targets: receipt, className: "is-live" } });
    onEnter(receipt, (tl) => {
      tl.fromTo(receipt, { opacity: 0, y: 80, rotation: -12 }, { opacity: 1, y: 0, rotation: 0, duration: 0.9, ease: "back.out(1.6)" });
    }, 0.85);
  }
  const kitItems = document.querySelectorAll("[data-kit-item]");
  if (kitItems.length) {
    onEnter(kitItems[0], (tl) => {
      tl.fromTo(kitItems, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.8)" });
    }, 0.85);
  }

  return () => {
    offs.forEach((off) => off());
    splits.forEach((s) => s.revert());
    receipt?.classList.remove("is-live");
  };
});
