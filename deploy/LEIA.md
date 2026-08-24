# Como o painel roda na VPS (postador.borusa.com.br)

## O desenho

GitHub = repositorio e deploy. VPS = runtime. Zero GitHub Actions, zero Cloudflare
no funcionamento (o Cloudflare so hospeda o DNS do dominio).

```
/opt/publicador/
  app/       clone do repositorio (codigo; troca a cada deploy)
  estado/    dados/ (livro.db, config.json, acesso.json, google_drive.json),
             analytics.json, midia/   (NUNCA entra no git; sobrevive ao deploy)
  backups/   livro-AAAA-MM-DD.db + estado-AAAA-MM-DD.tar.gz, 14 dias
```

## Subir uma versao nova

1. No PC: rodar `python provas/prova.py` (portao local) e dar push no main.
2. Na VPS: `sh /opt/publicador/app/deploy/subir.sh`
3. No PC: rodar o portao contra o ar:
   `python provas/prova.py --url https://postador.borusa.com.br --usuario ... --senha-arquivo ...`
   Reprovou? `git revert` + subir.sh de novo: o estado nao e tocado pelo deploy.

## Login

`painel/senha.py` grava `estado/dados/acesso.json` (cozido pbkdf2 + chave de sessao).
Trocar a senha = rodar de novo (mata as sessoes abertas). Sem esse arquivo o painel
nao tranca, entao ele SEMPRE existe na VPS, e o portao de provas reprova se a tranca
nao responder 401.

## Backup

Cron diario (03h17 de Brasilia) roda `deploy/backup.sh`. Restaurar = parar o
compose, trocar os arquivos de `estado/`, subir de novo.

## Acesso a maquina

SSH por chave (login por senha desativado). A chave privada mora no cofre local do
PC do Gabriel (`.claude/secrets/`), a recuperacao de emergencia e o console VNC do
painel da Contabo.
