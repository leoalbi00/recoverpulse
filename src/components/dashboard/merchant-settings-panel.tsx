"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Check, Loader2, Palette, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getReadableTextColor } from "@/lib/color";
import type { MerchantSettings } from "@/lib/merchant-settings";

const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

export function MerchantSettingsPanel({
  initialSettings,
}: {
  initialSettings: MerchantSettings;
}) {
  const [companyName, setCompanyName] = useState(initialSettings.companyName);
  const [supportEmail, setSupportEmail] = useState(
    initialSettings.supportEmail,
  );
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    initialSettings.primaryColor,
  );
  const [logoError, setLogoError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidColor = /^#[0-9a-fA-F]{6}$/.test(primaryColor);
  const previewColor = isValidColor ? primaryColor : "#10b981";
  const previewTextColor = getReadableTextColor(previewColor);

  async function persistSettings(overrides: { logoUrl?: string } = {}) {
    const response = await fetch("/api/dashboard/merchant-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        supportEmail,
        primaryColor,
        logoUrl: overrides.logoUrl ?? logoUrl,
      }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error ?? "Errore durante il salvataggio.");
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await persistSettings();
      setSavedAt(Date.now());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante il salvataggio.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogoFile(file: File) {
    setUploadError(null);

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setUploadError("Formato non supportato. Usa PNG, JPG, WebP o SVG.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setUploadError("Il file supera i 5MB consentiti.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/dashboard/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Errore durante il caricamento del logo.",
        );
      }

      setLogoUrl(data.url);
      setLogoError(false);

      // Il logo è già un file permanente su Supabase Storage: salviamo subito
      // anche l'URL in merchant_settings, così l'upload ha effetto immediato
      // senza dover per forza toccare gli altri campi del form.
      try {
        await persistSettings({ logoUrl: data.url });
        setSavedAt(Date.now());
      } catch {
        setError(
          'Logo caricato. Completa gli altri campi e premi"Salva" per applicarlo.',
        );
      }
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Errore durante il caricamento del logo.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadLogoFile(file);
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Palette className="size-4 text-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">
              Brand &amp; Personalizzazione
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Applicati automaticamente alle email di sollecito e al portale di
              aggiornamento carta.
            </p>
          </div>
        </div>
        {savedAt > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3.5" />
            Salvato
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="companyName"
              className="text-sm font-medium text-slate-700"
            >
              Nome azienda
            </label>
            <input
              id="companyName"
              type="text"
              required
              maxLength={120}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="RecoverPulse"
              className="h-10 rounded-lg border border-slate-200/60 bg-slate-100 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="supportEmail"
              className="text-sm font-medium text-slate-700"
            >
              Email di supporto
            </label>
            <input
              id="supportEmail"
              type="email"
              required
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              placeholder="supporto@tuaazienda.com"
              className="h-10 rounded-lg border border-slate-200/60 bg-slate-100 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Logo</label>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_LOGO_TYPES.join(",")}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadLogoFile(file);
                event.target.value = "";
              }}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  fileInputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-slate-200/60 bg-slate-100 hover:border-slate-300"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-5 animate-spin text-emerald-500" />
                  <p className="text-xs text-slate-500">
                    Caricamento in corso…
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="size-5 text-slate-500" />
                  <p className="text-xs text-slate-500">
                    Trascina qui il logo o{" "}
                    <span className="font-medium text-emerald-600">
                      sfoglia i file
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, WebP o SVG · max 5MB
                  </p>
                </>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-rose-500">{uploadError}</p>
            )}

            <div className="mt-1 flex items-center gap-2">
              <span className="shrink-0 text-xs text-slate-500">
                oppure URL:
              </span>
              <input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(event) => {
                  setLogoUrl(event.target.value);
                  setLogoError(false);
                }}
                placeholder="https://tuaazienda.com/logo.png"
                className="h-9 w-full rounded-lg border border-slate-200/60 bg-slate-100 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-xs text-slate-500">
              Lascia vuoto per usare il logo predefinito di RecoverPulse.
              Consigliato: quadrato su sfondo trasparente.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="primaryColor"
              className="text-sm font-medium text-slate-700"
            >
              Colore primario del brand
            </label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColor"
                type="color"
                value={isValidColor ? primaryColor : "#10b981"}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-200/60 bg-slate-100 p-1"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                placeholder="#10b981"
                maxLength={7}
                className="h-10 w-full rounded-lg border border-slate-200/60 bg-slate-100 px-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {!isValidColor && (
              <p className="text-xs text-rose-500">
                Formato non valido: usa un esadecimale come #10b981.
              </p>
            )}
          </div>
        </div>

        {/* Live preview: aggiornata a ogni digitazione/upload, prima ancora di salvare */}
        <div className="rounded-xl border border-slate-200/60 bg-slate-100 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Anteprima live
          </p>
          <div className="mt-3 flex items-center gap-2">
            {logoUrl && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL arbitrario fornito dal merchant, non ottimizzabile da next/image
              <img
                src={logoUrl}
                alt={companyName}
                onError={() => setLogoError(true)}
                className="size-7 shrink-0 rounded-md object-contain"
              />
            ) : (
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                style={{
                  backgroundColor: previewColor,
                  color: previewTextColor,
                }}
              >
                {companyName.trim().charAt(0).toUpperCase() || "R"}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-slate-900">
              {companyName || "RecoverPulse"}
            </span>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200/60 bg-white p-3">
            <p className="text-[11px] text-slate-500">Email di sollecito</p>
            <p className="mt-1 text-xs text-slate-700">
              Aggiorna il metodo di pagamento per continuare il servizio.
            </p>
            <button
              type="button"
              tabIndex={-1}
              className="mt-3 w-full cursor-default rounded-md py-2 text-xs font-semibold"
              style={{ backgroundColor: previewColor, color: previewTextColor }}
            >
              Aggiorna metodo di pagamento
            </button>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Così appariranno il pulsante nelle email e nel portale /pay.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}

      <div className="mt-6 flex items-center justify-end border-t border-slate-200/60 pt-5">
        <Button
          type="submit"
          disabled={saving || !isValidColor}
          className="shrink-0"
        >
          {saving ? "Salvataggio…" : "Salva Impostazioni Brand"}
        </Button>
      </div>
    </form>
  );
}
