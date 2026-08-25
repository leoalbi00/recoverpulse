/**
 * Sceglie nero o bianco come colore di testo leggibile sopra un colore di
 * brand arbitrario scelto dal merchant (formula YIQ per la luminanza percepita).
 * Usata sia lato server (template email) sia lato client (CTA del portale /pay).
 */
export function getReadableTextColor(hex: string): "#000000" | "#ffffff" {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return "#000000";

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 150 ? "#000000" : "#ffffff";
}
