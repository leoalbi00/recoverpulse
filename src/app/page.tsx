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
import { SecuritySection } from "@/components/landing/security-badges";
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
        "Riduci il churn involontario da pagamenti rifiutati su Stripe: riaddebiti intelligenti, solleciti brandizzati e aggiornamento carta in 1 click per SaaS B2B.",
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

  // `light`: scope Light Mode Enterprise (globals.css), solo per la Landing; la dashboard resta scura.
  return (
    <div className="light flex flex-1 flex-col bg-background font-sans text-foreground">
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
        <SecuritySection />
        <Pricing />
        <RoadmapBadge />
      </main>
      <Footer />
    </div>
  );
}
