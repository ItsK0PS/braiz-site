// Sitemap, écrit dans dist/sitemap.xml et annoncé par public/robots.txt.
//
// ⚠️ LISTE FERMÉE : seules les pages publiques et indexables y entrent.
// - l'accueil et /beta, listées à la main dans PAGES ;
// - les pages légales, lues dans la collection (src/content/legal) : un
//   document légal est public par nature, il s'ajoute tout seul.
// N'y sont pas, et ne doivent jamais y être : /join (pages d'invitation, en
// noindex, dont l'adresse porte un jeton) et la page 404 (noindex).
// Une nouvelle page publique s'ajoute à PAGES, à la main.
//
// Les adresses sont celles des balises canoniques de Site.astro : sans
// slash final ni extension (cleanUrls de vercel.json).
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const PAGES = ["/", "/beta"];

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("sitemap : « site » manque dans astro.config.mjs");
  const legal = (await getCollection("legal")).map((page) => `/${page.id}`).sort();
  const urls = [...PAGES, ...legal].map((path) => new URL(path, site).href);
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((url) => `  <url><loc>${url}</loc></url>\n`).join("") +
    `</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
