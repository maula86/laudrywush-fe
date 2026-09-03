import { defineConfig } from "nitro/config";

export default defineConfig({
  /**
   * Split SSR chunks form a circular helper import with this beta Nitro stack
   * (`__exportAll is not a function`). A single server graph avoids that cycle
   * and yields a compact Node artifact for the VPS.
   */
  inlineDynamicImports: true,
  /**
   * Keep browser API calls same-origin in production and forward them to the
   * Bun backend running on the same VPS.
   */
  routeRules: {
    "/api/**": { proxy: "http://127.0.0.1:3001/api/**" },
  },
});
