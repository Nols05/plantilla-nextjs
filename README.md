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

### Paso 0 (una sola vez): publicar esta plantilla en GitHub

Ya tienes un repo git local con un commit inicial (`git log` para
comprobarlo). Súbelo y márcalo como _template repository_ para poder usar
"Use this template" en cada proyecto nuevo. Dos formas, según tengas o no
[GitHub CLI](https://cli.github.com) instalado:

**Sin GitHub CLI (solo `git`, funciona siempre):**

1. Crea un repo vacío en <https://github.com/new> (sin README ni
   `.gitignore` — ya los tenemos) llamado, por ejemplo, `plantilla-nextjs`.
2. Conéctalo y súbelo:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/plantilla-nextjs.git
   git push -u origin main
   ```
3. En GitHub: **Settings → General → Template repository** → marca la casilla.

**Con GitHub CLI** (instálalo antes con `winget install --id GitHub.cli -e`
y autentícate con `gh auth login`):

```bash
gh repo create plantilla-nextjs --private --source=. --push
gh api repos/{owner}/{repo} -X PATCH -f is_template=true
```

### Por cada proyecto nuevo

1. Copia la plantilla:
   - **Con template marcado en GitHub:** botón "Use this template" en la
     página del repo → nombre del repo nuevo → `git clone` del repo creado.
   - **Con GitHub CLI:**
     `gh repo create mi-proyecto --template <tu-usuario>/plantilla-nextjs --private --clone`.
   - **Sin GitHub:** copia la carpeta a mano y borra `.git` (`rm -rf .git && git init`).
2. Renombra el placeholder: `pnpm run rename-project -- "Mi Proyecto"`.
3. Rellena [PRODUCT.md](./PRODUCT.md) con el problema, los usuarios y el
   flujo core de este proyecto en concreto.
4. `pnpm install`, copia `.env.example` → `.env` con tus credenciales reales,
   `pnpm prisma generate`.
5. Abre el repo con tu agente de IA (Claude Code) y pídele que construya,
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
