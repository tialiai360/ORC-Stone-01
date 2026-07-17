# MVP-001 Repository Bootstrap

Stone-01 executable product repository.

| Concern | Location |
|---|---|
| Architecture / Product Spec | `D:\ORC\ORC-Knowledge` (SoT) |
| Implementation | this repo (`ORC-Stone-01`) |

## Stack

- Frontend: Next.js + TypeScript + TailwindCSS (`apps/web`)
- Backend: NestJS + TypeScript (`apps/api`)
- Database: PostgreSQL (Docker Compose)
- Storage: local filesystem (`storage/uploads`)
- Container: Docker + Docker Compose (`docker/`)

## Capabilities

- **Document Import (MVI-001):** PDF/DOCX upload, local original storage, metadata, UUID, Evidence `DocumentImported`
- **Knowledge Extraction (MVP-003):** Deterministic regex/heading extraction → structured result + Evidence `KnowledgeExtracted`
- UI: `/documents`
- API: `POST/GET/DELETE /documents` · `POST/GET /extraction/...`

Excludes (by design): OCR, AI, extraction, transformation, auth.

## Commands

```bash
npm install
npm run lint
npm run test
npm run build

# API (memory metadata if DATABASE_URL unset)
set METADATA_STORE=memory
npm run dev:api

# Web
npm run dev:web
```

Docker (when Docker Desktop available):

```bash
docker compose -f docker/docker-compose.yml --env-file .env.example up --build
```
