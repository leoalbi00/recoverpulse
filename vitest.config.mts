import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
      // I moduli "server-only" lanciano se importati fuori da un Server Component:
      // nei test unitari li sostituiamo con un modulo vuoto.
      "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Fuso orario fisso: computeNextRetryAt lavora in ora locale.
    env: { TZ: "Europe/Rome" },
  },
});
