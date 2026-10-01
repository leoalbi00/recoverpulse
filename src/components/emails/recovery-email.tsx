import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export type RecoveryEmailProps = {
  companyName: string;
  /** Logo caricato dal merchant in "Brand & Personalizzazione"; null = monogramma col colore primario. */
  logoUrl: string | null;
  /** Colore primario del merchant (hex), usato per CTA e monogramma. */
  primaryColor: string;
  /** Colore del testo leggibile sopra `primaryColor` (src/lib/color.ts, getReadableTextColor). */
  primaryTextColor: string;
  customerName: string;
  planName: string;
  amountFormatted: string;
  recoveryLink: string;
  /** Motivo del rifiuto riportato dal gateway, mostrato nel riepilogo. */
  failureReason?: string | null;
  /** Data leggibile del prossimo tentativo automatico, null = tentativi esauriti. */
  nextAttemptLabel?: string | null;
  supportEmail?: string | null;
};

/**
 * Email di recupero renderizzata con React Email (src/lib/email.ts,
 * sendChargeRetryFailedEmail): inviata dal cron di riaddebito automatico
 * (src/app/api/cron/smart-retry/route.ts) quando un tentativo via
 * stripe.invoices.pay fallisce. Tailwind con preset in pixel: molti client
 * email (Outlook, Gmail app) non interpretano le unità rem.
 */
export function RecoveryEmail({
  companyName,
  logoUrl,
  primaryColor,
  primaryTextColor,
  customerName,
  planName,
  amountFormatted,
  recoveryLink,
  failureReason,
  nextAttemptLabel,
  supportEmail,
}: RecoveryEmailProps) {
  return (
    <Html lang="it">
      <Head />
      <Preview>{`Il pagamento di ${amountFormatted} per ${planName} non è andato a buon fine`}</Preview>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="m-0 bg-zinc-100 px-2 py-10 font-sans">
          <Container className="mx-auto max-w-[560px] overflow-hidden rounded-2xl border border-solid border-zinc-200 bg-white">
            <Section className="px-8 pt-8">
              {logoUrl ? (
                <Img src={logoUrl} alt={companyName} height="36" className="h-9 w-auto" />
              ) : (
                <Text
                  className="m-0 inline-block rounded-lg px-3 py-1.5 text-base font-semibold"
                  style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                >
                  {companyName}
                </Text>
              )}
            </Section>

            <Section className="px-8 pt-6">
              <Heading as="h1" className="m-0 text-2xl font-semibold leading-tight text-zinc-900">
                Il tuo pagamento non è andato a buon fine
              </Heading>
              <Text className="mt-3 text-[15px] leading-6 text-zinc-600">
                Ciao {customerName}, abbiamo provato ad addebitare il rinnovo del tuo abbonamento ma il
                pagamento è stato rifiutato. Aggiorna il metodo di pagamento per non perdere l&apos;accesso.
              </Text>
            </Section>

            <Section className="px-8">
              <Section className="rounded-xl border border-solid border-zinc-200 bg-zinc-50 px-5 py-4">
                <Text className="m-0 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Riepilogo
                </Text>
                <Text className="m-0 mt-2 text-[15px] text-zinc-700">{planName}</Text>
                <Text className="m-0 mt-1 text-3xl font-semibold text-zinc-900">{amountFormatted}</Text>
                {failureReason ? (
                  <Text className="m-0 mt-3 text-[13px] leading-5 text-rose-600">
                    Motivo del rifiuto: {failureReason}
                  </Text>
                ) : null}
              </Section>
            </Section>

            <Section className="px-8 py-8 text-center">
              <Button
                href={recoveryLink}
                className="box-border block w-full rounded-xl px-6 py-4 text-center text-base font-semibold no-underline"
                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
              >
                Aggiorna Carta in 1-Click
              </Button>
              <Text className="m-0 mt-3 text-xs text-zinc-500">
                Link sicuro e personale · nessun accesso o password richiesti
              </Text>
            </Section>

            {nextAttemptLabel ? (
              <Section className="px-8">
                <Text className="m-0 text-[13px] leading-5 text-zinc-500">
                  Riproveremo automaticamente l&apos;addebito {nextAttemptLabel}. Aggiornando ora la carta
                  eviti ulteriori tentativi.
                </Text>
              </Section>
            ) : null}

            <Hr className="mx-8 my-6 border-zinc-200" />

            <Section className="px-8 pb-8">
              <Text className="m-0 text-xs leading-5 text-zinc-400">
                Hai ricevuto questa email perché hai un abbonamento attivo con {companyName}.
                {supportEmail ? ` Per assistenza scrivi a ${supportEmail}.` : ""}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default RecoveryEmail;
