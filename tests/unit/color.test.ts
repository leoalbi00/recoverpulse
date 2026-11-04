import { describe, expect, it } from "vitest";

import { getReadableTextColor } from "@/lib/color";

describe("getReadableTextColor", () => {
  it("usa testo nero su colori chiari e bianco su colori scuri", () => {
    expect(getReadableTextColor("#ffffff")).toBe("#000000");
    expect(getReadableTextColor("#000000")).toBe("#ffffff");
    expect(getReadableTextColor("#facc15")).toBe("#000000"); // giallo
    expect(getReadableTextColor("#1e3a8a")).toBe("#ffffff"); // blu scuro
    expect(getReadableTextColor("#059669")).toBe("#ffffff"); // emerald-600
  });

  it("accetta maiuscole e assenza del #", () => {
    expect(getReadableTextColor("FFFFFF")).toBe("#000000");
    expect(getReadableTextColor("#0A0A0A")).toBe("#ffffff");
  });

  it("applica la soglia YIQ 150 (>= 150 -> nero)", () => {
    // grigio 150: yiq = 150 -> nero; grigio 149 -> bianco
    expect(getReadableTextColor("#969696")).toBe("#000000");
    expect(getReadableTextColor("#959595")).toBe("#ffffff");
  });

  it("ricade su nero per input non validi (shorthand, vuoto, garbage)", () => {
    for (const bad of ["", "#fff", "#12345", "#1234567", "red", "#gggggg", "javascript:alert(1)"]) {
      expect(getReadableTextColor(bad)).toBe("#000000");
    }
  });
});
