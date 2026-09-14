import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OmniRev",
    short_name: "OmniRev",
    description:
      "OmniRev trasforma i dati del tuo corpo in un punteggio di recupero chiaro e in un piano d'azione quotidiano per atleti e appassionati di performance.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
