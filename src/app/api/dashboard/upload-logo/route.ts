import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const BUCKET = "merchant-logos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Formati raster accettati. SVG escluso di proposito: è un documento XML che
// può contenere <script>, e il bucket è pubblico — un "logo" SVG diventerebbe
// una pagina con JavaScript arbitrario ospitata sul dominio di Storage.
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// Il tipo MIME arriva dal client: verifichiamo anche i magic bytes reali.
function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  if (!checkRateLimit(`upload-logo:${session.user.id}`, 10, 60 * 60).allowed) {
    return NextResponse.json({ error: "Troppi caricamenti. Riprova più tardi." }, { status: 429 });
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
  const path = `${session.user.id}/logo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!matchesMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "Il file non è un'immagine valida." }, { status: 400 });
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
