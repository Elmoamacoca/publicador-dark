# -*- coding: utf-8 -*-
"""A ABA DE CONTAS POR DENTRO: o acesso, a vigilancia e o diario de cada conta.

O QUE ESTA ABA RESPONDE, e o que ela nao responde. Ela responde UMA pergunta, de
tres maneiras: **esta conta esta de pe?** Pela conexao (a Meta respondeu agora?),
pelo acesso (quantos dias faltam para vencer?) e pelo que trava a operacao (teto do
dia, fila e falha). Seguidor e publicacao NAO moram aqui: isso e' desempenho, e
desempenho e' assunto da aba de Analytics.

AS QUATRO PECAS:

  1. O COFRE (`dados/contas.json`). Arroba, identificador e token de cada conta.
     E' estado: nunca entra no git, o servidor recusa servir esse caminho por http, e
     nenhuma resposta desta casa carrega o token.

  2. A VIGILANCIA. Uma vez por dia (cron da VPS) e sempre que alguem apertar o botao:
     pergunta a Meta conta a conta, classifica em viva, vencendo ou caiu, e **renova o
     acesso sozinho** faltando dez dias. Cada rodada deixa duas marcas no livro-caixa:
     uma linha no historico do dia e, quando algo digno de nota acontece, uma linha no
     diario.

  3. O HISTORICO (`vigia_dia`). Um registro por dia e por conta. E' dele que sai a tira
     de trinta dias da tela: sem guardar, "esta de pe agora" seria a unica coisa que a
     tela saberia dizer, e "esteve de pe ate agora" e' metade da resposta.

  4. O DIARIO (`conta_evento`). Checagem, renovacao, falha de publicacao, conta ligada
     e desligada. **E' aqui que se audita**, e por isso ele abre dentro do proprio
     cartao da conta, sem trocar de tela.

LIGAR CONTA E' DE VERDADE. O caminho e' o do Instagram com login do Instagram: a
pessoa autoriza no site do Instagram, volta com um codigo, o codigo vira um token de
uma hora e o token de uma hora vira um de sessenta dias. As credenciais do aplicativo
moram em `dados/app_meta.json`, junto do cofre.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

PASTA = pathlib.Path(__file__).parent
DADOS = PASTA / "dados"
COFRE = DADOS / "contas.json"          # arroba, identificador e token. Nunca sai daqui.
APP = DADOS / "app_meta.json"          # o aplicativo da Meta: numero e segredo.
VIGIA = DADOS / "vigia.json"           # o retrato da ultima rodada.

BASE = "https://graph.instagram.com/v23.0"
RENOVACAO = "https://graph.instagram.com/refresh_access_token"
TROCA = "https://graph.instagram.com/access_token"
AUTORIZAR = "https://www.instagram.com/oauth/authorize"
CODIGO = "https://api.instagram.com/oauth/access_token"
PERMISSOES = "instagram_business_basic,instagram_business_content_publish"

# Quantos dias antes do vencimento o acesso e' renovado sozinho. Dez da folga para
# tentar de novo por varios dias seguidos se a Meta estiver fora do ar, e ainda assim
# nunca renova cedo demais (a Meta recusa token com menos de 24 horas de vida).
RENOVAR_FALTANDO = 10
# A partir de quantos dias a tela mostra o aviso de vencimento.
AVISAR_FALTANDO = 14
# Por quanto tempo o resultado guardado serve sem perguntar a Meta de novo. F5 na tela
# nao pode virar chamada nova: a Meta tem teto de chamadas e a resposta muda devagar.
VALIDADE_DO_CACHE = 15 * 60
# Quantos dias a tira da tela mostra.
JANELA = 30

PISTAS = {
    190: "Token invalido ou expirado. A conta precisa ser religada.",
    200: "Falta permissao para essa conta.",
    100: "Parametro errado. Confira o identificador da conta.",
    4: "Teto de chamadas da Meta estourado. Tente mais tarde.",
    9: "Teto de publicacao da conta atingido nas ultimas 24 horas.",
    10: "A conta nao autorizou esta permissao.",
    24: "A Meta nao conseguiu baixar o video. A URL precisa ser publica.",
}


# ============================================================== o basico
def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def hoje() -> str:
    """O dia NO FUSO DE SAO PAULO. Numa VPS em UTC o dia cru vira amanha as 21h, e a
    tira da tela ganharia uma coluna que ainda nao existe."""
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo("America/Sao_Paulo")).date().isoformat()


def _ler(caminho: pathlib.Path, padrao):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except Exception:
        return padrao


def _gravar(caminho: pathlib.Path, dados, indentado: bool = True,
            segredo: bool = True) -> None:
    """Grava de forma atomica: escreve ao lado e troca de uma vez so'.

    Mesma regra do resto da casa. Aqui ela pesa mais que em qualquer outro lugar:
    este arquivo guarda o token renovado, e um arquivo pela metade seria uma conta
    fora do ar sem ninguem ter mexido em nada.

    OS DOIS INTERRUPTORES SAO PARA ARQUIVO DE FORA. O `analytics.json` nao e' desta
    casa: quem o escreve e' o montador, ele carrega retrato em base64 e pesa. Ali
    identar so' engorda, e trancar em 0600 seria esta funcao decidindo a permissao
    de um arquivo que nao e' dela.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    provisorio = caminho.with_suffix(caminho.suffix + ".novo")
    provisorio.write_text(
        json.dumps(dados, ensure_ascii=False, indent=2 if indentado else None),
        encoding="utf-8")
    os.replace(provisorio, caminho)
    if segredo:
        try:
            os.chmod(caminho, 0o600)
        except Exception:
            pass


def _chamar(url: str, token: str | None = None, dados: dict | None = None,
            tentativas: int = 3):
    """Devolve (ok, corpo). Nunca levanta excecao: quem chama decide o que fazer."""
    cabecalho = {"Authorization": "Bearer " + token} if token else {}
    corpo = urllib.parse.urlencode(dados).encode() if dados else None
    for tentativa in range(tentativas):
        try:
            pedido = urllib.request.Request(url, data=corpo, headers=cabecalho)
            with urllib.request.urlopen(pedido, timeout=30) as r:
                return True, json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                if tentativa == tentativas - 1:
                    try:
                        return False, json.loads(e.read().decode())
                    except Exception:
                        return False, {"error": {"message": f"HTTP {e.code}",
                                                 "code": e.code}}
                time.sleep(2 ** tentativa)
                continue
            try:
                return False, json.loads(e.read().decode())
            except Exception:
                return False, {"error": {"message": f"HTTP {e.code}", "code": e.code}}
        except Exception as e:
            if tentativa == tentativas - 1:
                return False, {"error": {"message": str(e)}}
            time.sleep(2 ** tentativa)
    return False, {"error": {"message": "falhou"}}


def _erro(payload: dict) -> str:
    """O texto do erro NAO carrega credencial: a Meta nunca poe token na mensagem."""
    if not isinstance(payload, dict):
        return "resposta ilegivel da Meta"
    erro = payload.get("error", {})
    if isinstance(erro, str):                       # o oauth responde noutro formato
        return f"[{payload.get('error_type', 'oauth')}] " + \
               str(payload.get("error_message") or erro)
    codigo = erro.get("code")
    texto = erro.get("message", "sem mensagem")
    pista = PISTAS.get(codigo, "")
    return f"[{codigo}] {texto}" + (f" | {pista}" if pista else "")


def _data(valor):
    if not valor:
        return None
    try:
        d = datetime.fromisoformat(str(valor).replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def dias_para_vencer(conta: dict):
    vence = _data(conta.get("vence_em"))
    if not vence:
        return None
    return (vence - datetime.now(timezone.utc)).days


def limpo(a: str) -> str:
    return (a or "").lstrip("@").strip().lower()


# ============================================================== o retrato
RETRATOS = DADOS / "retratos"


def _nome_de_arquivo(arroba: str) -> str:
    """So' o que pode virar nome de arquivo sem surpresa.

    NAO E' PARANOIA: o arroba vem da Meta, mas ele acaba num caminho de disco, e
    caminho montado com texto de fora e' como se abre a porta para `../../`.
    """
    return "".join(ch for ch in limpo(arroba)
                   if ch.isalnum() or ch in "._-")[:64]


def guardar_retrato(arroba: str, url: str, forcar: bool = False) -> bool:
    """Baixa a foto do perfil e guarda em disco.

    QUEM BUSCA E O SERVIDOR, e nao a tela. O CDN da Meta recusa a imagem quando o
    pedido vem de outra pagina, entao apontar a tag `img` direto para la' rende
    quadrado quebrado e o console cheio de erro. Medido em 29/08, com as tres
    contas: todas recusadas no navegador, todas servidas aqui.

    A FOTO E BAIXADA UMA VEZ POR DIA. O endereco da Meta muda toda hora, mas a foto
    nao, e a vigilancia roda a cada quinze minutos quando a aba esta' aberta.

    `forcar` E O BOTAO DE ATUALIZAR. Quem aperta esta' dizendo que trocou a foto
    agora; esperar a espera de um dia seria o botao respondendo com a foto velha.
    """
    nome = _nome_de_arquivo(arroba)
    if not nome:
        return False
    alvo = RETRATOS / (nome + ".jpg")
    try:
        if not forcar and alvo.exists() and time.time() - alvo.stat().st_mtime < 86400:
            return True
    except OSError:
        pass
    if not url:
        return alvo.exists()
    try:
        pedido = urllib.request.Request(url, headers={"User-Agent": "publicador"})
        with urllib.request.urlopen(pedido, timeout=15) as r:
            bytes_ = r.read(3 * 1024 * 1024)
        if not bytes_:
            return alvo.exists()
        RETRATOS.mkdir(parents=True, exist_ok=True)
        novo = alvo.with_suffix(".novo")
        novo.write_bytes(bytes_)
        os.replace(novo, alvo)
        return True
    except Exception:
        # foto e' enfeite: se ela falhar, a conta continua de pe'
        return alvo.exists()


def retrato_em_disco(arroba: str):
    alvo = RETRATOS / (_nome_de_arquivo(arroba) + ".jpg")
    return alvo if alvo.exists() else None


def endereco_do_retrato(arroba: str) -> str:
    """O endereco de casa para a foto, com um carimbo no fim.

    O CARIMBO NAO E ENFEITE: a rota manda o navegador guardar a foto por um dia,
    senao cada abertura da aba baixaria tudo de novo. So' que trocar a foto no
    Instagram tem que aparecer NA HORA, e endereco igual com foto diferente e'
    exatamente o caso que o navegador se recusa a buscar. Arquivo novo, hora nova,
    endereco novo.
    """
    alvo = retrato_em_disco(arroba)
    try:
        marca = int(alvo.stat().st_mtime) if alvo else 0
    except OSError:
        marca = 0
    return f"contas/retrato?u={urllib.parse.quote(arroba)}&v={marca}"


def _impressao_do_retrato(arroba: str) -> str:
    """A digital da foto em disco. E' com ela que o botao de atualizar sabe dizer
    'a foto mudou' em vez de 'a foto foi buscada de novo'."""
    alvo = retrato_em_disco(arroba)
    try:
        return hashlib.sha1(alvo.read_bytes()).hexdigest() if alvo else ""
    except OSError:
        return ""


# ============================================================== o cofre
def cofre() -> dict:
    return _ler(COFRE, {"contas": []})


def gravar_cofre(dados: dict) -> None:
    _gravar(COFRE, dados)


def app_meta() -> dict:
    """O aplicativo da Meta. Sem ele, ligar conta nao existe e a tela diz por que."""
    return _ler(APP, {})


# ============================================================== o livro-caixa
def _banco():
    """Import tardio de proposito: `midia` e o dono do banco, e chamar no topo faria
    dois modulos se importarem em circulo na primeira carga do servidor."""
    import midia
    return midia.abrir()


def _tabelas(con) -> None:
    con.executescript("""
        -- O HISTORICO DA VIGILANCIA, um registro por dia e por conta. E' a memoria
        -- que a API do Instagram nao tem: sem ela a tela so' saberia o agora.
        CREATE TABLE IF NOT EXISTS vigia_dia (
            dia TEXT NOT NULL,          -- 2026-08-29, no fuso de Sao Paulo
            arroba TEXT NOT NULL,
            estado TEXT NOT NULL,       -- viva, vencendo, caiu
            ms INTEGER,                 -- quanto a Meta demorou para responder
            detalhe TEXT,
            em TEXT NOT NULL,
            PRIMARY KEY (dia, arroba)
        );
        -- O DIARIO. E' aqui que se audita, e por isso ele guarda o texto do erro da
        -- Meta por extenso, com o codigo dela.
        CREATE TABLE IF NOT EXISTS conta_evento (
            id INTEGER PRIMARY KEY,
            arroba TEXT NOT NULL,
            quando TEXT NOT NULL,
            tipo TEXT NOT NULL,         -- ok, aviso, falha, marco
            titulo TEXT NOT NULL,
            detalhe TEXT
        );
        CREATE INDEX IF NOT EXISTS evento_por_conta ON conta_evento (arroba, quando);
    """)


def anotar(arroba: str, tipo: str, titulo: str, detalhe: str = "") -> None:
    """Escreve uma linha no diario da conta.

    NAO REPETE A MESMA LINHA NO MESMO DIA. A vigilancia roda todo dia e o botao de
    testar roda quando alguem aperta: sem essa trava, o diario viraria uma parede de
    'conexao testada' e a falha de terca sumiria no meio.
    """
    try:
        con = _banco()
        _tabelas(con)
        igual = con.execute(
            "SELECT id FROM conta_evento WHERE arroba=? AND tipo=? AND titulo=? "
            "AND substr(quando,1,10)=substr(?,1,10)",
            (limpo(arroba), tipo, titulo, agora())).fetchone()
        if igual:
            con.execute("UPDATE conta_evento SET quando=?, detalhe=? WHERE id=?",
                        (agora(), detalhe, igual["id"]))
        else:
            con.execute("INSERT INTO conta_evento (arroba, quando, tipo, titulo, detalhe) "
                        "VALUES (?,?,?,?,?)", (limpo(arroba), agora(), tipo, titulo, detalhe))
        con.commit()
        con.close()
    except Exception:
        pass                    # diario e' registro, nao pode derrubar a checagem


def marcar_dia(arroba: str, estado: str, ms=None, detalhe: str = "") -> None:
    try:
        con = _banco()
        _tabelas(con)
        con.execute(
            "INSERT INTO vigia_dia (dia, arroba, estado, ms, detalhe, em) VALUES (?,?,?,?,?,?) "
            "ON CONFLICT(dia, arroba) DO UPDATE SET estado=excluded.estado, "
            "ms=excluded.ms, detalhe=excluded.detalhe, em=excluded.em",
            (hoje(), limpo(arroba), estado, ms, detalhe, agora()))
        con.commit()
        con.close()
    except Exception:
        pass


def tira(arroba: str) -> list:
    """Os ultimos trinta dias, um por posicao. Dia sem registro vai como `sem`, e isso
    e' informacao: e' o tempo em que ninguem estava olhando."""
    de = {}
    try:
        con = _banco()
        _tabelas(con)
        for l in con.execute(
                "SELECT dia, estado, ms FROM vigia_dia WHERE arroba=? ORDER BY dia DESC "
                "LIMIT ?", (limpo(arroba), JANELA)):
            de[l["dia"]] = {"estado": l["estado"], "ms": l["ms"]}
        con.close()
    except Exception:
        pass
    from datetime import date
    fim = date.fromisoformat(hoje())
    saida = []
    for i in range(JANELA - 1, -1, -1):
        dia = (fim - timedelta(days=i)).isoformat()
        r = de.get(dia)
        saida.append({"dia": dia, "estado": (r or {}).get("estado", "sem"),
                      "ms": (r or {}).get("ms")})
    return saida


def diario(arroba: str, teto: int = 40) -> list:
    try:
        con = _banco()
        _tabelas(con)
        linhas = [dict(l) for l in con.execute(
            "SELECT quando, tipo, titulo, detalhe FROM conta_evento WHERE arroba=? "
            "ORDER BY quando DESC LIMIT ?", (limpo(arroba), teto))]
        con.close()
        return linhas
    except Exception:
        return []


def fila_e_falhas() -> dict:
    """Quantos videos estao marcados e quantos erraram nas ultimas 24 horas, por conta.
    Sai do livro-caixa, que e' quem sabe: a Meta nao guarda a nossa fila."""
    saida = {}
    try:
        con = _banco()
        limite = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        for l in con.execute(
                "SELECT conta, estado, COUNT(*) n, MAX(visto_em) ultimo FROM video "
                "WHERE conta IS NOT NULL GROUP BY conta, estado"):
            quem = limpo(l["conta"])
            d = saida.setdefault(quem, {"fila": 0, "falhas": 0, "publicados": 0})
            if l["estado"] == "erro":
                if (l["ultimo"] or "") >= limite:
                    d["falhas"] += l["n"]
            elif l["estado"] in ("programado", "baixado"):
                d["fila"] += l["n"]
            elif l["estado"] == "publicado":
                d["publicados"] += l["n"]
        con.close()
    except Exception:
        pass
    return saida


def pastas_por_conta() -> int:
    try:
        con = _banco()
        n = con.execute("SELECT COUNT(*) n FROM pasta").fetchone()["n"]
        con.close()
        return n
    except Exception:
        return 0


# ============================================================== a Meta
CAMPOS = "user_id,username,followers_count,media_count,account_type"


def identidade(token: str):
    """Quem e' a conta, na voz da Meta.

    O RETRATO VEM JUNTO, numa tentativa so'. Antes ele vinha do `analytics.json`, e
    conta recem-ligada nascia sem rosto porque aquele arquivo ainda nao a conhecia.

    A SEGUNDA TENTATIVA SEM O CAMPO NAO E ZELO EXCESSIVO: se um dia a Meta parar de
    aceitar `profile_picture_url` neste caminho, a chamada inteira falharia e TODAS
    as contas apareceriam caidas por causa de uma foto. Rosto e' enfeite; estar de
    pe' nao e'.
    """
    ok, p = _chamar(f"{BASE}/me?fields={CAMPOS},profile_picture_url", token=token)
    if ok:
        return p, None
    ok, p = _chamar(f"{BASE}/me?fields={CAMPOS}", token=token)
    return (p if ok else None), (None if ok else _erro(p))


def teto_do_dia(ig_user_id: str, token: str):
    ok, p = _chamar(f"{BASE}/{ig_user_id}/content_publishing_limit"
                    f"?fields=config,quota_usage", token=token)
    if not ok:
        return None
    d = (p.get("data") or [{}])[0]
    return {"usado": d.get("quota_usage"),
            "total": (d.get("config") or {}).get("quota_total")}


def renovar(conta: dict):
    """Pede a Meta um acesso novo de 60 dias. Devolve (ok, detalhe)."""
    token = (conta.get("token") or "").strip()
    if not token:
        return False, "conta sem token guardado"
    url = RENOVACAO + "?" + urllib.parse.urlencode(
        {"grant_type": "ig_refresh_token", "access_token": token})
    ok, p = _chamar(url)
    if not ok:
        return False, _erro(p)
    novo = p.get("access_token")
    if not novo:
        return False, "a Meta respondeu sem token novo"
    segundos = int(p.get("expires_in") or 60 * 86400)
    conta["token"] = novo
    conta["vence_em"] = (datetime.now(timezone.utc)
                         + timedelta(seconds=segundos)).isoformat(timespec="seconds")
    conta["renovado_em"] = agora()
    conta["renovacoes"] = int(conta.get("renovacoes") or 0) + 1
    return True, f"acesso renovado por {round(segundos / 86400)} dias"


# ============================================================== a checagem
def checar(conta: dict, renovar_se_preciso: bool = True) -> dict:
    """Pergunta a Meta sobre uma conta e, se for a hora, renova o acesso.

    A ORDEM IMPORTA: renova ANTES de perguntar. Um token a dois dias de morrer ainda
    responde, e seria justamente essa resposta boa que esconderia o problema ate' o
    dia em que ele deixasse de responder.
    """
    ficha = {
        "arroba": conta.get("arroba", ""),
        "ig_user_id": conta.get("ig_user_id", ""),
        "nome": conta.get("nome") or "",
        "ligada_em": conta.get("ligada_em"),
        "vence_em": conta.get("vence_em"),
        "renovado_em": conta.get("renovado_em"),
        "renovacoes": int(conta.get("renovacoes") or 0),
        "renovacao": None,
        "checada_em": agora(),
    }

    faltam = dias_para_vencer(conta)
    if renovar_se_preciso and faltam is not None and faltam <= RENOVAR_FALTANDO:
        deu, detalhe = renovar(conta)
        ficha["renovacao"] = {"tentou": True, "deu_certo": deu, "detalhe": detalhe,
                              "em": agora()}
        ficha["vence_em"] = conta.get("vence_em")
        ficha["renovado_em"] = conta.get("renovado_em")
        ficha["renovacoes"] = int(conta.get("renovacoes") or 0)
        faltam = dias_para_vencer(conta)
        anotar(ficha["arroba"], "aviso" if deu else "falha",
               "Acesso renovado sozinho" if deu else "Renovação do acesso falhou",
               detalhe)

    ficha["dias_para_vencer"] = faltam

    comeco = time.time()
    perfil, erro = identidade(conta.get("token", ""))
    ficha["ms"] = round((time.time() - comeco) * 1000)

    if erro:
        ficha.update({"estado": "caiu", "detalhe": erro, "teto_usado": None,
                      "teto_total": None, "tipo": None})
        marcar_dia(ficha["arroba"], "caiu", ficha["ms"], erro)
        anotar(ficha["arroba"], "falha", "Conexão recusada", erro)
        return ficha

    ficha.update({
        "detalhe": None,
        "arroba": perfil.get("username") or ficha["arroba"],
        "nome": ficha["nome"] or perfil.get("username") or "",
        "tipo": perfil.get("account_type"),
    })
    # O RETRATO NAO VAI PARA A TELA COMO ENDERECO DA META: o CDN deles recusa o
    # pedido feito de outra pagina. O servidor baixa, guarda e serve pelo endereco
    # de casa.
    ficha["avatar"] = (endereco_do_retrato(ficha["arroba"])
                       if guardar_retrato(ficha["arroba"],
                                          perfil.get("profile_picture_url"))
                       else None)
    if perfil.get("user_id"):
        ficha["ig_user_id"] = str(perfil["user_id"])

    teto = teto_do_dia(ficha["ig_user_id"], conta.get("token", ""))
    ficha["teto_usado"] = (teto or {}).get("usado")
    ficha["teto_total"] = (teto or {}).get("total")

    if faltam is None:
        ficha["estado"] = "viva"
    elif faltam <= 0:
        ficha["estado"] = "caiu"
        ficha["detalhe"] = "o acesso venceu, a conta precisa ser religada"
    elif faltam <= AVISAR_FALTANDO:
        ficha["estado"] = "vencendo"
        ficha["detalhe"] = f"o acesso vence em {faltam} dias"
    else:
        ficha["estado"] = "viva"

    marcar_dia(ficha["arroba"], ficha["estado"], ficha["ms"], ficha["detalhe"] or "")
    anotar(ficha["arroba"], "ok", "Conexão testada",
           f"A Meta respondeu em {ficha['ms']} ms")
    if ficha["teto_total"]:
        anotar(ficha["arroba"], "ok", "Teto do dia lido",
               f"{ficha['teto_usado']} de {ficha['teto_total']} publicações "
               f"nas últimas 24 horas")
    return ficha


def vigiar(renovar_se_preciso: bool = True, so: str = "") -> dict:
    """Percorre as contas, grava o cofre (pode ter token novo) e o resultado."""
    dados = cofre()
    contas = dados.get("contas") or []
    alvo = [c for c in contas if not so or limpo(c.get("arroba")) == limpo(so)]
    fichas = [checar(c, renovar_se_preciso) for c in alvo]
    if any((f.get("renovacao") or {}).get("deu_certo") for f in fichas):
        gravar_cofre(dados)

    if so:
        # checagem de uma conta so' nao pode apagar o retrato das outras
        guardado = _ler(VIGIA, {"contas": []})
        por = {limpo(f["arroba"]): f for f in guardado.get("contas", [])}
        for f in fichas:
            por[limpo(f["arroba"])] = f
        fichas = list(por.values())

    resultado = {
        "em": agora(),
        "contas": fichas,
        "caidas": sum(1 for f in fichas if f["estado"] == "caiu"),
        "vencendo": sum(1 for f in fichas if f["estado"] == "vencendo"),
        "vivas": sum(1 for f in fichas if f["estado"] == "viva"),
        "renovadas_agora": sum(1 for f in fichas
                               if (f.get("renovacao") or {}).get("deu_certo")),
    }
    _gravar(VIGIA, resultado)
    return resultado


def vestir(retrato: dict) -> dict:
    """Junta ao retrato o que mora no livro-caixa: tira, diario, fila e falhas.

    Fica separado da checagem de proposito: perguntar a Meta custa segundos e tem teto
    de chamadas; ler o livro custa nada. A tela pede isso a cada abertura.
    """
    livro = fila_e_falhas()
    pastas = pastas_por_conta()
    fichas = []
    for f in retrato.get("contas", []):
        quem = limpo(f.get("arroba"))
        do_livro = livro.get(quem, {})
        g = dict(f)
        g.pop("token", None)                 # cinto: token nunca sai daqui
        g["tira"] = tira(quem)
        g["diario"] = diario(quem)
        g["fila"] = do_livro.get("fila", 0)
        g["falhas24h"] = do_livro.get("falhas", 0)
        g["publicados"] = do_livro.get("publicados", 0)
        g["pastas_ligadas"] = pastas
        fichas.append(g)
    saida = dict(retrato)
    saida["contas"] = fichas
    saida["app_pronto"] = bool(app_meta().get("app_id") and app_meta().get("segredo"))
    return saida


def estado(forcar: bool = False) -> dict:
    """O que a tela pede. Usa o guardado enquanto ele for novo o bastante."""
    if not COFRE.exists():
        return vestir({"em": agora(), "contas": [], "caidas": 0, "vencendo": 0,
                       "vivas": 0, "renovadas_agora": 0,
                       "aviso": "nenhum acesso guardado em dados/contas.json"})
    guardado = _ler(VIGIA, None)
    if not forcar and guardado:
        quando = _data(guardado.get("em"))
        if quando and (datetime.now(timezone.utc) - quando).total_seconds() < VALIDADE_DO_CACHE:
            guardado["do_guardado"] = True
            return vestir(guardado)
    return vestir(vigiar())


# ============================================================== ligar conta
def _pendentes() -> dict:
    return _ler(DADOS / "ligando.json", {})


def endereco_de_volta(base: str) -> str:
    return base.rstrip("/") + "/contas/voltar"


def comecar_ligacao(base: str) -> dict:
    """Devolve o endereco do Instagram onde a pessoa autoriza a conta.

    O `state` e' um numero sorteado e guardado aqui: e' ele que impede alguem de
    empurrar um codigo de outra origem na volta.
    """
    app = app_meta()
    if not (app.get("app_id") and app.get("segredo")):
        return {"erro": "o aplicativo da Meta não está configurado em "
                        "dados/app_meta.json"}
    marca = secrets.token_urlsafe(18)
    pend = _pendentes()
    pend[marca] = {"em": agora(), "volta": endereco_de_volta(base)}
    # limpa o que passou de uma hora: pedido de ligacao nao envelhece bem
    pend = {k: v for k, v in pend.items()
            if (_data(v.get("em")) or datetime.now(timezone.utc))
            > datetime.now(timezone.utc) - timedelta(hours=1)}
    _gravar(DADOS / "ligando.json", pend)
    url = AUTORIZAR + "?" + urllib.parse.urlencode({
        "client_id": app["app_id"],
        "redirect_uri": endereco_de_volta(base),
        "scope": app.get("permissoes") or PERMISSOES,
        "response_type": "code",
        "state": marca,
    })
    return {"url": url, "volta": endereco_de_volta(base)}


def prontidao(base: str) -> dict:
    """O que a tela precisa saber ANTES de mandar alguem para o Instagram.

    NAO EXISTE ROTA NA META QUE RESPONDA "esse endereco de volta esta cadastrado?".
    A unica forma de descobrir e' mandar uma pessoa autorizar e ver se a tela deles
    reclama, e foi exatamente assim que o "Invalid redirect_uri" apareceu em 29/08:
    o endereco que este painel manda e' legitimo, mas nao estava na lista do
    aplicativo, que ate' entao so' conhecia o do Postiz.

    Entao o que da' para provar daqui, esta funcao prova (o aplicativo esta
    configurado, e este e' o endereco exato, letra por letra, que vai ser enviado), e
    o que nao da', ela mostra por extenso para conferencia no painel da Meta. Meio
    caminho dito com todas as letras vale mais que uma promessa inteira.
    """
    app = app_meta()
    fb = str(app.get("fb_app_id") or "")
    return {
        "app_pronto": bool(app.get("app_id") and app.get("segredo")),
        "app_id": str(app.get("app_id") or ""),
        "volta": endereco_de_volta(base),
        "permissoes": [p.strip() for p in
                       (app.get("permissoes") or PERMISSOES).split(",") if p.strip()],
        "console": (f"https://developers.facebook.com/apps/{fb}"
                    "/instagram-business/API-Setup/"
                    if fb else "https://developers.facebook.com/apps/"),
        "ligadas": [c.get("arroba") for c in (cofre().get("contas") or [])],
    }


def terminar_ligacao(code: str, marca: str, base: str) -> dict:
    """Troca o codigo por um acesso de sessenta dias e guarda a conta no cofre."""
    app = app_meta()
    if not (app.get("app_id") and app.get("segredo")):
        return {"erro": "o aplicativo da Meta não está configurado"}
    pend = _pendentes()
    if marca not in pend:
        return {"erro": "esse pedido de ligação não é desta janela, comece de novo"}
    pend.pop(marca, None)
    _gravar(DADOS / "ligando.json", pend)

    ok, p = _chamar(CODIGO, dados={
        "client_id": app["app_id"], "client_secret": app["segredo"],
        "grant_type": "authorization_code",
        "redirect_uri": endereco_de_volta(base), "code": code})
    if not ok:
        return {"erro": _erro(p)}
    curto = p.get("access_token")
    ig_id = str(p.get("user_id") or "")
    if not curto:
        return {"erro": "o Instagram respondeu sem acesso"}

    ok, p = _chamar(TROCA + "?" + urllib.parse.urlencode({
        "grant_type": "ig_exchange_token", "client_secret": app["segredo"],
        "access_token": curto}))
    if not ok:
        return {"erro": _erro(p)}
    longo = p.get("access_token")
    segundos = int(p.get("expires_in") or 60 * 86400)

    perfil, erro = identidade(longo)
    if erro:
        return {"erro": erro}
    arroba = perfil.get("username") or ig_id
    ig_id = str(perfil.get("user_id") or ig_id)

    dados = cofre()
    contas = dados.setdefault("contas", [])
    nova = {
        "arroba": arroba, "ig_user_id": ig_id, "token": longo,
        "nome": perfil.get("username") or arroba,
        "ligada_em": agora(),
        "vence_em": (datetime.now(timezone.utc)
                     + timedelta(seconds=segundos)).isoformat(timespec="seconds"),
        "renovado_em": None, "renovacoes": 0,
        "origem": "ligada pela tela em " + hoje(),
    }
    for i, c in enumerate(contas):
        if limpo(c.get("arroba")) == limpo(arroba):
            nova["renovacoes"] = int(c.get("renovacoes") or 0)
            contas[i] = nova
            break
    else:
        contas.append(nova)
    gravar_cofre(dados)
    anotar(arroba, "marco", "Conta ligada ao publicador",
           f"Acesso de {round(segundos / 86400)} dias concedido pelo Instagram")
    vigiar(renovar_se_preciso=False, so=arroba)
    return {"ok": True, "arroba": arroba}


def colar_token(token: str) -> dict:
    """Liga uma conta a partir do token gerado NA PROPRIA TELA DA META.

    ESTE E O CAMINHO CURTO, e ele existe porque a Meta tem um botao "Gerar token"
    dentro da configuracao do aplicativo. O token que sai dali ja' e' de sessenta
    dias ("Access tokens from the App Dashboard are long-lived and are valid for 60
    days", na documentacao deles), e nao passa por autorizacao de tela nenhuma.

    O QUE ISSO ECONOMIZA: nao precisa de endereco de volta cadastrado, nao precisa
    do vaivem do OAuth, nao precisa de convite de conta de teste. E o mesmo caminho
    que o Gabriel ja' usava no n8n.

    O que ele NAO da' e' token eterno: eterno nao existe em lugar nenhum desta API.
    O que faz a conta nunca cair e' a renovacao automatica, que ja' roda aqui.
    """
    token = (token or "").strip()
    if not token:
        return {"erro": "cole o token gerado no painel da Meta"}
    if len(token) < 40:
        return {"erro": "isso não parece um token da Meta (curto demais)"}

    # 1. A META E QUEM DIZ DE QUEM E O TOKEN. Nada de pedir o arroba para quem cola:
    #    campo digitado erra, e conta trocada com token trocado e' um estrago mudo.
    perfil, erro = identidade(token)
    if erro:
        return {"erro": erro}
    arroba = perfil.get("username") or ""
    ig_id = str(perfil.get("user_id") or "")
    if not arroba:
        return {"erro": "a Meta respondeu sem o arroba da conta"}

    # 2. A VALIDADE. A Meta nao conta quantos dias faltam, entao a saida honesta e'
    #    perguntar renovando: se ela renovar, o `expires_in` e' o numero de verdade.
    #    Token recem-gerado costuma ser recusado (ela exige 24 horas de vida), e ai'
    #    valem os sessenta dias que a documentacao promete.
    provisoria = {"token": token}
    renovou, detalhe = renovar(provisoria)
    if renovou:
        token = provisoria["token"]
        vence = provisoria["vence_em"]
        nota = "acesso trocado por um novo na hora de ligar"
    else:
        vence = (datetime.now(timezone.utc)
                 + timedelta(days=60)).isoformat(timespec="seconds")
        nota = ("validade contada como 60 dias, que e' o que a Meta da' no token do "
                "painel dela")

    dados = cofre()
    contas = dados.setdefault("contas", [])
    nova = {
        "arroba": arroba, "ig_user_id": ig_id, "token": token,
        "nome": arroba,
        "ligada_em": agora(), "vence_em": vence,
        "renovado_em": agora() if renovou else None,
        "renovacoes": 0,
        "origem": "token colado do painel da Meta em " + hoje(),
    }
    for i, c in enumerate(contas):
        if limpo(c.get("arroba")) == limpo(arroba):
            # RELIGAR NAO ZERA O PASSADO: a contagem de renovacoes e o dia em que a
            # conta entrou sao historia, e historia nao se apaga por troca de token.
            nova["renovacoes"] = int(c.get("renovacoes") or 0)
            nova["ligada_em"] = c.get("ligada_em") or nova["ligada_em"]
            contas[i] = nova
            break
    else:
        contas.append(nova)
    gravar_cofre(dados)
    anotar(arroba, "marco", "Conta ligada por token colado", nota)
    vigiar(renovar_se_preciso=False, so=arroba)
    return {"ok": True, "arroba": arroba, "renovou": renovou}


# ====================================================== atualizar o cadastro
#
# POR QUE ESTE BOTAO EXISTE. Dentro do publicador a conta e' guardada PELO ARROBA:
# a tira de 30 dias, o diario, o mercado, as etiquetas, a fila de video, o rascunho
# do lote e o arquivo do retrato, todos tem o arroba como chave. So' que o arroba e'
# o unico dado da conta que a pessoa pode trocar no Instagram a qualquer hora, sem
# avisar ninguem.
#
# O QUE ACONTECERIA SEM ELE, e foi medido lendo o codigo em 30/08: a checagem ja'
# le' o nome novo da Meta e ja' o mostra na tela, mas nunca o grava. A conta
# amanheceria com nome novo na ficha e passado nenhum, porque o passado continuaria
# arquivado no nome velho. Nada quebraria em voz alta. E' o tipo de perda que so'
# aparece meses depois, quando alguem procura a falha de uma terca-feira.
#
# O CERTO SERIA CHAVEAR TUDO PELO `ig_user_id`, que a Meta nunca troca. Isso e'
# reforma de banco inteiro, e nao cabe num botao. Enquanto ela nao vem, quem carrega
# o nome de um lugar para o outro, de uma vez so' e numa transacao so', e' aqui.


def _levar_arroba(velho: str, novo: str):
    """Troca o arroba em cada tabela do livro-caixa. Devolve (levado, avisos).

    TUDO NUMA TRANSACAO SO'. Parar no meio deixaria metade do passado num nome e
    metade no outro, que e' pior do que nao ter mexido.
    """
    levado, avisos = [], []
    con = _banco()
    _tabelas(con)
    try:
        with con:
            # O HISTORICO TEM CHAVE (dia, arroba). Se o nome novo ja' tiver linha do
            # mesmo dia, ela e' a leitura mais recente e fica; a do nome velho sai.
            con.execute("DELETE FROM vigia_dia WHERE arroba=? AND dia IN "
                        "(SELECT dia FROM vigia_dia WHERE arroba=?)", (velho, novo))
            levado.append(("Histórico de 30 dias",
                           con.execute("UPDATE vigia_dia SET arroba=? WHERE arroba=?",
                                       (novo, velho)).rowcount))
            levado.append(("Diário da conta",
                           con.execute("UPDATE conta_evento SET arroba=? WHERE arroba=?",
                                       (novo, velho)).rowcount))

            # MERCADO E ETIQUETAS. O arroba e' chave primaria aqui tambem. Se ja'
            # houver linha no nome novo, foi ele que alguem digitou depois da troca.
            if con.execute("SELECT 1 FROM conta_meta WHERE arroba=?",
                           (novo,)).fetchone():
                con.execute("DELETE FROM conta_meta WHERE arroba=?", (velho,))
                avisos.append(f"já havia mercado e etiquetas gravados em @{novo}, "
                              f"e foram eles que ficaram")
                levado.append(("Mercado e etiquetas", 0))
            else:
                levado.append(("Mercado e etiquetas",
                               con.execute("UPDATE conta_meta SET arroba=? "
                                           "WHERE arroba=?", (novo, velho)).rowcount))

            levado.append(("Fila e histórico de vídeos",
                           con.execute("UPDATE video SET conta=? WHERE LOWER(conta)=?",
                                       (novo, velho)).rowcount))

            # O RASCUNHO E UM POR CONTA, por indice unico. Dois lotes abertos com os
            # dois nomes so' existem se um lote foi comecado depois da troca: e' esse
            # que fica, e a tela diz que o outro saiu.
            if con.execute("SELECT 1 FROM rascunho WHERE LOWER(conta)=?",
                           (novo,)).fetchone():
                sobrando = con.execute("DELETE FROM rascunho WHERE LOWER(conta)=?",
                                       (velho,)).rowcount
                if sobrando:
                    avisos.append(f"havia um lote pela metade em @{velho} e outro em "
                                  f"@{novo}; ficou o mais novo")
                levado.append(("Rascunho de programação", 0))
            else:
                # o arroba tambem mora DENTRO do rascunho, no que ja' foi escolhido
                for l in con.execute("SELECT id, dados FROM rascunho "
                                     "WHERE LOWER(conta)=?", (velho,)).fetchall():
                    try:
                        d = json.loads(l["dados"])
                        if (d.get("escolha") or {}).get("conta"):
                            d["escolha"]["conta"] = novo
                            con.execute("UPDATE rascunho SET dados=? WHERE id=?",
                                        (json.dumps(d, ensure_ascii=False), l["id"]))
                    except Exception:
                        pass
                levado.append(("Rascunho de programação",
                               con.execute("UPDATE rascunho SET conta=? "
                                           "WHERE LOWER(conta)=?",
                                           (novo, velho)).rowcount))
    finally:
        con.close()
    return levado, avisos


def _levar_no_analytics(velho: str, novo: str) -> int:
    """O arroba tambem e' chave dentro do `analytics.json`.

    ESSE ARQUIVO E DE FORA: quem o escreve e' o montador, e a proxima geracao dele
    ja' traria o nome novo sozinha. So' que ate' la' a Home leria o nome velho ao
    lado do novo, e duas verdades na mesma tela e' o que este botao existe para
    evitar.
    """
    caminho = pathlib.Path(os.environ.get("PAINEL_ANALYTICS",
                                          str(PASTA / "analytics.json")))
    d = _ler(caminho, None)
    if not isinstance(d, dict):
        return 0
    n = 0
    for p in d.get("perfis") or []:
        if isinstance(p, dict) and limpo(p.get("u")) == velho:
            p["u"] = novo
            n += 1
    fundo = d.get("fundo")
    if isinstance(fundo, dict):
        for chave in list(fundo):
            if limpo(chave) == velho:
                fundo[novo] = fundo.pop(chave)
                n += 1
    if n:
        _gravar(caminho, d, indentado=False, segredo=False)
    return n


def sincronizar(arroba: str, ig_user_id: str = "") -> dict:
    """O BOTAO DE ATUALIZAR, um por conta.

    Pergunta a Meta quem esta conta e' HOJE e carrega a resposta para todo o
    sistema. Tres coisas mudam no Instagram sem avisar ninguem: o arroba, a foto e
    o tipo da conta. A quarta, o identificador, nao muda nunca, e por isso ele e'
    quem confirma que ainda se trata da mesma conta.

    A BUSCA COMECA PELO IDENTIFICADOR, E ISSO NAO E DETALHE. Foi assim que este
    botao se recusou a funcionar na primeira vez que rodou contra uma conta de
    verdade, em 01/09: a tela ja' mostrava o arroba NOVO (a checagem le' o nome da
    Meta a cada rodada), o cofre ainda guardava o VELHO, e procurar pelo que a tela
    mostra nao achava nada. O botao dava "essa conta nao esta no publicador"
    exatamente no unico caso que ele existe para resolver.
    """
    dados = cofre()
    conta = None
    alvo = str(ig_user_id or "").strip()
    if alvo:
        for c in dados.get("contas") or []:
            if str(c.get("ig_user_id") or "") == alvo:
                conta = c
                break
    if conta is None:
        for c in dados.get("contas") or []:
            if limpo(c.get("arroba")) == limpo(arroba):
                conta = c
                break
    if conta is None:
        return {"erro": "essa conta não está no publicador"}

    perfil, erro = identidade(conta.get("token", ""))
    if erro:
        return {"erro": erro}

    velho = limpo(conta.get("arroba"))
    novo = limpo(perfil.get("username") or velho)
    guardado = _ler(VIGIA, {"contas": []})
    ficha_velha = next((f for f in guardado.get("contas", [])
                        if limpo(f.get("arroba")) == velho), {})

    # A FOTO PRIMEIRO, e sem esperar o cache de um dia. Ela ainda esta' guardada com
    # o nome velho; a troca de nome, se houver, leva o arquivo junto logo abaixo.
    antes = _impressao_do_retrato(velho)
    guardar_retrato(velho, perfil.get("profile_picture_url"), forcar=True)
    depois = _impressao_do_retrato(velho)
    trocou_foto = bool(depois) and depois != antes

    mudou, levado, avisos = [], [], []

    if novo != velho:
        atual = retrato_em_disco(velho)
        if atual:
            try:
                RETRATOS.mkdir(parents=True, exist_ok=True)
                os.replace(atual, RETRATOS / (_nome_de_arquivo(novo) + ".jpg"))
            except OSError:
                pass
        levado, avisos = _levar_arroba(velho, novo)
        levado.append(("Retrato guardado", 1 if retrato_em_disco(novo) else 0))
        levado.append(("Painel de Analytics", _levar_no_analytics(velho, novo)))
        conta["arroba"] = novo
        if limpo(conta.get("nome")) == velho:
            conta["nome"] = novo
        mudou.append({"o_que": "arroba", "de": velho, "para": novo})
        # o retrato antigo sai do guardado, senao a mesma conta apareceria duas
        # vezes na tela ate' a proxima rodada da vigilancia
        guardado["contas"] = [f for f in guardado.get("contas", [])
                              if limpo(f.get("arroba")) != velho]
        _gravar(VIGIA, guardado)

    ig_novo = str(perfil.get("user_id") or "")
    if ig_novo and ig_novo != str(conta.get("ig_user_id") or ""):
        mudou.append({"o_que": "identificador",
                      "de": str(conta.get("ig_user_id") or "—"), "para": ig_novo})
        conta["ig_user_id"] = ig_novo

    if trocou_foto:
        mudou.append({"o_que": "foto", "de": "", "para": ""})

    tipo_velho = ficha_velha.get("tipo") or ""
    tipo_novo = perfil.get("account_type") or ""
    if tipo_novo and tipo_velho and tipo_novo != tipo_velho:
        mudou.append({"o_que": "tipo", "de": tipo_velho, "para": tipo_novo})

    if mudou:
        gravar_cofre(dados)
        anotar(novo, "marco", "Cadastro atualizado pela Meta",
               "; ".join(m["o_que"] + (f": @{m['de']} virou @{m['para']}"
                                       if m["o_que"] == "arroba" else "")
                         for m in mudou))

    # A ULTIMA PALAVRA E DA META, de novo: a ficha da tela sai de uma checagem
    # nova, e nao do que esta funcao acabou de escrever. Renovar aqui seria fora de
    # hora, entao a checagem vai sem renovacao.
    estado_novo = vestir(vigiar(renovar_se_preciso=False, so=novo))
    return {"ok": True, "arroba": novo, "antes": velho, "mudou": mudou,
            "levado": [{"onde": o, "n": n} for o, n in levado],
            "avisos": avisos, "em": agora(), "estado": estado_novo}


def desligar(arroba: str) -> dict:
    """Tira a conta do publicador. O DIARIO E O HISTORICO FICAM: desligar e' dizer
    'nao opere mais por aqui', e nao 'apague o que aconteceu'."""
    dados = cofre()
    antes = len(dados.get("contas") or [])
    dados["contas"] = [c for c in dados.get("contas", [])
                       if limpo(c.get("arroba")) != limpo(arroba)]
    if len(dados["contas"]) == antes:
        return {"erro": "essa conta não está no publicador"}
    gravar_cofre(dados)
    anotar(arroba, "marco", "Conta desligada do publicador",
           "O acesso foi apagado do cofre desta máquina")
    guardado = _ler(VIGIA, {"contas": []})
    guardado["contas"] = [f for f in guardado.get("contas", [])
                          if limpo(f.get("arroba")) != limpo(arroba)]
    _gravar(VIGIA, guardado)
    return {"ok": True}


# ============================================================== as rotas
def responder(rota: str, consulta: dict, corpo: dict | None, base: str = ""):
    """Devolve (objeto, codigo) ou None se a rota nao for daqui.

    NENHUMA RESPOSTA DAQUI CARREGA TOKEN. O que sai e' o estado; o segredo fica no
    cofre, que o servidor ja' recusa servir por http.
    """
    um = lambda k, p="": (consulta.get(k, [p])[0] or p)

    if rota == "contas/estado":
        return estado(), 200
    if rota == "contas/testar" and corpo is not None:
        return vestir(vigiar(so=(corpo.get("arroba") or ""))), 200
    if rota == "contas/renovar" and corpo is not None:
        quem = limpo(corpo.get("arroba"))
        dados = cofre()
        for c in dados.get("contas") or []:
            if limpo(c.get("arroba")) == quem:
                deu, detalhe = renovar(c)
                if deu:
                    gravar_cofre(dados)
                    anotar(quem, "aviso", "Acesso renovado na mão", detalhe)
                    vigiar(renovar_se_preciso=False, so=quem)
                return ({"ok": deu, "detalhe": detalhe,
                         "vence_em": c.get("vence_em")}, 200 if deu else 400)
        return {"erro": "essa conta nao esta no cofre"}, 404
    if rota == "contas/atualizar" and corpo is not None:
        d = sincronizar(corpo.get("arroba", ""), corpo.get("ig_user_id", ""))
        return d, (400 if "erro" in d else 200)
    if rota == "contas/prontidao":
        return prontidao(base), 200
    if rota == "contas/colar" and corpo is not None:
        d = colar_token(corpo.get("token", ""))
        return d, (400 if "erro" in d else 200)
    if rota == "contas/ligar":
        d = comecar_ligacao(base)
        return d, (400 if "erro" in d else 200)
    if rota == "contas/desligar" and corpo is not None:
        d = desligar(corpo.get("arroba", ""))
        return d, (404 if "erro" in d else 200)
    return None


if __name__ == "__main__":
    # E' assim que o cron da VPS chama, uma vez por dia.
    r = vigiar()
    print(f"{r['em']} | vivas {r['vivas']} | vencendo {r['vencendo']} | "
          f"caidas {r['caidas']} | renovadas agora {r['renovadas_agora']}")
    for f in r["contas"]:
        print(f"  @{f['arroba']}: {f['estado']}"
              + (f" | {f['detalhe']}" if f.get("detalhe") else "")
              + (f" | vence em {f['dias_para_vencer']} dias"
                 if f.get("dias_para_vencer") is not None else "")
              + (f" | {f.get('ms')} ms" if f.get("ms") is not None else ""))
