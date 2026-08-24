#!/bin/sh
# Sobe (ou atualiza) o painel na VPS. Roda de dentro de /opt/publicador/app.
set -e
E=/opt/publicador/estado
mkdir -p "$E/dados" "$E/midia"
# bind de arquivo unico: se nao existir ANTES do up, o Docker cria um DIRETORIO no lugar
[ -f "$E/analytics.json" ] || echo '{}' > "$E/analytics.json"
if [ ! -f "$E/dados/acesso.json" ]; then
  echo "ABORTADO: falta $E/dados/acesso.json. Painel exposto nao sobe aberto."
  echo "Crie com: docker compose -f deploy/docker-compose.yml run --rm painel \\"
  echo "          python senha.py gabriel --arquivo /app/dados/senha-tmp.txt"
  exit 1
fi
cd /opt/publicador/app
git pull --ff-only
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d --wait
docker compose -f deploy/docker-compose.yml ps
echo "agora rode o portao de provas a partir do PC:"
echo "  python provas/prova.py --url https://postador.borusa.com.br --usuario ... --senha-arquivo ..."
