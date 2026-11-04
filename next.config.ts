import type { NextConfig } from "next";

// Header di sicurezza applicati a ogni risposta. Nessuna CSP restrittiva su
// script/frame/connect (romperebbe Stripe.js, PayPal SDK e gli iframe 3DS):
// la CSP qui sotto limita solo chi può incorniciare le nostre pagine
// (clickjacking su dashboard e portale /pay) e chiude <base>/<object>.
// 'self' (e non 'none') perché l'anteprima email usa un iframe srcDoc interno.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Il token del portale è nel path: nessun Referer verso risorse terze
      // (logo del merchant, Stripe, PayPal) che lo esporrebbe nei loro log.
      {
        source: "/pay/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
