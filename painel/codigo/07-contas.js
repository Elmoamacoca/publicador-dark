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
   Os graficos sao ECharts, a mesma biblioteca de la, servida por esta casa
   (`vendor/`) e carregada SO quando esta aba abre: sao 500 KB que as outras
   cinco telas nao precisam pagar.
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
    marco:'<path d="M4 22V4a2 2 0 0 1 2-2h9l-1.5 4L15 10H6"/><path d="M4 15h11"/>'
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
  function num(n){ return (n == null ? 0 : n).toLocaleString('pt-BR'); }
  var cores = ['var(--ct-1)','var(--ct-2)','var(--ct-3)','var(--ct-4)','var(--ct-5)'];
  var ROTULO = {viva:'Conectada', vencendo:'Vencendo', caiu:'Sem Conexão'};

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

  /* ============================================================ os graficos
     ECharts, carregado so' quando esta aba abre. `pinta` roda de novo na troca
     de tema, porque a tinta dele sai de variaveis de CSS: sem isso o grafico
     ficaria com a cor do tema anterior ate a proxima navegacao. */
  var ECharts = null, quadros = {};
  function carregarEcharts(){
    if (window.echarts) { ECharts = window.echarts; return Promise.resolve(ECharts); }
    if (carregarEcharts.indo) return carregarEcharts.indo;
    carregarEcharts.indo = new Promise(function(ok){
      var s = document.createElement('script');
      s.src = 'vendor/echarts.simple.min.js';
      s.onload = function(){ ECharts = window.echarts; ok(ECharts); };
      s.onerror = function(){ ok(null); };
      document.head.appendChild(s);
    });
    return carregarEcharts.indo;
  }
  function tinta(nome){
    return getComputedStyle(pag).getPropertyValue(nome).trim();
  }
  function alfa(cor, a){
    var h = (cor || '').trim().replace('#','');
    if (h.length < 6) return cor;
    return 'rgba(' + parseInt(h.slice(0,2),16) + ',' + parseInt(h.slice(2,4),16) + ',' +
           parseInt(h.slice(4,6),16) + ',' + a + ')';
  }
  function comum(){
    var surf = tinta('--branco'), linha = tinta('--rule-solid');
    var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      surf: surf, linha: linha, linha2: tinta('--ct-linha2'),
      txt: tinta('--ink'), txt2: tinta('--muted'), txt3: tinta('--soft'),
      animationDuration: reduz ? 0 : 560, animationEasing: 'cubicOut',
      textStyle: {fontFamily: 'Manrope, system-ui, sans-serif'},
      dica: {backgroundColor: surf, borderColor: tinta('--ct-linha2'), borderWidth: 1,
             padding: [9, 12],
             textStyle: {color: tinta('--ink'), fontSize: 12,
                         fontFamily: 'Manrope, system-ui, sans-serif'},
             extraCssText: 'border-radius:12px;box-shadow:' + tinta('--ct-sombra-g') + ';'}
    };
  }
  function linhaDica(cor, nome, valor, barra){
    return '<div style="display:flex;align-items:center;gap:9px;margin-top:4px">' +
      '<i style="width:10px;height:10px;border-radius:' + (barra ? '2px' : '3px') +
      ';flex:none;background:' + cor + '"></i>' +
      '<span style="font-size:11.5px;font-weight:600;opacity:.75">' + nome + '</span>' +
      '<b style="margin-left:18px;font-variant-numeric:tabular-nums;font-weight:800">' +
      valor + '</b></div>';
  }
  function tituloDica(t){
    return '<div style="font-size:12.5px;font-weight:800">' + t + '</div>';
  }

  function grafico(id, receita){
    var caixa = document.getElementById(id);
    if (!caixa || !ECharts || !caixa.clientWidth) return;
    var g = quadros[id];
    if (!g || g.isDisposed()) {
      g = quadros[id] = ECharts.init(caixa, undefined, {renderer: 'canvas'});
    }
    receita(g, comum());
  }

  /* A CONEXAO DA REDE, dia a dia. Linha para quem respondeu, barra para quem
     recusou. Sao as duas unicas series possiveis aqui, e a barra e' a que
     importa: dia com barra e' dia em que alguem precisava agir. */
  function grafConexao(){
    grafico('ct-graf-rede', function(g, c){
      var lista = DADOS.contas || [];
      if (!lista.length) return;
      var eixo = [], dePe = [], falhou = [], semNada = [];
      var n = (lista[0].tira || []).length;
      for (var d = 0; d < n; d++){
        var dia = (lista[0].tira[d] || {}).dia;
        eixo.push(dCurta(dia));
        var ok = 0, mau = 0, sem = 0;
        lista.forEach(function(cc){
          var e = ((cc.tira || [])[d] || {}).estado;
          if (e === 'viva' || e === 'vencendo') ok++;
          else if (e === 'caiu') mau++;
          else sem++;
        });
        dePe.push(ok); falhou.push(mau); semNada.push(sem);
      }
      var a = tinta('--ct-1'), b = tinta('--ct-neg');
      var passo = Math.max(1, Math.ceil(eixo.length / 8));
      g.setOption({
        animationDuration: c.animationDuration, animationEasing: c.animationEasing,
        textStyle: c.textStyle,
        grid: {left: 4, right: 12, top: 18, bottom: 4, containLabel: true},
        tooltip: {trigger: 'axis', backgroundColor: c.dica.backgroundColor,
          borderColor: c.dica.borderColor, borderWidth: 1, padding: c.dica.padding,
          textStyle: c.dica.textStyle, extraCssText: c.dica.extraCssText,
          axisPointer: {type: 'line', lineStyle: {color: c.linha2, width: 1}, z: 1},
          formatter: function(ps){
            if (!ps.length) return '';
            var m = {};
            ps.forEach(function(p){ m[p.seriesName] = p.value; });
            var semReg = semNada[ps[0].dataIndex];
            return tituloDica(ps[0].axisValue) +
              linhaDica(a, 'Responderam', num(m['Responderam'] || 0)) +
              linhaDica(b, 'Recusaram', num(m['Recusaram'] || 0), true) +
              (semReg ? '<div style="margin-top:7px;padding-top:6px;border-top:1px solid ' +
                c.linha + ';font-size:11px;opacity:.7">' + semReg +
                ' sem registro nesse dia</div>' : '');
          }},
        xAxis: {type: 'category', boundaryGap: ['3%','3%'], data: eixo,
          axisLine: {lineStyle: {color: c.linha}}, axisTick: {show: false},
          axisLabel: {color: c.txt3, fontSize: 10.5, fontWeight: 700,
                      interval: passo - 1, margin: 12}},
        yAxis: {type: 'value', minInterval: 1, splitLine: {lineStyle: {color: c.linha}},
          axisLine: {show: false}, axisTick: {show: false},
          axisLabel: {color: c.txt3, fontSize: 10.5, fontWeight: 600, margin: 10}},
        series: [
          {name: 'Responderam', type: 'line', data: dePe, smooth: 0, showSymbol: false,
           z: 3, lineStyle: {color: a, width: 2.6}, symbol: 'circle', symbolSize: 7,
           itemStyle: {color: a, borderColor: c.surf, borderWidth: 2},
           emphasis: {focus: 'series', scale: 1.6},
           areaStyle: {color: new ECharts.graphic.LinearGradient(0, 0, 0, 1, [
             {offset: 0, color: alfa(a, .30)}, {offset: 1, color: alfa(a, 0)}])}},
          {name: 'Recusaram', type: 'bar', data: falhou, z: 2, barMaxWidth: 18,
           barMinHeight: 2,
           itemStyle: {borderRadius: [3,3,0,0],
             color: new ECharts.graphic.LinearGradient(0, 0, 0, 1, [
               {offset: 0, color: alfa(b, .92)}, {offset: 1, color: alfa(b, .45)}])},
           emphasis: {itemStyle: {color: b}}}
        ]
      }, true);
    });
  }

  /* O ACESSO DE CADA CONTA, em barras deitadas e ordenado do mais curto. E' a
     tela que responde "quem vence primeiro" sem ninguem precisar comparar
     numero por numero. */
  function grafAcesso(){
    grafico('ct-graf-acesso', function(g, c){
      var lista = (DADOS.contas || []).slice().sort(function(x, y){
        return (x.dias_para_vencer == null ? 999 : x.dias_para_vencer) -
               (y.dias_para_vencer == null ? 999 : y.dias_para_vencer);
      }).slice(0, 10);
      if (!lista.length) return;
      var verde = tinta('--ct-1'), ambar = tinta('--ct-alerta'), vermelho = tinta('--ct-neg');
      g.setOption({
        animationDuration: c.animationDuration, animationEasing: c.animationEasing,
        textStyle: c.textStyle,
        grid: {left: 2, right: 58, top: 6, bottom: 2, containLabel: true},
        tooltip: {trigger: 'item', backgroundColor: c.dica.backgroundColor,
          borderColor: c.dica.borderColor, borderWidth: 1, padding: c.dica.padding,
          textStyle: c.dica.textStyle, extraCssText: c.dica.extraCssText,
          formatter: function(p){
            var conta = lista[p.dataIndex];
            return tituloDica('@' + conta.arroba) +
              linhaDica(p.color, 'Dias Restantes', num(p.value)) +
              '<div style="margin-top:7px;padding-top:6px;border-top:1px solid ' +
              c.linha + ';font-size:11px;opacity:.7">vence em ' +
              dCurta(conta.vence_em) +
              (conta.renovacoes ? ' · renovado ' + conta.renovacoes + 'x' : '') +
              '</div>';
          }},
        xAxis: {type: 'value', max: 60, show: false},
        yAxis: {type: 'category', inverse: true,
          data: lista.map(function(x){ return '@' + x.arroba; }),
          axisLine: {show: false}, axisTick: {show: false},
          axisLabel: {color: c.txt2, fontSize: 12, fontWeight: 700, margin: 10}},
        series: [{type: 'bar', barWidth: 11,
          data: lista.map(function(x){
            var v = x.dias_para_vencer == null ? 0 : x.dias_para_vencer;
            var cor = v <= 7 ? vermelho : (v <= 14 ? ambar : verde);
            return {value: v, itemStyle: {borderRadius: 99,
              color: new ECharts.graphic.LinearGradient(0, 0, 1, 0, [
                {offset: 0, color: alfa(cor, .62)}, {offset: 1, color: cor}])}};
          }),
          showBackground: true,
          backgroundStyle: {color: tinta('--ct-trilho'), borderRadius: 99},
          label: {show: true, position: 'right', distance: 9, color: c.txt,
            fontWeight: 800, fontSize: 12,
            formatter: function(p){ return p.value + 'd'; }}}]
      }, true);
    });
  }

  function pintarGraficos(){
    if (!ECharts) return;
    grafConexao();
    grafAcesso();
  }

  /* GRAFICO SEM LARGURA NAO NASCE, e a largura pode chegar depois: a aba abre
     junto com a animacao de entrada, e a janela pode estar em qualquer tamanho
     no instante do primeiro desenho. Medido aqui com a janela em zero: o quadro
     tinha 0 pixel e a biblioteca simplesmente nao instanciava, sem erro nenhum.
     Por isso quem manda pintar e' o observador de medida, e nao so' o relogio. */
  var olhoDeMedida = new ResizeObserver(function(entradas){
    var mudou = entradas.some(function(e){ return e.contentRect.width > 0; });
    if (mudou) pintarGraficos();
  });
  ['ct-graf-rede', 'ct-graf-acesso'].forEach(function(id){
    var q = document.getElementById(id);
    if (q) olhoDeMedida.observe(q);
  });

  window.addEventListener('resize', function(){
    Object.keys(quadros).forEach(function(k){
      if (quadros[k] && !quadros[k].isDisposed()) quadros[k].resize();
    });
  });
  new MutationObserver(function(){ pintarGraficos(); })
    .observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});

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
    document.getElementById('ct-kpis').innerHTML =
      card('radio', 'Contas Conectadas', conectadas, 'de ' + lista.length,
           caidas ? caidas + (caidas === 1 ? ' sem conexão' : ' sem conexão') : 'todas de pé',
           caidas ? 'mau' : 'bom',
           lista.length ? 'a Meta respondeu agora' : 'nenhuma conta ligada') +
      card('escudo', 'Acesso Mais Curto', maisCurto == null ? '–' : maisCurto,
           maisCurto == null ? '' : (maisCurto === 1 ? 'dia' : 'dias'),
           vencendo ? vencendo + ' vencendo' : null, 'aviso',
           renovacoes ? renovacoes + (renovacoes === 1 ? ' renovação automática'
             : ' renovações automáticas') : 'a renovação entra faltando 10 dias') +
      card('gauge', 'Teto Usado Hoje', num(usado), teto ? 'de ' + num(teto) : '',
           null, '', 'a Meta zera a cada 24 horas') +
      card('alerta', 'Falhas Em 24 Horas', num(falhas), '',
           falhas ? 'abra o diário' : null, 'mau',
           falhas ? 'publicações recusadas pela Meta' : 'nenhuma publicação recusada');
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
        ? '<b>@' + seguro(caidas[0].arroba) + ' está sem conexão.</b> ' +
          seguro(caidas[0].detalhe || 'A Meta recusou o acesso.')
        : '<b>' + caidas.length + ' contas estão sem conexão</b> e precisam ser religadas.'),
        'Ligar De Novo', 'ligar');
    } else if (vencendo.length){
      alvo.innerHTML = faixa('', (vencendo.length === 1
        ? '<b>@' + seguro(vencendo[0].arroba) + ' vence em ' +
          vencendo[0].dias_para_vencer + ' dias.</b> A renovação automática entra' +
          ' faltando 10.'
        : '<b>' + vencendo.length + ' contas vencem em menos de duas semanas.</b>' +
          ' A renovação automática entra faltando 10 dias.'),
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

  /* o botao animado da casa, o mesmo gesto do Programar */
  function botao(rotulo, acao, extra, simbolo){
    return '<button class="ct-bt ' + (extra || '') + '" type="button" data-acao="' +
      acao + '">' +
      '<svg class="seta seta-esq" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
      '<span class="txt">' +
        (simbolo ? '<svg class="mrc" viewBox="0 0 24 24">' + IC[simbolo] + '</svg>' : '') +
        rotulo + '</span>' +
      '<span class="circ"></span>' +
      '<svg class="seta seta-dir" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
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
      return '<button class="ct-dd-o" role="option" data-mercado="' + seguro(o.v) +
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
        (registrados === 0 ? 'sem registro ainda'
          : (registrados === 1 ? 'primeiro registro hoje'
             : registrados + ' dias registrados')) + '</span>' +
        '<span>' + (c.checada_em ? 'testada ' + faz(c.checada_em) : '') + '</span></div>' +
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
        '<div class="pe">' + (tetoTotal ? (tetoTotal - tetoUsado) + ' saídas ainda cabem'
          : 'a Meta não respondeu') + '</div></div>' +
      '<div class="ct-m"><div class="cab">' + ico('escudo','xs') +
        '<span>Acesso Vence</span></div>' +
        '<div class="val"><b>' + (faltam == null ? '–' : faltam) + '</b>' +
        (faltam == null ? '' : '<small>' + (faltam === 1 ? 'dia' : 'dias') +
          '</small>') + '</div>' +
        '<div class="ct-barra"><i' + tomAcesso + ' style="width:' + pctAcesso +
          '%"></i></div>' +
        '<div class="pe">' + (c.renovacoes ? 'renovado ' + c.renovacoes + 'x · ' : '') +
          (c.vence_em ? 'até ' + dCurta(c.vence_em) : 'sem validade anotada') +
          '</div></div>' +
      '<div class="ct-m"><div class="cab">' + ico('camadas','xs') +
        '<span>Fila De Vídeos</span></div>' +
        '<div class="val"><b' + (c.falhas24h ? ' class="mau"' : '') + '>' +
          num(c.fila) + '</b></div>' +
        '<div class="ct-barra"><i style="width:' +
          Math.max(2, Math.min(100, (c.fila || 0) * 3)) + '%"></i></div>' +
        '<div class="pe">' + (c.falhas24h
          ? c.falhas24h + (c.falhas24h === 1 ? ' falha em 24h' : ' falhas em 24h')
          : (c.fila ? 'marcadas no livro' : 'nada marcado')) + '</div></div>' +
    '</div>';
  }

  function corpoEstado(c){
    return '<div class="ct-par"><span class="rot">' + ico('relogio','xs') +
        'Última Publicação</span><b>' + (c.publicados
          ? c.publicados + (c.publicados === 1 ? ' saída pelo publicador'
            : ' saídas pelo publicador') : 'nenhuma ainda') + '</b></div>' +
      '<div class="ct-par"><span class="rot">' + ico('video','xs') +
        'Pastas De Mídia Ligadas</span><b' + (c.pastas_ligadas ? '' : ' class="alerta"') +
        '>' + (c.pastas_ligadas || 'nenhuma') + '</b></div>' +
      '<div class="ct-par"><span class="rot">' + ico('agenda','xs') +
        'Saídas Programadas</span><b' + (c.fila ? '' : ' class="alerta"') + '>' +
        (c.fila || 'nenhuma') + '</b></div>' +
      '<div class="ct-par"><span class="rot">' + ico('chave','xs') +
        'Ligada Ao Publicador</span><b>' + faz(c.ligada_em) + '</b></div>' +
      '<div class="ct-par"><span class="rot">' + ico('ig','xs') +
        'Tipo Da Conta</span><b>' + seguro(c.tipo || 'não informado') + '</b></div>';
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

  function ficha(c, i){
    var qual = aba[c.arroba] || 'estado';
    var falhasNaTira = (c.tira || []).filter(function(t){
      return t.estado === 'caiu'; }).length;
    var face = c.avatar
      ? '<img class="ct-av" src="' + c.avatar + '" alt="">'
      : '<span class="ct-av" style="background:' + cores[i % 5] + '">' +
        seguro(String(c.arroba).slice(0, 2).toUpperCase()) + '</span>';
    var corpo = qual === 'diario' ? corpoDiario(c)
      : (qual === 'identidade' ? corpoIdentidade(c) : corpoEstado(c));

    return '<article class="ct-cd ct-f ' + c.estado + '" data-conta="' +
      seguro(c.arroba) + '">' +
      '<div class="ct-f-cab">' + face +
        '<div class="ct-quem"><div class="ct-arroba">@' + seguro(c.arroba) + '</div>' +
        '<div class="ct-sub">' + seguro(c.nome || c.arroba) + ' · ' +
        seguro(c.tipo || 'Instagram') + '</div></div>' +
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
          ? 'Nenhuma conta com esse filtro.'
          : 'Nenhuma conta ligada ao publicador. Use o botão Ligar Conta.') +
        '</div></div>';
    document.getElementById('ct-quantas').textContent =
      lista.length + (lista.length === 1 ? ' conta na tela' : ' contas na tela');
    kpis(); aviso(); filtros();
    var quando = document.getElementById('ct-relogio');
    if (quando) quando.textContent = DADOS.em
      ? 'vigiada ' + faz(DADOS.em) + ' às ' + hora(DADOS.em) : 'vigiando';
    var selo = document.querySelector('.ct-vivo');
    if (selo) selo.classList.toggle('mau', (DADOS.caidas || 0) > 0);
    setTimeout(pintarGraficos, 30);
  }

  /* ============================================================ carregar */
  function carregar(forcar){
    if (carregando) return Promise.resolve();
    carregando = true;
    var vai = forcar ? pedir('/contas/testar', {}) : pedir('/contas/estado');
    return (window.lerMeta ? window.lerMeta() : Promise.resolve())
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
    var op = e.target.closest('[data-mercado][role="option"]');
    if (op){
      mercado = op.dataset.mercado;
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

    /* ----------------------------------------- testar a conexao, de verdade */
    var testar = e.target.closest('[data-testar]');
    if (testar){
      testar.classList.add('girando');
      pedir('/contas/testar', {arroba: testar.dataset.testar}).then(function(d){
        DADOS = d || DADOS;
        desenhar();
      }).catch(function(){ testar.classList.remove('girando'); });
      return;
    }
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

    if (qual === 'testar-tudo'){
      var solta = ocupado(acao, 'Perguntando À Meta…');
      pedir('/contas/testar', {}).then(function(d){
        DADOS = d || DADOS; solta(); desenhar();
      }).catch(solta);
      return;
    }
    if (qual === 'ligar'){
      var solta2 = ocupado(acao, 'Abrindo O Instagram…');
      /* LIGAR CONTA E DE VERDADE: o servidor monta o endereco de autorizacao do
         Instagram com o numero do aplicativo e um `state` sorteado, e a pessoa
         autoriza no site deles. A volta cai em `/contas/voltar`. */
      pedir('/contas/ligar').then(function(d){
        solta2();
        if (d.erro){
          alert('Não dá para ligar conta ainda.\n\n' + d.erro);
          return;
        }
        location.href = d.url;
      }).catch(function(){ solta2(); });
      return;
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
    var alvo = e.target.closest('[data-mercado]:not([role="option"])');
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
    carregarEcharts().then(function(){
      if (!jaAbriu){ jaAbriu = true; carregar(false); }
      else { setTimeout(pintarGraficos, 30); }
    });
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
