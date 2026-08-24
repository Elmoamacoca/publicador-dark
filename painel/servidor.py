# -*- coding: utf-8 -*-
"""Servidor do rascunho, sem cache nenhum.

O `python -m http.server` guarda a pagina no navegador e responde 304 na recarga: o
Gabriel apertava F5 e continuava vendo a tela velha. Como aqui cada rodada troca o
arquivo, cache so atrapalha. Este servidor manda o navegador nunca guardar, e ignora o
pedido condicional que gera o 304.
"""
import base64
import http.server
import json
import os
import socketserver
import sys
import urllib.parse

import midia

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
PASTA = os.path.dirname(os.path.abspath(__file__))


# ------------------------------------------------------------------ dados da aba Analytics
#
# A tela de perfil veio inteira do Social Tracker e la' ela pede os numeros em tres rotas
# do servidor, e nao num arquivo. Reescrever esses pedidos seria mexer no motor copiado,
# e a copia deixaria de ser copia. Entao quem se adapta e' este servidor: ele responde as
# mesmas tres rotas lendo `analytics.json`, que o montador gera com a API do Instagram.
ANALYTICS = os.path.join(PASTA, "analytics.json")


def _pedaco(texto, teto):
    """Corta no espaco, e nao no meio da palavra. `faz muit` fica feio na ficha."""
    t = " ".join((texto or "").split())
    if len(t) <= teto:
        return t
    corte = t[:teto]
    espaco = corte.rfind(" ")
    return (corte[:espaco] if espaco > teto * 0.6 else corte).rstrip(" ,.;:") + "…"


def _analytics():
    with open(ANALYTICS, encoding="utf-8") as f:
        return json.load(f)


class SemCache(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=PASTA, **kw)

    def responder(self, obj, codigo=200):
        corpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def rota_de_midia(self, p, corpo=None):
        """A aba de Midia responde por `midia.py`. Aqui so' passa o pedido adiante.

        Fica separado de proposito: a Midia vai crescer (ligar pasta, reler, desligar,
        depois programar), e nada disso tem a ver com servir arquivo estatico."""
        rota = p.path.strip("/")
        if not (rota.startswith("midia/") or rota.startswith("contas/")
                or rota.startswith("painel/")):
            return False
        try:
            r = midia.responder(rota, urllib.parse.parse_qs(p.query), corpo)
        except Exception as e:
            # A tela precisa do motivo escrito, senao vira "deu erro" e ninguem sabe o que
            # fazer. O texto do erro nao carrega credencial: as fontes nunca a colocam na
            # mensagem.
            self.responder({"erro": type(e).__name__ + ": " + str(e)[:300]}, 500)
            return True
        if r is None:
            return False
        self.responder(r[0], r[1])
        return True

    def do_POST(self):
        p = urllib.parse.urlparse(self.path)
        tamanho = int(self.headers.get("Content-Length") or 0)
        try:
            corpo = json.loads(self.rfile.read(tamanho) or b"{}")
        except Exception:
            corpo = {}
        if not self.rota_de_midia(p, corpo):
            self.send_error(404)

    # ------------------------------------------------------------------ o Painel
    #
    # A HOME NAO PODE LER LISTA CONGELADA. Antes, o estado das contas vinha de um vetor
    # escrito a mao dentro da pagina, com o retrato de um dia. Aqui cada numero sai de
    # uma fonte que muda sozinha:
    #   quem sao as contas          -> `analytics.json`, gerado pela API do Instagram
    #   quem publicou e quando      -> os posts do mesmo arquivo
    #   quem tem fila e quem errou  -> o livro-caixa
    #   quantas cairam              -> o livro-caixa (hoje ninguem grava queda: fica 0)
    # Onde a fonte nao existe, o valor sai zero e a tela diz o motivo. Nada e' inventado.
    def rede(self):
        from datetime import datetime, timedelta, timezone

        try:
            d = _analytics()
        except FileNotFoundError:
            d = {}
        perfis = d.get("perfis", [])
        fundo = d.get("fundo") or {}
        hoje = datetime.now().date()

        # 1. quem publicou em cada um dos ultimos 30 dias, conta a conta
        #
        # DUAS CONTAGENS, e as duas viajam: quantas CONTAS publicaram no dia (a soma da
        # rede) e quantos POSTS cada conta fez naquele dia. Sem a segunda, o grafico
        # dizia "uma conta publicou" sem dizer qual, que e' justamente o que se quer
        # saber quando a rede tem dezenas de perfis.
        por_dia = {}
        posts_dia = {}
        ultimo = {}
        for arroba, bloco in fundo.items():
            for post in bloco.get("posts", []):
                q = (post.get("quando") or "")[:10]
                if not q:
                    continue
                por_dia.setdefault(q, set()).add(arroba)
                posts_dia.setdefault(q, {})
                posts_dia[q][arroba] = posts_dia[q].get(arroba, 0) + 1
                if q > ultimo.get(arroba, ""):
                    ultimo[arroba] = q

        # 2. o que o livro-caixa sabe: fila e erro por conta
        fila, erros = {}, {}
        pastas = 0
        try:
            con = midia.abrir()
            for l in con.execute("SELECT conta, estado, COUNT(*) n FROM video "
                                 "WHERE conta IS NOT NULL GROUP BY conta, estado"):
                if l["estado"] == "erro":
                    erros[l["conta"]] = l["n"]
                elif l["estado"] in ("programado", "baixado"):
                    fila[l["conta"]] = fila.get(l["conta"], 0) + l["n"]
            pastas = con.execute("SELECT COUNT(*) n FROM pasta").fetchone()["n"]
            quedas = {r["dia"]: r["caidas"] for r in con.execute(
                "SELECT dia, caidas FROM pulso")}
            con.close()
        except Exception:
            quedas = {}

        contas = []
        for perfil in perfis:
            a = perfil.get("u")
            ult = ultimo.get(a, "")
            recente = bool(ult) and (hoje - datetime.strptime(ult, "%Y-%m-%d").date()).days <= 2
            contas.append({
                "arroba": a, "nome": perfil.get("nome") or "",
                "avatar": perfil.get("avatar") or "",
                "ligada": bool(perfil.get("ativa", True)),
                "fila": fila.get(a, 0), "erros24h": erros.get(a, 0),
                "ultimo": ult, "publicando": bool(fila.get(a) or recente),
            })

        resumo = {
            "publicando": sum(1 for c in contas if c["publicando"]),
            "paradas": sum(1 for c in contas if c["ligada"] and not c["publicando"]),
            "caidas": sum(1 for c in contas if not c["ligada"]),
            "total": len(contas), "pastas": pastas,
        }

        # 3. a serie de 30 dias, dia a dia, sem buraco
        serie = []
        for i in range(89, -1, -1):
            dia = (hoje - timedelta(days=i)).isoformat()
            publicando = len(por_dia.get(dia, ()))
            do_dia = posts_dia.get(dia, {})
            serie.append({"dia": dia, "publicando": publicando,
                          "paradas": max(len(contas) - publicando, 0),
                          "caidas": quedas.get(dia, 0),
                          "contas": {c["arroba"]: do_dia.get(c["arroba"], 0)
                                     for c in contas}})

        # 4. os proximos sete dias: o que ja' saiu e o que esta' marcado
        marcado, publicado, saidas_conta = {}, {}, {}
        for arroba, bloco in fundo.items():
            for post in bloco.get("posts", []):
                q = (post.get("quando") or "")[:10]
                publicado[q] = publicado.get(q, 0) + 1
                saidas_conta.setdefault(q, {})
                saidas_conta[q][arroba] = saidas_conta[q].get(arroba, 0) + 1
        try:
            con = midia.abrir()
            for l in con.execute("SELECT quando, estado, conta FROM video "
                                 "WHERE quando IS NOT NULL"):
                q = (l["quando"] or "")[:10]
                if l["estado"] == "publicado":
                    publicado[q] = publicado.get(q, 0) + 1
                else:
                    marcado[q] = marcado.get(q, 0) + 1
                if l["conta"]:
                    saidas_conta.setdefault(q, {})
                    saidas_conta[q][l["conta"]] = saidas_conta[q].get(l["conta"], 0) + 1
            con.close()
        except Exception:
            pass
        # A JANELA E' DE 14 DIAS, sete atras e sete a frente. So' com o futuro, uma
        # agenda vazia desenhava um grafico sem nenhum ponto, e o eixo saia de -1 a 1.
        # Com a semana que passou junto, o cartao mostra o ritmo que houve e o que esta'
        # marcado, e as duas metades sao dado de verdade.
        semana = []
        for i in range(-30, 30):
            dia = (hoje + timedelta(days=i)).isoformat()
            do_dia = saidas_conta.get(dia, {})
            semana.append({"dia": dia, "publicados": publicado.get(dia, 0),
                           "programados": marcado.get(dia, 0),
                           "contas": {c["arroba"]: do_dia.get(c["arroba"], 0)
                                      for c in contas}})

        return {"contas": contas, "resumo": resumo, "serie": serie, "semana": semana}

    def do_GET(self):
        p = urllib.parse.urlparse(self.path)
        rota = p.path.strip("/")
        if self.rota_de_midia(p):
            return
        if rota == "painel/rede":
            return self.responder(self.rede())

        if rota == "calendario/saidas":
            # A AGENDA E' A SOMA DE DUAS COISAS, e as duas sao de verdade:
            #   1. o que JA' SAIU, lido da API do Instagram e guardado em `analytics.json`
            #   2. o que AINDA VAI SAIR, que nasce quando o assistente gravar as datas no
            #      livro-caixa. Hoje isso e' zero, e zero aqui e' informacao, nao falha.
            saidas = []
            try:
                d = _analytics()
            except FileNotFoundError:
                d = {}
            for conta, fundo in (d.get("fundo") or {}).items():
                for post in fundo.get("posts", []):
                    saidas.append({
                        # O nome da ficha e' a legenda, cortada. Sem legenda, o formato:
                        # o codigo do arquivo nao diz nada a quem bate o olho.
                        "titulo": _pedaco(post.get("legenda") or "", 48)
                                  or {"reel": "Reel", "carrossel": "Carrossel"}.get(
                                      post.get("fmt"), "Publicação"),
                        "conta": conta, "quando": post.get("quando"),
                        "estado": "publicado", "sc": post.get("sc"),
                        "fmt": post.get("fmt", "reel"),
                    })
            try:
                con = midia.abrir()
                for l in con.execute(
                        "SELECT nome, conta, quando, estado FROM video "
                        "WHERE quando IS NOT NULL ORDER BY quando"):
                    saidas.append({"titulo": l["nome"], "conta": l["conta"],
                                   "quando": l["quando"], "estado": l["estado"],
                                   "sc": None, "fmt": "reel"})
                con.close()
            except Exception:
                pass
            return self.responder({"saidas": saidas})

        if rota == "img":
            # A tela do acervo pede a midia de cada publicacao por atalho, em `img?sc=`.
            # No Social Tracker quem responde e' o arquivo guardado no Drive; aqui a
            # miniatura ja' viaja dentro do proprio `analytics.json`, entao basta
            # devolver os bytes dela.
            sc = urllib.parse.parse_qs(p.query).get("sc", [""])[0]
            try:
                d = _analytics()
            except FileNotFoundError:
                d = {}
            for lista in d.get("previas", {}).values():
                for m in lista:
                    if m.get("sc") == sc and m.get("mini"):
                        corpo = base64.b64decode(m["mini"].split(",", 1)[1])
                        self.send_response(200)
                        self.send_header("Content-Type", "image/jpeg")
                        self.send_header("Content-Length", str(len(corpo)))
                        self.send_header("Cache-Control", "no-store")
                        self.end_headers()
                        self.wfile.write(corpo)
                        return
            self.send_error(404)
            return

        if rota in ("perfis", "conta", "posts"):
            quem = (urllib.parse.parse_qs(p.query).get("u", [""])[0] or "").lower()
            try:
                d = _analytics()
            except FileNotFoundError:
                return self.responder({"erro": "analytics.json ainda nao foi gerado"}, 404)
            if rota == "perfis":
                return self.responder({"perfis": d.get("perfis", [])})
            if rota == "conta":
                c = d.get("fundo", {}).get(quem)
                return self.responder(c or {"erro": "essa conta nao esta no publicador"},
                                      200 if c else 404)
            return self.responder(d.get("previas", {}).get(quem, []))
        return super().do_GET()

    def send_head(self):
        # O 304 nasce aqui, comparando com o cabecalho de data que o navegador manda.
        # Sem esse cabecalho, o caminho do 304 nem e' considerado.
        self.headers.replace_header("If-Modified-Since", "") \
            if "If-Modified-Since" in self.headers else None
        if "If-None-Match" in self.headers:
            del self.headers["If-None-Match"]
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *a):
        pass


class Reusavel(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Reusavel(("127.0.0.1", PORTA), SemCache) as s:
    print(f"painel em http://localhost:{PORTA} (sem cache)", flush=True)
    s.serve_forever()
