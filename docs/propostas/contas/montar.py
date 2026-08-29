# -*- coding: utf-8 -*-
"""Monta os dois arquivos gerados das propostas de layout da aba de Contas.

POR QUE ESTE SCRIPT EXISTE. A maquete tem que ser a tela real: mesmo CSS, mesmas
classes, mesmos dados. Copiar estilo na mão para dentro de um HTML de proposta faria
a maquete envelhecer no dia seguinte. Aqui ela se remonta a partir da fonte.

O QUE ELE GERA (todos ficam fora do git, ver .gitignore):
  painel.css        os blocos de estilo do painel, na ordem numerica que e' lei
  sala.css          o botao animado da casa, a sala de controle do Portal e o
                    rodape Stacked Circular, recortados do repo `borusa-iscas`
  dados.js          as contas de verdade, com retrato e capa de painel/analytics.json
  marca-*.png       a marca, copiada de painel/

POR QUE O CSS DA SALA VEM DO PORTAL. Em 29/08 o Gabriel apontou duas telas
como regua de qualidade: a aba de Materiais (organizacao) e a de Rastreamento
(profundidade) do `portal.borusa.com.br`. Copiar o desenho a mao produziria
uma imitacao; peca da casa nao se imita, usa-se a fonte.

O QUE NAO E' GERADO: proposta-a.html, proposta-b.html e proposta-c.html sao escritos
a mao e ficam no git. Eles so' consomem o que sai daqui.

Rodar na raiz do repositorio:  python docs/propostas/contas/montar.py
"""
import json
import pathlib
import shutil

RAIZ = pathlib.Path(__file__).resolve().parents[3]
SAIDA = RAIZ / 'docs' / 'propostas' / 'contas'
# o clone do Portal, de onde saem o botao animado, a sala e o rodape
PORTAL = pathlib.Path.home() / 'repos' / 'borusa-iscas'

# A ORDEM E' LEI: os blocos se concatenam em ordem numerica e reproduzem o painel.
ORDEM = ['01-base.css', '02-menu.css', '03-componentes.css', '07-calendario.css',
         '08-filtros.css', '10-painel.css', '11-programar.css']

# Os numeros abaixo foram medidos na API do Instagram em 29/08/2026, conta a conta,
# com o token que mora no motor. Nada aqui e' estimado.
CONTAS = [
    {"u": "borusaof", "nome": "Borusa Digital",
     "igId": "17841438934092410", "seguidores": 3, "publicacoes": 7,
     "mercado": "corte de podcast", "etiquetas": ["principal"],
     "ligada": True, "conexao": "viva", "tipo": "Criador De Mídia",
     "tetoUsado": 0, "tetoTotal": 100,
     "ligadaEm": "2026-08-17T02:24:28", "vence": "2026-10-14T02:24:28",
     "fila": 0, "erros24h": 0, "ultimo": "2026-06-21T14:30:09",
     "medianaEng": 3, "rascunho": True},
    {"u": "eduardo_devereux", "nome": "Eduardo Devereux",
     "igId": "17841455201219116", "seguidores": 0, "publicacoes": 1,
     "mercado": "notícia", "etiquetas": [],
     "ligada": True, "conexao": "viva", "tipo": "Criador De Mídia",
     "tetoUsado": 0, "tetoTotal": 100,
     "ligadaEm": "2026-08-17T18:09:00", "vence": "2026-10-14T18:09:00",
     "fila": 0, "erros24h": 0, "ultimo": "2026-08-17T18:39:35",
     "medianaEng": 0, "rascunho": False},
]


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)

    pedacos = []
    for nome in ORDEM:
        pedacos.append('/* ===== ' + nome + ' ===== */')
        pedacos.append((RAIZ / 'painel' / 'estilo' / nome).read_text(encoding='utf-8'))
    (SAIDA / 'painel.css').write_text('\n'.join(pedacos), encoding='utf-8')

    d = json.loads((RAIZ / 'painel' / 'analytics.json').read_text(encoding='utf-8'))
    retrato = {p['u']: p.get('avatar', '') for p in d.get('perfis', [])}
    capa = {u: {m['sc']: m.get('mini', '') for m in lista if m.get('sc')}
            for u, lista in (d.get('previas') or {}).items()}

    contas = [dict(c, avatar=retrato.get(c['u'], '')) for c in CONTAS]
    posts = {}
    for u, bloco in (d.get('fundo') or {}).items():
        posts[u] = [{"sc": p.get("sc"), "quando": p.get("quando"), "cur": p.get("cur"),
                     "com": p.get("com"), "views": p.get("views"),
                     "fmt": p.get("fmt", "reel"),
                     "legenda": (p.get("legenda") or "")[:70],
                     "capa": capa.get(u, {}).get(p.get("sc"), "")}
                    for p in bloco.get("posts", [])]

    dados = {"hoje": "2026-08-29T17:00:00", "contas": contas, "posts": posts,
             "pastas": [{"nome": "Teste 123", "fonte": "drive", "videos": 0}]}
    (SAIDA / 'dados.js').write_text(
        'window.DADOS = ' + json.dumps(dados, ensure_ascii=False) + ';', encoding='utf-8')

    montar_sala()
    for marca in ('marca-clara.png', 'marca-escura.png'):
        shutil.copy(RAIZ / 'painel' / marca, SAIDA / marca)

    for nome in ('painel.css', 'sala.css', 'dados.js'):
        print(nome.ljust(11), round((SAIDA / nome).stat().st_size / 1024), 'KB')


def montar_sala():
    """Recorta do Portal as tres pecas emprestadas. Sem o clone, avisa e segue:
    o `sala.css` que ja esta na pasta continua servindo."""
    if not PORTAL.exists():
        print('sala.css   PULADO, falta o clone em', PORTAL)
        return
    pedacos = [
        '/* ===== anda.css: O BOTAO ANIMADO DA CASA (repo borusa-iscas) ===== */',
        (PORTAL / 'app' / 'anda.css').read_text(encoding='utf-8'),
        '/* ===== rastreamento.css: A SALA DE CONTROLE (repo borusa-iscas) ===== */',
        (PORTAL / 'app' / '(painel)' / 'rastreamento'
         / 'rastreamento.css').read_text(encoding='utf-8'),
    ]
    portal_css = (PORTAL / 'app' / 'portal.css').read_text(encoding='utf-8')
    i = portal_css.index('.rodape-pagina {')
    j = portal_css.index('/* ---------------------------------------'
                         '---------------------- rastreamento', i)
    pedacos.append('/* ===== rodape Stacked Circular (recortado de portal.css) ===== */')
    pedacos.append(portal_css[i:j])
    (SAIDA / 'sala.css').write_text('\n'.join(pedacos), encoding='utf-8')


if __name__ == '__main__':
    main()
