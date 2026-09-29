// Repli des apparitions au scroll pour les navigateurs sans
// animation-timeline: view() (iOS antérieur à 26, Firefox).
//
// Le contenu est visible par défaut. Seuls les éléments encore SOUS l'écran
// au moment où ce script tourne sont masqués (.is-pending), puis révélés
// quand ils y entrent. Rien de ce qui est déjà visible ne clignote, et si
// ce script ne charge pas, rien n'est jamais masqué.

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const native = CSS.supports?.("animation-timeline: view()");

if (!reduce && !native && "IntersectionObserver" in window) {
  const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight);

  if (below.length) {
    document.documentElement.classList.add("reveal-io");
    below.forEach((el) => el.classList.add("is-pending"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-in");
          el.classList.remove("is-pending");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    below.forEach((el) => io.observe(el));
  }
}
