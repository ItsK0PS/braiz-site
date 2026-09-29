// Exemple de la scène des virements : un groupe fictif, des montants
// crédibles, et tout ce qui s'en déduit (soldes, virements naïfs, virements
// minimisés par computeSettlements, géométrie du plateau). Calculé au build :
// la page statique et la version animée affichent exactement les mêmes
// chiffres.
import { computeSettlements, type Settlement } from "./computeSettlements";

export type Friend = { id: string; name: string; initial: string; color: string };
export type Expense = { id: string; emoji: string; title: string; by: string; amount: number; for: string[] };

export const GROUP = "Week-end à Biarritz";
export const PLACE = "Biarritz";

// Ordre = place autour du cercle, en partant du haut, sens horaire. Choisi
// pour que les trois virements finaux ne se croisent pas.
// Couleurs : palette des avatars de l'app (tokens.avatarPalette), fonds
// sombres désaturés, initiales en blanc chaud.
export const FRIENDS: Friend[] = [
  { id: "ines", name: "Inès", initial: "I", color: "#1E2233" },
  { id: "hugo", name: "Hugo", initial: "H", color: "#172623" },
  { id: "sami", name: "Sami", initial: "S", color: "#2A2118" },
  { id: "lea", name: "Léa", initial: "L", color: "#241E33" },
  { id: "chloe", name: "Chloé", initial: "C", color: "#2A1E22" },
];

const ALL = FRIENDS.map((f) => f.id);

// Montants en euros, parts égales entre les personnes concernées. Toutes les
// parts tombent au centime près.
export const EXPENSES: Expense[] = [
  { id: "maison", emoji: "🏠", title: "Maison, deux nuits", by: "ines", amount: 480, for: ALL },
  { id: "courses", emoji: "🛒", title: "Courses du samedi", by: "hugo", amount: 151.3, for: ALL },
  { id: "resto", emoji: "🍽️", title: "Restaurant du samedi soir", by: "sami", amount: 236.5, for: ALL },
  { id: "route", emoji: "⛽", title: "Essence et péage", by: "lea", amount: 106.5, for: ALL },
  { id: "surf", emoji: "🏄", title: "Cours de surf", by: "chloe", amount: 135, for: ["chloe", "sami", "lea"] },
  { id: "glaces", emoji: "🍦", title: "Glaces et cafés", by: "hugo", amount: 78.2, for: ALL },
];

const cents = (euros: number) => Math.round(euros * 100);

export const TOTAL = EXPENSES.reduce((sum, e) => sum + cents(e.amount), 0) / 100;

// Solde de chacun : ce qu'il a payé moins sa part, calculé en centimes.
export const BALANCES: Record<string, number> = (() => {
  const c: Record<string, number> = Object.fromEntries(ALL.map((id) => [id, 0]));
  for (const e of EXPENSES) {
    const share = cents(e.amount) / e.for.length;
    c[e.by] += cents(e.amount);
    for (const id of e.for) c[id] -= share;
  }
  return Object.fromEntries(Object.entries(c).map(([id, v]) => [id, Math.round(v) / 100]));
})();

// Sans calcul : chaque personne rembourse sa part à chaque personne qui a
// payé pour elle, dépense après dépense. Une paire débiteur → payeur = un
// virement (plusieurs dépenses du même payeur se regroupent).
export const NAIVE: { de: string; vers: string }[] = (() => {
  const seen = new Set<string>();
  const pairs: { de: string; vers: string }[] = [];
  for (const e of EXPENSES) {
    for (const id of e.for) {
      const key = `${id}>${e.by}`;
      if (id === e.by || seen.has(key)) continue;
      seen.add(key);
      pairs.push({ de: id, vers: e.by });
    }
  }
  return pairs;
})();

export const SETTLEMENTS: Settlement[] = computeSettlements(BALANCES);

export const friend = (id: string) => FRIENDS.find((f) => f.id === id)!;

// ---------- Formats ----------
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
// 120,5 € s'écrit 120,50 € ; 480 € reste 480 €.
export function euros(value: number): string {
  const fixed = Number.isInteger(value) ? value : Number(value.toFixed(2));
  const s = eur.format(fixed);
  return Number.isInteger(fixed) ? s : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(fixed);
}

// ---------- Géométrie du plateau (viewBox 0 0 1000 1000) ----------
export const BOARD = 1000;
const CX = 500;
const CY = 500;
export const RING = 330; // rayon du cercle des amis
export const AVATAR = 76; // rayon d'une pastille

export type Point = { x: number; y: number };

export const SEATS: Record<string, Point> = Object.fromEntries(
  FRIENDS.map((f, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return [f.id, { x: round(CX + RING * Math.cos(a)), y: round(CY + RING * Math.sin(a)) }];
  }),
);

function round(n: number) {
  return Math.round(n * 10) / 10;
}

// Flèche courbe de a vers b : courbe de Bézier quadratique qui part du bord
// de la pastille, puis la pointe, dans le même tracé (DrawSVG dessine la
// ligne, puis la pointe). bulge > 0 : la courbe passe à gauche du sens de
// la flèche, donc a → b et b → a ne se superposent jamais.
export function arrow(a: Point, b: Point, bulge: number, head = 26) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy;
  const ny = -ux;
  const gap = AVATAR + 16;
  const p0 = { x: a.x + ux * gap, y: a.y + uy * gap };
  const p1 = { x: b.x - ux * (gap + 4), y: b.y - uy * (gap + 4) };
  const c = { x: (p0.x + p1.x) / 2 + nx * bulge, y: (p0.y + p1.y) / 2 + ny * bulge };
  // Tangente à l'arrivée : de c vers p1.
  const tx = p1.x - c.x;
  const ty = p1.y - c.y;
  const tl = Math.hypot(tx, ty);
  const vx = tx / tl;
  const vy = ty / tl;
  const w = head * 0.62;
  const h1 = { x: p1.x - vx * head + vy * w, y: p1.y - vy * head - vx * w };
  const h2 = { x: p1.x - vx * head - vy * w, y: p1.y - vy * head + vx * w };
  const f = (p: Point) => `${round(p.x)} ${round(p.y)}`;
  // Milieu de la courbe (t = 0,5), pour poser le montant.
  const mid = { x: round(0.25 * p0.x + 0.5 * c.x + 0.25 * p1.x), y: round(0.25 * p0.y + 0.5 * c.y + 0.25 * p1.y) };
  return { d: `M${f(p0)} Q${f(c)} ${f(p1)} M${f(h1)} L${f(p1)} L${f(h2)}`, mid, normal: { x: nx, y: ny } };
}

// Enchevêtrement : courbures variées mais déterministes (même dessin à
// chaque build).
export const NAIVE_ARROWS = NAIVE.map((n, i) => {
  const bulge = 34 + ((i * 7 + n.de.length * 13 + n.vers.length * 5) % 6) * 24;
  return { ...n, ...arrow(SEATS[n.de], SEATS[n.vers], bulge, 22) };
});

// Le montant se pose à côté de la flèche, jamais sur sa pointe : vers
// l'extérieur du cercle pour une flèche courte (entre voisins), du côté
// opposé à la courbure pour une flèche qui traverse le cercle.
export const SETTLE_ARROWS = SETTLEMENTS.map((s) => {
  const a = arrow(SEATS[s.de], SEATS[s.vers], 38, 34);
  const dx = a.mid.x - CX;
  const dy = a.mid.y - CY;
  const dist = Math.hypot(dx, dy);
  const dir = dist > 180 ? { x: dx / dist, y: dy / dist } : { x: -a.normal.x, y: -a.normal.y };
  const label = { x: round(a.mid.x + dir.x * 80), y: round(a.mid.y + dir.y * 80) };
  return { ...s, ...a, label };
});

// Pile des tickets au centre : léger désordre, déterministe.
export const TICKETS = EXPENSES.map((e, i) => {
  const from = SEATS[e.by];
  // Tickets éparpillés sur la table, chacun lisible.
  const to = { x: CX + [-92, 96, -104, 88, -70, 84][i], y: CY + [-150, -104, -30, 22, 100, 150][i] };
  const rot = [-8, 6, -5, 7, -4, 4][i];
  // Arc de vol : la courbe passe par l'extérieur avant de plonger vers le centre.
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const ox = (mx - CX) * 0.9 + (i % 2 ? 90 : -90);
  const oy = (my - CY) * 0.9 - 120;
  const path = `M${round(from.x)} ${round(from.y)} Q${round(mx + ox)} ${round(my + oy)} ${round(to.x)} ${round(to.y)}`;
  return { ...e, from, to, rot, path };
});
