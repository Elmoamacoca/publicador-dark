# Publicador Dark

Ferramenta 2 do sistema de paginas dark: agenda publicacoes no Instagram em volume,
em varias contas, e monitora essas contas num painel.

Publica pela **API oficial da Meta**. Nao simula clique em navegador, que e a
categoria que toma banimento duro.

## Onde as coisas rodam

| Peca | Onde | Quando |
| --- | --- | --- |
| Painel | GitHub Pages | sempre no ar |
| Motor de publicacao | GitHub Actions | a cada 5 minutos |
| Vigia das contas | GitHub Actions | de hora em hora |
| Arquivos de video | pasta `midia/` deste repositorio | a Meta baixa daqui |
| Banco | arquivos em `dados/` | escritos pelo proprio motor |

Custo: zero. Nao depende do PC ligado.

## Como conectar uma conta

1. Crie **um aplicativo Meta novo**, separado de qualquer outro que voce use para
   cliente. Tipo "Outro", produto Instagram, configuracao "API com login do Instagram".
2. No painel do aplicativo, adicione a conta como **Testador do Instagram**.
3. Aceite o convite em `instagram.com/accounts/manage_access/`.
4. Gere o token e descubra o identificador numerico:
   `GET https://graph.instagram.com/v23.0/me?fields=user_id,username&access_token=SEU_TOKEN`
5. Guarde o token em **Settings, Secrets and variables, Actions**, com o nome
   `IG_TOKEN_CONTA1`.
6. Preencha a linha em `dados/contas.json` e marque `"ativa": true`.

Nao existe revisao de aplicativo nem verificacao de empresa nesse caminho. O acesso
padrao da Meta ja vale para contas que tem funcao no aplicativo.

## Como agendar um lote

Jogue os MP4 em `midia/`, coloque as legendas em `dados/legendas.json` e rode:

```
cd publicador
python agendar.py --inicio 2026-08-20 --horarios 09:00,13:00,19:00 --simular
python agendar.py --inicio 2026-08-20 --horarios 09:00,13:00,19:00
```

Cada horario informado e um post por dia, igual ao Speed Push. A diferenca esta nas
tres regras que ele nao tem.

## As tres regras que o agendador aplica sozinho

1. **Horario desencontrado.** Cada item recebe um desvio sorteado de ate 22 minutos,
   entao duas contas nunca postam no mesmo minuto.
2. **Legenda unica.** Legenda usada sai da lista e nao volta.
3. **Curva de aquecimento.** Conta com ate 21 dias recebe no maximo um post por dia.
   Sobe para dois na oitava semana e para tres depois disso.

## Limites que valem lembrar

- Teto da Meta: cem publicacoes por conta a cada 24 horas. O painel mostra o consumo.
- O gargalo real nao e esse. Conta saudavel sustenta de duas a tres por dia.
- Dez a cem videos por dia e alvo da **rede inteira**, nao de uma conta.
