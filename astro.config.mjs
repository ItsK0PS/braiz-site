import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://getbraiz.com",
  output: "static",
  // dist/beta.html et non dist/beta/index.html : vercel.json garde
  // cleanUrls et la réécriture /join/:token -> /join comme avant.
  trailingSlash: "never",
  // HTML servi tel qu'écrit : la compression des espaces peut décaler des
  // éléments en ligne.
  compressHTML: false,
  // Styles des pages de la refonte écrits dans le <head> : aucune feuille
  // bloquante à télécharger avant le premier rendu. Les pages actuelles
  // (public/style.css) ne sont pas concernées.
  build: { format: "file", inlineStylesheets: "always" },
  markdown: {
    // Sinon les apostrophes droites des pages légales deviennent courbes.
    smartypants: false,
  },
  devToolbar: { enabled: false },
});
