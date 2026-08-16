"""
Vigia das contas. Roda de hora em hora.

Pergunta a Meta se cada conta ainda responde. Token morto ou permissao negada
vira alarme no painel. Esse e o item numero um do painel: saber que a conta caiu
antes de abrir o Instagram.
"""

import json
import os
import pathlib
from datetime import datetime, timezone

import meta

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CONTAS = RAIZ / "dados" / "contas.json"


def main():
    agora = datetime.now(timezone.utc).isoformat()
    dados = json.loads(CONTAS.read_text(encoding="utf-8"))

    alarmes = 0
    for conta in dados["contas"]:
        token = os.environ.get(conta.get("segredo_token", ""), "").strip()
        conta["ultima_checagem"] = agora

        if not token:
            conta["status"] = "sem_token"
            conta["detalhe"] = f"segredo {conta.get('segredo_token')} nao configurado"
            alarmes += 1
            print(f"{conta['arroba']}: sem token")
            continue

        perfil, erro = meta.identidade(token)
        if erro:
            conta["status"] = "alarme"
            conta["detalhe"] = erro
            alarmes += 1
            print(f"{conta['arroba']}: ALARME {erro}")
            continue

        anterior = conta.get("seguidores")
        conta["status"] = "ok"
        conta["detalhe"] = None
        conta["arroba"] = "@" + perfil.get("username", "")
        conta["seguidores"] = perfil.get("followers_count")
        conta["posts"] = perfil.get("media_count")

        teto = meta.consumo_do_teto(conta["ig_user_id"], token)
        if teto:
            conta["teto_usado"] = teto["usado"]
            conta["teto_total"] = teto["teto"]

        variacao = ""
        if anterior is not None and conta["seguidores"] is not None:
            delta = conta["seguidores"] - anterior
            variacao = f" ({delta:+d})"
        print(f"{conta['arroba']}: ok | {conta['seguidores']} seguidores{variacao}"
              f" | teto {conta.get('teto_usado')}/{conta.get('teto_total')}")

    dados["atualizado_em"] = agora
    dados["alarmes"] = alarmes
    CONTAS.write_text(json.dumps(dados, ensure_ascii=False, indent=2),
                      encoding="utf-8")
    print(f"\n{alarmes} alarme(s)")


if __name__ == "__main__":
    main()
