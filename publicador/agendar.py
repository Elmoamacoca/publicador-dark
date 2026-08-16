"""
Agendamento em lote. E o que o Postiz nao faz e o Speed Push faz.

Pega os videos da pasta de midia, espalha pelas contas e pelos dias, e escreve
a agenda. Aplica as tres regras que saem das notas de contingencia do Gabriel:

  1. Horario desencontrado. Cada conta recebe um deslocamento sorteado dentro da
     janela, entao duas contas nunca postam no mesmo minuto.
  2. Legenda unica. Nenhuma legenda se repete entre contas, e o que ja foi usado
     fica registrado e nao volta.
  3. Curva de aquecimento. Conta nova nao entra em ritmo pleno.

Uso:
    python agendar.py --inicio 2026-08-20 --horarios 09:00,13:00,19:00
    python agendar.py --inicio 2026-08-20 --horarios 09:00,19:00 --dias seg,ter,qui
    python agendar.py --inicio 2026-08-20 --horarios 09:00 --simular
"""

import argparse
import hashlib
import json
import pathlib
import random
from datetime import datetime, timedelta, timezone

RAIZ = pathlib.Path(__file__).resolve().parent.parent
AGENDA = RAIZ / "dados" / "agenda.json"
CONTAS = RAIZ / "dados" / "contas.json"
LEGENDAS = RAIZ / "dados" / "legendas.json"
MIDIA = RAIZ / "midia"

DIAS = {"seg": 0, "ter": 1, "qua": 2, "qui": 3, "sex": 4, "sab": 5, "dom": 6}

# Deslocamento sorteado, em minutos, para o horario nunca bater igual entre contas.
JANELA_MINUTOS = 22

# Curva de aquecimento. Teto de posts por dia conforme a idade da conta.
def teto_do_dia(dias_de_vida):
    if dias_de_vida <= 21:
        return 1          # nos 21 primeiros dias, quase nada
    if dias_de_vida <= 42:
        return 1
    if dias_de_vida <= 56:
        return 2
    return 3


def ler(caminho, padrao):
    if not caminho.exists():
        return padrao
    return json.loads(caminho.read_text(encoding="utf-8"))


def gravar(caminho, dados):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(dados, ensure_ascii=False, indent=2),
                       encoding="utf-8")


def idade_em_dias(conta, hoje):
    try:
        nascida = datetime.fromisoformat(conta["criada_em"]).date()
        return (hoje - nascida).days
    except Exception:
        return 999  # sem data, trata como madura


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--inicio", required=True, help="AAAA-MM-DD")
    p.add_argument("--horarios", required=True,
                   help="lista separada por virgula, ex 09:00,13:00,19:00")
    p.add_argument("--dias", default="seg,ter,qua,qui,sex,sab,dom")
    p.add_argument("--fuso", type=int, default=-3, help="deslocamento do horario local")
    p.add_argument("--simular", action="store_true", help="mostra e nao grava")
    args = p.parse_args()

    inicio = datetime.strptime(args.inicio, "%Y-%m-%d").date()
    horarios = [h.strip() for h in args.horarios.split(",") if h.strip()]
    dias_validos = {DIAS[d.strip()] for d in args.dias.split(",") if d.strip() in DIAS}

    contas = [c for c in ler(CONTAS, {"contas": []})["contas"]
              if c.get("ativa", True)]
    if not contas:
        print("nenhuma conta ativa em dados/contas.json")
        return

    agenda = ler(AGENDA, {"itens": []})
    banco_legendas = ler(LEGENDAS, {"disponiveis": [], "usadas": []})

    ja_agendados = {i["video"] for i in agenda["itens"]}
    videos = sorted(v.name for v in MIDIA.glob("*.mp4")
                    if f"midia/{v.name}" not in ja_agendados)
    if not videos:
        print("nenhum video novo em midia/")
        return

    disponiveis = list(banco_legendas["disponiveis"])
    usadas = set(banco_legendas["usadas"])
    print(f"{len(videos)} video(s), {len(contas)} conta(s), "
          f"{len(disponiveis)} legenda(s) livre(s)")

    novos = []
    fila = list(videos)
    dia = inicio
    hoje = datetime.now(timezone.utc).date()
    # Semente estavel: mesma entrada gera a mesma agenda, o que torna o resultado
    # conferivel sem virar sempre igual entre contas.
    aleatorio = random.Random(f"{args.inicio}|{args.horarios}|{len(videos)}")

    while fila and dia < inicio + timedelta(days=365):
        if dia.weekday() not in dias_validos:
            dia += timedelta(days=1)
            continue

        for conta in contas:
            if not fila:
                break
            teto = teto_do_dia(idade_em_dias(conta, hoje))
            for horario in horarios[:teto]:
                if not fila:
                    break
                video = fila.pop(0)

                hora, minuto = map(int, horario.split(":"))
                desvio = aleatorio.randint(-JANELA_MINUTOS, JANELA_MINUTOS)
                local = datetime(dia.year, dia.month, dia.day, hora, minuto)
                local += timedelta(minutes=desvio)
                quando = local - timedelta(hours=args.fuso)  # converte para UTC

                if disponiveis:
                    legenda = disponiveis.pop(0)
                else:
                    legenda = ""
                usadas.add(legenda)

                item_id = hashlib.sha1(
                    f"{conta['id']}|{video}|{quando}".encode()).hexdigest()[:12]
                novos.append({
                    "id": item_id,
                    "conta": conta["id"],
                    "video": f"midia/{video}",
                    "legenda": legenda,
                    "quando": quando.replace(tzinfo=timezone.utc).isoformat(),
                    "status": "agendado",
                    "media_id": None,
                    "erro": None,
                    "tentativas": 0,
                })
        dia += timedelta(days=1)

    novos.sort(key=lambda i: i["quando"])
    print(f"\n{len(novos)} item(ns) gerado(s)")
    for i in novos[:12]:
        print(f"  {i['quando'][:16].replace('T', ' ')}  {i['conta']:12} {i['video']}")
    if len(novos) > 12:
        print(f"  ... mais {len(novos) - 12}")

    if args.simular:
        print("\nsimulacao, nada gravado")
        return

    agenda["itens"].extend(novos)
    gravar(AGENDA, agenda)
    gravar(LEGENDAS, {"disponiveis": disponiveis, "usadas": sorted(usadas)})
    print("\nagenda gravada")


if __name__ == "__main__":
    main()
