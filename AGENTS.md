# publicador-dark (Ferramenta 2, o Postador)

Leia antes de mexer em qualquer coisa.

## O que é

Painel de publicação e agendamento para Instagram, ligado direto à Meta. Cobre vínculo de perfil, agendamento de postagem, mídia vinda do Drive, analytics e ajuda.

A parte bruta (conexão com a Meta, publicação, agendamento) **já está feita**. O trabalho atual é qualidade de tela e confiabilidade.

## Onde roda

- **Produção**: VPS em `postador.borusa.com.br`, código em `/opt/publicador`.
- **Local**: `painel/servidor.py`, útil para desenvolvimento, mas **validação de token e de conexão com a Meta só vale feita na VPS**, onde estão o estado e as credenciais reais.

## Como provar que funciona

```
python provas/prova.py
```

Roda na raiz do repositório. A saída percorre rota por rota e tela por tela, e termina em `PASSA` ou aponta a falha. Prints ficam em `provas/saida/`.

**Nenhuma mudança é considerada pronta sem essa saída colada na resposta.** Se a prova reprovar, corrija e rode de novo.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `painel/` | O painel: `index.html`, `servidor.py`, `estilo/` em blocos numerados |
| `publicador/` | Motor de publicação e integração com a Meta |
| `provas/` | Bateria de provas e saídas |
| `deploy/` | Ida para a VPS |
| `.github/workflows/` | `agendar.yml`, `publicar.yml`, `vigia.yml` |
| `dados/` | Estado local |
| `legado/`, `postiz-borusa/` | Histórico, não é o caminho atual |

## Regras do projeto

1. O painel é **HTML, CSS e JavaScript puros**. Componentes de referência em React são adaptados para essa base, nunca importados.
2. O CSS mora em blocos numerados dentro de `painel/estilo/`. Respeite a numeração.
3. Toda mudança termina em `git commit` e `git push`. Nada fica só local.
4. O terminal desta máquina é PowerShell 5.1: **não use `&&`**, use `;`.
