// Identità visiva OmniRev: un'unica fonte per la geometria del marchio,
// condivisa da componente React (src/components/ui/logo.tsx), favicon/app
// icon (src/app/icon.tsx, src/app/apple-icon.tsx), email (src/lib/email.ts)
// e asset statici (public/brand/, rigenerabili con scripts/generate-brand-assets.mjs).
//
// Concept "Orbit": la "O" di Omni è un'orbita quasi chiusa (il ciclo
// continuo del cash flow, monitorato senza interruzioni); il nucleo al
// centro è il fatturato protetto; il nodo che chiude l'orbita è l'agente AI
// autonomo che recupera il pagamento mancante e "chiude il cerchio".
// "Rev" richiama sia revenue sia revolution: il nodo, al passaggio del
// mouse, compie un giro completo dell'orbita.
//
// Coordinate in un viewBox 32×32, centro (16, 16).

export const BRAND_VIEWBOX = "0 0 32 32";

/** Orbita: arco di raggio 11.5 da −17° a 287°, il varco in alto a destra ospita il nodo. */
export const BRAND_ORBIT_PATH = "M27 12.64A11.5 11.5 0 1 1 19.36 5";
export const BRAND_ORBIT_STROKE_WIDTH = 3.4;

/** Nucleo: il fatturato protetto. */
export const BRAND_CORE = { cx: 16, cy: 16, r: 4 } as const;

/** Nodo AI, posizionato nel varco dell'orbita (−45°). */
export const BRAND_NODE = { cx: 24.13, cy: 7.87, r: 3 } as const;

/**
 * Gradiente "Emerald → Cyan → Indigo": smeraldo per il denaro recuperato
 * (colore primario dell'app), ciano per l'automazione, indaco per l'AI.
 * Diagonale dal basso a sinistra verso l'alto a destra, in coordinate del
 * viewBox (gradientUnits="userSpaceOnUse").
 */
export const BRAND_GRADIENT = {
  x1: 4,
  y1: 28,
  x2: 28,
  y2: 4,
  stops: [
    { offset: 0, color: "#10B981" },
    { offset: 0.55, color: "#22D3EE" },
    { offset: 1, color: "#818CF8" },
  ],
} as const;

/** Colore del nodo AI su sfondo scuro / chiaro (contrasto ≥ 3:1 su entrambi). */
export const BRAND_NODE_COLOR = { dark: "#A5F3FC", light: "#0891B2" } as const;

/** Sfondo del contenitore "app icon" (favicon, apple-touch-icon, email). */
export const BRAND_SURFACE = "#09090B";

/**
 * SVG standalone del marchio, per contesti fuori da React (script di
 * generazione asset, email). `background` aggiunge il contenitore
 * arrotondato da app icon; `nodeColor` di default è quello per sfondo scuro.
 */
export function buildBrandMarkSvg({
  size,
  background,
  nodeColor = BRAND_NODE_COLOR.dark,
  monochrome,
  markScale = 0.72,
}: {
  size: number;
  background?: string;
  nodeColor?: string;
  /** Colore unico al posto del gradiente (es. marchio su sfondo colorato del merchant). */
  monochrome?: string;
  /** Con `background`: frazione del lato occupata dal marchio (0.72 = app icon, più alto per favicon minuscole). */
  markScale?: number;
}): string {
  const paint = monochrome ?? "url(#omnirev-brand-gradient)";
  const defs = monochrome
    ? ""
    : `<defs><linearGradient id="omnirev-brand-gradient" x1="${BRAND_GRADIENT.x1}" y1="${BRAND_GRADIENT.y1}" x2="${BRAND_GRADIENT.x2}" y2="${BRAND_GRADIENT.y2}" gradientUnits="userSpaceOnUse">${BRAND_GRADIENT.stops
        .map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`)
        .join("")}</linearGradient></defs>`;
  const mark = `<path d="${BRAND_ORBIT_PATH}" stroke="${paint}" stroke-width="${BRAND_ORBIT_STROKE_WIDTH}" stroke-linecap="round"/><circle cx="${BRAND_CORE.cx}" cy="${BRAND_CORE.cy}" r="${BRAND_CORE.r}" fill="${paint}"/><circle cx="${BRAND_NODE.cx}" cy="${BRAND_NODE.cy}" r="${BRAND_NODE.r}" fill="${monochrome ?? nodeColor}"/>`;
  const body = background
    ? `<rect width="32" height="32" rx="7.5" fill="${background}"/><g transform="translate(${(32 * (1 - markScale)) / 2} ${(32 * (1 - markScale)) / 2}) scale(${markScale})">${mark}</g>`
    : mark;

  return `<svg width="${size}" height="${size}" viewBox="${BRAND_VIEWBOX}" fill="none" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;
}

/** Data URI del marchio, per <img> in ImageResponse (favicon) e anteprime. */
export function brandMarkDataUri(options: Parameters<typeof buildBrandMarkSvg>[0]): string {
  // btoa (non Buffer): disponibile sia in Node sia nel browser, l'SVG è solo ASCII.
  return `data:image/svg+xml;base64,${btoa(buildBrandMarkSvg(options))}`;
}
