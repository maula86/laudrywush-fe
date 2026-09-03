// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      /**
       * Keep browser API calls same-origin in local development. The frontend
       * talks to `/api/*` on its own Vite origin (including :8082), while Vite
       * forwards those calls to the Bun API; no browser CORS preflight is needed.
       */
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  },
  /**
   * Lovable's wrapper defaults Nitro to Cloudflare. Pin a Node preset here so
   * production builds create a VPS-runnable server artifact instead. Extended
   * Nitro options live in `nitro.config.ts`, whose types cover the full API.
   */
  nitro: {
    preset: "node-server",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
