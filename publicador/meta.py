"""Camada fina sobre a API oficial do Instagram. Sem dependencia externa."""

import json
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://graph.instagram.com/v23.0"

PISTAS = {
    190: "Token invalido ou expirado.",
    200: "Falta permissao. A conta aceitou o convite de testadora?",
    100: "Parametro errado. Confira o identificador da conta e a URL do video.",
    4: "Teto de chamadas estourado.",
    9: "Teto de publicacao da conta atingido nas ultimas 24 horas.",
    24: "A Meta nao conseguiu baixar o video. A URL precisa ser publica.",
}


def chamar(url, dados=None, tentativas=3, token=None):
    """Devolve (ok, corpo). Repete em falha de rede ou provedor (429, 5xx)."""
    corpo = urllib.parse.urlencode(dados).encode() if dados else None
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    for tentativa in range(tentativas):
        try:
            req = urllib.request.Request(url, data=corpo, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as r:
                return True, json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                if tentativa == tentativas - 1:
                    try:
                        return False, json.loads(e.read().decode())
                    except Exception:
                        return False, {"error": {"message": f"HTTP {e.code}", "code": e.code}}
                # Usa Retry-After se existir, senao backoff exponencial
                espera = int(e.headers.get("Retry-After", 2 ** tentativa))
                time.sleep(espera)
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


def descrever_erro(payload):
    erro = payload.get("error", {})
    codigo = erro.get("code")
    texto = erro.get("message", "sem mensagem")
    pista = PISTAS.get(codigo, "")
    return f"[{codigo}] {texto}" + (f" | {pista}" if pista else "")


def identidade(token):
    """Confirma que o token vive e devolve arroba e seguidores."""
    ok, p = chamar(
        f"{BASE}/me?fields=user_id,username,followers_count,media_count",
        token=token)
    return (p if ok else None), (None if ok else descrever_erro(p))


def consumo_do_teto(ig_id, token):
    ok, p = chamar(f"{BASE}/{ig_id}/content_publishing_limit"
                   f"?fields=config,quota_usage", token=token)
    if not ok:
        return None
    d = (p.get("data") or [{}])[0]
    return {"usado": d.get("quota_usage"),
            "teto": (d.get("config") or {}).get("quota_total")}


def publicar_reels(ig_id, token, video_url, legenda,
                   espera=5, tentativas_max=60, log=print):
    """Cria o container, espera processar e publica. Devolve (media_id, erro)."""
    log(f"    criando container: {video_url}")
    ok, p = chamar(f"{BASE}/{ig_id}/media", {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": legenda,
    }, token=token)
    if not ok:
        return None, descrever_erro(p)
    container = p.get("id")

    for i in range(1, tentativas_max + 1):
        ok, p = chamar(f"{BASE}/{container}?fields=status_code,status",
                       token=token)
        if not ok:
            return None, descrever_erro(p)
        estado = p.get("status_code")
        if estado == "FINISHED":
            log(f"    processado em {i * espera}s")
            break
        if estado in ("ERROR", "EXPIRED"):
            return None, f"container {estado}: {p.get('status', '')}"
        time.sleep(espera)
    else:
        return None, "container nao ficou pronto em 5 minutos"

    ok, p = chamar(f"{BASE}/{ig_id}/media_publish", {
        "creation_id": container,
    }, token=token)
    if not ok:
        return None, descrever_erro(p)
    return p.get("id"), None
