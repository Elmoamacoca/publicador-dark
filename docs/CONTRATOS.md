# Contratos de rota do painel

O que a tela pede e o que o servidor promete. Mudou aqui, mudou nos dois lados no
mesmo commit. Toda rota devolve JSON `utf-8` sem cache, salvo onde dito.

## Leitura (GET)

| Rota | Promessa |
| --- | --- |
| `/` e arquivos | a pagina e seus estaticos, sempre sem cache |
| `painel/rede` | `{contas:[{arroba,nome,avatar,ligada,fila,erros24h,ultimo,publicando}], resumo:{publicando,paradas,caidas,total,pastas}, serie:[90 dias {dia,publicando,paradas,caidas,contas:{arroba:n}}], semana:[60 dias {dia,publicados,programados,contas}]}` |
| `perfis` | `{perfis:[{u,nome,avatar,ativa,...}]}` do analytics.json |
| `conta?u=` | o bloco daquela conta no analytics.json, 404 se nao ha |
| `posts?u=` | as previas daquela conta |
| `img?sc=` | os bytes jpeg da miniatura (unica rota que nao e json) |
| `calendario/saidas` | `{saidas:[{titulo,conta,quando,estado,sc,fmt}]}` publicado + programado |
| `midia/estado` | `{fonte,pronta,motivo,raiz,raiz_id[,robo]}` |
| `midia/navegar?pasta=&busca=` | `{trilha,pastas:[{id,nome,videos,caminho,ligada}],aqui}` |
| `midia/ligadas` | `{pastas:[{id,nome,...,total,prateleira,programados,publicados,erro}]}` |
| `contas/meta` | `{contas:{arroba:{mercado,etiquetas}}}` |
| `painel/rascunho` | `{rascunhos:[{id,conta,dados,mexido_em}]}` |
| `painel/pulso?dias=` | `{pulso:[{dia,publicando,paradas,caidas}]}` |

## Escrita (POST, corpo json)

| Rota | Corpo | Efeito |
| --- | --- | --- |
| `midia/ligar` | `{pasta,nome,caminho}` | anota os videos da pasta no livro |
| `midia/desligar` | `{pasta}` | tira da prateleira, historico fica |
| `midia/config` | campos da config | grava e devolve a config inteira |
| `contas/meta` | `{arroba,mercado,etiquetas}` | grava so o que veio |
| `painel/rascunho` | `{dados:{escolha...}}` | upsert do rascunho daquela conta |
| `painel/rascunho` | `{apagar:id\|"todos"}` | apaga; e o UNICO jeito de sumir rascunho |
| `painel/pulso` | `{publicando,paradas,caidas}` | o retrato do dia, sobrescreve |

## Acesso

| Rota | Promessa |
| --- | --- |
| `GET /entrar` | a pagina de login (unica rota de tela sem sessao) |
| `POST /entrar` | `{usuario,senha}` -> 200 com cookie `painel_sessao` (30 dias, httponly); 401 errado; 429 apos 5 falhas do mesmo IP por 60s |
| `GET /sair` | 302 pra `/entrar` apagando o cookie |

Com `dados/acesso.json` presente, TODA outra rota exige a sessao: dado sem sessao
leva 401 `{erro}`, tela sem sessao leva 302 pra `/entrar`. `dados/` e arquivos `.py`
NUNCA sao servidos, e listagem de pasta nao existe. Exposto fora de 127.0.0.1 sem
acesso.json, o servidor se recusa a subir.

## Regras transversais

1. Erro vem como `{erro:"motivo escrito"}` com codigo 4xx/5xx; a tela mostra o motivo.
2. Datas viajam como texto iso (`2026-08-24` ou com hora); "hoje" e do fuso do painel
   (`America/Sao_Paulo`), nunca do relogio cru da maquina.
3. Rota nova nasce aqui ANTES de nascer no codigo.
