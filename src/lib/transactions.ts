import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type TransactionStatus = "in_corso" | "recuperato" | "perso";

export type PaymentMethodType = "card" | "sepa_debit" | "paypal";

export type FailedTransaction = {
  id: string;
  userId: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId: string | null;
  planName: string;
  amount: number;
  currency: string;
  reason: string;
  status: TransactionStatus;
  paymentLinkToken: string;
  /** Link Stripe alla fattura ospitata (invoice.hosted_invoice_url), se disponibile. */
  hostedInvoiceUrl: string | null;
  createdAt: string;
  recoveredAt: string | null;
  /** Timestamp del primo sollecito ("immediate") inviato con successo, null finché non è ancora partito. */
  firstNoticeSentAt: string | null;
  /** 'card' per il flusso Stripe esistente, 'sepa_debit' per gli insoluti ricevuti dal webhook universale SDD. */
  paymentMethodType: PaymentMethodType;
  /** Ultime 4 cifre dell'IBAN addebitato, solo per paymentMethodType 'sepa_debit'. */
  ibanLast4: string | null;
  /** Riferimento al mandato SEPA (SDD), solo per paymentMethodType 'sepa_debit'. */
  mandateReference: string | null;
  /** Codice di rifiuto grezzo del gateway: codice di storno SEPA (es. AC01, MD01, MS02) per 'sepa_debit', decline/error code Stripe per 'card'. */
  failureCode: string | null;
  /** ID della subscription PayPal, solo per paymentMethodType 'paypal'. */
  paypalSubscriptionId: string | null;
  /** ID cliente/payer lato gateway esterno (es. PayPal Payer ID), solo per paymentMethodType 'paypal'. */
  gatewayCustomerId: string | null;
  /** Categoria del motivo di rifiuto (src/lib/dunning-error-categorization.ts), null se non ancora classificato (es. eventi PayPal, privi di un codice di rifiuto strutturato). */
  errorCategory: string | null;
  /** Prossimo tentativo "intelligente" pianificato dal cron (src/app/api/cron/dunning/route.ts), override del calendario a step del template. Null = nessun override in corso. */
  nextRetryAt: string | null;
  /** true per expired_card/invalid_card: niente ulteriori solleciti a giorni fissi, si è già inviato il Magic Link nello step immediato. */
  retryBypassed: boolean;
  /** Tentativi di riaddebito automatico già eseguiti dal cron (src/app/api/cron/smart-retry/route.ts), max MAX_CHARGE_RETRIES. */
  chargeRetryCount: number;
  /** Prossimo tentativo di riaddebito via stripe.invoices.pay, null = nessuno pianificato. */
  nextChargeRetryAt: string | null;
};

type FailedTransactionRow = {
  id: string;
  user_id: string;
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  subscription_id: string | null;
  plan_name: string;
  amount: number;
  currency: string;
  reason: string;
  status: TransactionStatus;
  payment_link_token: string;
  hosted_invoice_url: string | null;
  created_at: string;
  recovered_at: string | null;
  first_notice_sent_at: string | null;
  payment_method_type: PaymentMethodType;
  iban_last4: string | null;
  mandate_reference: string | null;
  failure_code: string | null;
  paypal_subscription_id: string | null;
  gateway_customer_id: string | null;
  error_category: string | null;
  next_retry_at: string | null;
  retry_bypassed: boolean;
  charge_retry_count: number | null;
  next_charge_retry_at: string | null;
};

function mapRow(row: FailedTransactionRow): FailedTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    subscriptionId: row.subscription_id,
    planName: row.plan_name,
    amount: row.amount,
    currency: row.currency,
    reason: row.reason,
    status: row.status,
    paymentLinkToken: row.payment_link_token,
    hostedInvoiceUrl: row.hosted_invoice_url,
    createdAt: row.created_at,
    recoveredAt: row.recovered_at,
    firstNoticeSentAt: row.first_notice_sent_at,
    paymentMethodType: row.payment_method_type ?? "card",
    ibanLast4: row.iban_last4,
    mandateReference: row.mandate_reference,
    failureCode: row.failure_code,
    paypalSubscriptionId: row.paypal_subscription_id,
    gatewayCustomerId: row.gateway_customer_id,
    errorCategory: row.error_category,
    nextRetryAt: row.next_retry_at,
    retryBypassed: row.retry_bypassed ?? false,
    chargeRetryCount: row.charge_retry_count ?? 0,
    nextChargeRetryAt: row.next_charge_retry_at ?? null,
  };
}

/**
 * Registra (o aggiorna) una fattura fallita su Supabase, per l'account
 * Stripe collegato `userId` (risolto dal webhook via `event.account`, vedi
 * src/lib/connected-stripe-accounts.ts). L'upsert avviene su `invoice_id`:
 * `id` e `created_at` restano quelli della riga esistente (non sono inclusi
 * nel payload), mentre stato ed esito di recupero vengono sempre ripristinati
 * a "in corso" perché rappresentano un nuovo fallimento.
 */
export async function recordFailedPayment(input: {
  userId: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId: string | null;
  planName: string;
  amount: number;
  currency: string;
  reason: string;
  /** Token monouso (in chiaro) generato su Supabase da `createPaymentToken` per il link del portale. */
  paymentLinkToken: string;
  /** Link Stripe alla fattura ospitata (invoice.hosted_invoice_url), se disponibile. */
  hostedInvoiceUrl?: string | null;
  /** 'card' (default, flusso Stripe) o 'sepa_debit' (webhook universale SDD). */
  paymentMethodType?: PaymentMethodType;
  /** Ultime 4 cifre dell'IBAN addebitato, solo per 'sepa_debit'. */
  ibanLast4?: string | null;
  /** Riferimento al mandato SEPA, solo per 'sepa_debit'. */
  mandateReference?: string | null;
  /** Codice di rifiuto grezzo del gateway: codice di storno SEPA (AC01, MD01, MS02, ...) per 'sepa_debit', decline/error code Stripe per 'card'. */
  failureCode?: string | null;
  /** ID della subscription PayPal, solo per 'paypal'. */
  paypalSubscriptionId?: string | null;
  /** ID cliente/payer lato gateway esterno, solo per 'paypal'. */
  gatewayCustomerId?: string | null;
  /** Categoria del motivo di rifiuto (src/lib/dunning-error-categorization.ts), null se non classificabile. */
  errorCategory?: string | null;
  /** Prossimo tentativo "intelligente" già pianificato al momento della registrazione (insufficient_funds/bank_system_error). */
  nextRetryAt?: Date | null;
  /** true per expired_card/invalid_card: il cron non pianifica ulteriori solleciti a giorni fissi per questa fattura. */
  retryBypassed?: boolean;
}): Promise<FailedTransaction> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .upsert(
      {
        user_id: input.userId,
        invoice_id: input.invoiceId,
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        subscription_id: input.subscriptionId,
        plan_name: input.planName,
        amount: input.amount,
        currency: input.currency,
        reason: input.reason,
        payment_link_token: input.paymentLinkToken,
        hosted_invoice_url: input.hostedInvoiceUrl ?? null,
        status: "in_corso" satisfies TransactionStatus,
        recovered_at: null,
        first_notice_sent_at: null,
        payment_method_type: input.paymentMethodType ?? "card",
        iban_last4: input.ibanLast4 ?? null,
        mandate_reference: input.mandateReference ?? null,
        failure_code: input.failureCode ?? null,
        paypal_subscription_id: input.paypalSubscriptionId ?? null,
        gateway_customer_id: input.gatewayCustomerId ?? null,
        error_category: input.errorCategory ?? null,
        next_retry_at: input.nextRetryAt ? input.nextRetryAt.toISOString() : null,
        retry_bypassed: input.retryBypassed ?? false,
      },
      { onConflict: "invoice_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Errore nella registrazione del pagamento fallito su Supabase: ${error.message}`);
  }

  return mapRow(data);
}

/**
 * `userId` opzionale: il webhook lo passa sempre (risolto da `event.account`
 * o dal token del portale); resta opzionale solo per non rompere percorsi
 * legacy che non lo hanno ancora — se passato, filtra anche per proprietario
 * come difesa in profondità.
 *
 * Restituisce `null` se la fattura era già "recuperato": più percorsi possono
 * segnare lo stesso recupero (portale /pay, cron di riaddebito, poi
 * invoice.paid dal webhook) e solo il primo deve notificare/registrare.
 */
export async function markInvoiceRecovered(invoiceId: string, userId?: string): Promise<FailedTransaction | null> {
  let query = supabaseAdmin
    .from("failed_transactions")
    .update({ status: "recuperato" satisfies TransactionStatus, recovered_at: new Date().toISOString() })
    .eq("invoice_id", invoiceId)
    .neq("status", "recuperato" satisfies TransactionStatus);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.select().maybeSingle();

  if (error) {
    throw new Error(`Errore nell'aggiornamento della transazione recuperata su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/**
 * Registra il timestamp del primo sollecito ("immediate") inviato con
 * successo, senza toccare `status`: quest'ultimo resta "in_corso" così il
 * cron di dunning (listActiveFailedTransactions) continua a considerare la
 * fattura per i solleciti successivi. L'update è condizionato a
 * first_notice_sent_at ancora nullo, per non sovrascrivere la data del primo
 * invio in caso di reinvii manuali dalla dashboard (resend/route.ts) che
 * riusano lo stesso step "immediate".
 */
export async function markFirstNoticeSent(invoiceId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ first_notice_sent_at: new Date().toISOString() })
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId)
    .is("first_notice_sent_at", null);

  if (error) {
    throw new Error(`Errore nell'aggiornamento di first_notice_sent_at su Supabase: ${error.message}`);
  }
}

/**
 * Consuma l'override "smart retry" (src/lib/dunning-error-categorization.ts)
 * dopo che il cron di dunning lo ha usato per inviare un sollecito fuori dal
 * calendario a giorni fissi: azzera `next_retry_at` così non rifiora alla
 * prossima esecuzione, il calendario a step del template riprende da qui in
 * poi in aggiunta al tentativo intelligente appena inviato.
 */
export async function clearNextRetryAt(invoiceId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ next_retry_at: null })
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Errore nell'aggiornamento di next_retry_at su Supabase: ${error.message}`);
  }
}

/**
 * Segna come "perso" una singola fattura ancora in corso, tipicamente
 * chiamata dal cron di dunning (src/app/api/cron/dunning/route.ts) quando i
 * giorni trascorsi superano l'ultimo step della sequenza di solleciti senza
 * che il pagamento sia stato recuperato. Il filtro su status "in_corso"
 * rende la chiamata idempotente tra esecuzioni successive del cron.
 */
export async function markInvoiceLost(invoiceId: string, userId?: string): Promise<FailedTransaction | null> {
  let query = supabaseAdmin
    .from("failed_transactions")
    .update({ status: "perso" satisfies TransactionStatus })
    .eq("invoice_id", invoiceId)
    .eq("status", "in_corso");
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.select().maybeSingle();

  if (error) {
    throw new Error(`Errore nell'aggiornamento della fattura persa su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/**
 * Segna come "perso" ogni recupero ancora in corso legato a uno Stripe
 * Subscription ID, tipicamente in risposta a customer.subscription.deleted:
 * una volta cancellato l'abbonamento non ha più senso proseguire la
 * sequenza di dunning sulle sue fatture non pagate.
 */
export async function markSubscriptionLost(subscriptionId: string, userId?: string): Promise<FailedTransaction[]> {
  let query = supabaseAdmin
    .from("failed_transactions")
    .update({ status: "perso" satisfies TransactionStatus })
    .eq("subscription_id", subscriptionId)
    .eq("status", "in_corso");
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.select();

  if (error) {
    throw new Error(`Errore nell'aggiornamento delle transazioni perse su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

/**
 * `userId` obbligatorio: chiamata da route dashboard autenticate (resend
 * manuale del sollecito) — senza questo filtro un utente potrebbe leggere e
 * agire sulla fattura di un altro account collegato.
 */
export async function getTransaction(invoiceId: string, userId: string): Promise<FailedTransaction | null> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella lettura della transazione su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/**
 * Risolve la transazione di pagamento fallito più recente non ancora recuperata
 * per uno Stripe Customer ID. Usata da `/pay/[token]`: il token del portale
 * (validato su Supabase) porta con sé anche `userId`, passato qui come difesa
 * in profondità (un customer_id Stripe non collide comunque tra account
 * diversi, ma il filtro evita ogni ambiguità).
 */
export async function getTransactionByCustomerId(
  customerId: string,
  userId?: string
): Promise<FailedTransaction | null> {
  let query = supabaseAdmin.from("failed_transactions").select("*").eq("customer_id", customerId);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Errore nella ricerca della transazione su Supabase: ${error.message}`);
  }

  if (!data || data.length === 0) return null;

  const active = data.find((row) => row.status === "in_corso");
  return mapRow(active ?? data[0]);
}

export async function listTransactions(userId: string): Promise<FailedTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Errore nel recupero delle transazioni su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

/**
 * Fatture ancora in corso di recupero per un account, usata dal cron dei
 * solleciti (src/app/api/cron/dunning/route.ts, un loop per ogni account
 * collegato) per valutare, fattura per fattura, se è il momento di inviare
 * il prossimo sollecito della sequenza.
 */
export async function listActiveFailedTransactions(userId: string): Promise<FailedTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "in_corso")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Errore nel recupero delle transazioni in corso su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

// computeDashboardStats, computeRecoveryChartData e i relativi tipi sono
// stati spostati in src/lib/dashboard-analytics.ts: sono funzioni pure senza
// dipendenze da Supabase, richiamabili anche dal componente client che
// gestisce il filtro temporale della dashboard (niente "server-only" lì).

/** Tentativi massimi di riaddebito automatico per fattura (vedi 20261001120000_stripe_charge_retry.sql). */
export const MAX_CHARGE_RETRIES = 3;

/**
 * Pianifica il PRIMO riaddebito automatico di una fattura appena fallita.
 * Condizionato a charge_retry_count = 0 e nessun tentativo già pianificato:
 * un invoice.payment_failed generato dal nostro stesso tentativo fallito (o
 * da una ridelivery) non riporta indietro il calendario dei riaddebiti.
 */
export async function scheduleFirstChargeRetry(invoiceId: string, userId: string, at: Date): Promise<void> {
  const { error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ next_charge_retry_at: at.toISOString() })
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId)
    .eq("charge_retry_count", 0)
    .is("next_charge_retry_at", null);

  if (error) {
    throw new Error(`Errore nella pianificazione del riaddebito automatico su Supabase: ${error.message}`);
  }
}

/** Fatture Stripe (carta) in corso con un riaddebito automatico scaduto, su tutti gli account. */
export async function listDueChargeRetries(now: Date, limit: number): Promise<FailedTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("status", "in_corso" satisfies TransactionStatus)
    .eq("payment_method_type", "card" satisfies PaymentMethodType)
    .eq("retry_bypassed", false)
    .lt("charge_retry_count", MAX_CHARGE_RETRIES)
    .lte("next_charge_retry_at", now.toISOString())
    .order("next_charge_retry_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Errore nel recupero dei riaddebiti pianificati su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

/**
 * Prenota il tentativo successivo PRIMA di chiamare Stripe: incrementa
 * charge_retry_count e azzera next_charge_retry_at solo se il contatore è
 * ancora quello letto da listDueChargeRetries. `null` = un'altra esecuzione
 * concorrente ha già preso questa fattura (o non è più in corso).
 */
export async function claimChargeRetry(transaction: FailedTransaction): Promise<FailedTransaction | null> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ charge_retry_count: transaction.chargeRetryCount + 1, next_charge_retry_at: null })
    .eq("id", transaction.id)
    .eq("status", "in_corso" satisfies TransactionStatus)
    .eq("charge_retry_count", transaction.chargeRetryCount)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella prenotazione del riaddebito su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/** Pianifica il riaddebito successivo dopo un tentativo fallito (`null` = tentativi esauriti). */
export async function scheduleNextChargeRetry(transactionId: string, at: Date | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ next_charge_retry_at: at ? at.toISOString() : null })
    .eq("id", transactionId)
    .eq("status", "in_corso" satisfies TransactionStatus);

  if (error) {
    throw new Error(`Errore nella pianificazione del riaddebito successivo su Supabase: ${error.message}`);
  }
}
