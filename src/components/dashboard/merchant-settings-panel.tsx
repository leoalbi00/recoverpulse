"use client";

import { useState, type FormEvent } from "react";
import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getReadableTextColor } from "@/lib/color";
import type { MerchantSettings } from "@/lib/merchant-settings";

export function MerchantSettingsPanel({ initialSettings }: { initialSettings: MerchantSettings }) {
  const [companyName, setCompanyName] = useState(initialSettings.companyName);
  const [supportEmail, setSupportEmail] = useState(initialSettings.supportEmail);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor);
  const [logoError, setLogoError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isValidColor = /^#[0-9a-fA-F]{6}$/.test(primaryColor);
  const previewColor = isValidColor ? primaryColor : "#10b981";
  const previewTextColor = getReadableTextColor(previewColor);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/dashboard/merchant-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, supportEmail, logoUrl, primaryColor }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Errore durante il salvataggio.");
      }

      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Palette className="size-4 text-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-100">Brand &amp; Personalizzazione</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Applicati automaticamente alle email di sollecito e al portale di aggiornamento carta.
            </p>
          </div>
        </div>
        {savedAt > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-500">
            <Check className="size-3.5" />
            Salvato
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="companyName" className="text-sm font-medium text-zinc-300">
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
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="supportEmail" className="text-sm font-medium text-zinc-300">
              Email di supporto
            </label>
            <input
              id="supportEmail"
              type="email"
              required
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              placeholder="supporto@tuaazienda.com"
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="logoUrl" className="text-sm font-medium text-zinc-300">
              URL Logo
            </label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(event) => {
                setLogoUrl(event.target.value);
                setLogoError(false);
              }}
              placeholder="https://tuaazienda.com/logo.png"
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-zinc-500">
              Lascia vuoto per usare il logo predefinito di RecoverPulse. Consigliato: PNG/SVG quadrato su sfondo trasparente.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="primaryColor" className="text-sm font-medium text-zinc-300">
              Colore primario del brand
            </label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColor"
                type="color"
                value={isValidColor ? primaryColor : "#10b981"}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/60 p-1"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                placeholder="#10b981"
                maxLength={7}
                className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {!isValidColor && (
              <p className="text-xs text-rose-500">Formato non valido: usa un esadecimale come #10b981.</p>
            )}
          </div>
        </div>

        {/* Live preview: aggiornata a ogni digitazione, prima ancora di salvare */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Anteprima live</p>
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
                style={{ backgroundColor: previewColor, color: previewTextColor }}
              >
                {companyName.trim().charAt(0).toUpperCase() || "R"}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-zinc-100">{companyName || "RecoverPulse"}</span>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
            <p className="text-[11px] text-zinc-500">Email di sollecito</p>
            <p className="mt-1 text-xs text-zinc-300">Aggiorna il metodo di pagamento per continuare il servizio.</p>
            <button
              type="button"
              tabIndex={-1}
              className="mt-3 w-full cursor-default rounded-md py-2 text-xs font-semibold"
              style={{ backgroundColor: previewColor, color: previewTextColor }}
            >
              Aggiorna metodo di pagamento
            </button>
          </div>

          <p className="mt-3 text-[11px] text-zinc-600">
            Così appariranno il pulsante nelle email e nel portale /pay.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}

      <div className="mt-6 flex items-center justify-end border-t border-zinc-800 pt-5">
        <Button type="submit" disabled={saving || !isValidColor} className="shrink-0">
          {saving ? "Salvataggio…" : "Salva Impostazioni Brand"}
        </Button>
      </div>
    </form>
  );
}
