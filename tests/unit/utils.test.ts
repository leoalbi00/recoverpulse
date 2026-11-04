import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("concatena le classi ignorando i valori falsy", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supporta oggetti e array (clsx)", () => {
    expect(cn({ a: true, b: false }, ["c", ["d"]])).toBe("a c d");
  });

  it("risolve i conflitti tailwind tenendo l'ultima classe", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500");
  });
});
