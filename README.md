# Plantilla Next.js

Plantilla base para arrancar proyectos: Next.js 16 (App Router), Prisma 7
(Postgres, carpeta `prisma/schema/`), Tailwind 4, TanStack Query 5 (con SSR
avanzado), TypeScript 7 y UI [coss](https://coss.build)/shadcn.

Para las convenciones técnicas (qué patrones seguir, cómo se organiza `lib/`,
cómo añadir una feature) ve a [AGENTS.md](./AGENTS.md). Para el flujo de "usar
esta plantilla en un proyecto nuevo", sigue leyendo.

## Uso rápido

```bash
pnpm install
cp .env.example .env   # y rellena DATABASE_URL con tu Postgres real
pnpm prisma generate
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) y
[http://localhost:3000/tasks](http://localhost:3000/tasks) (ejemplo end-to-end
de Prisma + API route + TanStack Query con prefetch SSR).

## Scripts

| Script                    | Qué hace                                           |
| ------------------------- | -------------------------------------------------- |
| `pnpm dev`                | Servidor de desarrollo (Turbopack)                 |
| `pnpm build`              | Build de producción (standalone)                   |
| `pnpm start`              | Sirve el build de producción                       |
| `pnpm test`               | Tests (`node --test`, sin framework extra)         |
| `pnpm run lint`           | ESLint                                             |
| `pnpm run format`         | Prettier (con orden de clases de Tailwind)         |
| `pnpm run typecheck`      | `tsc --noEmit`                                     |
| `pnpm run knip`           | Detecta código y dependencias muertas              |
| `pnpm prisma:seed`        | Seed de la base de datos (`prisma/seed.ts`)        |
| `pnpm run rename-project` | Sustituye el nombre placeholder por el nombre real |

## Flujo recomendado para un proyecto nuevo

1. **Una vez, sobre esta plantilla:** súbela a GitHub y márcala como _template
   repository_ (Settings → General → Template repository), o simplemente
   déjala como repo normal y clónala con `git clone --depth 1` cuando la
   necesites.
2. **Por proyecto nuevo:**
   - Con GitHub template: botón "Use this template" → nombre del repo nuevo,
     o `gh repo create mi-proyecto --template <tu-usuario>/plantilla-nextjs --private --clone`.
   - Sin GitHub template: copia la carpeta a mano y borra `.git`.
3. Renombra el placeholder: `pnpm run rename-project -- "Mi Proyecto"`.
4. Rellena [PRODUCT.md](./PRODUCT.md) con el problema, los usuarios y el
   flujo core de este proyecto en concreto.
5. `pnpm install`, copia `.env.example` → `.env` con tus credenciales reales,
   `pnpm prisma generate`.
6. Abre el repo con tu agente de IA (Claude Code) y pídele que construya,
   apoyándose en `AGENTS.md` (cómo) + `PRODUCT.md` (qué). Recomendado: pídele
   primero que entre en modo plan para la arquitectura inicial antes de
   generar código.

## Estructura

```
app/                   rutas, layouts, API routes
  api/tasks/route.ts    ejemplo de API route con validación zod
  tasks/                ejemplo de página SSR con prefetch + HydrationBoundary
components/ui/         componentes coss/shadcn (generados, no editar a mano)
lib/core/               infraestructura: db.ts, react-query.ts, utils.ts (cn)
lib/features/tasks/     ejemplo de patrón por-feature (queries + hooks)
prisma/schema/          un archivo .prisma por dominio
prisma/seed.ts          seed de desarrollo
scripts/                scripts de mantenimiento (tests, rename-project)
```

## Despliegue

`Dockerfile` incluido (build standalone de Next.js + Prisma). `.github/workflows/ci.yml`
corre lint, typecheck y tests en cada push/PR — sin paso de deploy, porque eso
depende de la infraestructura de cada proyecto (Vercel, Coolify, VPS, etc.).
