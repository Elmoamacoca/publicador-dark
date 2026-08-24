# Publicador Dark

Ferramenta 2 do sistema de paginas dark: agenda publicacoes no Instagram em volume,
em varias contas, e monitora essas contas num painel.

Publica pela **API oficial da Meta**. Nao simula clique em navegador, que e a
categoria que toma banimento duro.

## Onde as coisas rodam (migracao em curso, ago/2026)

| Peca | Onde | Estado |
| --- | --- | --- |
| Painel atual | `painel/` deste repositorio, rodando na VPS postador.borusa.com.br | em migracao |
| Motor de publicacao (legado) | GitHub Actions, a cada 5 minutos | ativo ate a esteira da VPS assumir |
| Vigia das contas (legado) | GitHub Actions, de hora em hora | ativo ate a esteira da VPS assumir |
| Painel antigo | `legado/painel-antigo.html` (era servido pelo GitHub Pages) | aposentado |
| Remendo Borusa do Postiz | `postiz-borusa/` (patch + logos + traducao pt-BR) | copia de seguranca |

Este repositorio e REPOSITORIO E DEPLOY, nao runtime: o destino e todo o
funcionamento rodar na VPS, e o GitHub guardar versoes e disparar a subida.

## O painel (`painel/`)

- `servidor.py`: servidor HTTP do painel (rotas de dados + arquivos estaticos).
- `midia.py`: fontes de video (Google Drive por API ou pasta de disco) + livro-caixa SQLite.
- `index.html`: a interface completa.
- Estado que NAO entra no git (fica na maquina que roda): `painel/dados/` (livro.db,
  config.json), `painel/analytics.json`, `painel/midia/` (capas e videos baixados).
- Dependencia Python: `painel/requirements.txt`.

## Motor legado (`publicador/` + `dados/` + `midia/`)

Pipeline do GitHub Actions que publica o que venceu em `dados/agenda.json` usando os
tokens guardados nos Secrets do Actions (IG_TOKEN_CONTA1..3). Os videos de `midia/`
sao servidos a Meta pelo endereco raw do GitHub, por isso o repositorio e publico.
Quando a esteira da VPS assumir, este pipeline sera desligado e o repositorio pode
virar privado.
