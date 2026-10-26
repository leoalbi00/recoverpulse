import { describe, expect, it } from "vitest";

import { BETA_HEADLINE, BETA_SUBHEADLINE } from "@/lib/beta";

describe("messaggi Beta", () => {
  it("sono stringhe non vuote che terminano con un punto (vengono concatenate nel copy)", () => {
    for (const text of [BETA_HEADLINE, BETA_SUBHEADLINE]) {
      expect(text.trim()).toBe(text);
      expect(text.length).toBeGreaterThan(0);
      expect(text.endsWith(".")).toBe(true);
    }
  });
});
