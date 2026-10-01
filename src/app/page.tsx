import type { Organization, SoftwareApplication, WithContext } from "schema-dts";

import { auth } from "@/auth";
import { Navbar } from "@/components/landing/navbar";
import { HeroScroll } from "@/components/landing/hero-scroll";
import { SimulationSection } from "@/components/landing/simulation-section";
import { MagicLinkPhoneMockup } from "@/components/landing/magic-link-phone-mockup";
import { Features } from "@/components/landing/features";
import { DemoVideo } from "@/components/landing/demo-video";
import { RoiCalculator } from "@/components/landing/roi-calculator";
import { Pricing } from "@/components/landing/pricing";
import { RoadmapBadge } from "@/components/landing/roadmap-badge";
import { Footer } from "@/components/landing/footer";
import { getAppBaseUrl } from "@/lib/app-url";
import { PLANS } from "@/lib/plans";

function buildStructuredData(baseUrl: string): [WithContext<SoftwareApplication>, WithContext<Organization>] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "OmniRev",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: baseUrl,
      description:
        "Smart dunning e recupero automatico dei pagamenti falliti per SaaS e abbonamenti: riaddebiti intelligenti, solleciti brandizzati e aggiornamento carta in 1 click.",
      offers: PLANS.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: (plan.priceInCents / 100).toFixed(2),
        priceCurrency: "USD",
        category: "subscription",
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "OmniRev",
      url: baseUrl,
      logo: `${baseUrl}/icon`,
    },
  ];
}

export default async function Home() {
  const session = await auth();
  const structuredData = buildStructuredData(getAppBaseUrl());

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100 font-sans">
      <script
        type="application/ld+json"
        // JSON statico generato dal server: "<" escapato per non chiudere il tag script.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Navbar user={session?.user} />
      <main className="flex-1">
        <HeroScroll />
        <SimulationSection />
        <MagicLinkPhoneMockup />
        <Features />
        <DemoVideo />
        <RoiCalculator />
        <Pricing />
        <RoadmapBadge />
      </main>
      <Footer />
    </div>
  );
}
