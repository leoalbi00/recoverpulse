import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OmniRev — Recupera i pagamenti falliti in automatico",
  description:
    "Smart dunning per SaaS e abbonamenti: OmniRev intercetta ogni pagamento fallito, ritenta l'addebito al momento giusto e invia al cliente un link 1-click per aggiornare la carta.",
  openGraph: {
    title: "OmniRev — Recupera i pagamenti falliti in automatico",
    description:
      "Recupera fino al 40% del fatturato perso per carte scadute e fondi insufficienti, senza inseguire i clienti.",
    type: "website",
    locale: "it_IT",
    siteName: "OmniRev",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`dark scroll-smooth ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">{children}</body>
    </html>
  );
}
