import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "merchant-logos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Estensioni per tipo MIME accettato: usate solo per dare un nome file
// leggibile all'oggetto in Storage, la validazione del formato è sul tipo MIME.
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa PNG, JPG, WebP o SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Il file supera i 5MB consentiti." }, { status: 400 });
  }

  // Nome univoco per ogni upload: evita di servire una versione del logo
  // messa in cache (CDN o client email) dopo che il merchant ne carica una nuova.
  const path = `logo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[upload-logo] errore nel caricamento su Supabase Storage:", uploadError.message);
    return NextResponse.json({ error: "Errore durante il caricamento del logo." }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
