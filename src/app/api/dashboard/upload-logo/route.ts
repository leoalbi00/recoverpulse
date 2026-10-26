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
};

// SVG escluso di proposito: è un documento attivo (può contenere <script>) e
// il bucket è pubblico, quindi un SVG caricato diventerebbe XSS memorizzato
// sul dominio Supabase Storage; in più Gmail/Outlook non mostrano SVG nelle
// email di dunning. Il tipo MIME arriva dal client (falsificabile): lo
// verifichiamo anche sui magic bytes del contenuto reale.
function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case "image/png":
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/webp":
      return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}

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
      { error: "Formato non supportato. Usa PNG, JPG o WebP." },
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
  if (!matchesMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "Il contenuto del file non corrisponde al formato dichiarato." }, { status: 400 });
  }

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
