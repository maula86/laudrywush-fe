import { defineConfig } from "nitro/config";

/**
 * Where the production server forwards `/api/*`.
 *
 * On a single VPS the API sits on localhost. On Railway the API is its own
 * service, reached over the private network at `<service>.railway.internal`.
 * Baked in at build time because Nitro resolves `routeRules` during the build,
 * so this must be passed as a Docker build argument, not a runtime variable.
 */
const apiProxyTarget = process.env["API_PROXY_TARGET"]?.trim() || "http://127.0.0.1:3001";

export default defineConfig({
  /**
   * Split SSR chunks form a circular helper import with this beta Nitro stack
   * (`__exportAll is not a function`). A single server graph avoids that cycle
   * and yields a compact Node artifact.
   */
  inlineDynamicImports: true,
  /**
   * Keep browser API calls same-origin: the frontend calls `/api/*` on its own
   * origin and the server proxies to the backend.
   */
  routeRules: {
    "/api/**": { proxy: `${apiProxyTarget}/api/**` },
  },
});
