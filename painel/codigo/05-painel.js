// GERADO PELO CORTE DO ARQUIVO UNICO (fase 2). Ordem numerica e lei.
(function(){
  var pag = document.getElementById('pag-painel');
  if (!pag) return;

  var $ = function(id){ return document.getElementById(id); };
  var DIAS = ['dom','seg','ter','qua','qui','sex','sáb'];
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto',
               'setembro','outubro','novembro','dezembro'];
  var CORES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
               'var(--chart-5)'];
  var ICO_CURVA = '<path d="M3 15c3 0 4-8 7-8s4 6 7 6 4-4 4-4"/>';
  var ICO_BARRA = '<path d="M4 20V10M10 20V4M16 20v-7M22 20v-3"/>';
  var seq = 0, DADOS = null;
  // O PADRAO E' HOJE nos dois cartoes: a home responde primeiro pelo dia de hoje, e o
  // resto e' consulta. Um dia so' nao vira curva, entao ele desenha em coluna.
  var verRede = 1, verSemana = 1, filtroRede = 'publicando', filtroSemana = 'programados';

  function seguro(t){
    return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
             .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function nomes(lista){
    var n = lista.map(function(c){ return '@' + c.arroba; });
    if (!n.length) return '';
    if (n.length === 1) return n[0];
    if (n.length > 3) return n.slice(0, 2).join(', ') + ' e mais ' + (n.length - 2);
    return n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1];
  }

  /* Uma serie do cartao. Em coluna, um ponto ja' e' desenho; em curva, e' preciso o
     segundo ponto para existir linha. */
  function serieDe(rot, cor, total, vals, motivo, logo, coluna){
    var vale = vals.length > (coluna ? 0 : 1);
    return {k:rot, rot:rot, cor:cor, total: vale ? total : '—', sozinha:false,
            vals: vale ? vals : [], motivo:motivo, ligada:vale, logo:logo};
  }

  function desenho(alvo, c){
    var bt = function(v, ico, rot){
      return '<button type="button" data-v="' + v + '" title="' + rot + '" ' +
             'aria-label="' + rot + '" class="' + (c.tipo === v ? 'on' : '') + '">' +
             '<svg viewBox="0 0 24 24">' + ico + '</svg></button>';
    };
    var abas = c.series.map(function(m){
      return '<button type="button" class="gaba" data-k="' + seguro(m.k) + '" role="tab"' +
        ' style="--cor-serie:' + m.cor + '"' +
        ' aria-selected="' + (m.ligada ? 'true' : 'false') + '"' +
        (m.vals.length ? '' : ' disabled') +
        '><span>' + seguro(m.rot) + '</span><b>' + m.total + '</b></button>';
    }).join('');
    alvo.innerHTML = '<div class="pf-nm">' +
      '<div class="pf-nm-cab"><span></span><div class="vtoggle pf-vt">' +
        bt('area', ICO_CURVA, 'curva') + bt('barra', ICO_BARRA, 'barras') + '</div></div>' +
      '<div class="grafico" data-dados="pn-g' + (++seq) + '" ' +
           'data-vista="' + (c.tipo || 'area') + '">' +
        '<div class="grafico-abas" role="tablist">' + abas + '</div>' +
        '<div class="grafico-tela"></div>' +
        '<div class="grafico-balao" hidden></div>' +
      '</div>' +
      '<i class="pf-nm-nota">' + c.nota + '</i></div>';

    var g = alvo.querySelector('.grafico');
    g.dadosProntos = {chaves: c.series, dominio: c.dominio};
    window.montarGrafico(g);
    [].forEach.call(alvo.querySelectorAll('[data-v]'), function(b){
      b.addEventListener('click', function(){
        g.dataset.vista = b.dataset.v;
        [].forEach.call(alvo.querySelectorAll('[data-v]'), function(o){
          o.classList.toggle('on', o === b);
        });
        if (g.redesenhar) g.redesenhar();
      });
    });
  }

  function barraPeriodo(alvo, janelas, escolhido, recado, aoTrocar){
    alvo.innerHTML = '<span class="pf-per-r">período</span>' +
      janelas.map(function(p){
        return '<button type="button" data-per="' + p.d + '" class="' +
               (p.d === escolhido ? 'on' : '') + '">' + p.r + '</button>';
      }).join('') + '<span class="pf-per-n">' + recado + '</span>';
    alvo.querySelectorAll('[data-per]').forEach(function(b){
      b.addEventListener('click', function(){ aoTrocar(parseInt(b.dataset.per, 10)); });
    });
  }

  /* ------------------------------------------------------------- as pendencias */
  var ALERTA = '<svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/>' +
    '<path d="M10.3 4.3 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/></svg>';
  var RELOGIO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/>' +
    '<path d="M12 7v5l3 2"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg>';

  function quando(iso){
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00'), hoje = new Date();
    hoje.setHours(12,0,0,0);
    var n = Math.round((hoje - d) / 86400000);
    if (n <= 0) return 'hoje';
    if (n === 1) return 'ontem';
    if (n < 30) return 'há ' + n + ' dias';
    return 'em ' + d.getDate() + '/' + ('0'+(d.getMonth()+1)).slice(-2);
  }

  function pendencias(d){
    var lista = [];
    d.contas.forEach(function(c){
      if (!c.ligada) lista.push({grave:true, titulo:'@' + c.arroba + ' está desligada',
        desc:'A conta saiu do ar na leitura mais recente da API do Instagram.',
        botao:'Ver a conta', forte:true, vai:'contas'});
    });
    d.contas.forEach(function(c){
      if (c.erros24h) lista.push({grave:true,
        titulo:'@' + c.arroba + ' tem ' + c.erros24h +
               (c.erros24h > 1 ? ' vídeos com erro' : ' vídeo com erro'),
        desc:'O envio foi recusado. O motivo de cada um está gravado no livro-caixa.',
        botao:'Ver', vai:'midia'});
    });
    if (!d.resumo.pastas) lista.push({grave:true, titulo:'Nenhuma pasta de vídeo ligada',
      desc:'Sem pasta, não há de onde puxar arquivo e nada pode ser programado.',
      botao:'Ligar uma pasta', forte:true, vai:'midia'});
    d.contas.forEach(function(c){
      if (!c.ligada || c.fila) return;
      lista.push({grave:false, titulo:'@' + c.arroba + ' está sem fila',
        desc: c.ultimo ? 'Nada programado. O último post saiu ' + quando(c.ultimo) + '.'
                       : 'Nada programado e nenhum post lido nesta conta.',
        botao:'Programar', vai:'programar'});
    });
    return lista;
  }

  function desenharPendencias(lista){
    var cx = $('pn-pendencias');
    $('pn-abertas').textContent = lista.length
      ? lista.length + (lista.length > 1 ? ' abertas' : ' aberta') : 'nada aberto';
    if (!lista.length){
      cx.innerHTML = '<div class="pn-calmo"><div class="marca">' + CHECK + '</div>' +
        '<b>Nada precisa de você</b><span>A rede está de pé e com fila. ' +
        'Quando algo travar, aparece aqui com o botão que resolve.</span></div>';
      return;
    }
    cx.innerHTML = lista.map(function(p){
      return '<div class="pend' + (p.grave ? '' : ' morno') + '">' +
        '<div class="sinal">' + (p.grave ? ALERTA : RELOGIO) + '</div>' +
        '<div class="texto"><b>' + seguro(p.titulo) + '</b><span>' + seguro(p.desc) +
        '</span></div><div class="dir"><button class="bt mini' +
        (p.forte ? ' forte' : '') + '" data-ir="' + p.vai + '">' + p.botao +
        '</button></div></div>';
    }).join('');
    cx.querySelectorAll('[data-ir]').forEach(function(b){
      b.addEventListener('click', function(){
        if (b.dataset.ir === 'programar') return window.abrirProgramar();
        var alvo = document.querySelector('.menu [data-pag="' + b.dataset.ir + '"]');
        if (alvo) alvo.click();
      });
    });
  }

  /* --------------------------------------------------------------- os cartoes */
  function serieDoDia(lista, arroba){
    return lista.map(function(p){
      return [p.dia + 'T12:00:00', (p.contas || {})[arroba] || 0];
    });
  }
  function dominio(lista){
    if (!lista.length) return null;
    var a = Date.parse(lista[0].dia + 'T12:00:00');
    var b = Date.parse(lista[lista.length-1].dia + 'T12:00:00');
    // Um dia so' nao tem vao: sem isso o motor nao tem eixo para espalhar as colunas.
    return a === b ? [a - 43200000, b + 43200000] : [a, b];
  }
  function acender(fileira, qual){
    fileira.querySelectorAll('[data-f]').forEach(function(b){
      b.classList.toggle('forte', b.dataset.f === qual);
    });
  }

  function pintarRede(){
    var d = DADOS, r = d.resumo;
    var serie = d.serie.slice(-verRede);
    var coluna = verRede === 1;
    $('pn-publicando').textContent = r.publicando;
    $('pn-paradas').textContent = r.paradas;
    $('pn-caidas').textContent = r.caidas;

    // O FILTRO E' A PROPRIA FILEIRA DE KPI: cada numero de cima escolhe quais contas o
    // desenho mostra. Numero zero nao vira botao morto: ele fica apagado.
    var grupos = {
      publicando: d.contas.filter(function(c){ return c.publicando; }),
      paradas:    d.contas.filter(function(c){ return c.ligada && !c.publicando; }),
      caidas:     d.contas.filter(function(c){ return !c.ligada; })
    };
    $('pn-kpis-rede').querySelectorAll('[data-f]').forEach(function(b){
      b.disabled = !grupos[b.dataset.f].length;
    });
    if (!grupos[filtroRede].length){
      filtroRede = ['publicando','paradas','caidas'].filter(function(k){
        return grupos[k].length; })[0] || 'publicando';
    }
    acender($('pn-kpis-rede'), filtroRede);

    var diasComPost = serie.filter(function(p){ return p.publicando; }).length;
    barraPeriodo($('pn-per-rede'),
      [{d:1, r:'hoje'}, {d:7, r:'7 dias'}, {d:30, r:'30'}, {d:90, r:'90'}], verRede,
      verRede === 1
        ? 'o dia de <b>hoje</b>, uma coluna por conta'
        : (diasComPost ? '<b>' + diasComPost + '</b> ' +
                         (diasComPost === 1 ? 'dia' : 'dias') + ' com publicação'
                       : 'nenhuma publicação nesta janela'),
      function(n){ verRede = n; pintarRede(); });

    var alvo = grupos[filtroRede];
    var series = alvo.map(function(c, i){
      var vals = serieDoDia(serie, c.arroba);
      var soma = vals.reduce(function(t, v){ return t + v[1]; }, 0);
      return serieDe('@' + c.arroba, CORES[i % CORES.length], String(soma), vals,
                     'nenhuma publicação desta conta na janela', c.avatar, coluna);
    });
    var rot = {publicando:['publicando','publicando'],
               paradas:['parada','paradas'],
               caidas:['caída','caídas']}[filtroRede];
    var uma = alvo.length === 1;
    desenho($('pn-cartao-rede'), {
      tipo: coluna ? 'barra' : 'area', dominio:dominio(serie), series:series,
      nota: (alvo.length ? nomes(alvo) + (uma ? ' está ' : ' estão ') + rot[uma ? 0 : 1]
                         : 'nenhuma conta ' + rot[0]) +
            ' · cada linha é uma conta, com a logo dela no desenho'});
  }

  function pintarSemana(){
    var d = DADOS;
    var meio = Math.floor(d.semana.length / 2);
    var atras = verSemana === 1 ? 0 : Math.floor(verSemana / 2);
    var sem = d.semana.slice(meio - atras, meio - atras + verSemana);
    var coluna = verSemana === 1;
    var prog = sem.reduce(function(a,p){ return a + p.programados; }, 0);
    var hoje = d.semana[meio] || {publicados:0, contas:{}};
    var secas = d.contas.filter(function(c){ return c.ligada && !c.fila; });

    $('pn-programados').textContent = prog;
    $('pn-hoje').textContent = hoje.publicados;
    $('pn-media').textContent = Math.round(
      sem.reduce(function(a,p){ return a + p.programados + p.publicados; }, 0) /
      Math.max(1, sem.length));
    $('pn-secam').textContent = secas.length;

    var grupos = {
      programados: d.contas.filter(function(c){ return c.fila; }),
      hoje: d.contas.filter(function(c){ return (hoje.contas || {})[c.arroba]; }),
      media: d.contas.filter(function(c){ return c.ligada; }),
      secam: secas
    };
    $('pn-kpis-semana').querySelectorAll('[data-f]').forEach(function(b){
      b.disabled = !grupos[b.dataset.f].length;
    });
    if (!grupos[filtroSemana].length){
      filtroSemana = ['programados','hoje','media','secam'].filter(function(k){
        return grupos[k].length; })[0] || 'media';
    }
    acender($('pn-kpis-semana'), filtroSemana);

    barraPeriodo($('pn-per-semana'),
      [{d:1, r:'hoje'}, {d:7, r:'semana'}, {d:14, r:'quinzena'}, {d:30, r:'mês'}],
      verSemana,
      verSemana === 1 ? 'o dia de <b>hoje</b>, uma coluna por conta'
                      : (prog ? '<b>' + prog + '</b> programados nesta janela'
                              : 'nada programado nesta janela'),
      function(n){ verSemana = n; pintarSemana(); });

    var alvo = grupos[filtroSemana];
    var series = alvo.map(function(c, i){
      var vals = serieDoDia(sem, c.arroba);
      var soma = vals.reduce(function(t, v){ return t + v[1]; }, 0);
      return serieDe('@' + c.arroba, CORES[i % CORES.length], String(soma), vals,
                     'nenhuma saída desta conta na janela', c.avatar, coluna);
    });
    var rot = {programados:'com saída programada', hoje:'publicou hoje',
               media:'ligada', secam:'sem fila'}[filtroSemana];
    desenho($('pn-cartao-semana'), {
      tipo:'barra', dominio:dominio(sem), series:series,
      nota: (alvo.length ? nomes(alvo) + ' · ' + rot : 'nenhuma conta ' + rot) +
            ' · cada barra é uma conta, com a logo dela em cima'});
  }

  /* ------------------------------------------------------------------ montagem */
  function montar(){
    var agora = new Date();
    $('pn-lido').textContent = 'lido às ' + ('0'+agora.getHours()).slice(-2) + ':' +
                               ('0'+agora.getMinutes()).slice(-2);
    fetch('/painel/rede', {cache:'no-store'})
      .then(function(x){ return x.json(); })
      .then(function(d){
        DADOS = d;
        var r = d.resumo;
        $('pn-dia').textContent =
          DIAS[agora.getDay()].replace(/^./, function(c){ return c.toUpperCase(); }) +
          ', ' + agora.getDate() + ' de ' + MESES[agora.getMonth()] + '. ' +
          (r.caidas ? 'Tem conta fora do ar.'
                    : (r.publicando ? 'A rede de pé e a semana pela frente.'
                                    : 'Nenhuma conta publicando agora.'));
        pintarRede();
        pintarSemana();
        desenharPendencias(pendencias(d));
      });
  }

  $('pn-kpis-rede').addEventListener('click', function(e){
    var b = e.target.closest('[data-f]');
    if (!b || b.disabled) return;
    filtroRede = b.dataset.f; pintarRede();
  });
  $('pn-kpis-semana').addEventListener('click', function(e){
    var b = e.target.closest('[data-f]');
    if (!b || b.disabled) return;
    filtroSemana = b.dataset.f; pintarSemana();
  });
  $('pn-atualizar').addEventListener('click', montar);
  window.abrirPainel = montar;
  montar();
})();
