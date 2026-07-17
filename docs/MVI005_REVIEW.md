# MVI005_REVIEW.md

> **MVI-005** — Internal Review · Document Import Foundation  
> Repository: `D:\ORC\ORC-Stone-01`  
> As of: 2026-07-17

---

## Scope reviewed

Document Import (MVI-001) · Unit tests (MVI-002) · Integration tests (MVI-003) · Evidence `DocumentImported` (MVI-004)

---

## Folder structure

| Path | Verdict |
|---|---|
| `apps/api/src/modules/document-import/` (controller, service, dto, entity, repository, validation, storage) | **OK** |
| `apps/api/src/modules/evidence/` | **OK** |
| `apps/web/src/features/document-import/` (page, upload, progress, list, api) | **OK** |
| `packages/shared` document + evidence types | **OK** |

---

## Coding standard

- TypeScript strict across workspaces
- Nest module boundaries with repository injection tokens
- Shared constants (`MAX_DOCUMENT_SIZE_BYTES`, allowed extensions) owned by `@orc/shared`
- No OCR/AI/parser/extraction/transformation/auth code present

---

## Dependencies

| Layer | Stack |
|---|---|
| API | NestJS, TypeORM + `pg` (postgres mode), multer, local filesystem |
| Web | Next.js App Router feature module |
| Metadata | PostgreSQL when `DATABASE_URL` / `METADATA_STORE=postgres`; memory fallback for local run without DB credentials |
| Storage | `STORAGE_ROOT` / `storage/uploads/documents` |

---

## Error handling

- Validation → `400 Bad Request` (extension, empty, size, MIME mismatch)
- Multer limit → `413 Payload Too Large`
- Missing document → `404 Not Found`
- Metadata save failure rolls back stored file

---

## API consistency

| Method | Path | Behavior |
|---|---|---|
| POST | `/documents` | multipart `file` · returns metadata + UUID |
| GET | `/documents` | list |
| GET | `/documents/{id}` | read |
| DELETE | `/documents/{id}` | delete metadata + original |

Header `x-uploader-session` captured into Evidence (defaults to `anonymous-session`).

---

## Frontend consistency

- `/documents` page uses shared types and API base `NEXT_PUBLIC_API_BASE_URL`
- Upload + progress + list + delete aligned to API
- Client-side 50 MB pre-check mirrors server rules

---

## Duplication

- Extension/size rules centralized in `@orc/shared` + API validation
- Evidence recording only in `EvidenceService` (called once on successful import)
- No duplicated import pipelines

---

## Residual notes

1. PostgreSQL is implemented (TypeORM entities/repos) but local default is `METADATA_STORE=memory` until `DATABASE_URL` credentials are configured on this host.
2. No authentication/authorization by design (MVI scope).

---

*MVI-005 Review. Stop.*
