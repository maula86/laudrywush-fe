<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history - force pushing, rebasing, amending, or squashing commits
> that are already pushed can desync Lovable history and lose editor state.
>
> Commits pushed to the connected branch sync back to Lovable, so keep every
> change in a working state.
<!-- LOVABLE:END -->

# PROJECT KNOWLEDGE BASE

## OVERVIEW
Frontend app built with Vite, TanStack Start/Router, React 19, TypeScript, Tailwind v4,
and shadcn/ui-style components. The app is optimized for Lovable-generated UI work.

## STRUCTURE
- `src/start.ts` - client entry bootstrap.
- `src/server.ts` - SSR/server entry used by TanStack Start.
- `src/router.tsx` - router composition and route tree wiring.
- `src/routeTree.gen.ts` - generated route tree; do not hand-edit.
- `src/routes/` - file-based pages and layouts.
- `src/routes/dashboard*.tsx` - dashboard shell and section pages.
- `src/routes/tracking*.tsx` - public tracking flow.
- `src/components/ui/` - base UI primitives.
- `src/components/laundry/` - feature-specific UI for laundry workflows.
- `src/hooks/` - shared React hooks.
- `src/lib/` - shared helpers, error handling, and utility modules.
- `src/lib/laundry/` - laundry-domain logic.
- `src/store/` - client-side state for the laundry flow.
- `src/assets/` - static assets imported by the app.
- `public/` - static files served as-is.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Update page copy or layout | `src/routes/*.tsx` | Route files are the main product surface. |
| Change dashboard navigation | `src/routes/dashboard.tsx` and `src/routes/dashboard.*.tsx` | Keep the shell and section pages aligned. |
| Adjust tracking experience | `src/routes/tracking*.tsx` | Public order lookup flow. |
| Edit reusable UI | `src/components/ui/` | Prefer existing primitives before adding new ones. |
| Edit laundry-specific UI | `src/components/laundry/` | Domain components live here. |
| Update shared logic | `src/lib/` and `src/store/` | Keep domain rules out of route components. |
| Change app bootstrap or server behavior | `src/start.ts`, `src/server.ts`, `src/router.tsx` | Core wiring lives here. |
| Change styling tokens or Tailwind input | `src/styles.css`, `components.json` | Tailwind v4 is wired through the Lovable config. |

## CONVENTIONS
- Use the `@/*` path alias from `tsconfig.json` for imports under `src/`.
- Keep route modules small; move reusable logic into `src/lib/`, `src/store/`, or `src/components/`.
- Treat `routeTree.gen.ts` as generated output.
- Prefer the existing ESLint + Prettier setup instead of adding ad hoc formatting rules.
- Keep TanStack Start/Vite config inside `vite.config.ts`; the Lovable wrapper already injects the core plugin chain.
- Follow the existing component library style in `components.json` and the `lucide` icon set.

## ANTI-PATTERNS
- Do not hand-edit `src/routeTree.gen.ts`.
- Do not add Next.js-only patterns such as `server-only`; this project uses TanStack Start.
- Do not duplicate the Lovable/Vite plugin chain in `vite.config.ts`.
- Do not scatter feature logic across route files when it belongs in `src/lib/` or `src/store/`.
- Do not change the published Lovable workflow by rewriting history.

## COMMANDS
```bash
npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run format
```

## NOTES
- `eslint.config.js` ignores `dist/`, `.output/`, and `.vinxi/` build artifacts.
- TypeScript is strict with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and related checks.
- Prettier uses 100-column width, semicolons, double quotes, and trailing commas.
- README says the app should match the screenshot exactly, so avoid unrelated UI churn.
- When changing routes or shared UI, verify the impact in the browser, not only by reading code.
