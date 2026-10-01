// STOP-SLOT Guardrails: nessuna azione di pagamento (riaddebito automatico) né
// sollecito al cliente può partire se anche uno solo degli slot obbligatori
// non è confermato. Usato dal webhook Stripe prima di registrare un insoluto
// (src/app/api/webhooks/stripe/route.ts) e dal cron di riaddebito prima di
// chiamare `stripe.invoices.pay` (src/app/api/cron/smart-retry/route.ts).
//
// Nessuna dipendenza da Supabase o da un gateway: riceve valori grezzi e
// restituisce o gli slot validati (tipizzati, non più nullable) o l'elenco
// esatto di quelli mancanti/non validi, così il chiamante può interrompersi
// con un log preciso invece di procedere con dati parziali.

import { z } from "zod";

const paymentSlotsSchema = z.object({
  customerId: z.string().trim().min(1),
  invoiceId: z.string().trim().min(1),
  // Importo in unità minori (centesimi), come restituito da Stripe: un
  // importo nullo o negativo non è mai un insoluto da recuperare.
  amount: z.number().int().positive(),
  currency: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{3}$/)
    .transform((value) => value.toLowerCase()),
});

export type PaymentSlots = z.infer<typeof paymentSlotsSchema>;

export type PaymentSlotName = keyof PaymentSlots;

export type SlotValidationResult =
  | { ok: true; slots: PaymentSlots }
  | { ok: false; missing: PaymentSlotName[] };

export type PaymentSlotsInput = {
  customerId?: string | null;
  invoiceId?: string | null;
  amount?: number | null;
  currency?: string | null;
};

/** Valida i 4 slot obbligatori; `missing` elenca ogni slot assente o non valido, nell'ordine dello schema. */
export function validatePaymentSlots(input: PaymentSlotsInput): SlotValidationResult {
  const result = paymentSlotsSchema.safeParse(input);
  if (result.success) {
    return { ok: true, slots: result.data };
  }

  const missing = [
    ...new Set(result.error.issues.map((issue) => issue.path[0] as PaymentSlotName)),
  ];
  return { ok: false, missing };
}

/**
 * Variante per i chiamanti che devono solo decidere se proseguire: emette il
 * log di avviso con gli slot mancanti e il contesto (`scope`, es.
 * "stripe-webhook") e restituisce `null` se l'esecuzione va interrotta.
 */
export function requirePaymentSlots(scope: string, input: PaymentSlotsInput): PaymentSlots | null {
  const result = validatePaymentSlots(input);
  if (result.ok) return result.slots;

  console.warn(
    `[${scope}] STOP-SLOT: slot obbligatori mancanti o non validi (${result.missing.join(", ")}) per la fattura ${
      input.invoiceId || "sconosciuta"
    }: azione di pagamento/sollecito interrotta.`
  );
  return null;
}
