// Mesure d'audience sans cookies : Vercel Web Analytics.
//
// - Aucun cookie, aucun identifiant stocké sur l'appareil : pas de bandeau.
// - Le script est servi par getbraiz.com lui-même (/_vercel/insights), et
//   seulement en production : ni en local, ni sur les aperçus Vercel.
// - Chargé par Site.astro (accueil, /beta). Jamais sur /join : son adresse
//   contient le jeton d'invitation.
//
// Événements : un clic sur un élément [data-track] (nom de l'événement, et
// data-track-where pour l'emplacement), ou un événement « braiz:track »
// émis par un script de page (changement d'onglet sur /beta).
// Pour passer à un autre outil (Plausible, Umami), seul ce fichier change
// (script et track()).

type Data = Record<string, string>;
declare global {
  interface Window {
    va?: (...args: unknown[]) => void;
    vaq?: unknown[];
  }
}

const PRODUCTION = /(^|\.)getbraiz\.com$/.test(location.hostname);

// ⚠️ ÉVÉNEMENTS PERSONNALISÉS DÉSACTIVÉS. Offre Vercel Hobby : seules les
// pages vues sont comptées (les événements personnalisés demandent l'offre
// Pro). Les attributs data-track restent dans le HTML et beta.ts émet
// toujours « braiz:track » : ils ne coûtent rien. Passer à true au passage
// en Pro suffit à tout réactiver (et mettre à jour la politique de
// confidentialité : la phrase sur les clics de la page de la beta).
const CUSTOM_EVENTS = false;

if (PRODUCTION) {
  // File d'attente : les événements émis avant l'arrivée du script sont
  // gardés et envoyés ensuite.
  window.va = window.va || ((...args: unknown[]) => (window.vaq = window.vaq || []).push(args));
  const s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
}

export function track(name: string, data: Data = {}) {
  if (!PRODUCTION || !CUSTOM_EVENTS) return;
  window.va?.("event", { name, data: { page: location.pathname, ...data } });
}

document.addEventListener("click", (e) => {
  const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
  if (!el?.dataset.track) return;
  track(el.dataset.track, el.dataset.trackWhere ? { emplacement: el.dataset.trackWhere } : {});
});

document.addEventListener("braiz:track", (e) => {
  const { name, data } = (e as CustomEvent<{ name: string; data?: Data }>).detail;
  track(name, data);
});
