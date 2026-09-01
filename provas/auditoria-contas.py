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
import urllib.error
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


def fora(url, cookie, corpo=None):
    """Um pedido POR FORA DO NAVEGADOR. Serve para conferir uma rota sem deixar o
    erro dela no console da pagina, que aqui e' criterio de aprovacao."""
    cab = {"User-Agent": "auditoria"}
    if cookie:
        cab["Cookie"] = cookie
    dados = None
    if corpo is not None:
        dados = json.dumps(corpo).encode()
        cab["Content-Type"] = "application/json"
    req = urllib.request.Request(url, headers=cab, data=dados)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}
    except Exception as e:
        return "erro", {"erro": type(e).__name__}


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

        # ------------------------------------------------------------ a escrita
        # DUAS LINHAS SAIRAM DA FICHA por ordem dele em 29/08, cada uma por um
        # motivo: "Pastas De Mídia" mostrava um numero do sistema inteiro dentro da
        # ficha de UMA conta, e "Saídas Programadas" repetia a medida "Fila De
        # Vídeos" a dois dedos de distancia. A auditoria guarda o lugar das duas:
        # linha removida costuma voltar sozinha na proxima mexida.
        corpo_ficha = pag.eval_on_selector("#pag-contas .ct-corpo", "e => e.textContent")
        anota("a ficha nao fala mais de pastas de midia",
              "Pastas De Mídia" not in corpo_ficha)
        anota("a ficha nao repete a fila em outra linha",
              "Saídas Programadas" not in corpo_ficha)
        anota("a ficha diz desde quando a conta esta no publicador",
              "No Publicador Desde" in corpo_ficha)
        kpi = pag.eval_on_selector("#ct-kpis", "e => e.textContent")
        anota("os textos de apoio dos numeros nao sao mais rascunho",
              "todas de pé" not in kpi and "a Meta respondeu agora" not in kpi)
        relogio = pag.eval_on_selector("#ct-relogio", "e => e.textContent.trim()")
        anota("o relogio do topo esta escrito por extenso",
              relogio.startswith("Vigiada") or relogio == "Vigiando", relogio)
        # texto de apoio comecando em minuscula era a marca do rascunho anterior
        minusculos = pag.evaluate("""() => [...document.querySelectorAll(
                '#ct-kpis .pe, #pag-contas .ct-m .pe, #pag-contas .ct-tira-pe span')]
            .map(e => e.textContent.trim()).filter(t => t && /^[a-zà-ú]/.test(t))""")
        anota("nenhum texto de apoio comeca em minuscula", not minusculos,
              str(minusculos)[:90])
        # TEXTO CORTADO NAO E TEXTO: ou cabe, ou vai para onde ha espaco. Ja' foram
        # tres correcoes manuais por reticencia nesta aba, entao a regra virou medida.
        cortados = pag.evaluate("""() => [...document.querySelectorAll(
                '#pag-contas .ct-f .pe, #pag-contas .ct-par b, ' +
                '#pag-contas .ct-tira-pe span, #ct-kpis .pe, #ct-kpis .num')]
            .filter(e => e.scrollWidth > e.clientWidth + 1)
            .map(e => e.textContent.trim().slice(0, 30))""")
        anota("nenhum texto aparece cortado na ficha", not cortados,
              str(cortados)[:110])

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
        # ELE RECLAMOU QUE ELA ENTRAVA SECA: a caixa deslizava, mas o conteudo ja'
        # estava inteiro no primeiro quadro. Agora o recheio sobe em cascata.
        casc = pag.evaluate("""() => {
            const c = document.querySelector('.ct-jan-cab');
            const r = document.querySelector('.ct-jan-rolo > *');
            return {cab: c ? getComputedStyle(c).animationName : 'nada',
                    corpo: r ? getComputedStyle(r).animationName : 'nada',
                    atraso: r ? getComputedStyle(r).animationDelay : '0s'};
        }""")
        anota("o recheio da janela entra em cascata, e nao seco",
              casc.get("cab") == "ct-jan-sobe" and casc.get("corpo") == "ct-jan-sobe",
              str(casc))
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

        # O RETRATO AGORA VEM DA META, e nao mais do `analytics.json`: conta
        # recem-ligada nascia sem rosto porque aquele arquivo nao a conhecia ainda.
        _, estado_cru = fora(base + "/contas/estado", cookie)
        com_rosto = [c.get("arroba") for c in estado_cru.get("contas", [])
                     if c.get("avatar")]
        anota("a Meta devolve o retrato das contas",
              len(com_rosto) == len(estado_cru.get("contas", [])),
              f"{len(com_rosto)} de {len(estado_cru.get('contas', []))}: {com_rosto}")

        # A REGRA DO BOTAO, valendo para a tela inteira: icone OU seta, nunca os
        # dois. Foi ele quem escreveu, em 29/08, olhando o Ligar Conta.
        mistura = pag.evaluate("""() => [...document.querySelectorAll('.ct-bt')]
            .filter(b => b.querySelector('.mrc') && b.querySelector('.seta'))
            .map(b => b.textContent.trim().slice(0, 24))""")
        anota("nenhum botao usa icone e seta ao mesmo tempo", not mistura, str(mistura))

        pag.keyboard.press("Escape")
        pag.wait_for_timeout(500)
        anota("Escape fecha a janela", pag.eval_on_selector("#ct-jan", "e => e.hidden"))

        # -------------------------------------------- atualizar o cadastro da conta
        # POR QUE ESTA PROVA IMPORTA MAIS QUE AS OUTRAS: dentro do publicador a conta
        # e' guardada PELO ARROBA, e o arroba e' o unico dado que a pessoa troca no
        # Instagram quando quiser. Sem este botao, trocar o arroba deixaria a tira de
        # 30 dias, o diario, o mercado, as etiquetas e a fila arquivados no nome
        # velho. Nada quebraria em voz alta: a conta so' amanheceria sem passado.
        anota("cada ficha tem o botao de atualizar",
              pag.eval_on_selector_all("[data-atualizar]", "e => e.length") == n,
              f"{pag.eval_on_selector_all('[data-atualizar]', 'e => e.length')} de {n}")
        # ELE NAO PODE USAR O MESMO DESENHO DO TESTAR. Dois circulos girando no mesmo
        # rodape seriam dois botoes que so' se distinguem clicando.
        desenhos = pag.evaluate("""() => {
            const d = e => e && e.querySelector('svg path') ?
                e.querySelector('svg path').getAttribute('d') : '';
            return {at: d(document.querySelector('[data-atualizar]')),
                    te: d(document.querySelector('[data-testar]')),
                    dica: (document.querySelector('[data-atualizar]') || {}).title || ''};
        }""")
        anota("atualizar e testar nao usam o mesmo icone",
              bool(desenhos.get("at")) and desenhos.get("at") != desenhos.get("te"))
        anota("o botao de atualizar diz o que faz ao passar o mouse",
              desenhos.get("dica", "").startswith("Atualizar"), desenhos.get("dica"))

        # O PEDIDO TEM QUE LEVAR O IDENTIFICADOR, e nao so' o arroba. Foi assim que
        # este botao se recusou a funcionar na primeira vez que rodou contra uma
        # conta de verdade, em 01/09: a ficha mostra o arroba NOVO que a Meta
        # devolveu, o cofre ainda guarda o VELHO, e procurar pelo que a tela mostra
        # nao acha nada. O botao respondia "essa conta nao esta no publicador"
        # exatamente no caso que ele existe para resolver.
        rede_at, envios = [], []
        pag.on("request", lambda r: (rede_at.append(r.url),
                                     envios.append(r.post_data or ""))
               if "/contas/atualizar" in r.url else None)
        pag.click("[data-atualizar]")
        pag.wait_for_timeout(500)
        anota("atualizar abre a janela na hora, sem esperar a Meta",
              pag.eval_on_selector("#ct-jan", "e => !e.hidden"))
        anota("a janela de atualizar se apresenta pelo nome",
              "Atualizar Cadastro" in pag.eval_on_selector("#ct-jan-cab",
                                                           "e => e.textContent"))
        pag.wait_for_timeout(7000)
        anota("o botao de atualizar fala com a Meta pelo servidor", bool(rede_at))
        anota("o pedido leva o identificador, e nao so' o arroba da tela",
              bool(envios) and '"ig_user_id":"1' in (envios[0] or "").replace(" ", ""),
              (envios[0] if envios else "nao pediu")[:90])
        corpo_at = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        for parte in ("Arroba", "Foto Do Perfil", "Tipo Da Conta",
                      "Identificador Na Meta"):
            anota(f"a janela de atualizar responde por: {parte}", parte in corpo_at)
        anota("a janela de atualizar nao ficou no 'perguntando'",
              "Perguntando à Meta" not in corpo_at, corpo_at[:60].strip())
        anota("a janela de atualizar da o veredito",
              bool(pag.eval_on_selector_all("#ct-jan-corpo .ct-vered", "e => e.length")))
        # nenhum valor da janela pode sair cortado com reticencia: foram tres
        # correcoes na mao nesta aba antes de isso virar medida
        cortado = pag.evaluate("""() => [...document.querySelectorAll(
                '#ct-jan-corpo .ct-pas .v, #ct-jan .ct-lev em')]
            .filter(e => e.scrollWidth > e.clientWidth + 1)
            .map(e => e.textContent.trim())""")
        anota("nada aparece cortado na janela de atualizar", not cortado, str(cortado))
        pag.screenshot(path=os.path.join(SAIDA, "contas-janela-atualizar.png"))
        pag.keyboard.press("Escape")
        pag.wait_for_timeout(500)

        # O ENDERECO DO RETRATO LEVA CARIMBO. A rota manda o navegador guardar a foto
        # por um dia; sem o carimbo, trocar a foto no Instagram nao apareceria aqui
        # ate' o dia seguinte, e o botao de atualizar pareceria quebrado justamente
        # no caso que ele existe para resolver.
        _, dep_estado = fora(base + "/contas/estado", cookie)
        avatares = [c.get("avatar") or "" for c in dep_estado.get("contas", [])]
        anota("o endereco do retrato leva carimbo de versao",
              bool(avatares) and all("&v=" in u for u in avatares), str(avatares[:2]))

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
        # UM METODO SO', UMA ETAPA POR VEZ. As duas regras sao dele, de 29/08, e a
        # auditoria cobra as duas: nao pode existir seletor de metodo, e a etapa 1
        # nao pode ja' mostrar o campo que e' da etapa 2.
        pag.click('[data-acao="ligar"]')
        pag.wait_for_timeout(2200)
        anota("Ligar Conta abre a janela, e nao o Instagram direto",
              pag.eval_on_selector("#ct-jan", "e => !e.hidden")
              and "instagram.com/oauth" not in pag.url, pag.url[:60])
        anota("nao ha mais de um metodo na tela",
              pag.eval_on_selector_all("#ct-cam, [data-cam]", "e => e.length") == 0)
        pontos = pag.eval_on_selector_all(".ct-trilha i", "e => e.length")
        anota("a trilha mostra as tres etapas", pontos == 3, f"{pontos} ponto(s)")
        anota("a etapa 1 e' a que esta acesa",
              pag.eval_on_selector(".ct-trilha i", "e => e.classList.contains('agora')"))
        et1 = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        anota("a etapa 1 pede uma coisa so': gerar o token",
              "Gere O Token Na Meta" in et1)
        anota("a etapa 1 NAO mostra o campo da etapa 2",
              pag.eval_on_selector_all("#ct-token", "e => e.length") == 0)
        anota("a etapa 1 leva ao painel da Meta",
              pag.eval_on_selector_all(
                  '#ct-jan-corpo a[href*="developers.facebook.com"]', "e => e.length") == 1)
        pag.screenshot(path=os.path.join(SAIDA, "contas-ligar-1.png"))

        pag.click('[data-acao="etapa-avancar"]')
        pag.wait_for_timeout(700)
        et2 = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        anota("avancar leva para a etapa 2", "Cole O Token Aqui" in et2)
        anota("a etapa 2 tem o campo do token",
              pag.eval_on_selector_all("#ct-token", "e => e.length") == 1)
        anota("a etapa 2 nao repete o texto da etapa 1",
              "Gere O Token Na Meta" not in et2)
        anota("a etapa 2 tem como voltar",
              pag.eval_on_selector_all('[data-acao="etapa-voltar"]', "e => e.length") == 1)
        pag.screenshot(path=os.path.join(SAIDA, "contas-ligar-2.png"))

        # ligar sem token nao pode disparar pedido, e tem que avisar em vez de calar
        antes_pedidos = len([u for u in rede if "/contas/colar" in u])
        pag.click('[data-acao="colar"]')
        pag.wait_for_timeout(800)
        anota("ligar sem token nao chama o servidor",
              len([u for u in rede if "/contas/colar" in u]) == antes_pedidos)
        anota("ligar sem token avisa em vez de calar",
              pag.eval_on_selector_all(".ct-erro", "e => e.length") == 1)

        pag.click('[data-acao="etapa-voltar"]')
        pag.wait_for_timeout(600)
        anota("voltar retorna para a etapa 1",
              "Gere O Token Na Meta" in pag.eval_on_selector("#ct-jan-corpo",
                                                             "e => e.textContent"))

        # A rota que a etapa 2 usa e' de verdade: token inventado leva recusa da META,
        # e a recusa chega escrita. Rota que engole erro de token grava conta pela
        # metade, com o cofre mexido e nada funcionando.
        #
        # ELA E CHAMADA POR FORA DO NAVEGADOR, de proposito. Um `fetch` daqui de
        # dentro deixaria o 400 no console, e o console limpo e' criterio de aprovacao
        # nesta casa: prova que suja a propria medida nao serve.
        codigo, resposta = fora(base + "/contas/colar", cookie,
                                {"token": "IG" + "Q" * 70})
        anota("colar token inventado leva recusa escrita da Meta",
              codigo == 400 and bool(resposta.get("erro")),
              str(resposta.get("erro", ""))[:70])

        pag.mouse.click(20, 20)
        pag.wait_for_timeout(500)
        anota("clicar fora fecha a janela", pag.eval_on_selector("#ct-jan", "e => e.hidden"))

        # ------------------------------------- as duas saidas: desligar e remover
        # A AUDITORIA NAO APERTA NENHUM DOS DOIS. Desligar apagaria o acesso de uma
        # conta viva e remover apagaria o passado dela: prova que estraga o que ela
        # mede nao e' prova. O que se confere e' a JANELA, e a trava do vermelho.
        anota("o botao de tirar do publicador existe",
              pag.eval_on_selector_all("[data-desligar]", "e => e.length") == n)
        pag.click("[data-desligar]")
        pag.wait_for_timeout(600)
        anota("ele abre a janela, e nao um confirm do navegador",
              pag.eval_on_selector("#ct-jan", "e => !e.hidden"))
        corpo_saida = pag.eval_on_selector("#ct-jan-corpo", "e => e.textContent")
        for parte in ("Desligar", "Remover", "Não tem volta"):
            anota(f"a janela de saida explica: {parte}", parte in corpo_saida)
        anota("a janela diz que o Instagram nao e' tocado",
              "Instagram" in pag.eval_on_selector("#ct-jan-pe", "e => e.textContent"))
        # O VERMELHO NASCE TRAVADO. E' a unica acao da aba que apaga passado, e ela
        # nao pode sair de um clique torto.
        travado = pag.evaluate("""() => {
            const b = document.querySelector('[data-acao="saida-remover"]');
            const d = document.querySelector('[data-acao="saida-desligar"]');
            return {remover: b ? b.disabled : null, desligar: d ? d.disabled : null};
        }""")
        anota("Remover nasce travado", travado.get("remover") is True, str(travado))
        anota("Desligar nao nasce travado", travado.get("desligar") is False)
        # digitar errado nao destrava; digitar o arroba destrava
        pag.fill("#ct-jura", "conta-errada")
        pag.wait_for_timeout(250)
        anota("arroba errado NAO destrava o Remover",
              pag.eval_on_selector('[data-acao="saida-remover"]', "e => e.disabled"))
        pag.fill("#ct-jura", arroba)
        pag.wait_for_timeout(250)
        anota("o arroba certo destrava o Remover",
              pag.eval_on_selector('[data-acao="saida-remover"]',
                                   "e => !e.disabled"), "@" + arroba)
        pag.keyboard.press("Escape")
        pag.wait_for_timeout(500)
        anota("Escape fecha a janela de saida sem tirar nada",
              pag.eval_on_selector("#ct-jan", "e => e.hidden"))
        _, dep_saida = fora(base + "/contas/estado", cookie)
        anota("nenhuma conta saiu durante a auditoria",
              len(dep_saida.get("contas", [])) == n,
              f"{len(dep_saida.get('contas', []))} de {n}")

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
