import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DunningChannelTabs } from "@/components/dashboard/dunning-channel-tabs";
import { getDunningTemplates } from "@/lib/dunning-templates";
import { getDunningSettings } from "@/lib/dunning-settings";

export default async function DunningPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [templates, channelSettings] = await Promise.all([
    getDunningTemplates(session.user.id),
    getDunningSettings(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Sequenze Dunning
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Automazione dei solleciti dopo un pagamento fallito, su Email, SMS e
          WhatsApp: attiva o disattiva ogni passaggio e personalizza il
          modello di ciascun messaggio.
        </p>
      </div>

      <DunningChannelTabs
        initialTemplatesSettings={templates}
        initialChannelEmailEnabled={channelSettings.channels.email}
      />
    </div>
  );
}
