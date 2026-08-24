#!/bin/sh
# Sobe (ou atualiza) o painel na VPS. Roda de dentro de /opt/publicador/app.
set -e
cd /opt/publicador/app
git pull --ff-only
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d
sleep 3
docker compose -f deploy/docker-compose.yml ps
echo "agora rode o portao de provas a partir do PC:"
echo "  python provas/prova.py --url https://postador.borusa.com.br --usuario ... --senha-arquivo ..."
