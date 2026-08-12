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
TanStack Query 5, Tailwind 4, UI con [shadcn/ui](https://ui.shadcn.com),
autenticación con [Better Auth](https://better-auth.com), estado de query
params con [nuqs](https://nuqs.dev). Gestor de paquetes: **pnpm** (no uses
npm/yarn, el lockfile es `pnpm-lock.yaml`).

## Estructura del proyecto

- `app/` — rutas, layouts, API routes.
- `lib/core/` — infraestructura transversal: `db.ts` (singleton de Prisma),
  `react-query.ts` (`getQueryClient`, patrón SSR), `utils.ts` (`cn` desde `cnfast`).
- `lib/features/<feature>/` — lógica colocada por feature (`types.ts`,
  `queries.ts`, `hooks.ts`). Es el patrón por defecto para código nuevo.
- `prisma/schema/` — un archivo `.prisma` por dominio (no un `schema.prisma`
  único). `main.prisma` solo tiene el bloque `generator`/`datasource`.
- `components/ui/` — componentes shadcn/ui generados. No los edites a mano
  salvo necesidad real; añade nuevos con `pnpm dlx shadcn add <componente>`.

Referencia viva del patrón completo (Prisma + TanStack Query SSR + nuqs +
Suspense) en modelo `Task`:
[`prisma/schema/tasks.prisma`](./prisma/schema/tasks.prisma) +
[`app/api/tasks/route.ts`](./app/api/tasks/route.ts) +
[`lib/features/tasks/`](./lib/features/tasks/) +
[`app/tasks/page.tsx`](./app/tasks/page.tsx) +
[`app/tasks/tasks-client.tsx`](./app/tasks/tasks-client.tsx).

## Reglas críticas

- **Next.js 16 async APIs:** siempre `await` `cookies()`, `headers()`,
  `draftMode()`, `props.params` y `props.searchParams`.
- **Estado y datos:** evita `useEffect` (ver sección de rendimiento más abajo).
  Usa TanStack Query para todo fetching/caching, no `useState` + `useEffect` a mano.
- **SSR + TanStack Query:** para páginas que necesitan datos al cargar, sigue
  el patrón de `app/tasks/page.tsx` — `getQueryClient()` +
  `prefetchQuery` + `<HydrationBoundary>`, con el mismo `queryKey` que el hook
  cliente usa. Ver la [guía oficial de SSR avanzado](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
- **UI:** usa solo componentes shadcn/ui (`components/ui`), nunca `radix-ui`
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

## Rendimiento y patrones de React/Next.js

Guía completa (45 reglas con ejemplos, de Vercel Engineering) vendorizada en
[`.agents/skills/vercel-react-best-practices/`](./.agents/skills/vercel-react-best-practices/SKILL.md)
— consúltala antes de escribir fetching de datos, componentes con estado, o
cualquier código sensible a rendimiento. Resumen de lo más importante:

- **Evita `useEffect`** salvo para sincronizar con un sistema externo real
  (DOM, `localStorage`, una suscripción externa). Antes de escribir uno, lee
  ["You Might Not Need an Effect"](https://react.dev/learn/you-might-not-need-an-effect).
  Fetching de datos → TanStack Query, nunca `useState` + `useEffect` a mano.
- **Evita re-renders innecesarios:** `useState(() => calcularCaro())` (lazy
  init) para valores caros de calcular; `setX((prev) => ...)` funcional para
  callbacks estables; deriva estado en el render (`const isEmpty = items.length === 0`)
  en vez de guardarlo en otro `useState` sincronizado a mano; no suscribas un
  componente a estado que solo lees dentro de un callback/evento.
- **Next.js 16 / Server Components:** paraleliza fetches independientes
  (`Promise.all`, no `await` en cadena de cosas que no dependen entre sí),
  usa `React.cache()` para deduplicar dentro del mismo request, streamea
  secciones lentas con `<Suspense>` en vez de bloquear toda la página con un
  `await` al principio del Server Component.
- **Bundle:** `next/dynamic` para componentes pesados que no son above-the-fold;
  importa símbolos directos (`import { Button } from "lib/x"`, no barrels
  `index.ts` que reexportan todo); difiere analytics/scripts de terceros a
  después de la hidratación.
- **TanStack Query:** sigue el patrón de `lib/features/tasks/` — query key
  factory tipada, `staleTime`/`gcTime` explícitos por endpoint, e invalidación
  específica en el `onSuccess` de cada mutación (`invalidateQueries({ queryKey: [...] })`
  con la key concreta, no una invalidación global sin key).

## Parámetros de búsqueda en la URL (nuqs)

Para cualquier estado que deba sobrevivir a un refresh o ser compartible por
URL (filtros, búsqueda, paginación, pestaña activa) usa **nuqs**, no
`useState`. `<NuqsAdapter>` ya envuelve la app en `app/layout.tsx`.

- Define los parsers **una sola vez** por feature, en un archivo
  `search-params.ts` que se importa tanto desde el servidor como desde el
  cliente (ver [`lib/features/tasks/search-params.ts`](./lib/features/tasks/search-params.ts)):
  ```ts
  import { createLoader, parseAsString } from "nuqs/server";

  export const tasksSearchParams = { q: parseAsString.withDefault("") };
  export const loadTasksSearchParams = createLoader(tasksSearchParams);
  ```
- **Server Component** (`page.tsx`): `await loadTasksSearchParams(searchParams)`
  y úsalo para el `prefetchQuery` — el `queryKey` de TanStack Query debe
  incluir el valor (`["tasks", q]`), igual que en `lib/features/tasks/queries.ts`.
- **Client Component**: `useQueryStates(tasksSearchParams)` de `"nuqs"` (no
  `"nuqs/server"`) — mismo objeto de parsers, así servidor y cliente nunca se
  desincronizan.
- Envuelve en `<Suspense>` el Client Component que lee el estado de nuqs
  dentro de un Server Component que ya hizo `await` de los `searchParams`
  (ver `app/tasks/page.tsx`) — es el patrón que documenta la
  [guía server-side de nuqs](https://nuqs.dev/docs/server-side) para no
  bloquear el shell estático de la página.

## Autenticación (Better Auth)

- `lib/core/auth.ts` — instancia servidor (`betterAuth()`), usa el mismo
  singleton `prisma` de `lib/core/db.ts` vía `prismaAdapter`. Nunca crees una
  segunda instancia de `betterAuth()`.
- `lib/core/auth-client.ts` — cliente React (`authClient`, `useSession`,
  `signIn`, `signUp`, `signOut`), para usar en Client Components.
- `app/api/auth/[...all]/route.ts` — handler catch-all, no lo muevas de sitio.
- **Server** (Server Components, Route Handlers, Server Actions): comprueba
  la sesión con
  ```ts
  const session = await auth.api.getSession({ headers: await headers() });
  ```
- **Client**: usa el hook `useSession()` de `@/lib/core/auth-client` (ver
  `app/page.tsx`). Formularios de referencia en `app/sign-in/page.tsx` y
  `app/sign-up/page.tsx`.
- **Proteger rutas**: Next.js 16 renombró `middleware.ts` a `proxy.ts`. Si el
  proyecto necesita rutas protegidas, añade un `proxy.ts` en la raíz que
  llame a `auth.api.getSession` y redirija si no hay sesión — no hay uno en
  la plantilla porque qué proteger depende de cada proyecto.
- **Cambiar el modelo de datos de auth** (añadir campos, proveedores OAuth,
  plugins con sus propias tablas): edita `lib/core/auth.ts` y regenera con
  `pnpm run auth:generate` — **no edites `prisma/schema/auth.prisma` a
  mano**, se sobrescribe. Después `pnpm prisma generate`.
- Variables de entorno requeridas: `BETTER_AUTH_SECRET` (32+ caracteres,
  genera una con `openssl rand -base64 32`) y `BETTER_AUTH_URL`.

## Cómo añadir una feature nueva

1. Modelo(s) en `prisma/schema/<feature>.prisma` → `pnpm prisma generate`.
2. `app/api/<feature>/route.ts` (valida input con `zod`).
3. `lib/features/<feature>/{types,queries,hooks}.ts` — y `search-params.ts`
   si la feature tiene filtros/paginación que deban vivir en la URL.
4. `app/<feature>/page.tsx` (Server Component: parsea `searchParams` con nuqs
   si aplica → prefetch + `HydrationBoundary`).
5. `app/<feature>/<feature>-client.tsx` (Client Component con los hooks,
   envuelto en `<Suspense>` desde `page.tsx` si lee estado de nuqs).

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
