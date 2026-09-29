// Découpe de texte commune à tous les titres animés (SplitText + masque).
//
// SplitText enveloppe chaque mot (ou ligne, ou lettre) dans un masque en
// overflow: clip, haut d'une ligne. Avec un interligne serré (line-height
// ≈ 1), la boîte est plus basse que les jambages (g, p, q), les accents
// (È, é) et certains signes (€) : ils étaient rognés. Les classes posées
// ici reçoivent dans site.css une marge intérieure compensée par une marge
// négative : le masque déborde de sa ligne, l'interligne visuel ne change
// pas. padding + marge négative plutôt qu'overflow-clip-margin, que
// Safari iOS n'applique pas encore.
import type { SplitText as SplitTextType } from "gsap/SplitText";

type Kind = "words" | "lines" | "chars";

// Déplacement (yPercent) pour cacher un mot sous son masque, ou l'en sortir
// par le haut. Plus grand que 100 : le masque est agrandi par la marge
// intérieure, un mot décalé de 100 % y serait encore en partie visible.
export const MASK_TRAVEL = 150;

// Espaces : par défaut, SplitText remplace TOUTES les espaces (\s, donc
// aussi l'espace insécable U+00A0) par une espace simple. Le « ? » de
// « à qui ? » ou le « à » de « à décrocher » pouvaient alors passer seuls à
// la ligne. On fusionne nous-mêmes les espaces ordinaires et on laisse les
// insécables : elles restent collées au mot, qui ne se coupe plus.
export const SPLIT_TEXT = {
  reduceWhiteSpace: false,
  prepareText: (text: string) => text.replace(/[ \t\n\r\f]+/g, " "),
};

export function splitMasked(SplitText: typeof SplitTextType, target: Element, type: Kind = "words") {
  return new SplitText(target, {
    ...SPLIT_TEXT,
    type,
    mask: type,
    wordsClass: "split-word",
    linesClass: "split-line",
    charsClass: "split-char",
  });
}
