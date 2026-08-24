# -*- coding: utf-8 -*-
"""O PORTAO DE PROVAS do painel. Reprovou, nao sobe. Passou, pode subir.

O que ele prova, em ordem:
  1. O servidor sobe e responde.
  2. Cada rota de dados devolve 200 com o formato esperado.
  3. Cada aba abre no navegador de verdade SEM NENHUM erro de console.
  4. O modo foco (Programar publicacoes) abre e volta.
  5. Um print por aba fica em provas/saida/ para conferencia de olho.

Uso:
  python prova.py                     -> prova o painel do proprio repositorio
  python prova.py --pasta CAMINHO     -> prova outro painel local
  python prova.py --url https://...   -> prova um painel ja no ar (nao sobe servidor)

Sai com codigo 0 quando passa e 1 quando reprova, para travar deploy em script.
"""
import argparse
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "saida")

# Cada rota com a prova do seu formato: (rota, chave que tem que existir na resposta).
# Chave vazia = basta o 200 com JSON valido. As rotas de pagina html ficam fora daqui.
ROTAS = [
    ("painel/rede", ("contas", "resumo", "serie", "semana")),
    ("perfis", ("perfis",)),
    ("calendario/saidas", ("saidas",)),
    ("midia/estado", ("fonte", "pronta")),
    ("midia/ligadas", ("pastas",)),
    ("contas/meta", ("contas",)),
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
        except Exception:
            time.sleep(0.3)
    return False


def pedir(url):
    req = urllib.request.Request(url, headers={"User-Agent": "prova"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, r.read()


def provar_rotas(base, falhas):
    for rota, chaves in ROTAS:
        try:
            codigo, corpo = pedir(base + "/" + rota)
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
        codigo, corpo = pedir(base + "/")
        if codigo != 200 or b"Publicador" not in corpo:
            falhas.append("pagina inicial nao parece o painel")
        else:
            print("  pagina inicial: ok")
    except Exception as e:
        falhas.append(f"pagina inicial: {e}")


def provar_telas(base, falhas):
    from playwright.sync_api import sync_playwright
    os.makedirs(SAIDA, exist_ok=True)
    erros_js = []
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pag = nav.new_page(viewport={"width": 1440, "height": 900})
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
        pag.click("#fc-voltar") if pag.query_selector("#fc-voltar") else None
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

    try:
        print("rotas:")
        provar_rotas(base, falhas)
        if not a.sem_telas:
            print("telas:")
            provar_telas(base, falhas)
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
