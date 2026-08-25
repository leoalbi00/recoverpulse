import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

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
}
