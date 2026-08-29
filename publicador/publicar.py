"""
Motor de publicacao. Roda a cada 5 minutos pelo gatilho de horario do GitHub.

Le a agenda, pega o que venceu, publica pela API oficial e grava o resultado
de volta na agenda. Nao depende do PC do Gabriel estar ligado.
"""

import json
import os
import pathlib
from datetime import datetime, timezone

import meta

RAIZ = pathlib.Path(__file__).resolve().parent.parent
AGENDA = RAIZ / "dados" / "agenda.json"
CONTAS = RAIZ / "dados" / "contas.json"

# Base publica de onde a Meta baixa o video.
RAW = os.environ.get(
    "BASE_MIDIA",
    "https://raw.githubusercontent.com/Elmoamacoca/publicador-dark/main/")

# Teto de seguranca por rodada, para um erro de agenda nao virar enxurrada.
MAXIMO_POR_RODADA = 10


def ler(caminho, padrao):
    if not caminho.exists():
        return padrao
    return json.loads(caminho.read_text(encoding="utf-8"))


def gravar(caminho, dados):
    """Grava de forma atomica: escreve ao lado e troca de uma vez so.

    A gravacao mudou de lugar em 29/08/2026, do fim do laco para dentro dele,
    e isso esta certo: sem ela por item, morrer no meio publica de novo na
    proxima rodada. Mas a escrita direta passou de uma para ate dez janelas de
    corrupcao por rodada, e a agenda e o unico registro do que ja foi ao ar.
    Trocar o arquivo pronto e uma operacao unica do sistema: ou o antigo
    inteiro, ou o novo inteiro, nunca metade.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    provisorio = caminho.with_suffix(caminho.suffix + ".novo")
    provisorio.write_text(json.dumps(dados, ensure_ascii=False, indent=2),
                          encoding="utf-8")
    os.replace(provisorio, caminho)


def main():
    agora = datetime.now(timezone.utc)
    agenda = ler(AGENDA, {"itens": []})
    contas = {c["id"]: c for c in ler(CONTAS, {"contas": []})["contas"]}

    vencidos = []
    marcou_erro_de_data = False
    for item in agenda["itens"]:
        if item.get("status") != "agendado":
            continue
        try:
            quando = datetime.fromisoformat(item["quando"].replace("Z", "+00:00"))
        except Exception:
            item["status"] = "erro"
            item["erro"] = "data invalida"
            marcou_erro_de_data = True
            continue
        if quando <= agora:
            vencidos.append(item)

    # Item com data invalida vira erro AQUI, antes de qualquer publicacao, e
    # nao entra em `vencidos`. Quando a rodada nao tem nada vencido, o laco de
    # baixo nao roda e a gravacao dele tambem nao: sem esta linha o carimbo se
    # perde e a mesma data quebrada e reprocessada a cada cinco minutos, para
    # sempre. Foi o que a mudanca de 29/08/2026 deixou passar.
    if marcou_erro_de_data:
        gravar(AGENDA, agenda)

    vencidos.sort(key=lambda i: i["quando"])
    print(f"agora {agora.isoformat()} | {len(vencidos)} item(ns) vencido(s)")

    if len(vencidos) > MAXIMO_POR_RODADA:
        print(f"cortando para {MAXIMO_POR_RODADA} nesta rodada")
        vencidos = vencidos[:MAXIMO_POR_RODADA]

    publicados = falhas = 0
    for item in vencidos:
        conta = contas.get(item["conta"])
        print(f"\n> {item['id']} | conta {item['conta']}")

        if not conta:
            item["status"] = "erro"
            item["erro"] = f"conta {item['conta']} nao existe em contas.json"
            falhas += 1
            print(f"    {item['erro']}")
            continue

        token = os.environ.get(conta["segredo_token"], "").strip()
        if not token:
            item["status"] = "erro"
            item["erro"] = f"segredo {conta['segredo_token']} vazio no GitHub"
            falhas += 1
            print(f"    {item['erro']}")
            continue

        media_id, erro = meta.publicar_reels(
            conta["ig_user_id"], token, RAW + item["video"],
            item.get("legenda", ""), log=print)

        item["tentativas"] = item.get("tentativas", 0) + 1
        if media_id:
            item["status"] = "publicado"
            item["media_id"] = media_id
            item["erro"] = None
            item["publicado_em"] = agora.isoformat()
            publicados += 1
            print(f"    PUBLICADO {media_id}")
        else:
            # Ate tres tentativas o item volta para a fila, depois desiste.
            item["erro"] = erro
            item["status"] = "agendado" if item["tentativas"] < 3 else "erro"
            falhas += 1
            print(f"    FALHOU: {erro}")
        
        gravar(AGENDA, agenda)

    print(f"\nresumo: {publicados} publicado(s), {falhas} falha(s)")


if __name__ == "__main__":
    main()
