// Messages système de l'app, pour les montrer tels qu'ils apparaissent dans
// le chat d'un groupe. Modèles recopiés AU CARACTÈRE PRÈS depuis braiz-native :
//   supabase/migrations/20260907140000_annonce_chambrage_groupee.sql
//     (punchlines de braiz_announce_trophies)
//   supabase/migrations/20260929151704_message_suppression_place_payeur.sql
//     (variantes de braiz_expense_deletion_notice)
//   supabase/migrations/20260929150037_message_suppression_depense.sql
//     (braiz_format_eur : « 78,20 € », espace fine insécable U+202F entre les
//     milliers, espace insécable U+00A0 avant €)
// Si un texte change dans l'app, le recopier ici.

export type SystemMessage = { emoji: string; text: string };

// Comme l'app : l'emoji est détaché à gauche, le texte à droite.
const split = (content: string, emoji: string): SystemMessage => ({
  emoji,
  text: content.slice(emoji.length).trimStart(),
});

export function formatEur(amount: number): string {
  const cents = Math.round(Math.abs(amount) * 100);
  const euros = String(Math.floor(cents / 100)).replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
  return `${amount < 0 ? "-" : ""}${euros},${String(cents % 100).padStart(2, "0")} €`;
}

// Variante « disparu » : '😶 %1$s a fait disparaître %2$s (%3$s)%4$s. On dit rien, mais on a vu.'
// %2$s = « titre », %4$s = « , payée par X », vide quand l'auteur est le payeur.
export function deletionDisparu(author: string, title: string, amount: number, payer?: string): SystemMessage {
  const payerPart = payer && payer !== author ? `, payée par ${payer}` : "";
  return split(`😶 ${author} a fait disparaître « ${title} » (${formatEur(amount)})${payerPart}. On dit rien, mais on a vu.`, "😶");
}

// Punchline « pompier » : '🚒 %s décroche%s Le Pompier. Un pote qui rembourse vite, ça se garde.'
// Second %s = « nt » quand plusieurs personnes décrochent le trophée.
export function trophyPompier(name: string): SystemMessage {
  return split(`🚒 ${name} décroche Le Pompier. Un pote qui rembourse vite, ça se garde.`, "🚒");
}
