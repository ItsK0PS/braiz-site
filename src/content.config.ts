import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// Pages légales : un fichier Markdown par page, sans frontmatter. Le titre
// de l'onglet est donné par src/pages/[legal].astro.
const legal = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/legal" }),
});

export const collections = { legal };
