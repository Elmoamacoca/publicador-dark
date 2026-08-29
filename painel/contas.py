# -*- coding: utf-8 -*-
"""A VIGILANCIA DO ACESSO DAS CONTAS: perguntar a Meta, avisar e renovar sozinho.

O PROBLEMA QUE ESTE ARQUIVO RESOLVE. O acesso de cada conta do Instagram vale 60
dias. Ate 29/08/2026 ninguem renovava e ninguem avisava: a coluna "Conexao" da tela
so' repetia o campo "esta ligada", entao uma conta morta apareceria como viva ate' o
dia em que uma publicacao falhasse. Medido no banco do motor: as duas contas foram
ligadas em 17/08 e nunca mais foram tocadas (`createdAt` igual a `updatedAt`).

AS TRES COISAS QUE ELE FAZ, nesta ordem:

  1. PERGUNTA. Chama a Meta conta a conta e traz o que so' ela sabe: se o token vive,
     arroba, seguidores, publicacoes e quanto do teto de publicacao do dia ja' foi
     usado. Isso e' uma chamada de verdade, e nao um selo guardado.
  2. AVISA. Calcula quantos dias faltam para o acesso vencer e classifica: viva,
     vencendo (duas semanas ou menos) ou caiu. A tela le' esse estado.
  3. RENOVA. Faltando dez dias ou menos, pede a Meta um acesso novo pelo
     `refresh_access_token` e guarda o novo token e a nova validade. Fica registrado
     quando renovou e quantas vezes, porque "renovou sozinho" so' vale se der para
     conferir.

ONDE MORAM OS TOKENS. Em `dados/contas.json`, que e' ESTADO e nunca entra no git (o
volume da VPS monta `dados/` de fora, e o servidor recusa servir esse caminho por
http). O token nao viaja em nenhuma resposta desta casa: o que sai daqui e' o estado,
nunca o segredo.

POR QUE NAO E' O MOTOR QUEM CUIDA DISSO. O motor guarda uma copia do acesso, mas ele
e' peca trocavel, mora em outra maquina e, em doze dias, nao renovou nada. A verdade
do publicador tem que estar no publicador.
"""
from __future__ import annotations

import json
import os
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

PASTA = pathlib.Path(__file__).parent
DADOS = PASTA / "dados"
COFRE = DADOS / "contas.json"          # arroba, identificador e token. Nunca sai daqui.
VIGIA = DADOS / "vigia.json"           # o resultado da ultima checagem. E' o que a tela le.

BASE = "https://graph.instagram.com/v23.0"
RENOVACAO = "https://graph.instagram.com/refresh_access_token"

# Quantos dias antes do vencimento o acesso e' renovado sozinho. Dez da folga para
# tentar de novo por varios dias seguidos se a Meta estiver fora do ar, e ainda assim
# nunca renova cedo demais (a Meta recusa token com menos de 24 horas de vida).
RENOVAR_FALTANDO = 10
# A partir de quantos dias a tela mostra o aviso de vencimento.
AVISAR_FALTANDO = 14
# Por quanto tempo o resultado guardado serve sem perguntar a Meta de novo. F5 na tela
# nao pode virar chamada nova: a Meta tem teto de chamadas e a resposta muda devagar.
VALIDADE_DO_CACHE = 15 * 60

PISTAS = {
    190: "Token invalido ou expirado. A conta precisa ser religada.",
    200: "Falta permissao para essa conta.",
    100: "Parametro errado. Confira o identificador da conta.",
    4: "Teto de chamadas da Meta estourado. Tente mais tarde.",
    10: "A conta nao autorizou esta permissao.",
}


# ============================================================== o basico
def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _ler(caminho: pathlib.Path, padrao):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except Exception:
        return padrao


def _gravar(caminho: pathlib.Path, dados) -> None:
    """Grava de forma atomica: escreve ao lado e troca de uma vez so'.

    Mesma regra do resto da casa. Aqui ela pesa mais que em qualquer outro lugar:
    este arquivo guarda o token renovado, e um arquivo pela metade seria uma conta
    fora do ar sem ninguem ter mexido em nada.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    provisorio = caminho.with_suffix(caminho.suffix + ".novo")
    provisorio.write_text(json.dumps(dados, ensure_ascii=False, indent=2),
                          encoding="utf-8")
    os.replace(provisorio, caminho)


def _chamar(url: str, token: str | None = None, tentativas: int = 3):
    """Devolve (ok, corpo). Nunca levanta excecao: quem chama decide o que fazer."""
    cabecalho = {"Authorization": "Bearer " + token} if token else {}
    for tentativa in range(tentativas):
        try:
            pedido = urllib.request.Request(url, headers=cabecalho)
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
    erro = payload.get("error", {}) if isinstance(payload, dict) else {}
    codigo = erro.get("code")
    texto = erro.get("message", "sem mensagem")
    pista = PISTAS.get(codigo, "")
    return f"[{codigo}] {texto}" + (f" | {pista}" if pista else "")


def _data(valor):
    """Le data em ISO, com ou sem fuso. Sem fuso, assume UTC."""
    if not valor:
        return None
    try:
        d = datetime.fromisoformat(str(valor).replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def dias_para_vencer(conta: dict):
    """Quantos dias faltam. Devolve None quando a conta nao tem validade anotada."""
    vence = _data(conta.get("vence_em"))
    if not vence:
        return None
    return (vence - datetime.now(timezone.utc)).days


# ============================================================== o cofre
def cofre() -> dict:
    return _ler(COFRE, {"contas": []})


def gravar_cofre(dados: dict) -> None:
    _gravar(COFRE, dados)


# ============================================================== a Meta
def identidade(token: str):
    ok, p = _chamar(f"{BASE}/me?fields=user_id,username,followers_count,"
                    f"media_count,account_type", token=token)
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
    """Pede a Meta um acesso novo de 60 dias. Devolve (ok, detalhe).

    A conta e' alterada no lugar quando dá certo: token novo, validade nova, carimbo
    da renovacao e o contador. Quem grava o cofre e' quem chamou.
    """
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

    ficha["dias_para_vencer"] = faltam

    perfil, erro = identidade(conta.get("token", ""))
    if erro:
        ficha.update({"estado": "caiu", "detalhe": erro, "seguidores": None,
                      "publicacoes": None, "teto_usado": None, "teto_total": None,
                      "tipo": None})
        return ficha

    ficha.update({
        "detalhe": None,
        "arroba": perfil.get("username") or ficha["arroba"],
        "seguidores": perfil.get("followers_count"),
        "publicacoes": perfil.get("media_count"),
        "tipo": perfil.get("account_type"),
    })
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
    return ficha


def vigiar(renovar_se_preciso: bool = True) -> dict:
    """Percorre todas as contas, grava o cofre (pode ter token novo) e o resultado."""
    dados = cofre()
    contas = dados.get("contas") or []
    fichas = [checar(c, renovar_se_preciso) for c in contas]
    if any(f.get("renovacao", {}) and f["renovacao"].get("deu_certo") for f in fichas):
        gravar_cofre(dados)

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


def estado(forcar: bool = False) -> dict:
    """O que a tela pede. Usa o guardado enquanto ele for novo o bastante.

    SEM COFRE NAO E' ERRO, e' um estado: a tela precisa dizer "nenhuma conta tem
    acesso guardado aqui" em vez de mostrar uma tabela vazia calada.
    """
    if not COFRE.exists():
        return {"em": agora(), "contas": [], "caidas": 0, "vencendo": 0, "vivas": 0,
                "renovadas_agora": 0,
                "aviso": "nenhum acesso guardado em dados/contas.json"}
    guardado = _ler(VIGIA, None)
    if not forcar and guardado:
        quando = _data(guardado.get("em"))
        if quando and (datetime.now(timezone.utc) - quando).total_seconds() < VALIDADE_DO_CACHE:
            guardado["do_guardado"] = True
            return guardado
    return vigiar()


# ============================================================== as rotas
def responder(rota: str, consulta: dict, corpo: dict | None):
    """Devolve (objeto, codigo) ou None se a rota nao for daqui.

    NENHUMA RESPOSTA DAQUI CARREGA TOKEN. O que sai e' o estado; o segredo fica no
    cofre, que o servidor ja' recusa servir por http.
    """
    if rota == "contas/estado":
        return estado(), 200
    if rota == "contas/testar" and corpo is not None:
        return vigiar(), 200
    if rota == "contas/renovar" and corpo is not None:
        quem = (corpo.get("arroba") or "").lstrip("@").strip().lower()
        dados = cofre()
        for c in dados.get("contas") or []:
            if (c.get("arroba") or "").lstrip("@").lower() == quem:
                deu, detalhe = renovar(c)
                if deu:
                    gravar_cofre(dados)
                    vigiar(renovar_se_preciso=False)
                return ({"ok": deu, "detalhe": detalhe,
                         "vence_em": c.get("vence_em")}, 200 if deu else 400)
        return {"erro": "essa conta nao esta no cofre"}, 404
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
                 if f.get("dias_para_vencer") is not None else ""))
