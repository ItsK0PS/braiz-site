// /beta : onglets iPhone / Android, coches des étapes, barre d'installation
// sur mobile, lien TestFlight. Petit script, sans GSAP.
//
// La mise en page initiale est déjà décidée dans le <head> (classes sur
// <html>) : ce script ne fait que réagir aux gestes et au défilement.
// Sans lui, la page reste complète : les deux plateformes sont affichées.

declare const TESTFLIGHT_URL: string;

const html = document.documentElement;
// Mode onglets : seulement hors reduced-motion (sinon les deux plateformes
// restent visibles l'une sous l'autre).
const tabsMode = html.classList.contains("motion-ok");
type Platform = "ios" | "android";

// Événements de mesure : émis ici, envoyés par analytics.ts s'il est chargé.
function signal(name: string, data: Record<string, string>) {
  document.dispatchEvent(new CustomEvent("braiz:track", { detail: { name, data } }));
}

// ---------- Lien TestFlight (source unique : /testflight.js) ----------
if (typeof TESTFLIGHT_URL === "string" && TESTFLIGHT_URL) {
  document.querySelectorAll<HTMLAnchorElement>("[data-testflight]").forEach((a) => (a.href = TESTFLIGHT_URL));
}

// Déclarée avant les onglets : select() met à jour les coches.
const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));

// ---------- Onglets (motif tablist de l'ARIA APG) ----------
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"));
const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"));
const current = (): Platform => (html.classList.contains("show-android") ? "android" : "ios");

function select(p: Platform, focus = false) {
  html.classList.toggle("show-ios", p === "ios");
  html.classList.toggle("show-android", p === "android");
  tabs.forEach((t) => {
    const on = t.dataset.tab === p;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  });
  updateSteps();
}

if (tabsMode) {
  panels.forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${panel.dataset.panel}`);
    panel.tabIndex = -1;
  });
  select(current());
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      const p = tab.dataset.tab as Platform;
      if (p === current()) return;
      select(p);
      signal("Changement d'onglet", { plateforme: p === "ios" ? "iPhone" : "Android" });
    });
    tab.addEventListener("keydown", (e) => {
      const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const next = tabs[(keys[e.key] + tabs.length) % tabs.length];
      select(next.dataset.tab as Platform, true);
      signal("Changement d'onglet", { plateforme: next.dataset.tab === "ios" ? "iPhone" : "Android" });
    });
  });
}

// ---------- L'icône Braiz atterrit quand le téléphone est à l'écran ----------
const phone = document.querySelector(".home-phone");
if (phone) {
  if ("IntersectionObserver" in window) {
    const phoneIo = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      phone.classList.add("in-view");
      phoneIo.disconnect();
    }, { threshold: 0.4 });
    phoneIo.observe(phone);
  } else {
    phone.classList.add("in-view");
  }
}

// ---------- Coches : une étape est « faite » quand on l'a dépassée ----------
let ticking = false;
// « Dépassée » : le bas de l'étape est remonté au-dessus du milieu de l'écran.
function updateSteps() {
  const limit = window.innerHeight * 0.5;
  for (const step of steps) {
    // offsetParent null : étape masquée (autre plateforme).
    if (step.offsetParent === null) continue;
    step.classList.toggle("is-done", step.getBoundingClientRect().bottom < limit);
  }
}
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateSteps();
    });
  },
  { passive: true },
);
updateSteps();

// ---------- Barre d'installation (mobile) ----------
// Visible une fois le premier écran dépassé, masquée tant que les étapes
// de la plateforme choisie sont à l'écran.
const bar = document.querySelector<HTMLElement>("[data-install-bar]");
const hero = document.querySelector<HTMLElement>(".bhero");
if (bar && hero && tabsMode && "IntersectionObserver" in window) {
  let heroVisible = true;
  let stepsVisible = false;
  let footVisible = false;
  const render = () => {
    const show = !heroVisible && !stepsVisible && !footVisible;
    bar.classList.toggle("is-shown", show);
    bar.inert = !show;
  };
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    render();
  }).observe(hero);
  const visibleSteps = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visibleSteps.add(e.target);
      else visibleSteps.delete(e.target);
    }
    stepsVisible = visibleSteps.size > 0;
    render();
  });
  // En bas de page, la barre s'efface pour laisser les liens du pied de page.
  const foot = document.querySelector(".site-bottom");
  if (foot) {
    new IntersectionObserver(([e]) => {
      footVisible = e.isIntersecting;
      render();
    }).observe(foot);
  }
  // Les deux listes : celle qui est masquée n'intersecte jamais.
  panels.forEach((p) => io.observe(p.querySelector("ol") ?? p));
  bar.inert = true;
}
