// Copie verbatim de braiz-native/src/lib/computeSettlements.ts (source de
// vérité : l'app). Ne pas modifier ici : corriger dans l'app, puis recopier.

// Porté depuis src/lib/computeSettlements.js (web) à l'identique — fonction
// PURE (aucune requête réseau, aucun état React), donc aucune adaptation
// nécessaire au-delà du typage. Voir le fichier web pour l'explication
// complète de l'algorithme glouton de simplification de dettes.
export type Settlement = {
  de: string;
  vers: string;
  montant: number;
};

export function computeSettlements(balances: Record<string, number>): Settlement[] {
  const creditors: { userId: string; cents: number }[] = [];
  const debtors: { userId: string; cents: number }[] = [];

  Object.entries(balances).forEach(([userId, balance]) => {
    const cents = Math.round(balance * 100);
    if (cents > 0) {
      creditors.push({ userId, cents });
    } else if (cents < 0) {
      debtors.push({ userId, cents: -cents });
    }
  });

  const settlements: Settlement[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.cents - a.cents);
    debtors.sort((a, b) => b.cents - a.cents);

    const creditor = creditors[0];
    const debtor = debtors[0];
    const transferCents = Math.min(creditor.cents, debtor.cents);

    settlements.push({
      de: debtor.userId,
      vers: creditor.userId,
      montant: transferCents / 100,
    });

    creditor.cents -= transferCents;
    debtor.cents -= transferCents;

    if (creditor.cents === 0) creditors.shift();
    if (debtor.cents === 0) debtors.shift();
  }

  return settlements;
}
