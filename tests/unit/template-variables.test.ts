import { describe, expect, it } from "vitest";

import { renderDunningTemplate, type DunningTemplateVariables } from "@/lib/template-variables";

const VARS: DunningTemplateVariables = {
  nome_cliente: "Mario Rossi",
  importo: "49,00 €",
  nome_piano: "Pro",
  nome_azienda: "Acme Srl",
  link_recupero: "https://app.example.com/pay/tok_123",
};

describe("renderDunningTemplate", () => {
  it("sostituisce tutte le variabili note, anche ripetute", () => {
    expect(
      renderDunningTemplate(
        "Ciao {{nome_cliente}}, {{nome_azienda}}: {{importo}} per {{nome_piano}}. {{link_recupero}} ({{nome_cliente}})",
        VARS
      )
    ).toBe(
      "Ciao Mario Rossi, Acme Srl: 49,00 € per Pro. https://app.example.com/pay/tok_123 (Mario Rossi)"
    );
  });

  it("lascia invariati i placeholder sconosciuti (typo visibile)", () => {
    expect(renderDunningTemplate("Ciao {{nome_clinete}}", VARS)).toBe("Ciao {{nome_clinete}}");
  });

  it("non tocca sintassi non riconosciute (spazi, graffe singole/triple)", () => {
    expect(renderDunningTemplate("{{ nome_cliente }} {nome_cliente} {{nome-cliente}}", VARS)).toBe(
      "{{ nome_cliente }} {nome_cliente} {{nome-cliente}}"
    );
    expect(renderDunningTemplate("{{{nome_cliente}}}", VARS)).toBe("{Mario Rossi}");
  });

  it("inserisce i valori letteralmente: niente pattern speciali di String.replace ($&, $1)", () => {
    const vars = { ...VARS, nome_cliente: "$& $1 $$ $`" };
    expect(renderDunningTemplate("Ciao {{nome_cliente}}", vars)).toBe("Ciao $& $1 $$ $`");
  });

  it("non espande ricorsivamente placeholder contenuti nei valori (no template injection)", () => {
    const vars = { ...VARS, nome_cliente: "{{link_recupero}}" };
    expect(renderDunningTemplate("Ciao {{nome_cliente}}", vars)).toBe("Ciao {{link_recupero}}");
  });

  it("NON fa escaping HTML: è un rendering testuale, l'escaping avviene in buildDunningEmailHtml (src/lib/email.ts)", () => {
    // Documenta il contratto: chi usa l'output in HTML deve fare escape (oggi email.ts usa escapeHtml(bodyText)
    // e l'anteprima React lo renderizza come testo).
    const vars = { ...VARS, nome_cliente: '<img src=x onerror="alert(1)">' };
    expect(renderDunningTemplate("{{nome_cliente}}", vars)).toBe('<img src=x onerror="alert(1)">');
  });

  // Le proprietà ereditate da Object.prototype non sono variabili valide.
  it("lascia invariati i nomi di proprietà di Object.prototype ({{constructor}}, {{toString}})", () => {
    expect(renderDunningTemplate("{{constructor}} {{toString}} {{__proto__}}", VARS)).toBe(
      "{{constructor}} {{toString}} {{__proto__}}"
    );
  });
});
