// La scène des virements (components/virements/VirementsScene.astro), en cinq chapitres, liée au
// défilement : elle avance et recule avec le scroll (scrub).
//
// 1. Un week-end, cinq amis : les pastilles se placent en cercle.
// 2. Chacun paie sa part : les tickets volent vers le centre, le total monte.
// 3. Qui doit combien à qui ? : les dettes s'emmêlent, 18 virements.
// 4. Braiz démêle tout : 3 flèches ember, le compteur retombe à 3.
// 5. Sortie : le slogan et le bouton.
//
// Uniquement transform, opacity et stroke-dashoffset (DrawSVG). Le HTML
// contient déjà l'état de départ : ce script ne fait que l'animer.
import { registerScene } from "./motion";
import { splitMasked, MASK_TRAVEL } from "./split";

// Compteur à rouleaux (Roller.astro). Chaque colonne défile comme un
// compteur mécanique : les unités tournent en continu, les colonnes
// suivantes ne bougent que pendant la retenue.
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
      // Pas de zéros inutiles à gauche (mais « 0,50 » garde son zéro).
      const lead = c.power > decimals && v < 10 ** c.power - 0.5;
      c.col.style.opacity = lead ? "0" : "";
    }
  };
}

registerScene(({ gsap, conditions, plugins }) => {
  const root = document.querySelector<HTMLElement>("[data-settle]");
  const SplitText = plugins.split;
  if (!root || !SplitText) return;

  const one = <T extends Element = HTMLElement>(key: string) => root.querySelector<T>(`[data-s="${key}"]`)!;
  const all = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

  const track = root.querySelector<HTMLElement>(".settle__track")!;
  const board = one("board");
  const place = one("place");
  const glow = one("glow");
  const hint = one("hint");
  const outro = one("outro");
  const total = one("total");
  const count = one("count");
  const countNum = one("countnum");
  const countRow = one("countrow");
  const check = one("check");
  const naive = one<SVGGElement>("naive");
  const settle = one<SVGGElement>("settle");
  const ticketsGroup = one<SVGGElement>("tickets");
  const naivePaths = all<SVGPathElement>('[data-s="naive"] path');
  const settlePaths = all<SVGPathElement>('[data-s="settle"] path');
  const seats = all<SVGGElement>(".seat");
  const tickets = all<SVGGElement>(".ticket");
  const names = all('[data-s="name"]');
  const chips = all('[data-s="chip"]');
  const steps = all('[data-s="step"]');
  const caps = all(".cap");

  const setTotal = roller(total.querySelector<HTMLElement>("[data-roller]")!);
  const setCount = roller(countNum.querySelector<HTMLElement>("[data-roller]")!);
  const chipRollers = chips.map((chip) => {
    const el = chip.querySelector<HTMLElement>("[data-roller]")!;
    return { set: roller(el), value: Number(el.dataset.roller) };
  });
  const tensCol = countNum.querySelector<HTMLElement>('.roll__col[data-power="1"]');

  const capTitles = caps.map((cap) => cap.querySelector(".cap__title")!);
  const capTexts = caps.map((cap) => cap.querySelector(".cap__text")!);
  const splits = capTitles.map((title) => splitMasked(SplitText, title));
  const outroSplit = splitMasked(SplitText, outro.querySelector(".outro__title")!);

  // Mots cachés sous leur masque dès le départ. Un fromTo avec stagger ne
  // pose l'état de départ que sur le premier mot tant que la timeline ne l'a
  // pas atteint : on le pose sur tous, explicitement.
  gsap.set([...splits.slice(1).flatMap((sp) => sp.words), ...outroSplit.words], {
    yPercent: MASK_TRAVEL,
    rotation: 8,
    opacity: 0,
  });

  // Départ : compteurs à zéro, flèches non dessinées.
  setTotal(0);
  setCount(0);
  chipRollers.forEach((c) => c.set(0));
  gsap.set([...naivePaths, ...settlePaths], { drawSVG: "0%" });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: conditions.desktop ? 0.6 : 0.35,
      invalidateOnRefresh: true,
      onUpdate: (self) => outro.classList.toggle("is-live", self.progress > 0.94),
    },
  });

  // Début de chaque chapitre, en unités de la timeline. Les écarts laissent
  // un temps de lecture entre deux chapitres.
  const C1 = 0;
  const C2 = 1.7;
  const C3 = 4.8;
  const C4 = 6.9;
  const C5 = 9.6;
  const END = 12.3;

  // Changement de légende : les mots du titre sortent par le haut, ceux du
  // suivant arrivent par le bas avec un ressort.
  const swapCaption = (from: number, to: number | null, at: number) => {
    tl.to(splits[from].words, { yPercent: -MASK_TRAVEL, rotation: -5, opacity: 0, duration: 0.25, stagger: 0.02, ease: "power2.in" }, at);
    tl.to(capTexts[from], { opacity: 0, y: -14, duration: 0.2, ease: "power1.in" }, at);
    if (to === null) return;
    tl.set(caps[to], { opacity: 1 }, at + 0.2);
    tl.fromTo(
      splits[to].words,
      { yPercent: MASK_TRAVEL, rotation: 7, opacity: 0 },
      { yPercent: 0, rotation: 0, opacity: 1, duration: 0.5, stagger: 0.045, ease: "back.out(2)" },
      at + 0.22,
    );
    tl.fromTo(capTexts[to], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, at + 0.35);
  };

  // ---------- 1. Un week-end, cinq amis ----------
  tl.to(hint, { opacity: 0, y: 12, duration: 0.25 }, C1);
  seats.forEach((seat, i) => {
    tl.to(seat, { x: Number(seat.dataset.x), y: Number(seat.dataset.y), duration: 0.75, ease: "back.out(1.8)" }, C1 + 0.05 + i * 0.08);
  });
  tl.fromTo(
    place,
    { opacity: 0, scale: 0.5, rotation: -16, yPercent: 12 },
    { opacity: 1, scale: 1, rotation: 0, yPercent: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" },
    C1 + 0.35,
  );
  tl.fromTo(names, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "back.out(2)" }, C1 + 0.8);
  tl.fromTo(glow, { scale: 0.7 }, { scale: 1, duration: 1.2, ease: "power2.out" }, C1);

  // ---------- 2. Chacun paie sa part ----------
  swapCaption(0, 1, C2);
  tl.to(place, { opacity: 0.1, scale: 1.08, duration: 0.5, ease: "power2.inOut" }, C2);
  tl.set(ticketsGroup, { opacity: 1 }, C2 + 0.2);
  tl.fromTo(total, { opacity: 0, y: 70, rotation: -4 }, { opacity: 1, y: 0, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, C2 + 0.2);

  const running = { v: 0 };
  let sum = 0;
  tickets.forEach((ticket, i) => {
    const at = C2 + 0.3 + i * 0.26;
    const body = ticket.querySelector<SVGGElement>(".ticket__body")!;
    const pulse = root.querySelector<SVGGElement>(`.seat[data-seat="${ticket.dataset.by}"] .seat__pulse`)!;
    // La pastille du payeur « lâche » le ticket.
    tl.to(pulse, { scale: 1.16, transformOrigin: "50% 50%", duration: 0.08, ease: "power2.out" }, at);
    tl.to(pulse, { scale: 1, transformOrigin: "50% 50%", duration: 0.4, ease: "elastic.out(1, 0.35)" }, at + 0.08);
    tl.fromTo(body, { scale: 0, rotation: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.3, ease: "back.out(2.6)" }, at);
    tl.to(ticket, { motionPath: { path: ticket.dataset.path! }, duration: 0.7, ease: "power2.inOut" }, at);
    tl.to(body, { rotation: Number(ticket.dataset.rot), duration: 0.7, ease: "back.out(2)" }, at);
    // Atterrissage : petit écrasement, et le total monte d'autant.
    tl.to(body, { scale: 1.1, duration: 0.06, ease: "power1.out" }, at + 0.66);
    tl.to(body, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" }, at + 0.72);
    const from = sum;
    sum += Number(ticket.dataset.cents);
    tl.fromTo(running, { v: from }, { v: sum, duration: 0.4, ease: "power2.out", onUpdate: () => setTotal(running.v) }, at + 0.55);
  });

  // ---------- 3. Qui doit combien à qui ? ----------
  swapCaption(1, 2, C3);
  tl.to(tickets.map((t) => t.querySelector(".ticket__body")), {
    scale: 0.2,
    opacity: 0,
    transformOrigin: "50% 50%",
    duration: 0.3,
    stagger: 0.03,
    ease: "back.in(2)",
  }, C3);
  tl.to(total, { opacity: 0, y: -50, rotation: 3, duration: 0.3, ease: "power2.in" }, C3);
  tl.to(place, { opacity: 0.05, duration: 0.4 }, C3);
  tl.set(naive, { opacity: 1 }, C3 + 0.2);
  tl.to(naivePaths, { drawSVG: "100%", duration: 0.5, stagger: 0.035, ease: "power2.out" }, C3 + 0.2);
  // Le chaos : le plateau tremble pendant que les dettes s'emmêlent.
  tl.to(board, {
    keyframes: [
      { x: -9, rotation: -1.4 },
      { x: 8, rotation: 1.1 },
      { x: -6, rotation: -0.9 },
      { x: 7, rotation: 0.8 },
      { x: -4, rotation: -0.5 },
      { x: 3, rotation: 0.3 },
      { x: 0, rotation: 0 },
    ],
    duration: 1.1,
    ease: "none",
  }, C3 + 0.35);
  const counter = { v: 0 };
  tl.fromTo(count, { opacity: 0, y: 80, rotation: 4 }, { opacity: 1, y: 0, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, C3 + 0.4);
  tl.to(counter, { v: naivePaths.length, duration: 0.9, ease: "power1.out", onUpdate: () => setCount(counter.v) }, C3 + 0.4);

  // ---------- 4. Braiz démêle tout ----------
  swapCaption(2, 3, C4);
  tl.to(naivePaths, { drawSVG: "100% 100%", duration: 0.4, stagger: { each: 0.02, from: "end" }, ease: "power2.in" }, C4);
  tl.set(settle, { opacity: 1 }, C4 + 0.55);
  tl.to(settlePaths, { drawSVG: "100%", duration: 0.55, stagger: 0.22, ease: "power3.out" }, C4 + 0.55);
  chips.forEach((chip, i) => {
    const at = C4 + 0.85 + i * 0.22;
    tl.fromTo(chip, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.8)" }, at);
    const proxy = { v: 0 };
    tl.to(proxy, { v: chipRollers[i].value, duration: 0.5, ease: "power2.out", onUpdate: () => chipRollers[i].set(proxy.v) }, at);
  });
  // Le compteur saute, redescend en rebond et tombe à 3.
  tl.to(countNum, { yPercent: -38, duration: 0.25, ease: "power2.out" }, C4 + 0.5);
  tl.to(countNum, { yPercent: 0, duration: 0.7, ease: "bounce.out" }, C4 + 0.75);
  tl.to(counter, { v: settlePaths.length, duration: 0.6, ease: "power2.inOut", onUpdate: () => setCount(counter.v) }, C4 + 0.5);
  // La colonne des dizaines disparaît : le 3 vient se caler à gauche.
  tl.to(countRow, { x: () => -(tensCol?.offsetWidth ?? 0), duration: 0.35, ease: "back.out(2)" }, C4 + 1.1);
  tl.fromTo(
    check,
    { opacity: 0, scale: 0, rotation: -60 },
    { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" },
    C4 + 1.35,
  );
  tl.to(glow, { scale: 1.2, duration: 0.8, ease: "power2.out" }, C4 + 0.55);

  // ---------- 5. Règle tes comptes, garde tes potes ----------
  // Le plateau se recentre, le groupe converge vers le centre et s'efface,
  // et le « B » de Braiz en sort.
  swapCaption(3, null, C5);
  tl.to(count, { opacity: 0, y: 50, duration: 0.3, ease: "power2.in" }, C5);
  tl.to(place, { opacity: 0, duration: 0.3 }, C5);
  tl.to(names, { opacity: 0, duration: 0.2 }, C5);
  tl.to(glow, { opacity: 0, duration: 0.6 }, C5 + 0.2);
  tl.to(board, {
    x: () => window.innerWidth / 2 - (board.offsetLeft + board.offsetWidth / 2),
    y: () => window.innerHeight / 2 - (board.offsetTop + board.offsetHeight / 2),
    duration: 0.6,
    ease: "power3.inOut",
  }, C5);
  const converge = { duration: 0.6, ease: "back.in(1.7)" };
  tl.to(settle, { scale: 0.05, opacity: 0, svgOrigin: "500 500", ...converge }, C5 + 0.1);
  tl.to(seats, { x: 500, y: 500, stagger: 0.04, ...converge }, C5 + 0.12);
  tl.to(seats.map((seat) => seat.querySelector(".seat__pulse")), {
    scale: 0.15,
    opacity: 0,
    transformOrigin: "50% 50%",
    stagger: 0.04,
    ...converge,
  }, C5 + 0.12);
  // Les montants (HTML, posés en %) rejoignent le centre du plateau.
  tl.to(chips, {
    x: (_i: number, el: HTMLElement) => (0.5 - parseFloat(el.style.left) / 100) * board.offsetWidth,
    y: (_i: number, el: HTMLElement) => (0.5 - parseFloat(el.style.top) / 100) * board.offsetHeight,
    scale: 0.2,
    opacity: 0,
    stagger: 0.04,
    ...converge,
  }, C5 + 0.1);

  const mark = one("mark");
  const markB = mark.querySelector("svg")!;
  tl.set(outro, { opacity: 1 }, C5 + 0.6);
  tl.fromTo(
    mark,
    { opacity: 0, scale: 0.08, rotation: -35 },
    { opacity: 1, scale: 1, rotation: 0, duration: 0.85, ease: "back.out(1.5)" },
    C5 + 0.62,
  );
  // Profondeur : le « B » continue de dériver doucement jusqu'à la fin.
  tl.fromTo(markB, { yPercent: 4, rotation: -3 }, { yPercent: -4, rotation: 2, duration: END - (C5 + 0.62), ease: "none" }, C5 + 0.62);
  tl.fromTo(
    outroSplit.words,
    { yPercent: MASK_TRAVEL, rotation: 8, opacity: 0 },
    { yPercent: 0, rotation: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: "back.out(1.9)" },
    C5 + 0.95,
  );
  tl.fromTo(outro.querySelector(".outro__text"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, C5 + 1.4);
  tl.fromTo(
    outro.querySelector(".outro__cta"),
    { opacity: 0, scale: 0.6, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2.4)" },
    C5 + 1.55,
  );

  // Barre de progression : un segment par chapitre.
  const bounds = [C1, C2, C3, C4, C5, END];
  steps.forEach((step, i) => {
    tl.fromTo(step, { scaleX: 0 }, { scaleX: 1, duration: bounds[i + 1] - bounds[i], ease: "none" }, bounds[i]);
  });

  // Au clavier, le bouton final peut recevoir le focus avant d'être
  // visible : on amène la scène à sa fin.
  const onFocus = () => {
    const st = tl.scrollTrigger;
    if (st && st.progress < 0.97) st.scroll(st.end);
  };
  outro.addEventListener("focusin", onFocus);

  return () => {
    outro.removeEventListener("focusin", onFocus);
    outro.classList.remove("is-live");
    splits.forEach((s) => s.revert());
    outroSplit.revert();
  };
});
