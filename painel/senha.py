# -*- coding: utf-8 -*-
"""Cria ou troca o acesso do painel (`dados/acesso.json`).

A senha NUNCA passa pela linha de comando nem aparece na tela: ela vem de um arquivo
(que voce apaga depois) ou e digitada as escuras.

  python senha.py gabriel --arquivo /tmp/senha.txt     # le do arquivo
  python senha.py gabriel                              # pede as escuras no terminal

O arquivo guarda o cozido da senha (pbkdf2, 200 mil voltas) e nunca a senha em si.
Trocar de senha e rodar de novo: o carimbo de sessao antigo morre junto, porque a
chave de assinatura tambem e trocada.
"""
import argparse
import getpass
import hashlib
import json
import os
import secrets

AQUI = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("usuario")
    ap.add_argument("--arquivo", help="arquivo com a senha na primeira linha")
    ap.add_argument("--destino", default=os.environ.get(
        "PAINEL_ACESSO", os.path.join(AQUI, "dados", "acesso.json")),
        help="onde gravar o acesso.json (na VPS: rode DENTRO do container, que "
             "o dados/ dele ja e o estado montado)")
    a = ap.parse_args()
    ACESSO = a.destino

    if a.arquivo:
        with open(a.arquivo, encoding="utf-8") as f:
            senha = f.readline().strip()
    else:
        senha = getpass.getpass("senha nova: ")
        if senha != getpass.getpass("de novo: "):
            raise SystemExit("as duas nao batem")
    if len(senha) < 10:
        raise SystemExit("senha curta demais: use 10+ caracteres")

    sal = secrets.token_hex(16)
    cozido = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"),
                                 bytes.fromhex(sal), 200_000).hex()
    os.makedirs(os.path.dirname(ACESSO), exist_ok=True)
    with open(ACESSO, "w", encoding="utf-8") as f:
        json.dump({"usuario": a.usuario, "sal": sal, "cozido": cozido,
                   "chave": secrets.token_hex(32)}, f, indent=1)
    try:
        os.chmod(ACESSO, 0o600)
    except Exception:
        pass
    print(f"acesso gravado para '{a.usuario}' em {ACESSO}")


if __name__ == "__main__":
    main()
