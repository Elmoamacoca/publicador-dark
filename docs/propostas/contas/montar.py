# -*- coding: utf-8 -*-
"""Monta os dois arquivos gerados das propostas de layout da aba de Contas.

POR QUE ESTE SCRIPT EXISTE. A maquete tem que ser a tela real: mesmo CSS, mesmas
classes, mesmos dados. Copiar estilo na mão para dentro de um HTML de proposta faria
a maquete envelhecer no dia seguinte. Aqui ela se remonta a partir da fonte.

O QUE ELE GERA (os dois ficam fora do git, ver .gitignore):
  painel.css   os blocos de estilo do painel, na ordem numerica que e' lei
  dados.js     as contas de verdade, com retrato e capa lidos de painel/analytics.json

O QUE NAO E' GERADO: proposta-a.html, proposta-b.html e proposta-c.html sao escritos
a mao e ficam no git. Eles so' consomem o que sai daqui.

Rodar na raiz do repositorio:  python docs/propostas/contas/montar.py
"""
import json
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parents[3]
SAIDA = RAIZ / 'docs' / 'propostas' / 'contas'

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

    print('painel.css', round((SAIDA / 'painel.css').stat().st_size / 1024), 'KB')
    print('dados.js  ', round((SAIDA / 'dados.js').stat().st_size / 1024), 'KB')


if __name__ == '__main__':
    main()
