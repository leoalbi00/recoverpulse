import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPilotRequestConfirmationEmail } from "@/lib/email";
import { ADMIN_EMAIL } from "@/lib/admin";
import { createNotification } from "@/lib/notifications";
import { findUserByEmail } from "@/lib/users";

export type PilotRequest = {
  id: string;
  name: string;
  email: string;
  company: string;
  estimatedMrr: string | null;
  message: string | null;
  createdAt: string;
};

type PilotRequestRow = {
  id: string;
  name: string;
  email: string;
  company: string;
  estimated_mrr: string | null;
  message: string | null;
  created_at: string;
};

function mapRow(row: PilotRequestRow): PilotRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    estimatedMrr: row.estimated_mrr,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function createPilotRequest(input: {
  name: string;
  email: string;
  company: string;
  estimatedMrr?: string;
  message?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("pilot_requests").insert({
    name: input.name,
    email: input.email,
    company: input.company,
    estimated_mrr: input.estimatedMrr || null,
    message: input.message || null,
  });

  if (error) {
    throw new Error(`Errore nel salvataggio della richiesta pilota su Supabase: ${error.message}`);
  }

  // Notifica in-app all'account Sviluppatore/Admin (ADMIN_EMAIL): un lead
  // pilota riguarda RecoverPulse stesso, non un merchant, quindi instradarlo a
  // un account cliente a caso mostrerebbe dati di un lead di vendita nella
  // sua dashboard. L'unico account a cui ha senso destinarla è quello admin.
  // Non propaga errori: la richiesta è già salvata con successo qui sopra, e
  // una notifica mancante non deve far fallire l'invio del modulo pilota
  // (stesso principio di notifyPaymentRecovered/notifyPaymentFailed).
  try {
    const adminUser = await findUserByEmail(ADMIN_EMAIL);
    if (adminUser) {
      await createNotification({
        userId: adminUser.id,
        type: "lead",
        title: "Nuova richiesta pilota",
        message: `${input.name} (${input.company}) ha richiesto l'integrazione pilota`,
        metadata: {
          name: input.name,
          email: input.email,
          company: input.company,
          estimatedMrr: input.estimatedMrr ?? null,
          message: input.message ?? null,
        },
      });
    } else {
      console.error(
        `[pilot-requests] nessun account trovato per ADMIN_EMAIL (${ADMIN_EMAIL}): notifica di lead non creata.`
      );
    }
  } catch (notificationError) {
    console.error("[pilot-requests] errore nella creazione della notifica admin:", notificationError);
  }

  // Email di conferma al lead: effetto collaterale non critico, non deve far
  // fallire la richiesta pilota, già salvata con successo qui sopra.
  // sendPilotRequestConfirmationEmail non propaga mai errori di suo, ma
  // resta wrappata per coerenza con lo stesso principio.
  try {
    await sendPilotRequestConfirmationEmail({ to: input.email, name: input.name });
  } catch (emailError) {
    console.error("[pilot-requests] errore nell'invio dell'email di conferma:", emailError);
  }
}

/** Tutte le richieste pilota ricevute, usata dalla sezione Sviluppatore (/dashboard/developer). */
export async function listPilotRequests(limit: number): Promise<PilotRequest[]> {
  const { data, error } = await supabaseAdmin
    .from("pilot_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Errore nel recupero delle richieste pilota su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}
