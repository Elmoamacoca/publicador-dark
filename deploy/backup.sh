#!/bin/sh
# Backup diario do estado. Entra no cron da VPS (veja deploy/LEIA.md).
# O banco e copiado pelo proprio sqlite (copia integra mesmo com o painel escrevendo).
set -e
d=$(TZ=America/Sao_Paulo date +%F)
mkdir -p /opt/publicador/backups
python3 - <<PY
import sqlite3
a = sqlite3.connect("/opt/publicador/estado/dados/livro.db")
b = sqlite3.connect("/opt/publicador/backups/livro-$d.db")
a.backup(b); b.close(); a.close()
PY
tar -czf "/opt/publicador/backups/estado-$d.tar.gz" \
    -C /opt/publicador/estado dados analytics.json
ls -1t /opt/publicador/backups/livro-*.db 2>/dev/null | tail -n +15 | xargs -r rm
ls -1t /opt/publicador/backups/estado-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm
