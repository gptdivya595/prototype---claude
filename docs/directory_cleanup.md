# Directory Cleanup

This repo is organized by ownership:

```text
backend/       Runtime backend code only.
frontend/      Runtime frontend code only.
docs/          Architecture, deployment, API contracts, screens, screenshots, research assets.
design/        Product and visual design documents.
phases/        Phase implementation plans.
scripts/       Local automation and smoke-test helpers.
```

Moved paths:

| Old Path | New Path |
|---|---|
| `server/` | `backend/` |
| `src/` | `frontend/src/` |
| `index.html` | `frontend/index.html` |
| `ARCHITECTURE.md` | `docs/architecture.md` |
| `DEPLOYMENT.md` | `docs/deployment.md` |
| `microservice/` | `docs/microservices/` |
| `screens/` | `docs/screens/` |
| `research_assets/` | `docs/research_assets/` |
| `screenshots/` | `docs/screenshots/` |
| `phase_*.md` | `phases/phase_*.md` |
| `design/product.md` | `design/prototype.md` |

Build and test commands are updated to use the new frontend/backend paths.

Deployment alignment:

```text
vercel.json stays at repo root and serves root-level dist/.
render.yaml stays at repo root and starts backend/index.ts through npm run start:server.
```
