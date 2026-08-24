# Arquitetura do painel

A regra que motivou tudo: **mexer numa aba nao pode quebrar outra**. O painel era um
arquivo unico de 7.782 linhas onde todas as abas dividiam o mesmo espaco; uma classe
repetida ja esmagou os numeros do Painel uma vez. Agora cada aba mora no seu arquivo.

## O mapa

```
painel/
  index.html          o esqueleto: marcacao das telas, menu, simbolos svg
  estilo/  01..12     o estilo, um arquivo por area, carregado em ORDEM NUMERICA
  codigo/  01..06     o codigo, um arquivo por area, carregado em ORDEM NUMERICA
  servidor.py         servidor http: rotas de dados + arquivos estaticos + login
  midia.py            fontes de video (Drive/pasta) + livro-caixa SQLite
  dados/              estado local (livro.db, config.json)  [fora do git]
  analytics.json      numeros do Instagram, gerados fora     [fora do git]
  midia/              capas e videos baixados                [fora do git]
```

## As leis

1. **A ordem numerica e lei.** Os arquivos de estilo e de codigo se concatenam na
   ordem dos numeros e reproduzem exatamente o arquivo original. Arquivo novo entra
   no fim ou ganha o numero do lugar certo, nunca "em qualquer ordem".
2. **Um assunto, um arquivo.** Aba Painel = `estilo/10` + `codigo/05`. Analytics =
   `estilo/04` + `codigo/02` (+ trocador em `03`). Programar = `estilo/11` e `12` +
   `codigo/06`. O que e compartilhado (design system, menu, componentes, filtros)
   mora nos arquivos de base e SO se mexe nele sabendo que todas as abas usam.
3. **Nada sobe sem passar no portao.** `python provas/prova.py` sobe o servidor,
   bate em todas as rotas, abre cada aba num navegador de verdade, exige console
   limpo e tira um print por aba. Reprovou, nao sobe.
4. **A tela fala com o servidor so pelas rotas do CONTRATOS.md.** Mudou uma rota,
   mudou o contrato: atualiza o documento no mesmo commit.

## Quem carrega quem

- `codigo/01-nucleo.js`: tema, menu, troca de pagina, ajuda. Nao depende de ninguem.
- `codigo/02-analytics.js`: o motor de graficos (`window.montarGrafico`) e a tela de
  perfil. O Painel REUSA esse motor, por isso o 02 vem antes do 05.
- `codigo/05-painel.js`: a home. Le `painel/rede`, desenha com o motor do 02.
- `codigo/06-programar.js`: o modo foco e os rascunhos.
