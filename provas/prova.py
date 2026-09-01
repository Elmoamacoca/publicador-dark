# -*- coding: utf-8 -*-
"""O PORTAO DE PROVAS do painel. Reprovou, nao sobe. Passou, pode subir.

O que ele prova, em ordem:
  1. O servidor sobe e responde.
  2. Se o login estiver ligado: rota sem sessao leva 401, e entrar funciona.
  3. Cada rota de dados devolve 200 com o formato esperado.
  4. Cada aba abre no navegador de verdade SEM NENHUM erro de console.
  5. O modo foco (Programar publicacoes) abre.
  6. Um print por aba fica em provas/saida/ para conferencia de olho.

Uso:
  python prova.py                          -> prova o painel do proprio repositorio
  python prova.py --pasta CAMINHO          -> prova outro painel local
  python prova.py --url https://... \
     --usuario g --senha-arquivo cofre.txt -> prova um painel no ar, com login

Sai com codigo 0 quando passa e 1 quando reprova, para travar deploy em script.
"""
import argparse
import json
import os
import socket
import subprocess
import sys
import time
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "saida")

# Cada rota com a prova do seu formato: (rota, chaves que tem que existir na resposta).
ROTAS = [
    ("painel/rede", ("contas", "resumo", "serie", "semana")),
    ("perfis", ("perfis",)),
    ("calendario/saidas", ("saidas",)),
    ("midia/estado", ("fonte", "pronta")),
    ("midia/ligadas", ("pastas",)),
    ("contas/meta", ("contas",)),
    # O ACESSO DAS CONTAS. Esta rota pergunta a Meta e devolve o estado de cada
    # conexao, com a validade e a contagem de renovacoes. Ela entra na prova porque
    # e' ela que sustenta o aviso de vencimento: se calar, a tela volta a mentir.
    ("contas/estado", ("contas", "vivas", "vencendo", "caidas", "app_pronto")),
    ("painel/rascunho", ("rascunhos",)),
    ("painel/pulso", ("pulso",)),
]

ABAS = ["painel", "calendario", "midia", "analytics", "contas", "ajuda"]


def livre(porta):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", porta)) != 0


def esperar(url, tempo=15):
    fim = time.time() + tempo
    while time.time() < fim:
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except urllib.error.HTTPError:
            return True
        except Exception:
            time.sleep(0.3)
    return False


def pedir(url, cookie="", corpo=None):
    cab = {"User-Agent": "prova"}
    if cookie:
        cab["Cookie"] = cookie
    dados = None
    if corpo is not None:
        dados = json.dumps(corpo).encode("utf-8")
        cab["Content-Type"] = "application/json"
    req = urllib.request.Request(url, headers=cab, data=dados)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read(), r.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read(), e.headers


def entrar(base, usuario, senha, falhas):
    codigo, corpo, cab = pedir(base + "/entrar", corpo={"usuario": usuario,
                                                        "senha": senha})
    if codigo != 200:
        falhas.append(f"login recusado (codigo {codigo}): {corpo[:120]}")
        return ""
    biscoito = (cab.get("Set-Cookie") or "").split(";")[0]
    if not biscoito.startswith("painel_sessao="):
        falhas.append("login nao devolveu a sessao")
        return ""
    print("  login: ok")
    return biscoito


def provar_tranca(base, cookie, falhas):
    """Com login ligado, rota pelada tem que levar 401 e tela tem que ser levada
    para /entrar. Painel aberto quando devia estar trancado e REPROVA na hora."""
    codigo, _, _ = pedir(base + "/painel/rede")
    if codigo != 401:
        falhas.append(f"TRANCA FALHOU: painel/rede sem sessao respondeu {codigo}, nao 401")
    else:
        print("  tranca: rota sem sessao leva 401")


def provar_rotas(base, cookie, falhas):
    for rota, chaves in ROTAS:
        try:
            codigo, corpo, _ = pedir(base + "/" + rota, cookie)
            d = json.loads(corpo)
            if codigo != 200:
                falhas.append(f"rota {rota}: codigo {codigo}")
                continue
            faltando = [c for c in chaves if c not in d]
            if faltando:
                falhas.append(f"rota {rota}: resposta sem {faltando}")
            else:
                print(f"  rota {rota}: ok")
        except Exception as e:
            falhas.append(f"rota {rota}: {type(e).__name__}: {e}")
    try:
        codigo, corpo, _ = pedir(base + "/", cookie)
        if codigo != 200 or b"Publicador" not in corpo:
            falhas.append("pagina inicial nao parece o painel")
        else:
            print("  pagina inicial: ok")
    except Exception as e:
        falhas.append(f"pagina inicial: {e}")


def provar_contas(base, cookie, falhas):
    """A ABA DE CONTAS POR INTEIRO: o estado com a tira e o diario, e o caminho de
    ligar conta.

    LIGAR CONTA TEM DUAS RESPOSTAS CERTAS, e por isso ela nao entra na lista comum:
    200 com o endereco do Instagram (aplicativo configurado) ou 400 dizendo que falta
    configurar. O que nao pode e' a rota sumir, ou devolver endereco que nao seja do
    Instagram com o nosso endereco de volta.
    """
    url = ""            # a autorizacao montada; a prontidao e' conferida contra ela
    try:
        codigo, corpo, _ = pedir(base + "/contas/estado", cookie)
        d = json.loads(corpo)
        for c in d.get("contas", []):
            if "token" in c:
                falhas.append("contas/estado: A RESPOSTA CARREGA TOKEN")
            if len(c.get("tira") or []) != 30:
                falhas.append(f"contas/estado: @{c.get('arroba')} sem a tira de 30 dias")
            if "diario" not in c:
                falhas.append(f"contas/estado: @{c.get('arroba')} sem diario")
        print(f"  contas/estado: {len(d.get('contas', []))} conta(s), tira e diario ok, "
              f"sem token na resposta")
    except Exception as e:
        falhas.append(f"contas/estado: {type(e).__name__}: {e}")

    try:
        codigo, corpo, _ = pedir(base + "/contas/ligar", cookie)
        d = json.loads(corpo)
        # o endereco de volta viaja CODIFICADO dentro da URL, entao a conferencia
        # desfaz a codificacao antes de procurar
        url = urllib.parse.unquote(d.get("url") or "")
        if codigo == 400 and d.get("erro"):
            print("  contas/ligar: sem aplicativo configurado (resposta honesta)")
        elif codigo == 200 and "instagram.com/oauth/authorize" in url \
                and "/contas/voltar" in url and "client_id=" in url:
            print("  contas/ligar: monta a autorizacao do Instagram com a volta certa")
        else:
            falhas.append(f"contas/ligar: resposta inesperada ({codigo}) {url[:90]}")
    except Exception as e:
        falhas.append(f"contas/ligar: {type(e).__name__}: {e}")

    # A PRONTIDAO E O QUE A JANELA DE LIGAR MOSTRA ANTES DE MANDAR ALGUEM PARA A
    # META. Ela nao pode carregar segredo (o numero do aplicativo e' publico, o
    # segredo nao) e o endereco de volta tem que ser o mesmo que a autorizacao usa:
    # os dois batendo e' o que evita repetir o "Invalid redirect_uri".
    try:
        codigo, corpo, _ = pedir(base + "/contas/prontidao", cookie)
        d = json.loads(corpo)
        crus = json.dumps(d)
        for proibido in ("segredo", "client_secret", "app_secret", "token"):
            if proibido in crus:
                falhas.append(f"contas/prontidao: A RESPOSTA CARREGA '{proibido}'")
        if not (d.get("volta") or "").endswith("/contas/voltar"):
            falhas.append(f"contas/prontidao: endereco de volta estranho "
                          f"({d.get('volta')})")
        if d.get("volta") and d["volta"] not in urllib.parse.unquote(url or ""):
            falhas.append("contas/prontidao: a volta que a janela mostra NAO e' a "
                          "que a autorizacao usa")
        print(f"  contas/prontidao: {d.get('volta')} | aplicativo pronto: "
              f"{d.get('app_pronto')}")
    except Exception as e:
        falhas.append(f"contas/prontidao: {type(e).__name__}: {e}")

    # COLAR TOKEN E O CAMINHO CURTO DE LIGAR CONTA. Ele so' pode aceitar token que a
    # META reconhece, e a recusa tem que chegar ESCRITA na tela: rota que engole erro
    # de token vira conta ligada pela metade, com o cofre gravado e nada funcionando.
    for rotulo, envio, espera in (
            ("vazio", {"token": ""}, "cole o token"),
            ("curto demais", {"token": "abc123"}, "curto demais"),
            ("inventado", {"token": "IG" + "Q" * 70}, None)):
        try:
            codigo, corpo, _ = pedir(base + "/contas/colar", cookie, corpo=envio)
            d = json.loads(corpo)
            if codigo != 400 or not d.get("erro"):
                falhas.append(f"contas/colar ({rotulo}): devia recusar e nao recusou "
                              f"({codigo}) {corpo[:100]}")
            elif espera and espera not in d["erro"]:
                falhas.append(f"contas/colar ({rotulo}): recusou pelo motivo errado: "
                              f"{d['erro'][:80]}")
            else:
                print(f"  contas/colar: recusa token {rotulo} | {d['erro'][:60]}")
            if "access_token" in corpo.decode("utf-8", "replace"):
                falhas.append(f"contas/colar ({rotulo}): A RESPOSTA CARREGA TOKEN")
        except Exception as e:
            falhas.append(f"contas/colar ({rotulo}): {type(e).__name__}: {e}")

    # ATUALIZAR CADASTRO. O portao prova a RECUSA, e nao a atualizacao: atualizar de
    # verdade mexeria no cofre e no historico de uma conta de producao, e prova que
    # muda o que ela mede nao e' prova. O que se cobra aqui e' que conta inventada
    # leve 400 com motivo escrito, e nunca um "ok" educado.
    for rotulo, quem in (("vazia", ""), ("inventada", "conta-que-nao-existe-9x")):
        try:
            codigo, corpo, _ = pedir(base + "/contas/atualizar", cookie,
                                     corpo={"arroba": quem})
            d = json.loads(corpo)
            if codigo != 400 or not d.get("erro"):
                falhas.append(f"contas/atualizar ({rotulo}): devia recusar e nao "
                              f"recusou ({codigo}) {corpo[:100]}")
            elif "publicador" not in d["erro"]:
                falhas.append(f"contas/atualizar ({rotulo}): recusou pelo motivo "
                              f"errado: {d['erro'][:80]}")
            else:
                print(f"  contas/atualizar: recusa conta {rotulo} | {d['erro'][:60]}")
            if "access_token" in corpo.decode("utf-8", "replace"):
                falhas.append(f"contas/atualizar ({rotulo}): A RESPOSTA CARREGA TOKEN")
        except Exception as e:
            falhas.append(f"contas/atualizar ({rotulo}): {type(e).__name__}: {e}")

    # REMOVER APAGA PASSADO, entao o portao prova a TRAVA, e nunca a remocao: rodar
    # a remocao de verdade contra producao apagaria o historico de uma conta viva
    # para dizer que o botao funciona. O que se cobra e' que sem o arroba digitado,
    # ou com o arroba errado, a rota recuse com motivo escrito.
    for rotulo, envio in (
            ("sem confirmacao", {"arroba": "borusaof"}),
            ("confirmacao errada", {"arroba": "borusaof", "confirma": "outra"}),
            ("tudo vazio", {"arroba": "", "confirma": ""})):
        try:
            codigo, corpo, _ = pedir(base + "/contas/remover", cookie, corpo=envio)
            d = json.loads(corpo)
            if codigo != 400 or not d.get("erro"):
                falhas.append(f"contas/remover ({rotulo}): DEVIA RECUSAR e nao "
                              f"recusou ({codigo}) {corpo[:100]}")
            elif "digite" not in d["erro"]:
                falhas.append(f"contas/remover ({rotulo}): recusou pelo motivo "
                              f"errado: {d['erro'][:80]}")
            else:
                print(f"  contas/remover: trava segura, {rotulo}")
        except Exception as e:
            falhas.append(f"contas/remover ({rotulo}): {type(e).__name__}: {e}")

    # A SONDA DA VOLTA. Ela e' o unico pedaco do caminho de retorno que da' para
    # provar sem a Meta: que o endereco existe neste painel e responde.
    try:
        codigo, corpo, _ = pedir(base + "/contas/voltar?sonda=1", cookie)
        d = json.loads(corpo)
        if codigo != 200 or not d.get("pronto"):
            falhas.append(f"contas/voltar?sonda=1: nao respondeu pronto ({codigo})")
        else:
            print("  contas/voltar: o endereco de volta responde neste painel")
    except Exception as e:
        falhas.append(f"contas/voltar?sonda=1: {type(e).__name__}: {e}")

    # O COFRE E O CODIGO NAO SE SERVEM, nem para quem ja entrou.
    for caminho in ("dados/contas.json", "dados/vigia.json", "contas.py"):
        try:
            codigo, _, _ = pedir(base + "/" + caminho, cookie)
            if codigo == 200:
                falhas.append(f"{caminho}: SE SERVE POR HTTP, e nao deveria")
        except Exception:
            pass
    print("  cofre e codigo: barrados por http")


def provar_derivadas(base, cookie, falhas):
    """As rotas que dependem de dado real (um @ de verdade, um sc de verdade) e o
    ciclo de escrita. A escrita e' DESCARTAVEL: cria um rascunho de conta de prova,
    confere que existe, apaga, confere que sumiu. Nada do Gabriel e' tocado."""
    try:
        _, corpo, _ = pedir(base + "/perfis", cookie)
        us = [p.get("u") for p in json.loads(corpo).get("perfis", []) if p.get("u")]
    except Exception:
        us = []
    if us:
        for rota, chaves in ((f"conta?u={us[0]}", ("posts",)),
                             (f"posts?u={us[0]}", ())):
            codigo, corpo, _ = pedir(base + "/" + rota, cookie)
            if codigo != 200:
                falhas.append(f"rota {rota}: codigo {codigo}")
            else:
                print(f"  rota {rota.split('?')[0]}?u=: ok")
    else:
        print("  conta/posts: pulado, sem perfil na base")
    try:
        _, corpo, _ = pedir(base + "/calendario/saidas", cookie)
        scs = [s.get("sc") for s in json.loads(corpo).get("saidas", []) if s.get("sc")]
    except Exception:
        scs = []
    if scs:
        codigo, corpo, cab = pedir(base + f"/img?sc={scs[0]}", cookie)
        if codigo != 200 or "image" not in (cab.get("Content-Type") or ""):
            falhas.append(f"rota img?sc=: codigo {codigo}")
        else:
            print("  rota img?sc=: ok")
    else:
        print("  img: pulado, sem sc na base")
    codigo, corpo, _ = pedir(base + "/midia/navegar", cookie)
    d = json.loads(corpo)
    if codigo == 200 and all(k in d for k in ("trilha", "pastas", "aqui")):
        print("  rota midia/navegar: ok")
    elif "erro" in d:
        print(f"  rota midia/navegar: fonte indisponivel com motivo escrito ({codigo})")
    else:
        falhas.append(f"rota midia/navegar: codigo {codigo} sem forma conhecida")

    # o ciclo de escrita: nasce, aparece, morre, some
    conta_prova = "prova-portao"
    codigo, corpo, _ = pedir(base + "/painel/rascunho", cookie,
                             corpo={"dados": {"escolha": {"conta": conta_prova}}})
    if codigo != 200:
        falhas.append(f"escrita rascunho: codigo {codigo}")
        return
    _, corpo, _ = pedir(base + "/painel/rascunho", cookie)
    meus = [r for r in json.loads(corpo).get("rascunhos", [])
            if r.get("conta") == conta_prova]
    if not meus:
        falhas.append("escrita rascunho: gravou mas nao aparece na leitura")
        return
    pedir(base + "/painel/rascunho", cookie, corpo={"apagar": meus[0]["id"]})
    _, corpo, _ = pedir(base + "/painel/rascunho", cookie)
    if any(r.get("conta") == conta_prova
           for r in json.loads(corpo).get("rascunhos", [])):
        falhas.append("escrita rascunho: apagou e continua la")
    else:
        print("  escrita rascunho (nasce/aparece/morre): ok")


def provar_telas(base, cookie, falhas):
    from playwright.sync_api import sync_playwright
    os.makedirs(SAIDA, exist_ok=True)
    erros_js = []
    dominio = base.split("//", 1)[1].split("/")[0].split(":")[0]
    with sync_playwright() as p:
        nav = p.chromium.launch()
        ctx = nav.new_context(viewport={"width": 1440, "height": 900})
        if cookie:
            nome, valor = cookie.split("=", 1)
            ctx.add_cookies([{"name": nome, "value": valor, "domain": dominio,
                              "path": "/"}])
        pag = ctx.new_page()
        pag.on("console", lambda m: erros_js.append(f"console [{m.type}] {m.text}")
               if m.type == "error" else None)
        pag.on("pageerror", lambda e: erros_js.append(f"pageerror {e}"))
        pag.goto(base + "/", wait_until="networkidle")
        for aba in ABAS:
            pag.click(f'.mi[data-pag="{aba}"]')
            pag.wait_for_timeout(1400)
            pag.screenshot(path=os.path.join(SAIDA, f"aba-{aba}.png"))
            print(f"  aba {aba}: aberta")
        # o modo foco entra e volta
        pag.click('.mi[data-pag="painel"]')
        pag.wait_for_timeout(400)
        pag.click("#menu-programar")
        pag.wait_for_timeout(900)
        foco = pag.get_attribute("html", "data-tela")
        pag.screenshot(path=os.path.join(SAIDA, "modo-foco.png"))
        if foco != "foco":
            falhas.append("modo foco nao abriu (data-tela != foco)")
        else:
            print("  modo foco: abriu")
        # o tema escuro nao pode quebrar
        pag.evaluate("document.documentElement.setAttribute('data-theme','dark')")
        pag.wait_for_timeout(400)
        pag.screenshot(path=os.path.join(SAIDA, "tema-escuro.png"))
        nav.close()
    for e in erros_js:
        falhas.append("navegador: " + e[:300])
    if not erros_js:
        print("  console do navegador: limpo")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pasta", default=os.path.join(os.path.dirname(AQUI), "painel"))
    ap.add_argument("--porta", type=int, default=4199)
    ap.add_argument("--url", default="")
    ap.add_argument("--usuario", default="")
    ap.add_argument("--senha-arquivo", default="",
                    help="arquivo com a senha na primeira linha (nunca na linha de comando)")
    ap.add_argument("--sem-telas", action="store_true",
                    help="so as rotas, sem navegador (maquina sem playwright)")
    a = ap.parse_args()

    falhas = []
    servidor = None
    if a.url:
        base = a.url.rstrip("/")
    else:
        if not livre(a.porta):
            print(f"porta {a.porta} ocupada; provando o servidor que ja esta nela")
        else:
            servidor = subprocess.Popen(
                [sys.executable, "servidor.py", str(a.porta)], cwd=a.pasta,
                stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        base = f"http://127.0.0.1:{a.porta}"
    if not esperar(base + "/"):
        print("REPROVA: o servidor nao subiu")
        return 1

    cookie = ""
    try:
        codigo, _, _ = pedir(base + "/painel/rede")
        trancado = codigo == 401
        if a.usuario and not trancado:
            falhas.append("o painel DEVIA exigir login e respondeu sem sessao")
        if trancado:
            if not a.usuario or not a.senha_arquivo:
                print("REPROVA: painel com login; passe --usuario e --senha-arquivo")
                return 1
            with open(a.senha_arquivo, encoding="utf-8") as f:
                senha = f.readline().strip()
            print("tranca:")
            provar_tranca(base, cookie, falhas)
            cookie = entrar(base, a.usuario, senha, falhas)
            if not cookie:
                raise SystemExit(1)
        print("rotas:")
        provar_rotas(base, cookie, falhas)
        print("contas:")
        provar_contas(base, cookie, falhas)
        print("derivadas e escrita:")
        provar_derivadas(base, cookie, falhas)
        if not a.sem_telas:
            print("telas:")
            provar_telas(base, cookie, falhas)
    finally:
        if servidor:
            servidor.terminate()

    if falhas:
        print("\nREPROVA:")
        for f in falhas:
            print("  - " + f)
        return 1
    print("\nPASSA: rotas e telas em ordem, prints em provas/saida/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
