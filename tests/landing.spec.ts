import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { PLANS } from "../src/lib/plans";

// E2E della landing (/). Selettori basati su ruoli/struttura/id di sezione, non sul copy
// marketing (che può cambiare). Nessuna chiamata reale a servizi esterni: /api/pilot-request
// è sempre intercettata con page.route.

const LEGAL_PAGES = ["/privacy", "/cookie", "/termini", "/dpa"] as const;

// Formula del calcolatore ROI (src/lib/roi.ts), ricalcolata qui in modo indipendente
// lavorando in centesimi interi: rischio = 9% MRR, recuperabile = 40% del rischio, anno = 12 mesi.
const ROI_MIN = 1000;
const ROI_MAX = 200000;
const ROI_STEP = 500;
const ROI_DEFAULT = 20000;

function expectedRoi(mrr: number) {
  const atRiskCents = mrr * 9; // mrr*100 * 9/100
  const monthlyCents = (atRiskCents * 40) / 100;
  return {
    atRisk: atRiskCents / 100,
    monthly: monthlyCents / 100,
    yearly: (monthlyCents * 12) / 100,
  };
}

const eur = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

/** Confronto tollerante agli spazi: Intl usa NBSP / NNBSP. */
const norm = (s: string | null) => (s ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/** Attende che React abbia idratato l'elemento (altrimenti input/submit vanno persi o fanno submit nativo). */
async function waitForHydration(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps"));
    },
    selector,
    { timeout: 60_000 }
  );
}

/**
 * Imposta il valore dello slider come farebbe il browser (setter nativo + evento "input"), anche fuori
 * intervallo: locator.fill() rifiuta i valori che l'input range sanifica ("Malformed value").
 */
async function setRangeValue(slider: Locator, value: string) {
  await slider.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function gotoLanding(page: Page) {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  return response!;
}

function roiSection(page: Page) {
  return page.locator("section#roi-calculator");
}

/** Le tre card risultato del calcolatore (rischio, mensile, annuale): il 2° <p> di ogni card è l'importo. */
function roiOutputs(page: Page) {
  const cards = roiSection(page).locator("div.grid > div");
  return {
    cards,
    atRisk: cards.nth(0).locator("p").nth(1),
    monthly: cards.nth(1).locator("p").nth(1),
    yearly: cards.nth(2).locator("p").nth(1),
  };
}

async function expectRoiFor(page: Page, mrr: number) {
  const slider = roiSection(page).getByRole("slider");
  await expect(slider).toHaveValue(String(mrr));
  const exp = expectedRoi(mrr);
  const out = roiOutputs(page);
  await expect.poll(async () => norm(await out.atRisk.textContent())).toBe(norm(eur(exp.atRisk)));
  await expect.poll(async () => norm(await out.monthly.textContent())).toBe(norm(eur(exp.monthly)));
  await expect.poll(async () => norm(await out.yearly.textContent())).toBe(norm(eur(exp.yearly)));
  // MRR mostrato sopra lo slider
  const mrrLabel = roiSection(page).locator("label[for='mrr-input'] + p");
  await expect.poll(async () => norm(await mrrLabel.textContent())).toBe(norm(eur(mrr)));
  // CTA "Recupera X/mese"
  const cta = roiSection(page).getByRole("link").filter({ hasText: "€" });
  await expect(cta).toHaveAttribute("href", "/start-trial");
  await expect.poll(async () => norm(await cta.textContent())).toContain(norm(eur(exp.monthly)));
  // Accessibilità: lo slider annuncia il valore in euro
  await expect(slider).toHaveAttribute("aria-valuetext", eur(mrr));
  // Traccia colorata coerente con la posizione
  const progress = await slider.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--range-progress"));
  expect(parseFloat(progress)).toBeCloseTo(((mrr - ROI_MIN) / (ROI_MAX - ROI_MIN)) * 100, 5);
  await expect(roiSection(page)).not.toContainText(/NaN|Infinity|undefined/);
}

test.describe("Landing — caricamento e SEO", () => {
  test("risponde 200 con title, meta description e lang corretti", async ({ page }) => {
    const response = await gotoLanding(page);
    expect(response.headers()["content-type"]).toContain("text/html");
    await expect(page).toHaveTitle(/OmniRev/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThanOrEqual(70);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);

    await expect(page.locator("html")).toHaveAttribute("lang", "it");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /OmniRev/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "it_IT");

    // JSON-LD valido con un'offerta per piano
    const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(ldJson!);
    expect(Array.isArray(data)).toBe(true);
    const app = data.find((d: { "@type": string }) => d["@type"] === "SoftwareApplication");
    expect(app.offers).toHaveLength(PLANS.length);
  });

  // SEO: Google tronca la meta description oltre ~155-160 caratteri.
  test("meta description entro 160 caratteri", async ({ page }) => {
    await gotoLanding(page);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description!.length).toBeLessThanOrEqual(160);
  });

  test("nessun errore in console né eccezioni non gestite", async ({ page }) => {
    // Regressione: i link stilizzati da bottone usano <a className={buttonVariants(...)}>, non
    // <Button render={<a/>}> di Base UI (console.error nativeButton e type="button" sugli <a>).
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (msg) => {
      // MissingSecret di Auth.js: dipende da .env.local locale senza AUTH_SECRET (configurazione, non codice).
      // Va verificato che AUTH_SECRET sia impostato in produzione (vedi report).
      if (msg.type() === "error" && !msg.text().includes("MissingSecret") && !msg.text().includes("@auth/core"))
        consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("requestfailed", (req) => failedRequests.push(`${req.method()} ${req.url()} ${req.failure()?.errorText}`));
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
    });

    await gotoLanding(page);
    await waitForHydration(page, "#mrr-input");
    // Scorre tutta la pagina per montare/renderizzare ogni sezione
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
    });
    await page.waitForTimeout(500);

    expect(pageErrors, "eccezioni non gestite").toEqual([]);
    expect(failedRequests.filter((r) => !r.includes("/_next/webpack-hmr")), "richieste fallite").toEqual([]);
    expect(consoleErrors, "console.error").toEqual([]);
  });

  test("nessuna eccezione non gestita né richiesta fallita", async ({ page }) => {
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("requestfailed", (req) => failedRequests.push(`${req.method()} ${req.url()} ${req.failure()?.errorText}`));
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
    });
    await gotoLanding(page);
    await waitForHydration(page, "#mrr-input");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    expect(pageErrors).toEqual([]);
    expect(failedRequests.filter((r) => !r.includes("/_next/webpack-hmr"))).toEqual([]);
  });

  test("non contatta Stripe né altri domini esterni al caricamento", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol.startsWith("http")) external.push(req.url());
    });
    await gotoLanding(page);
    await waitForHydration(page, "#mrr-input");
    expect(external).toEqual([]);
  });
});

test.describe("Landing — Hero e navigazione", () => {
  test("H1 e CTA primaria visibili e puntano a /start-trial", async ({ page }) => {
    await gotoLanding(page);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();

    const hero = page.locator("main section").first();
    await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
    const heroLinks = hero.getByRole("link");
    const primary = heroLinks.first();
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute("href", "/start-trial");

    // CTA secondaria verso il calcolatore: l'ancora deve esistere
    const secondary = hero.locator('a[href^="#"]').first();
    const hash = await secondary.getAttribute("href");
    expect(hash).toBe("#roi-calculator");
    await expect(page.locator(hash!)).toHaveCount(1);

    // La pagina /start-trial esiste
    const res = await page.request.get("/start-trial");
    expect(res.status()).toBe(200);
  });

  test("i link ancora della navbar portano a sezioni esistenti", async ({ page, isMobile }) => {
    await gotoLanding(page);
    await waitForHydration(page, "header button, header a");
    const header = page.locator("header");

    // Tutti gli href "#id" della pagina devono avere un target (i "#" vuoti sono placeholder, vedi test footer).
    const hrefs = await page.locator('a[href^="#"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")!).filter((h) => h.length > 1)
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of new Set(hrefs)) {
      await expect(page.locator(`[id="${href.slice(1)}"]`), `target di ${href}`).toHaveCount(1);
    }

    if (isMobile) {
      const toggle = header.getByRole("button", { expanded: false });
      await expect(toggle).toBeVisible();
    }

    const desktopNav = header.locator("nav").first();
    const navCount = isMobile ? 0 : await desktopNav.locator('a[href^="#"]').count();
    const count = isMobile ? 3 : navCount;
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      let link: Locator;
      if (isMobile) {
        await header.getByRole("button", { expanded: false }).click();
        await expect(header.getByRole("button", { expanded: true })).toBeVisible();
        link = header.locator("nav").last().locator('a[href^="#"]').nth(i);
      } else {
        link = desktopNav.locator('a[href^="#"]').nth(i);
      }
      const href = (await link.getAttribute("href"))!;
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      const target = page.locator(href);
      await expect(target).toBeInViewport({ ratio: 0.05 });
      // Il titolo della sezione non deve finire sotto l'header sticky
      const heading = target.getByRole("heading").first();
      const headerBox = await header.boundingBox();
      await expect
        .poll(async () => (await heading.boundingBox())?.y ?? -1, { message: `heading di ${href} sotto l'header` })
        .toBeGreaterThanOrEqual((headerBox?.height ?? 0) - 1);
      if (isMobile) {
        // Il menu si chiude dopo il click
        await expect(header.getByRole("button", { expanded: true })).toHaveCount(0);
      }
    }
  });
});

test.describe("Landing — Prezzi", () => {
  test("mostra tutti i piani con prezzo mensile e toggle annuale (-20%)", async ({ page }) => {
    await gotoLanding(page);
    const pricing = page.locator("section#pricing");
    await expect(pricing).toBeVisible();

    const usd = (v: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", trailingZeroDisplay: "stripIfInteger" } as Intl.NumberFormatOptions).format(v);

    for (const plan of PLANS) {
      const heading = pricing.getByRole("heading", { level: 3, name: plan.name, exact: true });
      await expect(heading).toBeVisible();
      const card = heading.locator("..");
      await expect(card).toContainText(usd(plan.priceInCents / 100));
      for (const feature of plan.features) await expect(card).toContainText(feature);
      // In Beta i piani non sono acquistabili: CTA disabilitata
      await expect(card.getByRole("button")).toBeDisabled();
    }

    await waitForHydration(page, '[role="radiogroup"] button');
    const group = pricing.getByRole("radiogroup");
    const radios = group.getByRole("radio");
    await expect(radios).toHaveCount(2);
    await expect(radios.first()).toHaveAttribute("aria-checked", "true");
    await radios.nth(1).click();
    await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");
    await expect(radios.first()).toHaveAttribute("aria-checked", "false");

    for (const plan of PLANS) {
      const monthlyCents = Math.round(plan.priceInCents * 0.8);
      const card = pricing.getByRole("heading", { level: 3, name: plan.name, exact: true }).locator("..");
      await expect(card).toContainText(usd(monthlyCents / 100));
      await expect(card).toContainText(usd((monthlyCents * 12) / 100));
      await expect(card).not.toContainText(/NaN|Infinity/);
    }
  });
});

test.describe("Landing — Calcolatore ROI", () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
    await roiSection(page).scrollIntoViewIfNeeded();
    await waitForHydration(page, "#mrr-input");
  });

  test("valori di default e struttura dello slider", async ({ page }) => {
    const slider = roiSection(page).getByRole("slider", { name: /MRR/ });
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute("min", String(ROI_MIN));
    await expect(slider).toHaveAttribute("max", String(ROI_MAX));
    await expect(slider).toHaveAttribute("step", String(ROI_STEP));
    await expectRoiFor(page, ROI_DEFAULT);
    await expect(roiOutputs(page).cards).toHaveCount(3);
    // Etichette min/max dell'intervallo
    await expect(roiSection(page)).toContainText(norm(eur(ROI_MIN)).replace(/ /g, " "));
  });

  test("aggiorna i risultati per diversi valori di MRR (fill)", async ({ page }) => {
    const slider = roiSection(page).getByRole("slider");
    for (const mrr of [ROI_MIN, 1500, 10000, 37500, 50000, 99500, 123500, 199500, ROI_MAX]) {
      await slider.fill(String(mrr));
      await expectRoiFor(page, mrr);
    }
  });

  test("tastiera: Home/End/frecce/PageUp rispettano min, max e step", async ({ page }) => {
    const slider = roiSection(page).getByRole("slider");
    await slider.focus();
    await page.keyboard.press("Home");
    await expectRoiFor(page, ROI_MIN);
    await page.keyboard.press("ArrowLeft"); // non scende sotto il minimo
    await expectRoiFor(page, ROI_MIN);
    await page.keyboard.press("ArrowRight");
    await expectRoiFor(page, ROI_MIN + ROI_STEP);
    await page.keyboard.press("End");
    await expectRoiFor(page, ROI_MAX);
    await page.keyboard.press("ArrowRight"); // non supera il massimo
    await expectRoiFor(page, ROI_MAX);
    await page.keyboard.press("ArrowLeft");
    await expectRoiFor(page, ROI_MAX - ROI_STEP);
  });

  test("valori fuori dominio vengono riportati nei limiti, senza NaN/Infinity", async ({ page }) => {
    const slider = roiSection(page).getByRole("slider");
    // L'input range sanifica il valore: 0 / negativi -> min, enormi -> max, fuori step -> step più vicino.
    const cases: Array<[string, number]> = [
      ["0", ROI_MIN],
      ["-5000", ROI_MIN],
      ["999999999", ROI_MAX],
      ["1e21", ROI_MAX],
      ["1234", ROI_MIN],
      ["1300", 1500],
      ["20249", 20000],
      ["abc", 100500], // valore non numerico -> il browser usa il default (punto medio)
      ["", 100500],
      ["NaN", 100500],
      ["Infinity", 100500],
    ];
    for (const [input, expected] of cases) {
      await setRangeValue(slider, input);
      await expectRoiFor(page, expected);
    }
  });

  test("trascinamento col mouse fino agli estremi", async ({ page, isMobile }) => {
    test.skip(isMobile, "drag col mouse solo su desktop");
    const slider = roiSection(page).getByRole("slider");
    const box = (await slider.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 50, y, { steps: 5 });
    await page.mouse.up();
    await expectRoiFor(page, ROI_MAX);
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x - 50, y, { steps: 5 });
    await page.mouse.up();
    await expectRoiFor(page, ROI_MIN);
  });
});

test.describe("Landing — Form integrazione pilota", () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
    await page.locator("#pilot").scrollIntoViewIfNeeded();
    await waitForHydration(page, "#pilot-email");
  });

  function form(page: Page) {
    const root = page.locator("#pilot form");
    return {
      root,
      name: root.locator("#pilot-name"),
      email: root.locator("#pilot-email"),
      company: root.locator("#pilot-company"),
      mrr: root.locator("#pilot-mrr"),
      message: root.locator("#pilot-message"),
      submit: root.locator('button[type="submit"]'),
    };
  }

  async function trackApi(page: Page, handler?: Parameters<Page["route"]>[1]) {
    const calls: { body: unknown }[] = [];
    await page.route("**/api/pilot-request", async (route, request) => {
      calls.push({ body: request.postDataJSON() });
      if (handler) return handler(route, request);
      return route.fulfill({ status: 500, json: { error: "non atteso" } });
    });
    return calls;
  }

  test("gli input hanno label associate", async ({ page }) => {
    const f = form(page);
    for (const id of ["pilot-name", "pilot-email", "pilot-company", "pilot-mrr", "pilot-message"]) {
      await expect(f.root.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(f.email).toHaveAttribute("type", "email");
    await expect(f.name).toHaveAttribute("required", "");
  });

  test("invio vuoto: validazione client, nessuna richiesta all'API", async ({ page }) => {
    const calls = await trackApi(page);
    const f = form(page);
    await f.submit.click();
    expect(await f.name.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    expect(await f.name.evaluate((el: HTMLInputElement) => el.validationMessage)).not.toBe("");
    expect(await f.root.evaluate((el: HTMLFormElement) => el.checkValidity())).toBe(false);
    await page.waitForTimeout(300);
    expect(calls).toHaveLength(0);
    await expect(f.root).toBeVisible();
    expect(page.url()).not.toContain("?"); // nessun submit GET nativo
  });

  test("email non valida: validazione client, nessuna richiesta all'API", async ({ page }) => {
    const calls = await trackApi(page);
    const f = form(page);
    await f.name.fill("Mario Rossi");
    await f.company.fill("Acme Srl");
    for (const bad of ["non-una-email", "mario@", "@acme.it", "mario rossi@acme.it"]) {
      await f.email.fill(bad);
      await f.submit.click();
      expect(await f.email.evaluate((el: HTMLInputElement) => el.validity.valid), bad).toBe(false);
    }
    await page.waitForTimeout(300);
    expect(calls).toHaveLength(0);
  });

  test("invio valido (API mockata): payload corretto e stato di successo", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const calls = await trackApi(page, async (route) => {
      await gate;
      await route.fulfill({ status: 200, json: { ok: true } });
    });
    const f = form(page);
    await f.name.fill("Mario Rossi");
    await f.email.fill("mario@acme.it");
    await f.company.fill("Acme Srl");
    await f.mrr.fill("20.000 €");
    await f.message.fill("Vorremmo testare il dunning via email.");
    await f.submit.click();

    // Stato di caricamento: bottone disabilitato durante la richiesta
    await expect(f.submit).toBeDisabled();
    release();

    await expect(page.locator("#pilot form")).toHaveCount(0);
    await expect(page.locator("#pilot")).toContainText(/inviata|grazie/i);

    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({
      name: "Mario Rossi",
      email: "mario@acme.it",
      company: "Acme Srl",
      estimatedMrr: "20.000 €",
      message: "Vorremmo testare il dunning via email.",
      website: "",
    });
  });

  test("errore dall'API: messaggio visibile e form riutilizzabile", async ({ page }) => {
    await trackApi(page, (route) => route.fulfill({ status: 400, json: { error: "Email aziendale non valida." } }));
    const f = form(page);
    await f.name.fill("Mario Rossi");
    await f.email.fill("mario@acme.it");
    await f.company.fill("Acme Srl");
    await f.submit.click();
    await expect(f.root).toContainText("Email aziendale non valida.");
    await expect(f.submit).toBeEnabled();
    await expect(f.email).toHaveValue("mario@acme.it");
  });

  test("risposta 500 non-JSON: messaggio di fallback in italiano", async ({ page }) => {
    await trackApi(page, (route) => route.fulfill({ status: 500, body: "<html>Internal Server Error</html>" }));
    const f = form(page);
    await f.name.fill("Mario Rossi");
    await f.email.fill("mario@acme.it");
    await f.company.fill("Acme Srl");
    await f.submit.click();
    await expect(f.root).toContainText(/errore durante l'invio/i);
    await expect(f.submit).toBeEnabled();
  });

  // Regressione: su errore di rete il form deve mostrare un messaggio italiano, non "Failed to fetch".
  test("errore di rete: messaggio comprensibile in italiano", async ({ page }) => {
    await trackApi(page, (route) => route.abort("internetdisconnected"));
    const f = form(page);
    await f.name.fill("Mario Rossi");
    await f.email.fill("mario@acme.it");
    await f.company.fill("Acme Srl");
    await f.submit.click();
    await expect(f.submit).toBeEnabled();
    const error = f.root.locator("p.text-rose-600");
    await expect(error).toBeVisible();
    await expect(error).not.toHaveText(/failed to fetch|network|fetch/i, { timeout: 2000 });
  });
});

test.describe("Footer e pagine legali", () => {
  for (const path of LEGAL_PAGES) {
    test(`link ${path} presente nel footer, 200 e con un H1`, async ({ page }) => {
      await gotoLanding(page);
      const footer = page.locator("footer");
      await expect(footer.locator(`a[href="${path}"]`).first()).toBeAttached();

      const res = await page.request.get(path);
      expect(res.status()).toBe(200);

      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const nav = await page.goto(path);
      expect(nav?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(/.+/);
      expect(errors).toEqual([]);
    });
  }

  test("segnala i link placeholder (href=\"#\") nel footer", async ({ page }) => {
    await gotoLanding(page);
    const placeholders = await page
      .locator('footer a[href="#"]')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    // Non blocca la suite: registra i link morti come annotazione nel report.
    test.info().annotations.push({
      type: "placeholder-links",
      description: placeholders.length ? placeholders.join(", ") : "nessuno",
    });
    const socials = await page.locator('footer a[target="_blank"]').evaluateAll((els) =>
      els.map((el) => ({ href: el.getAttribute("href"), rel: el.getAttribute("rel") }))
    );
    for (const s of socials) expect(s.rel ?? "", `rel di ${s.href}`).toContain("noopener");
  });
});

test.describe("Accessibilità di base", () => {
  test("un solo H1, immagini con alt, input con label", async ({ page }) => {
    await gotoLanding(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const imgsWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imgsWithoutAlt).toBe(0);

    const unlabeled = await page.locator("main input, main textarea, main select").evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLInputElement).type !== "hidden")
        .filter((el) => {
          const id = el.getAttribute("id");
          const hasFor = id && document.querySelector(`label[for="${id}"]`);
          return !hasFor && !el.closest("label") && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby");
        })
        .map((el) => el.outerHTML.slice(0, 120))
    );
    expect(unlabeled).toEqual([]);

    // I bottoni senza testo devono avere un nome accessibile
    const unnamedButtons = await page.locator("button, a").evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .filter((el) => !el.textContent?.trim() && !el.getAttribute("aria-label") && !el.querySelector("img[alt]:not([alt=''])"))
        .map((el) => el.outerHTML.slice(0, 120))
    );
    expect(unnamedButtons).toEqual([]);
  });

  // Regressione a11y: il badge "Consigliato" (pricing-plans.tsx) deve restare >= 4.5:1 (bg-emerald-700).
  test("axe: nessuna violazione serious/critical", async ({ page }) => {
    await gotoLanding(page);
    await waitForHydration(page, "#mrr-input");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        sample: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      }));
    test.info().annotations.push({ type: "axe", description: JSON.stringify(serious) });
    expect(serious).toEqual([]);
  });
});
