// GERADO NA REFORMA DA ABA DE CONTAS (29/08/2026). Ordem numerica e lei.
/* =====================================================================
   A ABA DE CONTAS

   Ela responde UMA pergunta, de tres maneiras: esta conta esta de pe? Pela
   conexao (a Meta respondeu agora?), pelo acesso (quantos dias faltam?) e pelo
   que trava a operacao (teto do dia, fila e falha).

   NADA AQUI E DE MENTIRA. Cada botao faz o que promete contra a Meta de
   verdade: testar pergunta, ligar abre a autorizacao do Instagram, renovar
   troca o acesso, desligar apaga o token do cofre. Os filtros filtram o que
   veio do servidor, e nao uma lista escrita na pagina.

   O DESENHO E O DA SALA DE CONTROLE DO PORTAL, apontada por ele como regua.
   SEM GRAFICO: os dois que existiam foram removidos a pedido dele em 29/08. O
   historico que a aba mostra e' a tira de 30 dias dentro de cada ficha, que e'
   onde a pergunta "esta conta esteve de pe?" pertence.
   ===================================================================== */
(function(){
  'use strict';
  var pag = document.getElementById('pag-contas');
  if (!pag) return;

  /* ------------------------------------------------------------- simbolos
     No traco do Lucide, o mesmo do resto da casa. */
  var IC = {
    radio:'<path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/><path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>',
    gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    escudo:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    alerta:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    relogio:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    camadas:'<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>',
    video:'<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    girar:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    check:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    chave:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ig:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    desligar:'<path d="M12 4v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/>',
    agenda:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>',
    mais:'<path d="M5 12h14"/><path d="M12 5v14"/>',
    marco:'<path d="M4 22V4a2 2 0 0 1 2-2h9l-1.5 4L15 10H6"/><path d="M4 15h11"/>',
    colar:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 12V6a2 2 0 0 1 2-2h2"/><path d="M4 16h.01"/>',
    /* A SETA DE VOLTAR E UM ICONE, e nao a seta animada do botao: aquela aponta
       sempre para a frente, e "Voltar" com seta para a frente e' contradicao. */
    voltar:'<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'
  };
  function ico(nome, cls){
    return '<svg class="ct-i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' +
           (IC[nome] || '') + '</svg>';
  }
  function seguro(t){
    return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
             .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ------------------------------------------------------------- formatos */
  var FUSO = 'America/Sao_Paulo';
  function dias(a, b){ return Math.round((new Date(b) - new Date(a)) / 864e5); }
  function agora(){ return new Date(); }
  function dCurta(d){
    var x = new Date(d);
    return String(x.getDate()).padStart(2,'0') + '/' + String(x.getMonth()+1).padStart(2,'0');
  }
  function faz(d){
    if (!d) return 'nunca';
    var n = dias(d, agora());
    if (n <= 0) return 'hoje';
    if (n === 1) return 'ontem';
    if (n < 30) return 'há ' + n + ' dias';
    if (n < 365) return 'há ' + Math.round(n/30) + ' meses';
    return 'há ' + Math.round(n/365) + ' anos';
  }
  function hora(d){
    try { return new Date(d).toLocaleTimeString('pt-BR',
      {hour:'2-digit', minute:'2-digit', timeZone:FUSO}); } catch(e){ return ''; }
  }
  function quando(d){
    var n = dias(d, agora());
    return n <= 0 ? hora(d) : (n === 1 ? 'ontem' : dCurta(d));
  }
  /* AS DUAS RECEITAS DE TEMPO DA TELA. Ele reprovou o vaivem entre "hoje" e "há 12
     dias" na mesma coluna: duas fichas lado a lado falavam idiomas diferentes.
     Agora e' sempre a data, e o "faz quanto tempo" vem depois dela, como apoio. */
  function desde(d){
    if (!d) return 'Não anotado';
    var n = dias(d, agora());
    if (n <= 0) return 'Hoje';
    if (n === 1) return 'Ontem';
    return dCurta(d) + ' · ' + n + ' dias';
  }
  function vigiadaEm(d){
    if (!d) return 'Vigiando';
    var n = dias(d, agora());
    if (n <= 0) return 'Vigiada às ' + hora(d);
    if (n === 1) return 'Vigiada ontem, ' + hora(d);
    return 'Vigiada em ' + dCurta(d);
  }
  function num(n){ return (n == null ? 0 : n).toLocaleString('pt-BR'); }
  var cores = ['var(--ct-1)','var(--ct-2)','var(--ct-3)','var(--ct-4)','var(--ct-5)'];
  var ROTULO = {viva:'Conectada', vencendo:'Vencendo', caiu:'Sem Conexão'};
  /* A Meta devolve o tipo em caixa alta e em ingles. Isso e nome de campo, nao
     nome de coisa, e nome de campo nao vai para a tela. */
  var TIPO = {MEDIA_CREATOR:'Criador De Mídia', BUSINESS:'Empresa',
              CREATOR:'Criador', PERSONAL:'Pessoal'};
  function tipoDe(t){ return TIPO[t] || (t ? String(t).toLowerCase() : 'Instagram'); }

  /* ------------------------------------------------------------- o estado */
  var DADOS = {contas: []}, filtro = '', mercado = '', busca = '';
  var aba = {}, soFalhas = {}, carregando = false;

  function pedir(rota, corpo){
    var op = corpo ? {method:'POST', headers:{'Content-Type':'application/json'},
                      body: JSON.stringify(corpo)} : {cache:'no-store'};
    return fetch(rota, op).then(function(r){ return r.json(); });
  }
  function achar(u){
    return (DADOS.contas || []).filter(function(c){ return c.arroba === u; })[0];
  }
  function metaDe(a){
    return (window.metaDe ? window.metaDe(a) : {mercado:'', etiquetas:[]});
  }
  function filtradas(){
    return (DADOS.contas || []).filter(function(c){
      if (busca && (c.arroba + ' ' + (c.nome || '')).toLowerCase()
            .indexOf(busca) === -1) return false;
      if (mercado && metaDe(c.arroba).mercado !== mercado) return false;
      if (!filtro) return true;
      if (filtro === 'falha') return (c.falhas24h > 0) ||
        (c.tira || []).some(function(t){ return t.estado === 'caiu'; });
      return c.estado === filtro;
    });
  }

  /* OS DOIS GRAFICOS SAIRAM em 29/08, por ordem dele: "esses graficos de conexao
     da rede e acesso por conta pode remover". Com eles saiu tambem a biblioteca
     ECharts (500 KB em `vendor/`), que nao tinha mais quem a usasse. O que a aba
     mostra de historico agora e' a tira de 30 dias dentro de cada ficha, que e'
     onde a pergunta "esta conta esteve de pe?" pertence. */

  /* ============================================================ os quatro numeros */
  function kpis(){
    var lista = DADOS.contas || [];
    var conectadas = lista.filter(function(c){ return c.estado === 'viva'; }).length;
    var vencendo = lista.filter(function(c){ return c.estado === 'vencendo'; }).length;
    var caidas = lista.filter(function(c){ return c.estado === 'caiu'; }).length;
    var maisCurto = lista.length ? Math.min.apply(null, lista.map(function(c){
      return c.dias_para_vencer == null ? 999 : c.dias_para_vencer; })) : null;
    var usado = lista.reduce(function(s, c){ return s + (c.teto_usado || 0); }, 0);
    var teto = lista.reduce(function(s, c){ return s + (c.teto_total || 0); }, 0);
    var falhas = lista.reduce(function(s, c){ return s + (c.falhas24h || 0); }, 0);
    var renovacoes = lista.reduce(function(s, c){ return s + (c.renovacoes || 0); }, 0);

    function card(simbolo, rotulo, valor, sufixo, selo, tomSelo, pe){
      return '<div class="ct-cd ct-kpi">' +
        '<div class="cab">' + ico(simbolo, 's') + '<span class="ct-rot2">' + rotulo +
          '</span></div>' +
        '<div class="num ct-tn">' + valor +
          (sufixo ? '<small>' + sufixo + '</small>' : '') + '</div>' +
        '<div class="lin"><span class="pe">' + (pe || '') + '</span>' +
          (selo ? '<span class="ct-selo-n ' + (tomSelo || '') + '">' + selo + '</span>' : '') +
        '</div></div>';
    }
    /* OS TEXTOS DE APOIO SEGUEM UMA RECEITA SO': frase curta, comeca com maiuscula,
       sem ponto final, e diz de onde o numero veio ou o que ele obriga a fazer.
       O que havia antes ("todas de pé", "a Meta respondeu agora") era anotacao de
       rascunho, e ele reprovou por escrito. */
    var quandoMedido = DADOS.em ? ' às ' + hora(DADOS.em) : '';
    document.getElementById('ct-kpis').innerHTML =
      card('radio', 'Contas Conectadas', conectadas, 'de ' + lista.length,
           caidas ? caidas + (caidas === 1 ? ' fora' : ' fora') : 'Rede completa',
           caidas ? 'mau' : 'bom',
           lista.length ? 'Verificado na Meta' + quandoMedido
                        : 'Nenhuma conta ligada até agora') +
      card('escudo', 'Acesso Mais Curto', maisCurto == null ? '–' : maisCurto,
           maisCurto == null ? '' : (maisCurto === 1 ? 'dia' : 'dias'),
           vencendo ? vencendo + (vencendo === 1 ? ' vencendo' : ' vencendo') : null,
           'aviso',
           renovacoes ? 'Já renovado ' + renovacoes + (renovacoes === 1 ? ' vez'
             : ' vezes') + ' sem intervenção'
             : 'Renovação automática faltando 10 dias') +
      card('gauge', 'Teto Usado Hoje', num(usado), teto ? 'de ' + num(teto) : '',
           null, '', 'A Meta zera a contagem a cada 24 horas') +
      card('alerta', 'Falhas Em 24 Horas', num(falhas), '',
           falhas ? 'ver diário' : null, 'mau',
           falhas ? 'Publicações recusadas pela Meta'
                  : 'Nenhuma publicação recusada no período');
  }

  /* ============================================================ o aviso do topo */
  function aviso(){
    var alvo = document.getElementById('ct-aviso');
    var lista = DADOS.contas || [];
    if (DADOS.aviso){
      alvo.innerHTML = faixa('grave', DADOS.aviso, '');
      return;
    }
    var caidas = lista.filter(function(c){ return c.estado === 'caiu'; });
    var vencendo = lista.filter(function(c){ return c.estado === 'vencendo'; });
    if (caidas.length){
      alvo.innerHTML = faixa('grave', (caidas.length === 1
        ? '<b>@' + seguro(caidas[0].arroba) + ' perdeu a conexão.</b> ' +
          seguro(caidas[0].detalhe || 'A Meta recusou o acesso.')
        : '<b>' + caidas.length + ' contas perderam a conexão</b> e precisam ser ' +
          'ligadas de novo.'),
        'Ligar De Novo', 'ligar');
    } else if (vencendo.length){
      alvo.innerHTML = faixa('', (vencendo.length === 1
        ? '<b>O acesso de @' + seguro(vencendo[0].arroba) + ' vence em ' +
          vencendo[0].dias_para_vencer + ' dias.</b> A renovação automática age ' +
          'faltando 10.'
        : '<b>' + vencendo.length + ' contas vencem em menos de duas semanas.</b>' +
          ' A renovação automática age faltando 10 dias.'),
        'Renovar Agora', 'renovar-tudo');
    } else {
      alvo.innerHTML = '';
    }
  }
  function faixa(tom, texto, rotulo, acao){
    return '<div class="ct-aviso ' + tom + '">' +
      '<svg viewBox="0 0 24 24"><path d="M12 9v4"/>' +
      '<circle cx="12" cy="16.6" r=".7" fill="currentColor" stroke="none"/>' +
      '<path d="M10.3 3.9 2.4 17.5A1.9 1.9 0 0 0 4 20.4h16a1.9 1.9 0 0 0 1.6-2.9L13.7' +
      ' 3.9a1.9 1.9 0 0 0-3.4 0Z"/></svg><span>' + texto + '</span>' +
      (rotulo ? botao(rotulo, acao, 'mini') : '') + '</div>';
  }

  /* o botao animado da casa, o mesmo gesto do Programar.

     ICONE OU SETA, NUNCA OS DOIS. A regra e' dele, de 29/08: "no botao de ligar
     conta, remova a seta... porque ambos ja tem icone, ai com essa seta ficaria
     dois icones". Entao quem passa simbolo perde as setas, e quem nao passa fica
     com o gesto completo. A regra mora aqui dentro para nao depender de alguem
     lembrar dela na hora de escrever o proximo botao. */
  function botao(rotulo, acao, extra, simbolo, arroba){
    var seta = function(lado){
      return '<svg class="seta seta-' + lado + '" viewBox="0 0 24 24">' +
             '<use href="#i-seta"/></svg>';
    };
    return '<button class="ct-bt ' + (extra || '') + '" type="button" data-acao="' +
      acao + '"' + (arroba ? ' data-arroba="' + seguro(arroba) + '"' : '') + '>' +
      (simbolo ? '' : seta('esq')) +
      '<span class="txt">' +
        (simbolo ? '<svg class="mrc" viewBox="0 0 24 24">' + IC[simbolo] + '</svg>' : '') +
        rotulo + '</span>' +
      '<span class="circ"></span>' +
      (simbolo ? '' : seta('dir')) +
      '</button>';
  }

  /* ============================================================ os filtros */
  function filtros(){
    var lista = DADOS.contas || [];
    function conta(qual){
      if (qual === 'falha') return lista.filter(function(c){
        return (c.falhas24h > 0) ||
          (c.tira || []).some(function(t){ return t.estado === 'caiu'; }); }).length;
      return lista.filter(function(c){ return c.estado === qual; }).length;
    }
    var opcoes = [
      {v:'', r:'Todas', n: lista.length},
      {v:'viva', r:'Conectadas', n: conta('viva')},
      {v:'vencendo', r:'Vencendo', n: conta('vencendo')},
      {v:'caiu', r:'Sem Conexão', n: conta('caiu')},
      {v:'falha', r:'Com Falha', n: conta('falha')}
    ];
    document.getElementById('ct-seg').innerHTML = opcoes.map(function(o){
      return '<button data-f="' + o.v + '"' + (filtro === o.v ? ' class="on"' : '') + '>' +
        o.r + (o.n ? '<span class="n">' + o.n + '</span>' : '') + '</button>';
    }).join('');

    var mercados = [];
    lista.forEach(function(c){
      var m = metaDe(c.arroba).mercado;
      if (m && mercados.indexOf(m) === -1) mercados.push(m);
    });
    if (mercado && mercados.indexOf(mercado) === -1) mercado = '';
    var gatilho = document.getElementById('ct-dd-v');
    if (gatilho) gatilho.textContent = mercado || 'Todos Os Mercados';
    var balao = document.getElementById('ct-dd-m');
    balao.innerHTML = [{v:'', r:'Todos Os Mercados'}].concat(
      mercados.sort().map(function(m){ return {v:m, r:m}; })).map(function(o, k){
      return '<button class="ct-dd-o" role="option" data-op-mercado="' + seguro(o.v) +
        '" aria-selected="' + (mercado === o.v) + '">' +
        '<span class="pt" style="background:' + (o.v ? cores[k % 5] : 'var(--soft)') +
        '"></span>' + seguro(o.r) +
        '<span class="ck">' + ico('check','xs') + '</span></button>';
    }).join('');
  }

  /* ============================================================ a ficha */
  function tira(c){
    var marcas = (c.tira || []).map(function(t){
      var texto = {viva:'respondeu', vencendo:'respondeu, acesso vencendo',
                   caiu:'recusou'}[t.estado] || 'sem registro';
      return '<i class="' + t.estado + '" title="' + dCurta(t.dia) + ': ' + texto +
             (t.ms ? ' em ' + t.ms + ' ms' : '') + '"></i>';
    }).join('');
    var registrados = (c.tira || []).filter(function(t){
      return t.estado !== 'sem'; }).length;
    return '<div class="ct-vig">' +
      '<div class="ct-vig-l"><span class="ct-rot1">Vigilância Dos Últimos 30 Dias</span>' +
        '<span class="ct-ms">' + (c.ms != null ? c.ms + ' ms' : '') + '</span></div>' +
      '<div class="ct-tira">' + marcas + '</div>' +
      '<div class="ct-tira-pe"><span>' +
        (registrados === 0 ? 'Sem registro ainda'
          : (registrados === 1 ? 'Primeiro registro hoje'
             : registrados + ' dias registrados')) + '</span>' +
        '<span>' + (c.checada_em ? 'Testada às ' + hora(c.checada_em) : '') +
        '</span></div>' +
    '</div>';
  }

  function medidas(c){
    var tetoTotal = c.teto_total || 0, tetoUsado = c.teto_usado || 0;
    var pctTeto = tetoTotal ? Math.round(tetoUsado / tetoTotal * 100) : 0;
    var tomTeto = pctTeto >= 80 ? ' class="mau"' : (pctTeto >= 50 ? ' class="meio"' : '');
    var faltam = c.dias_para_vencer;
    var total = c.ligada_em && c.vence_em
      ? Math.max(dias(c.ligada_em, c.vence_em), 1) : 60;
    var pctAcesso = faltam == null ? 0
      : Math.max(2, Math.min(100, Math.round(faltam / total * 100)));
    var tomAcesso = faltam == null ? '' : (faltam <= 7 ? ' class="mau"'
      : (faltam <= 14 ? ' class="meio"' : ''));
    return '<div class="ct-med">' +
      '<div class="ct-m"><div class="cab">' + ico('gauge','xs') +
        '<span>Teto De Hoje</span></div>' +
        '<div class="val"><b>' + (tetoTotal ? tetoUsado : '–') + '</b>' +
        (tetoTotal ? '<small>de ' + tetoTotal + '</small>' : '') + '</div>' +
        '<div class="ct-barra"><i' + tomTeto + ' style="width:' +
          Math.max(pctTeto, 2) + '%"></i></div>' +
        '<div class="pe">' + (tetoTotal
          ? 'Restam ' + (tetoTotal - tetoUsado) + ' para hoje'
          : 'A Meta não respondeu o teto') + '</div></div>' +
      '<div class="ct-m"><div class="cab">' + ico('escudo','xs') +
        '<span>Acesso Vence</span></div>' +
        '<div class="val"><b>' + (faltam == null ? '–' : faltam) + '</b>' +
        (faltam == null ? '' : '<small>' + (faltam === 1 ? 'dia' : 'dias') +
          '</small>') + '</div>' +
        '<div class="ct-barra"><i' + tomAcesso + ' style="width:' + pctAcesso +
          '%"></i></div>' +
        /* SO' A DATA. A contagem de renovacoes cabia aqui em ingles, mas em
           portugues ela estourava a coluna e virava "Até 28/10 · renovad…". Texto
           cortado nao e' texto: ou cabe, ou vai para onde ha espaco. Ela vive no
           numero do topo e na janela de teste. */
        '<div class="pe">' + (c.vence_em ? 'Até ' + dCurta(c.vence_em)
                                         : 'Sem validade anotada') + '</div></div>' +
      '<div class="ct-m"><div class="cab">' + ico('camadas','xs') +
        '<span>Fila De Vídeos</span></div>' +
        '<div class="val"><b' + (c.falhas24h ? ' class="mau"' : '') + '>' +
          num(c.fila) + '</b></div>' +
        '<div class="ct-barra"><i style="width:' +
          Math.max(2, Math.min(100, (c.fila || 0) * 3)) + '%"></i></div>' +
        '<div class="pe">' + (c.falhas24h
          ? c.falhas24h + (c.falhas24h === 1 ? ' falha em 24 horas'
                                             : ' falhas em 24 horas')
          : (c.fila ? 'Aguardando publicação' : 'Nada na fila')) + '</div></div>' +
    '</div>';
  }

  function corpoEstado(c){
    /* DUAS LINHAS SAIRAM em 29/08, por ordem dele, e cada uma por um motivo:

       "Pastas De Mídia No Sistema" nunca deveria ter estado numa ficha de CONTA: o
       numero e' do sistema inteiro e se repetia igual nas tres fichas, o que faz
       qualquer leitor achar que aquilo e' da conta que ele esta' olhando.

       "Saídas Programadas" repetia a medida "Fila De Vídeos", que fica a dois dedos
       de distancia na mesma ficha. Mesmo numero dito duas vezes com nomes parecidos
       nao informa mais: so' faz duvidar de qual dos dois esta' certo. */
    return '<div class="ct-par"><span class="rot">' + ico('relogio','xs') +
        'Saídas Pelo Publicador</span><b>' + (c.publicados
          ? c.publicados + (c.publicados === 1 ? ' publicação' : ' publicações')
          : 'Nenhuma ainda') + '</b></div>' +
      '<div class="ct-par"><span class="rot">' + ico('chave','xs') +
        'No Publicador Desde</span><b>' + desde(c.ligada_em) + '</b></div>' +
      '<div class="ct-par"><span class="rot">' + ico('ig','xs') +
        'Tipo Da Conta</span><b>' + seguro(tipoDe(c.tipo)) + '</b></div>';
  }

  function corpoDiario(c){
    var so = soFalhas[c.arroba];
    var lista = (c.diario || []).filter(function(e){ return !so || e.tipo === 'falha'; });
    var corpo = lista.length
      ? lista.map(function(e){
          var marca = {falha:'falha', aviso:'aviso', ok:'ok'}[e.tipo] || '';
          var simbolo = {falha:'alerta', aviso:'girar', ok:'check'}[e.tipo] || 'marco';
          return '<div class="ct-ev"><span class="ic ' + marca + '">' + ico(simbolo) +
            '</span><span class="c"><b>' + seguro(e.titulo) + '</b>' +
            '<span>' + seguro(e.detalhe || '') + '</span></span>' +
            '<span class="q">' + quando(e.quando) + '</span></div>';
        }).join('')
      : '<div class="ct-sem">' + (so ? 'Nenhuma falha registrada nesta conta.'
          : 'O diário desta conta ainda está vazio.') + '</div>';
    return '<div class="ct-diario-topo"><span class="ct-rot1">Diário Da Conta</span>' +
      '<button class="ct-so-falhas' + (so ? ' on' : '') + '" data-falhas="' +
      seguro(c.arroba) + '">Só Falhas</button></div>' +
      '<div class="ct-diario">' + corpo + '</div>';
  }

  function corpoIdentidade(c){
    var m = metaDe(c.arroba);
    return '<div class="ct-par" style="border:0;padding-top:2px">' +
      '<span class="rot">Mercado</span>' +
      '<span class="ct-campo' + (m.mercado ? '' : ' vazio') + '" data-mercado="' +
      seguro(c.arroba) + '">' + seguro(m.mercado || 'definir') + '</span></div>' +
      '<div style="padding-top:10px"><span class="ct-rot1">Etiquetas</span>' +
      '<span class="ct-etqs" data-etqs="' + seguro(c.arroba) + '">' +
        m.etiquetas.map(function(t){
          return '<span class="ct-etq">' + seguro(t) + '<button data-tirar="' + seguro(t) +
            '" aria-label="Tirar ' + seguro(t) + '">×</button></span>'; }).join('') +
        '<button class="ct-etq-mais" data-por="' + seguro(c.arroba) +
        '">+ etiqueta</button></span></div>' +
      '<div class="ct-par" style="margin-top:12px"><span class="rot">' + ico('ig','xs') +
        'Identificador Na Meta</span><b class="ct-tn" style="font-size:11.5px;' +
        'color:var(--soft)">' + seguro(c.ig_user_id || '') + '</b></div>';
  }

  /* O ROSTO DA CONTA. Fica solto porque a ficha nao e' mais o unico lugar que o
     usa: a janela de teste tambem mostra de quem ela fala, e retrato desenhado em
     dois lugares diferentes vira dois retratos diferentes na primeira mudanca. */
  function rosto(c, i){
    var retrato = c.avatar || RETRATOS[String(c.arroba).toLowerCase()];
    var iniciais = seguro(String(c.arroba).slice(0, 2).toUpperCase());
    var fundo = cores[(i || 0) % 5];
    /* O RETRATO DA META VEM COM PRAZO: o endereco e' assinado e um dia caduca.
       Quando isso acontecer, a ficha troca a foto pelas iniciais em vez de mostrar
       o quadrado quebrado do navegador. */
    return retrato
      ? '<img class="ct-av" src="' + seguro(retrato) + '" alt="" ' +
        'onerror="this.outerHTML=\'&lt;span class=&quot;ct-av&quot; style=&quot;' +
        'background:' + fundo + '&quot;&gt;' + iniciais + '&lt;/span&gt;\'">'
      : '<span class="ct-av" style="background:' + fundo + '">' + iniciais + '</span>';
  }
  /* a cor do rosto vem da posicao na lista, entao ela precisa ser a mesma posicao
     na ficha e na janela, senao a mesma conta muda de cor ao abrir */
  function indiceDe(u){
    var lista = DADOS.contas || [];
    for (var i = 0; i < lista.length; i++) if (lista[i].arroba === u) return i;
    return 0;
  }

  function ficha(c, i){
    var qual = aba[c.arroba] || 'estado';
    var falhasNaTira = (c.tira || []).filter(function(t){
      return t.estado === 'caiu'; }).length;
    var face = rosto(c, i);
    var corpo = qual === 'diario' ? corpoDiario(c)
      : (qual === 'identidade' ? corpoIdentidade(c) : corpoEstado(c));

    return '<article class="ct-cd ct-f ' + c.estado + '" data-conta="' +
      seguro(c.arroba) + '">' +
      '<div class="ct-f-cab">' + face +
        '<div class="ct-quem"><div class="ct-arroba">@' + seguro(c.arroba) + '</div>' +
        '<div class="ct-sub">' + seguro(c.nome || c.arroba) + ' · ' +
        seguro(tipoDe(c.tipo)) + '</div></div>' +
        '<span class="ct-estado ' + c.estado + '"><i></i>' + ROTULO[c.estado] +
        '</span></div>' +
      tira(c) + medidas(c) +
      '<div class="ct-seg ct-abas" data-abas="' + seguro(c.arroba) + '">' +
        '<button data-aba="estado"' + (qual === 'estado' ? ' class="on"' : '') +
          '>Estado</button>' +
        '<button data-aba="diario"' + (qual === 'diario' ? ' class="on"' : '') +
          '>Diário' + (falhasNaTira ? '<span class="n">' + falhasNaTira + '</span>' : '') +
          '</button>' +
        '<button data-aba="identidade"' + (qual === 'identidade' ? ' class="on"' : '') +
          '>Identidade</button>' +
      '</div>' +
      '<div class="ct-corpo">' + corpo + '</div>' +
      '<div class="ct-f-pe">' +
        botao('Programar', 'programar', 'mini verde') +
        '<div class="dir">' +
          '<button class="ct-ic" data-testar="' + seguro(c.arroba) +
            '" title="Testar a conexão agora">' + ico('girar') + '</button>' +
          (c.dias_para_vencer != null && c.dias_para_vencer <= 30
            ? '<button class="ct-ic" data-renovar="' + seguro(c.arroba) +
              '" title="Renovar o acesso agora">' + ico('escudo') + '</button>' : '') +
          '<a class="ct-ic" href="https://www.instagram.com/' + seguro(c.arroba) +
            '/" target="_blank" rel="noopener" title="Abrir no Instagram">' +
            ico('ig') + '</a>' +
          '<button class="ct-ic" data-desligar="' + seguro(c.arroba) +
            '" title="Desligar do publicador">' + ico('desligar') + '</button>' +
        '</div></div></article>';
  }

  /* ============================================================ desenhar */
  function desenhar(){
    var lista = filtradas();
    var caixa = document.getElementById('ct-fichas');
    caixa.innerHTML = lista.length
      ? lista.map(ficha).join('')
      : '<div class="ct-cd"><div class="ct-vazio">' +
        ((DADOS.contas || []).length
          ? 'Nenhuma conta corresponde a este filtro.'
          : 'Nenhuma conta ligada ainda. Use o botão Ligar Conta para começar.') +
        '</div></div>';
    document.getElementById('ct-quantas').textContent =
      lista.length + (lista.length === 1 ? ' conta na tela' : ' contas na tela');
    kpis(); aviso(); filtros();
    var quando = document.getElementById('ct-relogio');
    if (quando) quando.textContent = vigiadaEm(DADOS.em);
    var selo = document.querySelector('.ct-vivo');
    if (selo) selo.classList.toggle('mau', (DADOS.caidas || 0) > 0);
  }

  /* ============================================================ carregar */
  /* O RETRATO NAO VEM DA CONEXAO. A chamada de identidade da Meta devolve arroba e
     numeros, nunca a foto; ela mora em `analytics.json`, que a rota `perfis` serve.
     Sao duas fontes para uma ficha so, e por isso o retrato e' guardado a parte. */
  var RETRATOS = {};
  function lerRetratos(){
    return pedir('/perfis').then(function(d){
      (d.perfis || []).forEach(function(p){
        if (p.u && p.avatar) RETRATOS[String(p.u).toLowerCase()] = p.avatar;
      });
    }).catch(function(){});
  }

  function carregar(forcar){
    if (carregando) return Promise.resolve();
    carregando = true;
    var vai = forcar ? pedir('/contas/testar', {}) : pedir('/contas/estado');
    return Promise.all([
        (window.lerMeta ? window.lerMeta() : Promise.resolve()), lerRetratos()])
      .then(function(){ return vai; })
      .then(function(d){
        DADOS = d || {contas: []};
        carregando = false;
        desenhar();
      })
      .catch(function(){
        carregando = false;
        document.getElementById('ct-fichas').innerHTML =
          '<div class="ct-cd"><div class="ct-vazio">Não consegui falar com o ' +
          'servidor do painel. Recarregue a página.</div></div>';
      });
  }

  /* ============================================================ A JANELA
     Duas conversas cabem nela: o teste de conexao (uma por conta) e o passo a
     passo de ligar conta. A casca e' a mesma; o que muda e' o recheio.

     ELA MOSTRA O CAMINHO, e nao so' o fim. Um "deu certo" verde nao explica o que
     foi perguntado nem em quanto tempo respondeu, e e' justamente isso que a
     pessoa precisa quando alguma coisa para de funcionar. */
  var JAN = document.getElementById('ct-jan');
  var J_CAB = document.getElementById('ct-jan-cab');
  var J_CORPO = document.getElementById('ct-jan-corpo');
  var J_PE = document.getElementById('ct-jan-pe');
  var focoAntes = null, relogioDaSaida = null;

  function janelaAberta(){ return !!JAN && !JAN.hidden; }

  function abrirJanela(cab, corpo, pe, larga){
    if (!JAN) return;
    clearTimeout(relogioDaSaida);
    JAN.classList.remove('saindo');
    JAN.classList.toggle('larga', !!larga);
    J_CAB.innerHTML = cab;
    J_CORPO.innerHTML = corpo;
    J_PE.innerHTML = pe || '';
    if (JAN.hidden){
      focoAntes = document.activeElement;
      JAN.hidden = false;
    }
    var x = JAN.querySelector('.ct-jan-x');
    if (x) x.focus();
  }
  function trocarCorpo(corpo, pe, cab){
    if (!janelaAberta()) return;
    if (cab != null) J_CAB.innerHTML = cab;
    J_CORPO.innerHTML = corpo;
    if (pe != null) J_PE.innerHTML = pe;
  }
  function fecharJanela(){
    if (!janelaAberta()) return;
    JAN.classList.add('saindo');
    relogioDaSaida = setTimeout(function(){
      JAN.hidden = true;
      JAN.classList.remove('saindo');
      J_CAB.innerHTML = ''; J_CORPO.innerHTML = ''; J_PE.innerHTML = '';
      if (focoAntes && focoAntes.focus) focoAntes.focus();
    }, 160);
  }

  /* ------------------------------------------------------------- as pecas */
  function fecharBt(){
    return '<button class="ct-jan-x" type="button" data-ct-fechar aria-label="Fechar">' +
      '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
  }
  function cabConta(c, titulo){
    return rosto(c, indiceDe(c.arroba)) +
      '<div class="ct-jan-quem"><b id="ct-jan-tit">@' + seguro(c.arroba) + '</b>' +
      '<span>' + seguro(titulo) +
        (c.tipo ? ' · ' + seguro(tipoDe(c.tipo)) : '') + '</span></div>' +
      (c.estado ? '<span class="ct-estado ' + c.estado + '"><i></i>' +
        ROTULO[c.estado] + '</span>' : '') + fecharBt();
  }
  function cabSimples(simbolo, titulo, sub){
    return '<span class="ct-av" style="background:var(--ink);color:var(--paper)">' +
      '<svg class="ct-i s" viewBox="0 0 24 24">' + (IC[simbolo] || '') + '</svg></span>' +
      '<div class="ct-jan-quem"><b id="ct-jan-tit">' + titulo + '</b>' +
      '<span>' + sub + '</span></div>' + fecharBt();
  }
  function veredito(tom, simbolo, titulo, sub, direita, esperando){
    return '<div class="ct-vered ' + (tom || '') + (esperando ? ' esperando' : '') + '">' +
      '<span class="bolha"><svg viewBox="0 0 24 24">' + (IC[simbolo] || '') +
      '</svg></span>' +
      '<div class="c"><b>' + titulo + '</b><span>' + sub + '</span></div>' +
      (direita || '') + '</div>';
  }
  function passo(tom, simbolo, titulo, texto, valor, tomValor){
    return '<div class="ct-pas"><span class="ic ' + (tom || '') + '">' +
      '<svg viewBox="0 0 24 24">' + (IC[simbolo] || '') + '</svg></span>' +
      '<span class="c"><b>' + titulo + '</b><span>' + texto + '</span></span>' +
      (valor ? '<span class="v ' + (tomValor || '') + '">' + valor + '</span>' : '') +
      '</div>';
  }

  /* ------------------------------------------------- o teste de uma conta
     A JANELA ABRE ANTES DA RESPOSTA, de proposito. A pergunta a Meta leva de 200
     ms a alguns segundos, e botao que fica mudo nesse tempo parece quebrado. */
  /* `semVeredito` serve a janela de conta recem-ligada, que ja' tem o proprio
     veredito em cima e so' quer as linhas do que a Meta respondeu. */
  function corpoTeste(c, esperando, semVeredito){
    if (esperando){
      return veredito('neutro', 'girar', 'Perguntando à Meta…',
        'Três perguntas seguidas: renovar se for a hora, quem é a conta e quanto ' +
        'ainda cabe hoje.', '', true) +
        passo('', 'ig', 'Identidade Da Conta', 'Aguardando resposta', '') +
        passo('', 'escudo', 'Validade Do Acesso', 'Aguardando resposta', '') +
        passo('', 'gauge', 'Teto De Publicação', 'Aguardando resposta', '');
    }
    var caiu = c.estado === 'caiu';
    var faltam = c.dias_para_vencer;
    var linhas = '';

    /* a renovacao so' aparece quando ela de fato aconteceu nesta rodada: linha que
       diz "nao precisou" a cada teste vira ruido e some da vista quando importar */
    var r = c.renovacao;
    if (r && r.tentou){
      linhas += passo(r.deu_certo ? 'ok' : 'mau', 'girar', 'Renovação Do Acesso',
        r.deu_certo
          ? 'O acesso estava a menos de 10 dias do fim e foi trocado por um novo ' +
            'antes da pergunta.'
          : seguro(r.detalhe || 'A Meta recusou a renovação.'),
        r.deu_certo ? 'renovado' : 'falhou', r.deu_certo ? '' : 'mau');
    }
    linhas += passo(caiu ? 'mau' : 'ok', 'ig', 'Identidade Da Conta',
      caiu ? seguro(c.detalhe || 'A Meta recusou o acesso desta conta.')
           : 'A Meta devolveu o arroba, o tipo e o identificador ' +
             seguro(c.ig_user_id || ''),
      caiu ? 'recusou' : seguro(tipoDe(c.tipo)), caiu ? 'mau' : '');

    linhas += passo(faltam == null ? '' : (faltam <= 0 ? 'mau'
        : (faltam <= 14 ? 'aviso' : 'ok')), 'escudo', 'Validade Do Acesso',
      faltam == null ? 'Este acesso não tem validade anotada no cofre.'
        : (faltam <= 0 ? 'O acesso venceu. A conta precisa ser ligada de novo.'
          : 'Vence em ' + dCurta(c.vence_em) +
            (c.renovacoes ? ' · já renovado ' + c.renovacoes + 'x' : '') +
            '. A renovação automática entra faltando 10 dias.'),
      faltam == null ? '–' : faltam + (faltam === 1 ? ' dia' : ' dias'),
      faltam == null ? '' : (faltam <= 0 ? 'mau' : (faltam <= 14 ? 'aviso' : '')));

    var teto = c.teto_total || 0;
    linhas += passo(teto ? 'ok' : '', 'gauge', 'Teto De Publicação',
      teto ? 'A Meta deixa ' + teto + ' publicações por conta a cada 24 horas, e ' +
             'já foram ' + (c.teto_usado || 0) + '.'
           : 'A Meta não devolveu o teto desta conta nesta rodada.',
      teto ? (teto - (c.teto_usado || 0)) + ' cabem' : '–');

    if (semVeredito) return linhas;
    return veredito(caiu ? 'mau' : (c.estado === 'vencendo' ? 'aviso' : ''),
      caiu ? 'alerta' : 'check',
      caiu ? 'A Meta recusou o acesso' : 'A Meta respondeu',
      caiu ? seguro(c.detalhe || 'O acesso desta conta não vale mais.')
           : 'A conta está ativa e pronta para publicar.',
      (c.ms != null ? '<span class="ms">' + c.ms + '<small>ms</small></span>' : '')) +
      linhas;
  }
  function peTeste(c, esperando){
    return '<span class="nota">' + (esperando ? 'Consultando a Meta'
        : (c.checada_em ? 'Verificado às ' + hora(c.checada_em) : '')) + '</span>' +
      '<span class="dir">' +
        (!esperando && c.dias_para_vencer != null && c.dias_para_vencer <= 30
          ? botao('Renovar Acesso', 'renovar-um', 'mini', 'escudo', c.arroba) : '') +
        (esperando ? '' : botao('Testar De Novo', 'testar-de-novo', 'mini', 'girar',
                                c.arroba)) +
        botao('Fechar', 'fechar', 'mini') +
      '</span>';
  }

  function janelaTeste(arroba){
    var c = achar(arroba) || {arroba: arroba};
    abrirJanela(cabConta(c, 'Teste De Conexão'), corpoTeste(c, true), peTeste(c, true));
    return pedir('/contas/testar', {arroba: arroba}).then(function(d){
      DADOS = d || DADOS;
      desenhar();
      var novo = achar(arroba) || c;
      trocarCorpo(corpoTeste(novo, false), peTeste(novo, false),
                  cabConta(novo, 'Teste De Conexão'));
    }).catch(function(){
      trocarCorpo(veredito('mau', 'alerta', 'Não consegui falar com o painel',
        'O pedido não chegou ao servidor. Recarregue a página e tente de novo.'),
        peTeste(c, false));
    });
  }

  /* ------------------------------------------------- o teste da rede inteira */
  function linhaConta(c, esperando){
    return '<button class="ct-lin" type="button" data-abrir-conta="' +
      seguro(c.arroba) + '">' + rosto(c, indiceDe(c.arroba)) +
      '<span class="c"><b>@' + seguro(c.arroba) + '</b><span>' +
        (esperando ? 'Consultando…'
          : (c.estado === 'caiu' ? seguro(c.detalhe || 'A Meta recusou o acesso')
            : (c.dias_para_vencer != null
              ? 'Acesso válido por mais ' + c.dias_para_vencer + ' dias'
              : 'Acesso sem validade anotada'))) + '</span></span>' +
      (esperando ? '' : '<span class="ct-estado ' + c.estado + '"><i></i>' +
        ROTULO[c.estado] + '</span>') +
      '<span class="ms">' + (esperando || c.ms == null ? '' : c.ms + ' ms') +
      '</span></button>';
  }
  function corpoRede(lista, esperando){
    var deram = lista.filter(function(c){ return c.estado !== 'caiu'; }).length;
    var tempos = lista.map(function(c){ return c.ms; })
                      .filter(function(m){ return m != null; });
    var medio = tempos.length ? Math.round(tempos.reduce(function(a, b){
      return a + b; }, 0) / tempos.length) : null;
    var tom = esperando ? 'neutro'
      : (deram === lista.length ? '' : (deram ? 'aviso' : 'mau'));
    return veredito(tom, esperando ? 'girar' : (deram === lista.length ? 'check' : 'alerta'),
      esperando ? 'Perguntando à Meta…'
        : deram + ' de ' + lista.length +
          (lista.length === 1 ? ' conta respondeu' : ' contas responderam'),
      esperando ? 'Uma consulta por conta, uma de cada vez.'
        : (medio != null ? 'Tempo médio de resposta: ' + medio + ' ms'
                         : 'A Meta não devolveu tempo de resposta'),
      '', esperando) +
      '<div style="margin-top:8px">' +
        (lista.length ? lista.map(function(c){ return linhaConta(c, esperando); }).join('')
          : '<div class="ct-sem">Nenhuma conta ligada ainda.</div>') +
      '</div>';
  }
  function janelaRede(){
    var lista = (DADOS.contas || []).slice();
    abrirJanela(cabSimples('radio', 'Teste De Conexão Da Rede',
        lista.length + (lista.length === 1 ? ' conta ligada' : ' contas ligadas')),
      corpoRede(lista, true),
      '<span class="nota">Clique numa conta para ver o detalhe</span>' +
      '<span class="dir">' + botao('Fechar', 'fechar', 'mini') + '</span>');
    return pedir('/contas/testar', {}).then(function(d){
      DADOS = d || DADOS;
      desenhar();
      trocarCorpo(corpoRede(DADOS.contas || [], false));
    }).catch(function(){
      trocarCorpo(veredito('mau', 'alerta', 'Não consegui falar com o painel',
        'O pedido não chegou ao servidor. Recarregue a página e tente de novo.'));
    });
  }

  /* ------------------------------------------------------------ LIGAR CONTA
     UM METODO SO', UMA ETAPA POR VEZ. As duas regras sao dele, em 29/08, depois
     de reprovar a versao anterior: "tem que ser um metodo unico, nao pode ter mais
     de um metodo" e "tem que ser uma coisa por etapa, aqui voce ja ta cuspindo
     todas as etapas".

     O METODO ESCOLHIDO E O DO TOKEN COLADO, e nao o OAuth, por um motivo pratico:
     ele funciona hoje, sem depender de cadastro nenhum no painel da Meta. O OAuth
     exige que o endereco de volta esteja cadastrado la', e enquanto nao estiver ele
     morre com "Invalid redirect_uri" na cara de quem clicou. As rotas do OAuth
     continuam no servidor, provadas pelo portao, mas fora da tela.

     SO' SE LIGA UMA VEZ. O acesso e' de 60 dias porque nao existe eterno nesta API,
     mas quem renova e' o painel: no cron das 7h07 e sempre que esta aba e' aberta
     depois de 15 minutos. A ultima etapa diz isso com todas as letras. */
  var etapa = 1, ligada = null, PRONTIDAO = null;
  var ETAPAS = 3;

  function trilha(){
    var pontos = '';
    for (var i = 1; i <= ETAPAS; i++){
      pontos += '<i class="' + (i < etapa ? 'feito' : (i === etapa ? 'agora' : '')) +
        '"></i>';
      if (i < ETAPAS) pontos += '<u class="' + (i < etapa ? 'feito' : '') + '"></u>';
    }
    return '<div class="ct-trilha">' + pontos + '</div>';
  }
  function etapaCorpo(simbolo, titulo, texto, extra, tom){
    return trilha() +
      '<div class="ct-et">' +
        '<span class="ct-et-ic ' + (tom || '') + '">' +
          '<svg viewBox="0 0 24 24">' + (IC[simbolo] || '') + '</svg></span>' +
        '<h4>' + titulo + '</h4>' +
        '<p>' + texto + '</p>' +
        (extra || '') +
      '</div>';
  }
  /* o botao da casa em forma de link: sair daqui para a Meta e' navegacao, e
     navegacao e' <a>, nao <button> que finge */
  function botaoLink(rotulo, url, simbolo){
    return '<a class="ct-bt verde" href="' + seguro(url) + '" target="_blank" ' +
      'rel="noopener"><span class="txt">' +
      '<svg class="mrc" viewBox="0 0 24 24">' + (IC[simbolo] || '') + '</svg>' +
      rotulo + '</span><span class="circ"></span></a>';
  }

  function desenharEtapa(){
    var cab, corpo, pe;
    if (etapa === 1){
      var console_ = (PRONTIDAO && PRONTIDAO.console) ||
                     'https://developers.facebook.com/apps/';
      cab = cabSimples('chave', 'Ligar Conta', 'passo 1 de 3');
      corpo = etapaCorpo('chave', 'Gere O Token Na Meta',
        'No aplicativo, abra <b>Instagram → Configuração da API com login do ' +
        'Instagram</b>. No bloco <b>Gerar token de acesso</b>, conecte a conta que ' +
        'vai publicar e clique em Gerar token.',
        '<div class="ct-et-acao">' + botaoLink('Abrir A Meta', console_, 'ig') +
        '</div>' +
        '<p class="ct-et-pe">A conta precisa ser profissional, Empresa ou Criador. ' +
        'A Meta mostra o token uma vez só.</p>');
      pe = '<span class="nota">Gerou? siga para colar</span><span class="dir">' +
        botao('Avançar', 'etapa-avancar', 'verde') + '</span>';
    } else if (etapa === 2){
      cab = cabSimples('chave', 'Ligar Conta', 'passo 2 de 3');
      corpo = etapaCorpo('colar', 'Cole O Token Aqui',
        'O publicador pergunta à Meta de quem é este token e liga a conta certa. ' +
        '<b>Você não digita o arroba</b>, para não existir conta trocada com token ' +
        'trocado.',
        '<textarea class="ct-token" id="ct-token" rows="4" spellcheck="false" ' +
        'autocomplete="off" placeholder="IGAAx..."></textarea>' +
        '<p class="ct-et-pe">O token fica no cofre do servidor e nunca volta para ' +
        'a tela.</p>');
      pe = '<span class="dir" style="margin-left:0">' +
        botao('Voltar', 'etapa-voltar', 'mini', 'voltar') + '</span>' +
        '<span class="dir">' + botao('Ligar Conta', 'colar', 'verde', 'mais') +
        '</span>';
    } else {
      var c = ligada || {};
      cab = cabConta(c, 'Conta Ligada');
      corpo = trilha() +
        '<div class="ct-et">' +
          '<span class="ct-et-ic bom"><svg viewBox="0 0 24 24">' + IC.check +
            '</svg></span>' +
          '<h4>@' + seguro(c.arroba || '') + ' Está Ligada</h4>' +
          '<p>A Meta respondeu' + (c.ms != null ? ' em <b>' + c.ms + ' ms</b>' : '') +
          ' e a conta já pode publicar pelo publicador.</p>' +
        '</div>' +
        '<div class="ct-et-linhas">' + corpoTeste(c, false, true) + '</div>' +
        '<div class="ct-et-jura">' +
          '<svg viewBox="0 0 24 24">' + IC.girar + '</svg>' +
          '<span><b>Você não liga esta conta de novo.</b> O acesso vale 60 dias, ' +
          'e o publicador troca por um novo sozinho faltando 10, no relógio das ' +
          '7h07 e toda vez que esta aba é aberta. Token que não expira não existe ' +
          'nesta API: o que existe é essa troca.</span>' +
        '</div>';
      pe = '<span class="nota">Ligada agora</span><span class="dir">' +
        botao('Concluir', 'fechar', 'verde') + '</span>';
    }
    trocarCorpo(corpo, pe, cab);
  }

  function janelaLigar(){
    etapa = 1; ligada = null;
    abrirJanela(cabSimples('chave', 'Ligar Conta', 'passo 1 de 3'),
      '<div class="ct-sem">Carregando…</div>', '');
    return pedir('/contas/prontidao').then(function(p){
      PRONTIDAO = p;
      desenharEtapa();
    }).catch(function(){
      PRONTIDAO = null;
      desenharEtapa();
    });
  }


  /* --------------------------------------------------------- os cliques dela
     A JANELA MORA FORA DA ABA, entao ela precisa do proprio ouvinte: o da pagina
     nao alcanca o que esta' fora dela. */
  if (JAN) JAN.addEventListener('click', function(e){
    if (e.target.closest('[data-ct-fechar]')) return fecharJanela();

    var linha = e.target.closest('[data-abrir-conta]');
    if (linha) return janelaTeste(linha.dataset.abrirConta);

    var bt = e.target.closest('[data-acao]');
    if (!bt) return;
    var qual = bt.dataset.acao;
    if (qual === 'fechar') return fecharJanela();
    if (qual === 'testar-de-novo') return janelaTeste(bt.dataset.arroba);
    if (qual === 'renovar-um'){
      var quem = bt.dataset.arroba;
      var solta = ocupado(bt, 'Renovando…');
      pedir('/contas/renovar', {arroba: quem})
        .then(function(){ solta(); return janelaTeste(quem); })
        .catch(solta);
      return;
    }
    if (qual === 'etapa-avancar'){ etapa = 2; desenharEtapa();
      var novo = document.getElementById('ct-token');
      if (novo) novo.focus();
      return;
    }
    if (qual === 'etapa-voltar'){ etapa = 1; return desenharEtapa(); }
    if (qual === 'colar'){
      var campo = document.getElementById('ct-token');
      var valor = campo ? campo.value.trim() : '';
      var velho = document.querySelector('.ct-erro');
      if (velho) velho.remove();
      if (!valor){
        if (campo){
          campo.focus();
          campo.insertAdjacentHTML('afterend',
            '<div class="ct-erro">Cole o token antes de ligar.</div>');
        }
        return;
      }
      var largar = ocupado(bt, 'Perguntando À Meta…');
      pedir('/contas/colar', {token: valor}).then(function(d){
        largar();
        if (!d || d.erro){
          /* O ERRO FICA JUNTO DO CAMPO, e nao no lugar da etapa. Erro que troca a
             tela inteira obriga a pessoa a refazer o caminho so' para reler. */
          var onde = document.getElementById('ct-token');
          if (onde) onde.insertAdjacentHTML('afterend',
            '<div class="ct-erro">' + seguro(d && d.erro || 'não deu certo') +
            '</div>');
          return;
        }
        return carregar(false).then(function(){
          ligada = achar(d.arroba) || {arroba: d.arroba};
          etapa = 3;
          desenharEtapa();
        });
      }).catch(function(){ largar(); });
      return;
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && janelaAberta()) fecharJanela();
  });

  /* ============================================================ as acoes
     TODAS FALAM COM A META DE VERDADE. Nenhum botao desta tela finge. */
  function ocupado(b, texto){
    if (!b) return function(){};
    var alvo = b.querySelector('.txt') || b;
    var antes = alvo.innerHTML;
    alvo.textContent = texto;
    b.disabled = true;
    return function(){ alvo.innerHTML = antes; b.disabled = false; };
  }

  pag.addEventListener('click', function(e){
    /* --------------------------------------------------------- filtros */
    var seg = e.target.closest('#ct-seg button');
    if (seg){ filtro = seg.dataset.f; return desenhar(); }

    var gatilho = e.target.closest('#ct-dd-bt');
    if (gatilho){
      e.stopPropagation();
      var balao = document.getElementById('ct-dd-m');
      var abre = balao.hidden;
      balao.hidden = !abre;
      gatilho.setAttribute('aria-expanded', String(abre));
      return;
    }
    var op = e.target.closest('[data-op-mercado]');
    if (op){
      mercado = op.dataset.opMercado;
      document.getElementById('ct-dd-m').hidden = true;
      document.getElementById('ct-dd-bt').setAttribute('aria-expanded', 'false');
      return desenhar();
    }

    /* ------------------------------------------------- abas dentro da ficha */
    var botaoAba = e.target.closest('[data-abas] button');
    if (botaoAba){
      aba[botaoAba.closest('[data-abas]').dataset.abas] = botaoAba.dataset.aba;
      return desenhar();
    }
    var falhas = e.target.closest('[data-falhas]');
    if (falhas){
      soFalhas[falhas.dataset.falhas] = !soFalhas[falhas.dataset.falhas];
      return desenhar();
    }

    /* ----------------------------------------- testar a conexao, de verdade
       O RESULTADO ABRE EM JANELA, uma por conta. Antes ele so' mexia nos numeros
       da ficha, e ficha que muda sozinha nao conta o que foi perguntado nem o que
       a Meta respondeu. Pedido dele em 29/08. */
    var testar = e.target.closest('[data-testar]');
    if (testar) return janelaTeste(testar.dataset.testar);
    var renovar = e.target.closest('[data-renovar]');
    if (renovar){
      renovar.classList.add('girando');
      pedir('/contas/renovar', {arroba: renovar.dataset.renovar}).then(function(){
        return pedir('/contas/estado');
      }).then(function(d){ DADOS = d || DADOS; desenhar(); })
        .catch(function(){ renovar.classList.remove('girando'); });
      return;
    }
    var desligar = e.target.closest('[data-desligar]');
    if (desligar){
      var quem = desligar.dataset.desligar;
      if (!confirm('Desligar @' + quem + ' do publicador?\n\nO acesso é apagado desta ' +
                   'máquina. O diário e o histórico ficam.')) return;
      desligar.classList.add('girando');
      pedir('/contas/desligar', {arroba: quem}).then(function(){
        return pedir('/contas/estado');
      }).then(function(d){ DADOS = d || DADOS; desenhar(); });
      return;
    }

    /* ------------------------------------------------------- os do cabecalho */
    var acao = e.target.closest('[data-acao]');
    if (!acao) return;
    var qual = acao.dataset.acao;

    if (qual === 'testar-tudo') return janelaRede();
    if (qual === 'ligar'){
      /* LIGAR CONTA ABRE O PASSO A PASSO, e nao o Instagram direto. Mandar direto
         foi o que produziu o "Invalid redirect_uri" na cara dele: a Meta cobra
         coisas que so' ela sabe, e a tela precisa dizer quais sao antes. Quem
         autoriza continua sendo ele, no site do Instagram, pelo botao do pé da
         janela. */
      return janelaLigar();
    }
    if (qual === 'renovar-tudo'){
      var solta3 = ocupado(acao, 'Renovando…');
      var vencendo = (DADOS.contas || []).filter(function(c){
        return c.estado === 'vencendo'; });
      Promise.all(vencendo.map(function(c){
        return pedir('/contas/renovar', {arroba: c.arroba}); }))
        .then(function(){ return pedir('/contas/estado'); })
        .then(function(d){ DADOS = d || DADOS; solta3(); desenhar(); })
        .catch(solta3);
      return;
    }
    if (qual === 'programar'){
      var ir = document.getElementById('menu-programar') ||
               document.getElementById('pn-programar');
      if (ir) ir.click();
      return;
    }
  });

  document.addEventListener('click', function(){
    var balao = document.getElementById('ct-dd-m');
    if (balao && !balao.hidden){
      balao.hidden = true;
      document.getElementById('ct-dd-bt').setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------------------------------------- editar mercado e etiqueta
     A edicao acontece na propria celula: clicou, virou campo; Enter ou sair,
     gravou. Quem grava e o `01-nucleo.js`, que e' o dono desse dado. */
  pag.addEventListener('click', function(e){
    var alvo = e.target.closest('.ct-campo[data-mercado]');
    if (alvo && !alvo.querySelector('input')){
      var quem = alvo.dataset.mercado, atual = metaDe(quem).mercado;
      alvo.classList.remove('vazio');
      alvo.innerHTML = '<input value="' + seguro(atual) + '" placeholder="mercado">';
      var campo = alvo.querySelector('input');
      campo.focus(); campo.select();
      var fim = function(){
        window.gravarMeta(quem, {mercado: campo.value.trim()}).then(desenhar);
      };
      campo.addEventListener('blur', fim);
      campo.addEventListener('keydown', function(ev){
        if (ev.key === 'Enter') campo.blur();
        if (ev.key === 'Escape'){ campo.value = atual; campo.blur(); }
      });
      return;
    }
    var tirar = e.target.closest('[data-tirar]');
    if (tirar){
      var caixa = tirar.closest('[data-etqs]'), u = caixa.dataset.etqs;
      var resto = metaDe(u).etiquetas.filter(function(t){
        return t !== tirar.dataset.tirar; });
      return window.gravarMeta(u, {etiquetas: resto}).then(desenhar);
    }
    var por = e.target.closest('[data-por]');
    if (por){
      var cx = por.closest('[data-etqs]'), uu = cx.dataset.etqs;
      por.outerHTML = '<input class="ct-etq-novo" placeholder="etiqueta">';
      var novo = cx.querySelector('.ct-etq-novo');
      novo.style.cssText = 'border:1px dashed var(--rule-solid);border-radius:999px;' +
        'padding:5px 12px;font:inherit;font-size:11.5px;width:110px;outline:none;' +
        'background:none;color:var(--ink)';
      novo.focus();
      novo.addEventListener('blur', function(){
        var v = novo.value.trim().toLowerCase();
        var lista = metaDe(uu).etiquetas.slice();
        if (v && lista.indexOf(v) === -1) lista.push(v);
        window.gravarMeta(uu, {etiquetas: lista}).then(desenhar);
      });
      novo.addEventListener('keydown', function(ev){
        if (ev.key === 'Enter') novo.blur();
        if (ev.key === 'Escape'){ novo.value = ''; novo.blur(); }
      });
    }
  });

  var campoBusca = document.getElementById('ct-busca');
  if (campoBusca) campoBusca.addEventListener('input', function(){
    busca = campoBusca.value.trim().toLowerCase();
    desenhar();
  });

  /* ------------------------------------------------------------- a abertura */
  var jaAbriu = false;
  window.abrirContas = function(){
    if (!jaAbriu){ jaAbriu = true; carregar(false); }
  };

  /* A VOLTA DO INSTAGRAM. O servidor manda de volta com o recado no endereco;
     a tela abre na aba certa e diz o que aconteceu. */
  (function(){
    var q = new URLSearchParams(location.search);
    if (q.get('aba') === 'contas'){
      var item = document.querySelector('.menu [data-pag="contas"]');
      if (item) item.click();
      var recado = q.get('ligacao') || '';
      if (recado){
        setTimeout(function(){
          var alvo = document.getElementById('ct-aviso');
          if (recado.indexOf('ligada:') === 0){
            alvo.innerHTML = faixa('bom', '<b>@' + seguro(recado.slice(7)) +
              ' foi ligada ao publicador.</b> O acesso vale 60 dias e se renova sozinho.',
              '', '');
          } else {
            alvo.innerHTML = faixa('grave', '<b>Não deu para ligar a conta.</b> ' +
              seguro(recado), '', '');
          }
        }, 600);
      }
      history.replaceState({}, '', location.pathname);
    }
  })();
})();
