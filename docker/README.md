# Docker notes for Stone-01 bootstrap
#
# From repo root:
#   docker compose -f docker/docker-compose.yml --env-file .env.example up --build
#
# Services: postgres, api (NestJS health), web (Next.js shell)
# Local file storage mounted at ./storage -> /data/storage
#
# Architecture SoT remains in ORC-Knowledge — this repo is implementation only.
