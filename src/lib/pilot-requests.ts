import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";

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

  // La notifica in-app è un effetto collaterale: se fallisce non deve far
  // fallire la richiesta pilota, già salvata con successo qui sopra.
  try {
    await createNotification({
      type: "lead",
      title: "Nuovo lead pilota",
      message: `Nuova richiesta pilota da ${input.company}`,
      metadata: {
        name: input.name,
        email: input.email,
        company: input.company,
        estimatedMrr: input.estimatedMrr ?? null,
        message: input.message ?? null,
      },
    });
  } catch (notificationError) {
    console.error("[pilot-requests] errore nella creazione della notifica:", notificationError);
  }
}
