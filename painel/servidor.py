# -*- coding: utf-8 -*-
"""Servidor do painel: rotas de dados, arquivos estaticos, login e zero cache.

SEM CACHE porque cada rodada troca o arquivo e o 304 fazia o Gabriel ver tela velha.

COM LOGIN quando `dados/acesso.json` existir. E o caso da VPS: toda rota, de tela ou
de dado, exige a sessao. Sem o arquivo (o uso local de desenvolvimento), o servidor
se comporta como sempre: aberto, mas escutando so em 127.0.0.1.

O FUSO E O DE SAO PAULO. A maquina pode estar em UTC (a VPS esta): "hoje" calculado
no relogio cru viraria amanha as 21h e o painel mentiria. Tudo que decide "que dia e
hoje" passa por FUSO.
"""
import base64
import hashlib
import hmac
import http.server
import json
import os
import socketserver
import sys
import time
import urllib.parse
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import contas
import midia

PORTA = int(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PAINEL_PORTA", 4173))
ENDERECO = os.environ.get("PAINEL_ENDERECO", "127.0.0.1")
PASTA = os.path.dirname(os.path.abspath(__file__))
FUSO = ZoneInfo("America/Sao_Paulo")

# ------------------------------------------------------------------ dados da aba Analytics
#
# A tela de perfil veio inteira do Social Tracker e la' ela pede os numeros em tres rotas
# do servidor, e nao num arquivo. Reescrever esses pedidos seria mexer no motor copiado,
# e a copia deixaria de ser copia. Entao quem se adapta e' este servidor: ele responde as
# mesmas tres rotas lendo `analytics.json`, que o montador gera com a API do Instagram.
ANALYTICS = os.environ.get("PAINEL_ANALYTICS", os.path.join(PASTA, "analytics.json"))

# ------------------------------------------------------------------ o acesso
#
# `dados/acesso.json` guarda usuario, o tempero e o cozido da senha (pbkdf2, nunca a
# senha em si) e a chave que assina o carimbo de sessao. Quem cria e' `senha.py`.
ACESSO = os.path.join(PASTA, "dados", "acesso.json")
SESSAO_DIAS = 30
_falhas = {}          # ip -> [quantas, proibido_ate]. Trava de forca bruta, em memoria.
_tranca = __import__("threading").Lock()


def _acesso():
    try:
        with open(ACESSO, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _cozinhar(senha, sal):
    return hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"),
                               bytes.fromhex(sal), 200_000).hex()


def _carimbo(usuario, chave):
    ate = str(int(time.time()) + SESSAO_DIAS * 86400)
    massa = usuario + "|" + ate
    ass = hmac.new(bytes.fromhex(chave), massa.encode("utf-8"), "sha256").hexdigest()
    return base64.urlsafe_b64encode((massa + "|" + ass).encode("utf-8")).decode("ascii")


def _carimbo_vale(valor, acesso):
    try:
        massa = base64.urlsafe_b64decode(valor.encode("ascii")).decode("utf-8")
        usuario, ate, ass = massa.rsplit("|", 2)
        certo = hmac.new(bytes.fromhex(acesso["chave"]),
                         (usuario + "|" + ate).encode("utf-8"), "sha256").hexdigest()
        return (hmac.compare_digest(ass, certo)
                and usuario == acesso["usuario"] and int(ate) > time.time())
    except Exception:
        return False


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

    def responder(self, obj, codigo=200, cookie=None):
        corpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(corpo)

    # ------------------------------------------------------------------ o login
    def ip_cliente(self):
        """Atras do Caddy, todo pedido chega do IP do proxy; o cliente de verdade
        viaja no X-Forwarded-For. Sem ele (uso local direto), vale o socket."""
        xff = self.headers.get("X-Forwarded-For", "")
        if xff:
            return xff.split(",")[0].strip()
        return self.client_address[0]

    def endereco_base(self):
        """O endereco publico desta casa, do jeito que o navegador chegou aqui.

        Serve para UMA coisa: montar o endereco de volta que o Instagram exige na
        hora de ligar uma conta. Ele tem que bater LETRA POR LETRA com o que esta
        cadastrado no aplicativo da Meta, entao ele nasce do pedido de verdade, e nao
        de uma constante escrita a mao que envelhece quando o dominio muda.
        """
        esquema = self.headers.get("X-Forwarded-Proto") or "http"
        casa = self.headers.get("X-Forwarded-Host") or self.headers.get("Host") \
            or f"{ENDERECO}:{PORTA}"
        return f"{esquema}://{casa}"

    def sessao_ok(self):
        acesso = _acesso()
        if not acesso:
            return True                      # sem acesso.json = uso local aberto
        biscoitos = self.headers.get("Cookie", "")
        for pedaco in biscoitos.split(";"):
            nome, _, valor = pedaco.strip().partition("=")
            if nome == "painel_sessao" and _carimbo_vale(valor, acesso):
                return True
        return False

    def pagina_entrar(self, errado=False):
        try:
            with open(os.path.join(PASTA, "entrar.html"), encoding="utf-8") as f:
                corpo = f.read()
        except FileNotFoundError:
            corpo = "<h1>falta entrar.html</h1>"
        corpo = corpo.replace("{ERRO}", "certo" if not errado else "errado")
        corpo = corpo.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def entrar(self, corpo):
        acesso = _acesso()
        if not acesso:
            return self.responder({"ok": True, "aviso": "servidor sem login"})
        ip = self.ip_cliente()
        with _tranca:
            falha = _falhas.get(ip, [0, 0])
            if falha[1] > time.time():
                return self.responder({"erro": "muitas tentativas, espere um minuto"}, 429)
        usuario = str(corpo.get("usuario") or "").strip()
        senha = str(corpo.get("senha") or "")
        # comparacao em bytes: compare_digest com str recusa acento e viraria 500
        try:
            combina = (hmac.compare_digest(usuario.encode("utf-8"),
                                           str(acesso["usuario"]).encode("utf-8"))
                       and hmac.compare_digest(
                           _cozinhar(senha, acesso["sal"]).encode("ascii"),
                           str(acesso["cozido"]).encode("ascii")))
        except Exception:
            combina = False
        if combina:
            with _tranca:
                _falhas.pop(ip, None)
            biscoito = ("painel_sessao=" + _carimbo(usuario, acesso["chave"])
                        + f"; Max-Age={SESSAO_DIAS * 86400}; Path=/; HttpOnly"
                        + "; SameSite=Lax")
            if self.headers.get("X-Forwarded-Proto") == "https":
                biscoito += "; Secure"
            return self.responder({"ok": True}, cookie=biscoito)
        with _tranca:
            falha = [falha[0] + 1, 0]
            if falha[0] >= 5:
                falha = [0, time.time() + 60]
            _falhas[ip] = falha
        return self.responder({"erro": "usuario ou senha errados"}, 401)

    def rota_de_midia(self, p, corpo=None):
        """As abas respondem pelos seus modulos. Aqui so' passa o pedido adiante.

        Fica separado de proposito: a Midia vai crescer (ligar pasta, reler, desligar,
        depois programar), e nada disso tem a ver com servir arquivo estatico.

        SAO DOIS MODULOS, NA ORDEM. `contas.py` cuida do acesso das contas (perguntar
        a Meta, avisar do vencimento, renovar) e `midia.py` cuida do resto, inclusive
        do `contas/meta`, que e' o mercado e as etiquetas que o Gabriel digita. Quem
        nao reconhece a rota devolve None, e a vez passa para o proximo."""
        rota = p.path.strip("/")
        if not (rota.startswith("midia/") or rota.startswith("contas/")
                or rota.startswith("painel/")):
            return False
        try:
            r = contas.responder(rota, urllib.parse.parse_qs(p.query), corpo,
                                 self.endereco_base())
            if r is None:
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
        if p.path.strip("/") == "entrar":
            return self.entrar(corpo)
        if not self.sessao_ok():
            return self.responder({"erro": "sem sessao, entre de novo"}, 401)
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
        try:
            d = _analytics()
        except FileNotFoundError:
            d = {}
        perfis = d.get("perfis", [])
        fundo = d.get("fundo") or {}
        hoje = datetime.now(FUSO).date()

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
        if rota == "entrar":
            return self.pagina_entrar()
        if rota == "sair":
            self.send_response(302)
            self.send_header("Set-Cookie", "painel_sessao=; Max-Age=0; Path=/")
            self.send_header("Location", "/entrar")
            self.end_headers()
            return
        if not self.sessao_ok():
            # rota de dado leva o 401 escrito; rota de tela leva para a porta de entrada
            if rota and ("/" in rota or rota in ("perfis", "conta", "posts", "img")):
                return self.responder({"erro": "sem sessao, entre de novo"}, 401)
            self.send_response(302)
            self.send_header("Location", "/entrar")
            self.end_headers()
            return
        # A VOLTA DO INSTAGRAM. Ela e' de TELA, e nao de dado: quem chega aqui e' o
        # navegador do Gabriel, trazido de volta pelo Instagram depois de ele
        # autorizar a conta. Por isso termina em desvio para a aba de Contas, com o
        # recado no endereco, e nao num JSON que ninguem veria.
        if rota == "contas/voltar":
            q = urllib.parse.parse_qs(p.query)
            # A SONDA E' A UNICA PARTE DO CAMINHO DE VOLTA QUE DA' PARA PROVAR DAQUI:
            # que o Caddy encaminha este endereco e que o painel responde nele. Se a
            # Meta aceita ou nao esse endereco, so' a Meta sabe, e nao ha rota que
            # pergunte. Por isso a janela de ligar mostra o endereco por extenso.
            if q.get("sonda"):
                return self.responder({"pronto": True,
                                       "volta": self.endereco_base() + "/contas/voltar"})
            recado = ""
            if q.get("error"):
                recado = q.get("error_description", ["a autorização foi negada"])[0]
            else:
                d = contas.terminar_ligacao(q.get("code", [""])[0],
                                            q.get("state", [""])[0],
                                            self.endereco_base())
                recado = ("ligada:" + d["arroba"]) if d.get("ok") else d.get("erro", "")
            self.send_response(302)
            self.send_header("Location", "/?aba=contas&ligacao="
                             + urllib.parse.quote(recado[:200]))
            self.end_headers()
            return

        # O RETRATO DA CONTA. Ele mora em `dados/retratos/`, que o servidor recusa
        # servir como caminho de arquivo (e faz bem: o resto de `dados/` e' segredo).
        # Entao a foto sai por esta rota, que so' alcanca essa pasta e so' devolve o
        # que o modulo de contas ja' baixou da Meta.
        if rota == "contas/retrato":
            quem = urllib.parse.parse_qs(p.query).get("u", [""])[0]
            caminho = contas.retrato_em_disco(quem)
            if not caminho:
                self.send_error(404)
                return
            corpo = caminho.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(corpo)))
            # um dia de cache: a foto do perfil muda devagar, e a tela redesenha muito
            self.send_header("Cache-Control", "private, max-age=86400")
            self.end_headers()
            self.wfile.write(corpo)
            return

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
        # O ESTADO NUNCA SE SERVE. `dados/` mora dentro da raiz servida (no container o
        # volume monta ali) e guarda a credencial do Drive, o cozido da senha e a chave
        # que assina as sessoes: servir isso por http entregaria a casa a qualquer
        # sessao valida. Codigo-fonte tambem nao e' pagina.
        if rota.split("/")[0] == "dados" or rota.endswith(".py"):
            return self.responder({"erro": "esse caminho nao se serve"}, 404)
        return super().do_GET()

    def do_HEAD(self):
        # HEAD tem as mesmas trancas do GET: sem isso ele confirmaria a existencia
        # (e o tamanho) de qualquer arquivo, logado ou nao.
        if not self.sessao_ok():
            self.send_response(401)
            self.end_headers()
            return
        rota = urllib.parse.urlparse(self.path).path.strip("/")
        if rota.split("/")[0] == "dados" or rota.endswith(".py"):
            self.send_error(404)
            return
        return super().do_HEAD()

    def list_directory(self, path):
        # Listar pasta e' vitrine de coisa que ninguem pediu para expor.
        self.send_error(404)
        return None

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


if __name__ == "__main__":
    # FALHA FECHADA: exposto para fora sem tranca, o servidor se recusa a subir.
    # A falta do acesso.json so' e' aceitavel no uso local de desenvolvimento.
    if ENDERECO != "127.0.0.1" and not _acesso():
        print(f"RECUSADO: escutaria em {ENDERECO} sem dados/acesso.json. "
              "Rode painel/senha.py antes; painel exposto nao sobe aberto.", flush=True)
        sys.exit(1)
    with Reusavel((ENDERECO, PORTA), SemCache) as s:
        tranca = "com login" if _acesso() else "SEM login (uso local)"
        print(f"painel em http://{ENDERECO}:{PORTA} ({tranca})", flush=True)
        s.serve_forever()
