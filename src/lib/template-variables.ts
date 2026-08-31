export type DunningTemplateVariables = {
  nome_cliente: string;
  importo: string;
  nome_piano: string;
  nome_azienda: string;
  link_recupero: string;
};

/**
 * Sostituisce i placeholder {{variabile}} di un template configurato in
 * /dashboard/dunning (oggetto o corpo email) con i valori reali della
 * fattura. Un placeholder senza un valore noto viene lasciato invariato
 * invece di sparire silenziosamente, così un typo nel nome della variabile
 * resta visibile nell'anteprima/nell'email inviata.
 *
 * Nessuna dipendenza server-only: usata sia dall'invio email reale
 * (src/lib/dunning-templates.ts, che la ri-esporta) sia dall'anteprima live
 * nell'editor client (src/components/dashboard/dunning-templates-manager.tsx).
 */
export function renderDunningTemplate(template: string, vars: DunningTemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? vars[key as keyof DunningTemplateVariables] : match
  );
}
