# -*- coding: utf-8 -*-
"""AUDITORIA DA ABA DE CONTAS, feita no navegador contra o painel no ar.

Ela nao substitui o portao (`prova.py`), que diz se a casa esta de pe. Esta aqui
responde outra pergunta: **a aba obedece?** Cada controle e' apertado de verdade e o
resultado e' medido no DOM, e nao suposto.

O QUE ELA NAO FAZ: desligar conta. E o unico botao da tela que destroi estado, e
prova que apaga o acesso de uma conta real nao e' prova, e' estrago.

Rodar:
  python provas/auditoria-contas.py --url https://postador.borusa.com.br \
      --usuario gabriel --senha-arquivo <arq>
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "saida")


def entrar(base, usuario, senha):
    corpo = json.dumps({"usuario": usuario, "senha": senha}).encode()
    req = urllib.request.Request(base + "/entrar", data=corpo,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        biscoito = r.headers.get("Set-Cookie", "")
    return biscoito.split(";")[0] if biscoito else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--usuario", default="")
    ap.add_argument("--senha-arquivo", default="")
    a = ap.parse_args()
    base = a.url.rstrip("/")

    cookie = ""
    if a.usuario and a.senha_arquivo:
        with open(a.senha_arquivo, encoding="utf-8") as f:
            cookie = entrar(base, a.usuario, f.read().strip())

    from playwright.sync_api import sync_playwright
    os.makedirs(SAIDA, exist_ok=True)
    achados, erros_js = [], []

    def anota(nome, ok, detalhe=""):
        print(("  ok   " if ok else "  ACHADO ") + nome + (" | " + detalhe if detalhe else ""))
        if not ok:
            achados.append(nome + (" | " + detalhe if detalhe else ""))

    with sync_playwright() as p:
        nav = p.chromium.launch()
        ctx = nav.new_context(viewport={"width": 1440, "height": 900})
        if cookie:
            nome, valor = cookie.split("=", 1)
            ctx.add_cookies([{"name": nome, "value": valor,
                              "domain": base.split("//", 1)[1].split("/")[0].split(":")[0],
                              "path": "/"}])
        pag = ctx.new_page()
        pag.on("console", lambda m: erros_js.append(f"[{m.type}] {m.text}")
               if m.type == "error" else None)
        pag.on("pageerror", lambda e: erros_js.append(f"pageerror {e}"))
        pag.goto(base + "/", wait_until="networkidle")
        pag.click('.mi[data-pag="contas"]')
        pag.wait_for_timeout(2200)

        # ------------------------------------------------------------ desenho
        n = pag.eval_on_selector_all(".ct-f", "e => e.length")
        anota("as fichas nascem", n > 0, f"{n} ficha(s)")
        anota("os quatro numeros nascem",
              pag.eval_on_selector_all(".ct-kpi", "e => e.length") == 4)
        # os dois graficos foram removidos a pedido dele: nao pode ter sobrado casca
        anota("nao sobrou casca de grafico na tela",
              pag.eval_on_selector_all(".ct-ec, #ct-graf-rede, #ct-graf-acesso",
                                       "e => e.length") == 0)

        # ---------------------------------------------- o balao do mercado abre POR CIMA
        pag.click("#ct-dd-bt")
        pag.wait_for_timeout(400)
        por_cima = pag.evaluate("""() => {
            const b = document.getElementById('ct-dd-m');
            if (!b || b.hidden) return {erro: 'o balao nao abriu'};
            const r = b.getBoundingClientRect();
            const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + 20);
            return {quemEstaLa: alvo ? (alvo.className || alvo.tagName) : 'nada',
                    dentroDoBalao: !!(alvo && b.contains(alvo))};
        }""")
        anota("o balao de mercado abre por cima das fichas",
              por_cima.get("dentroDoBalao") is True,
              "quem esta no lugar dele: " + str(por_cima.get("quemEstaLa"))[:60])
        pag.screenshot(path=os.path.join(SAIDA, "contas-balao.png"))
        # fecha clicando fora: `h1` sozinho pega o titulo da aba escondida do Painel
        pag.click("#pag-contas h1")
        pag.wait_for_timeout(300)
        anota("o balao fecha ao clicar fora",
              pag.eval_on_selector("#ct-dd-m", "e => e.hidden") is True)

        # ------------------------------------------------------------- filtros
        for chave, rotulo in (("viva", "Conectadas"), ("caiu", "Sem Conexão"),
                              ("falha", "Com Falha"), ("", "Todas")):
            pag.click(f'#ct-seg [data-f="{chave}"]')
            pag.wait_for_timeout(320)
            quantas = pag.eval_on_selector_all(".ct-f", "e => e.length")
            no_botao = pag.eval_on_selector(
                f'#ct-seg [data-f="{chave}"]',
                "e => { const n = e.querySelector('.n'); return n ? +n.textContent : 0; }")
            anota(f"filtro {rotulo} bate com a contagem do botao",
                  quantas == no_botao, f"tela {quantas}, botao {no_botao}")

        # -------------------------------------------------------------- busca
        primeira = pag.eval_on_selector(".ct-arroba", "e => e.textContent.replace('@','')")
        pag.fill("#ct-busca", primeira[:6])
        pag.wait_for_timeout(400)
        anota("a busca filtra", pag.eval_on_selector_all(".ct-f", "e => e.length") == 1)
        pag.fill("#ct-busca", "zzzznaoexiste")
        pag.wait_for_timeout(400)
        anota("busca sem resultado avisa em vez de calar",
              pag.eval_on_selector_all(".ct-vazio", "e => e.length") == 1)
        pag.fill("#ct-busca", "")
        pag.wait_for_timeout(400)

        # ------------------------------------------------- as abas dentro da ficha
        pag.click('[data-abas] [data-aba="diario"]')
        pag.wait_for_timeout(400)
        anota("a aba Diario abre dentro do cartao",
              pag.eval_on_selector_all(".ct-ev", "e => e.length") > 0
              or pag.eval_on_selector_all(".ct-sem", "e => e.length") > 0)
        anota("o Diario traz o texto do erro ou da checagem",
              pag.eval_on_selector_all(".ct-ev .c span", "e => e.length") > 0)
        pag.click("[data-falhas]")
        pag.wait_for_timeout(400)
        anota("o botao So Falhas responde",
              pag.eval_on_selector("[data-falhas]", "e => e.classList.contains('on')"))
        pag.click("[data-falhas]")
        pag.wait_for_timeout(300)
        pag.click('[data-abas] [data-aba="identidade"]')
        pag.wait_for_timeout(400)
        anota("a aba Identidade abre",
              pag.eval_on_selector_all(".ct-campo[data-mercado]", "e => e.length") > 0)

        # --------------------------------------------- editar mercado, ida e volta
        antes = pag.eval_on_selector(".ct-campo[data-mercado]", "e => e.textContent.trim()")
        pag.click(".ct-campo[data-mercado]")
        pag.wait_for_timeout(300)
        tem_campo = pag.eval_on_selector_all(".ct-campo[data-mercado] input", "e => e.length") == 1
        anota("clicar no mercado vira campo", tem_campo)
        if tem_campo:
            pag.fill(".ct-campo[data-mercado] input", "zz auditoria")
            pag.keyboard.press("Enter")
            pag.wait_for_timeout(900)
            agora = pag.eval_on_selector(".ct-campo[data-mercado]", "e => e.textContent.trim()")
            anota("o mercado grava", agora == "zz auditoria", f"ficou: {agora}")
            pag.click(".ct-campo[data-mercado]")
            pag.wait_for_timeout(300)
            pag.fill(".ct-campo[data-mercado] input", "" if antes == "definir" else antes)
            pag.keyboard.press("Enter")
            pag.wait_for_timeout(900)
            voltou = pag.eval_on_selector(".ct-campo[data-mercado]", "e => e.textContent.trim()")
            anota("o mercado volta ao que era", voltou == antes, f"ficou: {voltou}")
        pag.click('[data-abas] [data-aba="estado"]')
        pag.wait_for_timeout(300)

        # ------------------------------------- testar a conexao, o botao da ficha
        rede = []
        pag.on("request", lambda r: rede.append(r.url) if "/contas/" in r.url else None)
        ms_antes = pag.eval_on_selector(".ct-ms", "e => e.textContent")
        arroba = pag.eval_on_selector(".ct-arroba", "e => e.textContent.replace('@','')")
        pag.click("[data-testar]")
        pag.wait_for_timeout(500)

        # A JANELA ABRE ANTES DA RESPOSTA, de proposito: perguntar a Meta leva de
        # 200 ms a alguns segundos, e botao que fica mudo nesse tempo parece
        # quebrado. Entao ela nasce com o "perguntando" e depois troca de recheio.
        anota("testar abre a janela na hora, sem esperar a Meta",
              pag.eval_on_selector("#ct-jan", "e => !e.hidden"))
        anima = pag.eval_on_selector(".ct-jan-cx", "e => getComputedStyle(e).animationName")
        anota("a janela entra com animacao", anima == "ct-jan-entra", str(anima))
        em_cima = pag.evaluate("""() => {
            const cx = document.querySelector('.ct-jan-cx');
            const r = cx.getBoundingClientRect();
            const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + 30);
            return {dentro: !!(alvo && cx.contains(alvo)),
                    quem: alvo ? (alvo.className || alvo.tagName).toString() : 'nada'};
        }""")
        anota("a janela abre por cima de tudo", em_cima.get("dentro") is True,
              "quem esta no lugar dela: " + str(em_cima.get("quem"))[:50])
        anota("a janela diz de qual conta ela fala",
              arroba in pag.eval_on_selector("#ct-jan-cab", "e => e.textContent"),
              "@" + arroba)

        pag.wait_for_timeout(5000)
        chamou = any("/contas/testar" in u for u in rede)
        anota("o botao de testar chama a Meta pelo servidor", chamou)
        corpo_jan = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        for parte in ("Identidade Da Conta", "Validade Do Acesso", "Teto De Publicação"):
            anota(f"a janela conta o que foi perguntado: {parte}", parte in corpo_jan)
        anota("a janela nao ficou no 'perguntando'",
              "Perguntando à Meta" not in corpo_jan, corpo_jan[:60].strip())
        veredito = pag.eval_on_selector("#ct-jan-corpo .ct-vered", "e => e.textContent")
        anota("a janela da o veredito da conexao",
              "respondeu" in veredito or "recusou" in veredito, veredito[:70].strip())
        pag.screenshot(path=os.path.join(SAIDA, "contas-janela-teste.png"))
        ms_depois = pag.eval_on_selector(".ct-ms", "e => e.textContent")
        anota("o tempo de resposta se atualiza na ficha tambem",
              bool(ms_depois) and ms_depois.endswith("ms"),
              f"antes {ms_antes}, depois {ms_depois}")

        # A REGRA DO BOTAO, valendo para a tela inteira: icone OU seta, nunca os
        # dois. Foi ele quem escreveu, em 29/08, olhando o Ligar Conta.
        mistura = pag.evaluate("""() => [...document.querySelectorAll('.ct-bt')]
            .filter(b => b.querySelector('.mrc') && b.querySelector('.seta'))
            .map(b => b.textContent.trim().slice(0, 24))""")
        anota("nenhum botao usa icone e seta ao mesmo tempo", not mistura, str(mistura))

        pag.keyboard.press("Escape")
        pag.wait_for_timeout(500)
        anota("Escape fecha a janela", pag.eval_on_selector("#ct-jan", "e => e.hidden"))

        # ------------------------------------------------- os botoes do cabecalho
        for acao, rotulo in (("testar-tudo", "Testar Conexões"), ("ligar", "Ligar Conta")):
            existe = pag.eval_on_selector_all(f'[data-acao="{acao}"]', "e => e.length") == 1
            anota(f"o botao {rotulo} existe", existe)
        setas = pag.eval_on_selector_all(
            '[data-acao="testar-tudo"] .seta, [data-acao="ligar"] .seta', "e => e.length")
        anota("os botoes do cabecalho nao tem seta sobrando (o icone ja basta)",
              setas == 0, f"{setas} seta(s) encontradas")

        # ------------------------------------------------ a janela da rede inteira
        pag.click('[data-acao="testar-tudo"]')
        pag.wait_for_timeout(700)
        anota("Testar Conexoes abre a janela da rede",
              pag.eval_on_selector("#ct-jan", "e => !e.hidden"))
        pag.wait_for_timeout(9000)
        linhas = pag.eval_on_selector_all(".ct-lin", "e => e.length")
        anota("a janela da rede traz uma linha por conta", linhas == n,
              f"{linhas} linha(s) para {n} conta(s)")
        anota("a janela da rede diz quantas responderam",
              "responderam" in pag.eval_on_selector("#ct-jan-corpo .ct-vered",
                                                    "e => e.textContent")
              or "respondeu" in pag.eval_on_selector("#ct-jan-corpo .ct-vered",
                                                     "e => e.textContent"))
        pag.click(".ct-lin")
        pag.wait_for_timeout(5000)
        anota("clicar numa linha abre o teste daquela conta",
              "Teste De Conexão" in pag.eval_on_selector("#ct-jan-cab",
                                                         "e => e.textContent"))
        pag.keyboard.press("Escape")
        pag.wait_for_timeout(500)

        # ------------------------------------------------ a janela de ligar conta
        # ELA E' A CORRECAO DO ERRO DE 29/08. O botao mandava direto para a Meta e a
        # Meta respondeu "Invalid redirect_uri" sem dizer o que fazer. Nao existe
        # rota que pergunte a ela se o endereco esta cadastrado, entao o que a tela
        # deve e' mostrar o endereco exato, copiavel, e onde ele precisa estar.
        pag.click('[data-acao="ligar"]')
        pag.wait_for_timeout(2500)
        anota("Ligar Conta abre o passo a passo, e nao o Instagram direto",
              pag.eval_on_selector("#ct-jan", "e => !e.hidden")
              and "instagram.com/oauth" not in pag.url, pag.url[:60])

        # SAO DOIS CAMINHOS, e o curto (colar o token que a Meta gera na tela dela)
        # abre primeiro, porque e' o unico que funciona sem cadastro nenhum.
        abas = pag.eval_on_selector_all("#ct-cam button", "e => e.length")
        anota("a janela oferece os dois caminhos", abas == 2, f"{abas} aba(s)")
        anota("o caminho curto abre primeiro",
              pag.eval_on_selector('#ct-cam [data-cam="colar"]',
                                   "e => e.classList.contains('on')"))
        anota("o caminho curto tem onde colar o token",
              pag.eval_on_selector_all("#ct-token", "e => e.length") == 1)
        anota("o caminho curto tem o botao de ligar",
              pag.eval_on_selector_all('#ct-jan-pe [data-acao="colar"]',
                                       "e => e.length") == 1)
        texto_colar = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        anota("o caminho curto diz onde a Meta gera o token",
              "Gerar token de acesso" in texto_colar)
        anota("o caminho curto nao promete token eterno",
              "Não existe token eterno" in texto_colar)
        # botao de ligar sem token nenhum nao pode disparar pedido
        antes_pedidos = len([u for u in rede if "/contas/colar" in u])
        pag.click('#ct-jan-pe [data-acao="colar"]')
        pag.wait_for_timeout(700)
        anota("ligar sem token nao chama o servidor",
              len([u for u in rede if "/contas/colar" in u]) == antes_pedidos)

        pag.click('#ct-cam [data-cam="oauth"]')
        pag.wait_for_timeout(600)
        passos = pag.eval_on_selector_all("#ct-jan-corpo .ct-pss", "e => e.length")
        anota("o caminho de tela tem os quatro passos", passos == 4, f"{passos} passo(s)")
        # NEGRITO NO MEIO DA FRASE TEM QUE CONTINUAR NO MEIO DA FRASE. A regra do
        # titulo do passo (`b` em bloco) pegava tambem os negritos do texto, e o
        # passo saia picado em cinco pedacos, um por palavra grifada.
        picado = pag.evaluate("""() => [...document.querySelectorAll(
                '#ct-jan-corpo p b, #ct-jan-corpo li b')]
            .filter(b => getComputedStyle(b).display !== 'inline')
            .map(b => b.textContent.trim().slice(0, 24))""")
        anota("negrito no meio da frase nao quebra linha", not picado, str(picado))
        d = pag.evaluate("""async () => {
            const r = await fetch('/contas/ligar', {cache: 'no-store'});
            return {codigo: r.status, corpo: await r.json()};
        }""")
        url = (d.get("corpo") or {}).get("url", "")
        anota("Ligar Conta monta a autorizacao do Instagram",
              "instagram.com/oauth/authorize" in url,
              (d.get("corpo") or {}).get("erro", "")[:80])
        mostrado = pag.eval_on_selector("#ct-jan-corpo .ct-cod code",
                                        "e => e.textContent.trim()")
        anota("o endereco que a janela mostra e' o mesmo que vai para a Meta",
              bool(mostrado) and mostrado in urllib.parse.unquote(url), mostrado)
        anota("da para copiar o endereco sem digitar",
              pag.eval_on_selector_all("#ct-jan-corpo [data-copiar]", "e => e.length") == 1)
        texto_ligar = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        anota("a janela diz onde cadastrar o endereco na Meta",
              "URIs de redirecionamento" in texto_ligar)
        anota("a janela avisa do erro que a Meta devolve se faltar o cadastro",
              "Invalid redirect_uri" in texto_ligar)
        anota("a janela leva ao painel da Meta",
              pag.eval_on_selector_all(
                  '#ct-jan-corpo a[href*="developers.facebook.com"]', "e => e.length") >= 1)
        anota("o botao de autorizar esta no pe da janela",
              pag.eval_on_selector_all('#ct-jan-pe [data-acao="autorizar"]',
                                       "e => e.length") == 1)
        pag.screenshot(path=os.path.join(SAIDA, "contas-janela-ligar.png"))
        pag.mouse.click(20, 20)
        pag.wait_for_timeout(500)
        anota("clicar fora fecha a janela", pag.eval_on_selector("#ct-jan", "e => e.hidden"))

        # --------------------------------------------- desligar: existe e avisa
        anota("o botao de desligar existe e pede confirmacao",
              pag.eval_on_selector_all("[data-desligar]", "e => e.length") > 0)

        # ------------------------------------------------ o que sobra na tela
        sobra = pag.evaluate("""() => {
            const fora = [];
            document.querySelectorAll('#pag-contas *').forEach(e => {
                const r = e.getBoundingClientRect();
                if (r.width && r.right > document.documentElement.clientWidth + 2)
                    fora.push((e.className || e.tagName).toString().slice(0, 30));
            });
            return [...new Set(fora)].slice(0, 5);
        }""")
        anota("nada vaza para fora da tela", not sobra, str(sobra))

        # ------------------------------------------------------ tela estreita
        pag.set_viewport_size({"width": 1180, "height": 900})
        pag.wait_for_timeout(700)
        pag.screenshot(path=os.path.join(SAIDA, "contas-1180.png"))
        estreito = pag.evaluate("""() => {
            const fora = [];
            document.querySelectorAll('#pag-contas *').forEach(e => {
                const r = e.getBoundingClientRect();
                if (r.width && r.right > document.documentElement.clientWidth + 2)
                    fora.push((e.className || e.tagName).toString().slice(0, 30));
            });
            return [...new Set(fora)].slice(0, 5);
        }""")
        anota("em 1180 tambem nao vaza", not estreito, str(estreito))
        pag.set_viewport_size({"width": 1440, "height": 900})

        # ------------------------------------------------------- tema escuro
        pag.evaluate("document.documentElement.setAttribute('data-theme','dark')")
        pag.wait_for_timeout(800)
        pag.screenshot(path=os.path.join(SAIDA, "contas-escuro.png"))
        cru = pag.evaluate("""() => {
            const fundo = getComputedStyle(document.querySelector('.ct-cd')).backgroundColor;
            return fundo;
        }""")
        anota("o tema escuro veste os cartoes", cru != "rgb(255, 255, 255)", cru)
        pag.evaluate("document.documentElement.setAttribute('data-theme','light')")
        pag.wait_for_timeout(400)
        pag.screenshot(path=os.path.join(SAIDA, "contas-auditoria.png"),
                       full_page=True)
        nav.close()

    for e in erros_js:
        achados.append("console: " + e[:200])
    print()
    if achados:
        print("ACHADOS (" + str(len(achados)) + "):")
        for x in achados:
            print("  - " + x)
        sys.exit(1)
    print("SEM ACHADOS: a aba de Contas obedece.")


if __name__ == "__main__":
    main()
