# AGENTS.md

Convenciones de este proyecto para cualquier agente de IA (Claude Code, Cursor,
Copilot, Gemini...) o humano que vaya a escribir código aquí. Es la fuente de
verdad tool-agnostic; `CLAUDE.md` solo apunta aquí para evitar duplicar reglas.

> Antes de pedirle a un agente que "construya el proyecto", rellena
> [`PRODUCT.md`](./PRODUCT.md) con el problema, los usuarios y el flujo core.
> Este archivo (`AGENTS.md`) explica **cómo** construir; `PRODUCT.md` explica
> **qué** construir.

## Stack

Next.js 16 (App Router), React 19, TypeScript 7, Prisma 7 (Postgres),
TanStack Query 5, Tailwind 4, UI con [coss](https://coss.build)/shadcn.
Gestor de paquetes: **pnpm** (no uses npm/yarn, el lockfile es `pnpm-lock.yaml`).

## Estructura del proyecto

- `app/` — rutas, layouts, API routes.
- `lib/core/` — infraestructura transversal: `db.ts` (singleton de Prisma),
  `react-query.ts` (`getQueryClient`, patrón SSR), `utils.ts` (`cn` desde `cnfast`).
- `lib/features/<feature>/` — lógica colocada por feature (`types.ts`,
  `queries.ts`, `hooks.ts`). Es el patrón por defecto para código nuevo.
- `prisma/schema/` — un archivo `.prisma` por dominio (no un `schema.prisma`
  único). `main.prisma` solo tiene el bloque `generator`/`datasource`.
- `components/ui/` — componentes shadcn/coss generados. No los edites a mano
  salvo necesidad real; añade nuevos con `pnpm dlx shadcn add <componente>`.

Referencia viva del patrón completo: modelo `Task` en
[`prisma/schema/tasks.prisma`](./prisma/schema/tasks.prisma) +
[`app/api/tasks/route.ts`](./app/api/tasks/route.ts) +
[`lib/features/tasks/`](./lib/features/tasks/) +
[`app/tasks/page.tsx`](./app/tasks/page.tsx).

## Reglas críticas

- **Next.js 16 async APIs:** siempre `await` `cookies()`, `headers()`,
  `draftMode()`, `props.params` y `props.searchParams`.
- **Estado y datos:** evita `useEffect` salvo para sincronizar con sistemas
  externos de verdad (revisa ["You Might Not Need an Effect"](https://react.dev/learn/you-might-not-need-an-effect)
  antes de escribir uno). Usa TanStack Query para todo fetching/caching, no
  `useState` + `useEffect` a mano.
- **SSR + TanStack Query:** para páginas que necesitan datos al cargar, sigue
  el patrón de `app/tasks/page.tsx` — `getQueryClient()` +
  `prefetchQuery` + `<HydrationBoundary>`, con el mismo `queryKey` que el hook
  cliente usa. Ver la [guía oficial de SSR avanzado](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
- **UI:** usa solo componentes coss/shadcn (`components/ui`), nunca Radix
  directamente. Prefiere `gap` con flex/grid antes que `space-y`/`space-x`.
- **Clases condicionales:** usa `cn` de `@/lib/core/utils` (re-exporta
  `cnfast`), no concatenación manual ni `clsx` directo.
- **TypeScript:** evita `enum` (usa const maps / union types). Prefiere
  `function` declarativa en vez de `const fn = () =>` para funciones de nivel
  superior. Importa siempre con el alias `@/*`.
- **Prisma:** nunca instancies `PrismaClient` fuera de `lib/core/db.ts` —
  importa el singleton `prisma` desde ahí. Tipos del cliente generado en
  `@/generated/prisma/client`. Añade modelos nuevos como archivo propio en
  `prisma/schema/<dominio>.prisma`, nunca amontonados en `main.prisma`.
- **Validación:** valida el body de cualquier API route con `zod` (ver
  `app/api/tasks/route.ts`).

## Cómo añadir una feature nueva

1. Modelo(s) en `prisma/schema/<feature>.prisma` → `pnpm prisma generate`.
2. `app/api/<feature>/route.ts` (valida input con `zod`).
3. `lib/features/<feature>/{types,queries,hooks}.ts`.
4. `app/<feature>/page.tsx` (Server Component: prefetch + `HydrationBoundary`).
5. `app/<feature>/<feature>-client.tsx` (Client Component con los hooks).

## Cómo crecer `lib/` más allá de `core` + `features`

`lib/features/<feature>` es el punto de partida para todo. Si un proyecto
crece lo suficiente, divide **solo cuando aparezca la necesidad real** (no antes):

- `lib/domain/` — reglas de negocio puras, sin I/O.
- `lib/services/` — capa de acceso a BD/colas/email/etc.
- `lib/integrations/` — clientes de APIs de terceros.
- `lib/shared/` — helpers cross-feature (parsers de query params, etc.).
- `lib/api/` — helpers compartidos de API routes (guards de auth, forma de respuesta).

No crees estas carpetas vacías de antemano — añádelas la primera vez que
haga falta, igual que ha ido evolucionando la estructura en el proyecto de
producción del que sale esta plantilla.

## Testing y calidad

- `pnpm test` — corre `scripts/run-tests.mjs` (`node --test` + `tsx`, sin
  framework adicional; recoge cualquier `*.test.ts` bajo `app/` o `lib/`).
- `pnpm run lint` — ESLint (con `simple-import-sort` y `unused-imports`).
- `pnpm run typecheck` — `tsc --noEmit`.
- `pnpm run format` — Prettier (con `prettier-plugin-tailwindcss`, ordena
  clases de Tailwind automáticamente).
- `pnpm run knip` — detecta código/dependencias muertas.

El guardado automático (`formatOnSave`) está desactivado a propósito
(`.vscode/settings.json`) — corre `pnpm run format`/`pnpm run lint` de forma
explícita.

> **Nota conocida:** con TypeScript 7, `pnpm run lint` falla ahora mismo con
> `typescript-eslint does not support TS 7.0` — es una limitación de
> `typescript-eslint` (no de esta plantilla ni de tu código), ya trackeada en
> [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940).
> Por eso el CI no incluye un paso de lint todavía. `pnpm run format` y
> `pnpm run typecheck` sí funcionan con normalidad; vuelve a activar el paso
> de lint en CI en cuanto se publique la versión compatible.
