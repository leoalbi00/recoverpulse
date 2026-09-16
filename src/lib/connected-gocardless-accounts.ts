import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { encryptSecret, decryptSecret } from "@/lib/encryption";

export type ConnectedGoCardlessAccount = {
  organisationId: string;
  userId: string;
  accessToken: string;
  organisationName: string | null;
  environment: "live" | "sandbox";
  connectedAt: string;
};

type ConnectedGoCardlessAccountRow = {
  organisation_id: string;
  user_id: string;
  access_token: string;
  organisation_name: string | null;
  environment: "live" | "sandbox";
  connected_at: string;
};

function mapRow(row: ConnectedGoCardlessAccountRow): ConnectedGoCardlessAccount {
  return {
    organisationId: row.organisation_id,
    userId: row.user_id,
    accessToken: decryptSecret(row.access_token),
    organisationName: row.organisation_name,
    environment: row.environment,
    connectedAt: row.connected_at,
  };
}

/** Registra (o riassocia) un'organisation GoCardless collegata via OAuth (src/app/api/gocardless/connect/callback/route.ts). L'access_token è cifrato prima del salvataggio. */
export async function upsertConnectedGoCardlessAccount(input: {
  organisationId: string;
  userId: string;
  accessToken: string;
  organisationName?: string | null;
  environment?: "live" | "sandbox";
}): Promise<ConnectedGoCardlessAccount> {
  const { data, error } = await supabaseAdmin
    .from("connected_gocardless_accounts")
    .upsert(
      {
        organisation_id: input.organisationId,
        user_id: input.userId,
        access_token: encryptSecret(input.accessToken),
        organisation_name: input.organisationName ?? null,
        environment: input.environment ?? "live",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organisation_id" }
    )
    .select("organisation_id, user_id, access_token, organisation_name, environment, connected_at")
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio dell'account GoCardless collegato su Supabase: ${error.message}`);
  }

  return mapRow(data);
}

export async function getConnectedGoCardlessAccountForUser(userId: string): Promise<ConnectedGoCardlessAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("connected_gocardless_accounts")
    .select("organisation_id, user_id, access_token, organisation_name, environment, connected_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero dell'account GoCardless collegato su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/** Usata dal webhook universale (`links.organisation` di ogni evento) per risolvere quale utente OmniRev possiede l'organisation che ha generato l'evento. */
export async function getUserIdForOrganisation(organisationId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("connected_gocardless_accounts")
    .select("user_id")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella risoluzione dell'account GoCardless collegato su Supabase: ${error.message}`);
  }

  return data?.user_id ?? null;
}

/** Disconnette GoCardless per l'utente: elimina la riga collegata. */
export async function clearGoCardlessAccountForUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("connected_gocardless_accounts").delete().eq("user_id", userId);

  if (error) {
    throw new Error(`Errore nella disconnessione GoCardless su Supabase: ${error.message}`);
  }
}
