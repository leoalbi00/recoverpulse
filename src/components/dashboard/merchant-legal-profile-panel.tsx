"use client";

import { useState, type FormEvent } from "react";
import { Building2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MerchantSettings } from "@/lib/merchant-settings";

export function MerchantLegalProfilePanel({
  initialSettings,
}: {
  initialSettings: MerchantSettings;
}) {
  const [firstName, setFirstName] = useState(initialSettings.firstName);
  const [lastName, setLastName] = useState(initialSettings.lastName);
  const [companyName, setCompanyName] = useState(initialSettings.companyName);
  const [vatNumber, setVatNumber] = useState(initialSettings.vatNumber);
  const [legalAddress, setLegalAddress] = useState(initialSettings.legalAddress);
  const [supportEmail, setSupportEmail] = useState(initialSettings.supportEmail);
  const [phone, setPhone] = useState(initialSettings.phone);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/dashboard/merchant-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          companyName,
          vatNumber,
          legalAddress,
          supportEmail,
          phone,
        }),
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
      className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <Building2 className="size-4 text-emerald-700" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Profilo Merchant &amp; Dati Legali/Fiscali
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Dati obbligatori per la fatturazione e per i contratti (Termini
              di Servizio, DPA).
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

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-sm font-medium text-zinc-700">
            Nome
          </label>
          <input
            id="firstName"
            type="text"
            required
            maxLength={80}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Mario"
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-sm font-medium text-zinc-700">
            Cognome
          </label>
          <input
            id="lastName"
            type="text"
            required
            maxLength={80}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Rossi"
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="supportEmail" className="text-sm font-medium text-zinc-700">
            Email di contatto
          </label>
          <input
            id="supportEmail"
            type="email"
            required
            value={supportEmail}
            onChange={(event) => setSupportEmail(event.target.value)}
            placeholder="info@tuaazienda.com"
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
            Telefono
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+39 02 1234567"
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="companyName" className="text-sm font-medium text-zinc-700">
            Ragione Sociale / Nome Azienda
          </label>
          <input
            id="companyName"
            type="text"
            required
            maxLength={120}
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="RecoverPulse S.r.l."
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="vatNumber" className="text-sm font-medium text-zinc-700">
            Partita IVA / Codice Fiscale
          </label>
          <input
            id="vatNumber"
            type="text"
            required
            maxLength={40}
            value={vatNumber}
            onChange={(event) => setVatNumber(event.target.value)}
            placeholder="IT01234567890"
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="legalAddress" className="text-sm font-medium text-zinc-700">
            Indirizzo sede legale
          </label>
          <input
            id="legalAddress"
            type="text"
            required
            maxLength={240}
            value={legalAddress}
            onChange={(event) => setLegalAddress(event.target.value)}
            placeholder="Via Roma 1, 20100 Milano (MI)"
            className="h-10 rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}

      <div className="mt-6 flex items-center justify-end border-t border-zinc-200/80 pt-5">
        <Button type="submit" disabled={saving} className="shrink-0">
          {saving ? "Salvataggio…" : "Salva Dati Legali"}
        </Button>
      </div>
    </form>
  );
}
