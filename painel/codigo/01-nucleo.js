// GERADO PELO CORTE DO ARQUIVO UNICO (fase 2). Ordem numerica e lei.
(function(){
  'use strict';
  var raiz = document.documentElement;

  /* ------------------------------------------------------------ tema */
  var chave = document.getElementById('chave'), icone = document.getElementById('tema-icone');
  var SOL = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>';
  var LUA = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';

  function pinta(t){
    raiz.setAttribute('data-theme', t);
    localStorage.setItem('pub-tema', t);
    chave.setAttribute('aria-checked', t === 'dark');
    icone.innerHTML = t === 'dark' ? LUA : SOL;
  }
  pinta(raiz.getAttribute('data-theme'));
  function troca(){
    raiz.classList.add('trocando-tema');
    pinta(raiz.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    setTimeout(function(){ raiz.classList.remove('trocando-tema'); }, 320);
  }
  chave.addEventListener('click', troca);
  icone.parentNode.addEventListener('click', function(e){
    if (e.target.closest('#chave')) return;
    troca();
  });

  /* -------------------------------------------------- abrir e fechar o menu
     O estado fica guardado: se voce fechar hoje, amanha ele abre fechado. */
  var botao = document.getElementById('botao-menu');
  botao.setAttribute('aria-expanded', raiz.getAttribute('data-menu') === 'aberto');
  botao.addEventListener('click', function(){
    var novo = raiz.getAttribute('data-menu') === 'aberto' ? 'fechado' : 'aberto';
    raiz.setAttribute('data-menu', novo);
    localStorage.setItem('pub-menu', novo);
    botao.setAttribute('aria-expanded', novo === 'aberto');
  });

  /* -------------------------------------------------------- troca de pagina */
  var menu = document.querySelector('.menu');
  function vaiPara(nome){
    menu.querySelectorAll('[data-pag]').forEach(function(b){
      b.classList.toggle('ativo', b.dataset.pag === nome);
    });
    document.querySelectorAll('.pagina').forEach(function(p){
      p.classList.toggle('ativa', p.id === 'pag-' + nome);
    });
    if (nome === 'analytics' && window.abrirAnalytics) window.abrirAnalytics();
    if (nome === 'midia' && window.abrirMidia) window.abrirMidia();
    if (nome === 'calendario' && window.abrirCalendario) window.abrirCalendario();
    scrollTo({ top:0, behavior:'instant' });
  }
  menu.addEventListener('click', function(e){
    var b = e.target.closest('[data-pag]');
    if (b) vaiPara(b.dataset.pag);
  });
  document.querySelectorAll('[data-vai]').forEach(function(b){
    b.addEventListener('click', function(){ vaiPara(b.dataset.vai); });
  });


/* -------------------------------------------------------- troca de página na Ajuda
   Mesma mecânica do menu lateral, em escala menor: um botão acende, um artigo aparece.
   A primeira página fica aberta, para a aba nunca abrir vazia. */
(function(){
  var indice = document.getElementById('ajuda-indice');
  if (!indice) return;
  indice.addEventListener('click', function(e){
    var b = e.target.closest('[data-doc]');
    if (!b) return;
    indice.querySelectorAll('[data-doc]').forEach(function(x){
      x.classList.toggle('ativo', x === b);
    });
    document.querySelectorAll('#ajuda-corpo .doc').forEach(function(d){
      d.classList.toggle('ativo', d.id === 'doc-' + b.dataset.doc);
    });
    scrollTo({ top:0, behavior:'instant' });
  });
  document.querySelector('#doc-visao').classList.add('ativo');
})();


  /* ------------------------------------------------------------------ Mídia
     A tela só conversa com o servidor por quatro perguntas: onde estou, o que já está
     ligado, ligue esta pasta, desligue esta pasta. Quem sabe ler o Drive é o `midia.py`,
     e é de propósito: trocar o Drive por outra origem não muda uma linha daqui. */
  (function(){
    var trilha = document.getElementById('mid-trilha'),
        lista  = document.getElementById('mid-lista'),
        prat   = document.getElementById('mid-ligadas'),
        busca  = document.getElementById('mid-busca'),
        selo   = document.getElementById('mid-fonte'),
        aviso  = document.getElementById('mid-aviso');
    if (!lista) return;

    var aqui = '', carregou = false, esperando = null, robo = '';

    function seguro(t){
      return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
               .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function pedir(rota, corpo){
      var op = corpo ? {method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify(corpo)} : {cache:'no-store'};
      return fetch(rota, op).then(function(r){ return r.json(); });
    }
    var PASTA = '<svg viewBox="0 0 24 24"><path d="M3 7.5v9A2.5 2.5 0 0 0 5.5 19h13a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 18.5 7h-6l-1.6-2.1A2 2 0 0 0 9.3 4H5.5A2.5 2.5 0 0 0 3 6.5Z"/></svg>';

    /* ------------------------------------------------------- a origem dos arquivos */
    function verEstado(){
      return pedir('/midia/estado').then(function(e){
        robo = e.robo || '';
        selo.className = 'mid-fonte' + (e.pronta ? '' : ' parada');
        selo.innerHTML = '<i></i>' + (e.fonte === 'drive' ? 'Google Drive'
                                     : 'pasta ' + seguro(e.raiz));
        aviso.innerHTML = e.pronta ? '' :
          '<div class="mid-aviso"><b>A origem não está de pé.</b>&nbsp;' +
          seguro(e.motivo) + '</div>';
        return e;
      });
    }

    /* ------------------------------------------------------------- a prateleira */
    function verPrateleira(){
      return pedir('/midia/ligadas').then(function(d){
        var ps = d.pastas || [];
        if (!ps.length){
          prat.innerHTML = '<div class="mid-vazio">nenhuma pasta ligada ainda. ' +
            'Escolha uma abaixo.</div>';
          return;
        }
        prat.innerHTML = ps.map(function(p){
          return '<div class="mid-linha ligada">' +
            '<span class="mid-ic">' + PASTA + '</span>' +
            '<span class="mid-nome"><b>' + seguro(p.nome) + '</b>' +
            '<span>' + seguro(p.caminho) + '</span></span>' +
            '<span class="dir">' +
              '<span class="mid-conta"><b>' + p.total + '</b> ' +
                 (p.total === 1 ? 'vídeo' : 'vídeos') + '</span>' +
              '<span class="mid-conta">' + p.prateleira + ' na prateleira</span>' +
              '<span class="mid-conta">' + p.programados + ' programados</span>' +
              (p.erro ? '<span class="pino ruim">' + p.erro + ' com erro</span>' : '') +
              '<button class="bt mini" data-reler="' + seguro(p.id) + '">Reler</button>' +
              '<button class="bt mini" data-desligar="' + seguro(p.id) + '">Desligar</button>' +
            '</span></div>';
        }).join('');
      });
    }

    /* -------------------------------------------------------------- o navegador */
    function navegar(pasta){
      aqui = pasta || '';
      var q = '/midia/navegar?pasta=' + encodeURIComponent(aqui) +
              '&busca=' + encodeURIComponent(busca.value.trim());
      return pedir(q).then(function(d){
        if (d.erro){
          lista.innerHTML = '<div class="mid-vazio">' + seguro(d.erro) + '</div>';
          trilha.innerHTML = '';
          return;
        }
        trilha.innerHTML = '<span class="trilha-ic">' + PASTA + '</span>' +
          (d.trilha || []).map(function(t, i){
            return (i ? '<i>›</i>' : '') + '<button data-ir="' + seguro(t.id) + '">' +
                   seguro(t.nome) + '</button>';
          }).join('');
        var ps = d.pastas || [];
        if (!ps.length){
          var recado;
          if (busca.value.trim()){
            recado = 'nenhuma pasta com esse nome aqui.';
          } else if (!aqui && robo){
            /* Vazio na raiz do Drive quase nunca é "não tem nada": é que ninguém
               compartilhou pasta com o robô ainda. Dizer só "vazio" deixaria você sem
               saber o que fazer, então aqui vai o endereço dele. */
            recado = 'nenhuma pasta foi compartilhada com o publicador ainda.<br>' +
                     'No Drive, abra a pasta mãe dos vídeos, clique em compartilhar e ' +
                     'coloque <b>' + seguro(robo) + '</b> como Leitor.';
          } else {
            recado = 'esta pasta não tem subpastas.';
          }
          lista.innerHTML = '<div class="mid-vazio">' + recado + '</div>';
          return;
        }
        lista.innerHTML = ps.map(function(p){
          return '<div class="mid-linha' + (p.ligada ? ' ligada' : '') + '">' +
            '<span class="mid-ic">' + PASTA + '</span>' +
            '<button class="mid-nome" data-ir="' + seguro(p.id) + '" ' +
              'style="text-align:left;background:none;border:0;font:inherit;cursor:pointer">' +
              '<b>' + seguro(p.nome) + '</b>' +
              '<span>' + (p.videos ? p.videos + (p.videos === 1 ? ' vídeo' : ' vídeos')
                                   : 'nenhum vídeo nesta pasta') + '</span></button>' +
            '<span class="dir">' +
              (p.ligada
                ? '<span class="pino"><i></i>ligada</span>'
                : '<button class="bt mini forte" data-ligar="' + seguro(p.id) + '" ' +
                  'data-nome="' + seguro(p.nome) + '" ' +
                  'data-caminho="' + seguro(p.caminho || '') + '">Ligar</button>') +
            '</span></div>';
        }).join('');
      });
    }

    /* ------------------------------------------------------------------ cliques */
    document.getElementById('pag-midia').addEventListener('click', function(e){
      var ir = e.target.closest('[data-ir]');
      if (ir) return navegar(ir.dataset.ir);

      var lig = e.target.closest('[data-ligar]');
      if (lig){
        lig.disabled = true; lig.textContent = 'lendo';
        return pedir('/midia/ligar', {pasta: lig.dataset.ligar, nome: lig.dataset.nome,
                                      caminho: lig.dataset.caminho})
          .then(function(){ return Promise.all([navegar(aqui), verPrateleira()]); });
      }
      var rel = e.target.closest('[data-reler]');
      if (rel){
        rel.disabled = true; rel.textContent = 'lendo';
        return pedir('/midia/ligar', {pasta: rel.dataset.reler})
          .then(verPrateleira);
      }
      var des = e.target.closest('[data-desligar]');
      if (des){
        des.disabled = true;
        return pedir('/midia/desligar', {pasta: des.dataset.desligar})
          .then(function(){ return Promise.all([navegar(aqui), verPrateleira()]); });
      }
    });

    /* A busca espera você parar de digitar. Cada tecla é uma leitura de pasta, e no
       Drive isso é uma chamada de rede: disparar a cada letra seria pagar dez vezes
       pela mesma resposta. */
    busca.addEventListener('input', function(){
      clearTimeout(esperando);
      esperando = setTimeout(function(){ navegar(aqui); }, 260);
    });

    /* A aba só acorda no primeiro clique nela. Ler o Drive na abertura do painel seria
       pagar por uma tela que talvez ninguém abra. */
    window.abrirMidia = function(){
      if (carregou) return;
      carregou = true;
      verEstado().then(function(){ return Promise.all([verPrateleira(), navegar('')]); });
    };
  })();


  /* -------------------------------------------------------------- Calendário
     Traduzido do ReUI Event Calendar. Mês, semana e lista compartilham a mesma lista de
     saídas; o que muda é o desenho. A cor é por conta, e vem da paleta de gráfico. */
  (function(){
    var corpo = document.getElementById('cal-corpo'),
        titulo = document.getElementById('cal-titulo'),
        legenda = document.getElementById('cal-legenda');
    if (!corpo) return;

    var DIAS = ['dom','seg','ter','qua','qui','sex','sáb'];
    var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto',
                 'setembro','outubro','novembro','dezembro'];
    var PALETA = ['var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)',
                  'var(--chart-5)'];
    var visao = 'mes', foco = new Date(), saidas = [], contas = {},
        porCelula = 3,
        carregou = false, abertos = {};

    function so(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function maiuscula(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
    function chave(d){ return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }
    function hhmm(d){
      return String(d.getHours()).padStart(2,'0') + ':' +
             String(d.getMinutes()).padStart(2,'0');
    }
    function seguro(t){
      return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
               .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function corDe(conta){
      if (!(conta in contas)) contas[conta] = PALETA[Object.keys(contas).length % 5];
      return contas[conta];
    }


    /* ------------------------------------------------------------------ filtros
       Os tres controles do Social Tracker. Quem sabe o mercado e as etiquetas de cada
       conta e' a aba de Contas; aqui so' se le' o que foi digitado la'. */
    var META_C = {}, PERFIS_C = [];
    var escolha = {conta:'', mercado:'', etiquetas:[]};

    function passou(s){
      var a = String(s.conta).replace('@','').toLowerCase();
      if (escolha.conta && a !== escolha.conta) return false;
      var m = META_C[a] || {mercado:'', etiquetas:[]};
      if (escolha.mercado && (m.mercado || '') !== escolha.mercado) return false;
      if (escolha.etiquetas.length){
        /* Basta ter UMA das escolhidas. Exigir todas transformaria dois cliques em
           lista vazia, que e' o contrario do que um filtro serve. */
        var tem = (m.etiquetas || []).some(function(t){
          return escolha.etiquetas.indexOf(t) !== -1; });
        if (!tem) return false;
      }
      return true;
    }

    /* ------------------------------------------------------------- busca de conta */
    var acCampo = document.getElementById('calacq'),
        acLista = document.getElementById('calaclista'),
        acLimpar = document.getElementById('calaclimpar');
    function retrato(p){
      if (p.avatar) return '<img class="ac-ini" src="' + p.avatar + '" alt="">';
      return '<span class="ac-ini">' + seguro((p.u || '?').charAt(0)) + '</span>';
    }
    function pintarBusca(){
      var q = acCampo.value.trim().toLowerCase().replace('@','');
      acLimpar.hidden = !acCampo.value;
      /* Campo em foco e vazio mostra TODAS as contas. No Social Tracker sao centenas de
         perfis e a lista so' abre depois de digitar; aqui sao poucas contas, e obrigar a
         digitar para ver duas linhas seria trabalho a toa. */
      var achou = !q ? PERFIS_C.slice() : PERFIS_C.filter(function(p){
        return p.u.toLowerCase().indexOf(q) !== -1 ||
               String(p.nome || '').toLowerCase().indexOf(q) !== -1; });
      if (!achou.length && !q){ acLista.classList.remove('aberta'); return; }
      if (!achou.length){
        acLista.innerHTML = '<div class="ac-nada">nenhuma conta com esse nome.</div>';
        acLista.classList.add('aberta'); return;
      }
      acLista.innerHTML = achou.slice(0, 8).map(function(p){
        /* SO' O QUE IDENTIFICA A CONTA: retrato, arroba e nome. Etiqueta e contagem
           sairam daqui em 18/08, a pedido do Gabriel: aqui se escolhe uma conta, e o
           resto e' informacao que nao ajuda a escolher. */
        return '<button type="button" role="option" data-u="' + seguro(p.u) + '">' +
          retrato(p) + '<span class="ac-nome">@' + seguro(p.u) +
          (p.nome ? '<span class="ac-conta-nome">' + seguro(p.nome) + '</span>' : '') +
          '</span></button>';
      }).join('');
      acLista.classList.add('aberta');
    }
    acCampo.addEventListener('input', pintarBusca);
    acCampo.addEventListener('focus', pintarBusca);
    acLimpar.addEventListener('click', function(){
      acCampo.value = ''; escolha.conta = ''; pintarBusca(); pintar();
    });
    acLista.addEventListener('click', function(e){
      var b = e.target.closest('[data-u]');
      if (!b) return;
      escolha.conta = b.dataset.u.toLowerCase();
      acCampo.value = '@' + escolha.conta;
      acLimpar.hidden = false;
      acLista.classList.remove('aberta');
      pintar();
    });
    document.addEventListener('click', function(e){
      if (!e.target.closest('#calac')) acLista.classList.remove('aberta');
    });

    /* ------------------------------------------------------------------- mercado */
    function montarMercado(lista){
      /* O CONTROLE E' REFEITO DO ZERO A CADA CARGA. O `montarSelect` pendura um ouvinte
         no gatilho toda vez que roda; chamando duas vezes, o mesmo clique abria e fechava
         na sequencia, e o menu parecia nao abrir. Trocando o no' por uma copia limpa, os
         ouvintes velhos vao junto. */
      var velho = document.getElementById('calmerc');
      var novo = velho.cloneNode(true);
      velho.parentNode.replaceChild(novo, velho);
      var opcoes = [{v:'', r:'Todos os mercados'}].concat(lista.map(function(m){
        return {v:m, r:m}; }));
      window.montarSelect('calmerc', opcoes, escolha.mercado, function(v){
        escolha.mercado = v; pintar();
      });
      var valor = document.getElementById('calmercv');
      valor.textContent = escolha.mercado || 'Todos os mercados';
      valor.dataset.vazio = escolha.mercado ? 'false' : 'true';
    }

    /* ----------------------------------------------------------------- etiquetas */
    var CERTO = '<span class="list-box-item__indicator"><svg viewBox="0 0 24 24" ' +
                'fill="none" stroke="currentColor" stroke-width="3" ' +
                'stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M20 6 9 17l-5-5"/></svg></span>';
    var etqGat = document.getElementById('caletqgatilho'),
        etqPop = document.getElementById('caletqpop'),
        etqVal = document.getElementById('caletqvalor'),
        etqLim = document.getElementById('caletqlimpar'),
        etqSeta = document.getElementById('caletqseta'),
        etqQ = document.getElementById('caletqq'),
        etqLista = document.getElementById('caletqlista'),
        TODAS = [];
    function pintarEtqs(){
      var q = etqQ.value.trim().toLowerCase();
      var vistas = TODAS.filter(function(t){ return !q || t.indexOf(q) !== -1; });
      /* O ITEM E' O `list-box-item` DA CASA. Sem essa classe ele nascia como botao cru
         do navegador, com a cara cinza do Windows, que foi o que o Gabriel viu. */
      etqLista.innerHTML = vistas.length ? vistas.map(function(t){
        var on = escolha.etiquetas.indexOf(t) !== -1;
        return '<button class="list-box-item" type="button" role="option" ' +
               'aria-selected="' + on + '" data-etq="' + seguro(t) + '">' +
               '<span>' + seguro(t) + '</span>' + (on ? CERTO : '') + '</button>';
      }).join('') : '<div class="list-box-vazia">' +
        (TODAS.length ? 'Nenhuma etiqueta com esse nome.'
                      : 'Nenhuma conta tem etiqueta ainda.') + '</div>';
      var n = escolha.etiquetas.length;
      /* No gatilho, as escolhidas viram o mesmo distintivo aprovado da casa, e nao uma
         segunda pastilha de outra biblioteca. */
      etqVal.innerHTML = n ? escolha.etiquetas.map(function(t){
          return '<span class="badge badge-outline">' + seguro(t) + '</span>'; }).join('')
        : 'Todas as etiquetas';
      etqVal.dataset.placeholder = n ? 'false' : 'true';
      etqLim.dataset.empty = n ? 'false' : 'true';
    }
    function abrirEtq(abre){
      etqPop.classList.toggle('aberta', abre);
      etqGat.setAttribute('aria-expanded', abre ? 'true' : 'false');
      etqSeta.dataset.open = abre ? 'true' : 'false';
      if (abre){ pintarEtqs(); etqQ.focus(); }
    }
    etqGat.addEventListener('click', function(e){
      if (e.target.closest('#caletqlimpar')) return;
      abrirEtq(!etqPop.classList.contains('aberta'));
    });
    etqLim.addEventListener('click', function(e){
      e.stopPropagation();
      escolha.etiquetas = []; pintarEtqs(); pintar();
    });
    etqQ.addEventListener('input', pintarEtqs);
    etqLista.addEventListener('click', function(e){
      var b = e.target.closest('[data-etq]');
      if (!b) return;
      var t = b.dataset.etq, i = escolha.etiquetas.indexOf(t);
      if (i === -1) escolha.etiquetas.push(t); else escolha.etiquetas.splice(i, 1);
      pintarEtqs(); pintar();
    });
    document.addEventListener('click', function(e){
      if (!e.target.closest('#caletq')) abrirEtq(false);
    });

    /* ----------------------------------------------- o que alimenta os tres controles */
    window.recarregarFiltros = function(){
      return Promise.all([
        fetch('/contas/meta', {cache:'no-store'}).then(function(r){ return r.json(); })
          .catch(function(){ return {contas:{}}; }),
        fetch('/perfis', {cache:'no-store'}).then(function(r){ return r.json(); })
          .catch(function(){ return {perfis:[]}; })
      ]).then(function(par){
        META_C = par[0].contas || {};
        PERFIS_C = par[1].perfis || [];
        var mercados = [];
        TODAS = [];
        Object.keys(META_C).forEach(function(a){
          var m = META_C[a];
          if (m.mercado && mercados.indexOf(m.mercado) === -1) mercados.push(m.mercado);
          (m.etiquetas || []).forEach(function(t){
            if (TODAS.indexOf(t) === -1) TODAS.push(t); });
        });
        mercados.sort(); TODAS.sort();
        montarMercado(mercados);
        pintarEtqs();
      });
    };

    /* ------------------------------------------------------------------ os dados
       Tudo aqui e' de verdade: o que ja' saiu vem da API do Instagram, e o que ainda vai
       sair vem do livro-caixa. Nao existe mais exemplo nesta tela. */
    function carregar(){
      return fetch('/calendario/saidas', {cache:'no-store'})
        .then(function(r){ return r.ok ? r.json() : {saidas: []}; })
        .catch(function(){ return {saidas: []}; })
        .then(function(d){
          saidas = (d.saidas || []).map(function(x){
            return {quando: new Date(x.quando), conta: x.conta, titulo: x.titulo,
                    estado: x.estado, sc: x.sc, fmt: x.fmt};
          }).filter(function(x){ return !isNaN(x.quando); });
          /* O indice e' a identidade da saida dentro desta tela: e' ele que a ficha
             carrega e que o clique devolve. Usar a data nao serviria, porque duas contas
             podem sair no mesmo minuto. */
          saidas.forEach(function(s, i){ s.i = i; });
          contas = {};
          saidas.forEach(function(s){ corDe(s.conta); });
          pintarLegenda();
        });
    }

    function pintarLegenda(){
      legenda.innerHTML = Object.keys(contas).map(function(c){
        return '<span class="cal-leg"><i style="background:' + contas[c] + '"></i>@' +
               seguro(c) + '</span>';
      }).join('');
    }

    function doDia(d){
      var k = chave(d);
      return saidas.filter(function(s){ return chave(s.quando) === k && passou(s); })
                   .sort(function(a,b){ return a.quando - b.quando; });
    }

    /* ------------------------------------------------------------------ visão de mês */
    function ficha(s){
      var classe = 'cal-ev' + (s.estado === 'publicado' ? ' saiu' :
                               s.estado === 'erro' ? ' falhou' : '');
      var cor = corDe(s.conta);
      /* BOTAO, e nao caixa: cada ficha e' um post que abre. Elemento clicavel que
         nao e' botao nao chega pelo teclado nem e' anunciado como clicavel. */
      return '<button type="button" class="' + classe + '" style="--ev-cor:' + cor +
             ';--ev-fundo:color-mix(in srgb,' + cor + ' 13%,transparent)" ' +
             'data-post="' + s.i + '" ' +
             'title="' + seguro(s.titulo) + ' · @' + seguro(s.conta) + '">' +
             '<i></i><b>' + seguro(s.titulo) + '</b><span>' + hhmm(s.quando) +
             '</span></button>';
    }

    function mes(){
      var ini = new Date(foco.getFullYear(), foco.getMonth(), 1);
      var comeco = new Date(ini); comeco.setDate(1 - ini.getDay());
      var hoje = chave(new Date());
      var h = '<div class="cal-cab">' + DIAS.map(function(d){
        return '<span>' + d + '</span>'; }).join('') + '</div><div class="cal-mes">';
      for (var i = 0; i < 42; i++){
        var d = new Date(comeco); d.setDate(comeco.getDate() + i);
        var fora = d.getMonth() !== foco.getMonth();
        var lista = doDia(d), k = chave(d);
        var teto = abertos[k] ? lista.length : porCelula;
        h += '<div class="cal-dia' + (fora ? ' fora' : '') +
             (chave(d) === hoje ? ' hoje' : '') + '">' +
             lista.slice(0, teto).map(ficha).join('') +
             (lista.length > teto
               ? '<button class="cal-mais" data-abrir="' + k + '">+' +
                 (lista.length - teto) + ' mais</button>' : '') +
             '<span class="cal-num">' + d.getDate() + '</span></div>';
      }
      return h + '</div>';
    }

    /* --------------------------------------------------------------- visão de semana */
    var H0 = 6, H1 = 23;
    function semana(){
      var ini = new Date(foco); ini.setDate(foco.getDate() - foco.getDay());
      var hoje = chave(new Date());
      var cab = '<div class="cal-diacab"><div></div>';
      for (var i = 0; i < 7; i++){
        var d = new Date(ini); d.setDate(ini.getDate() + i);
        cab += '<div' + (chave(d) === hoje ? ' class="hoje"' : '') + '>' + DIAS[d.getDay()] +
               '<b>' + d.getDate() + '</b></div>';
      }
      cab += '</div>';

      var h = cab + '<div class="cal-semana"><div>';
      for (var q = H0; q <= H1; q++)
        h += '<div class="cal-hora">' + String(q).padStart(2,'0') + 'h</div>';
      h += '</div>';
      for (i = 0; i < 7; i++){
        var dia = new Date(ini); dia.setDate(ini.getDate() + i);
        h += '<div class="cal-col">';
        for (q = H0; q <= H1; q++) h += '<div class="cal-fio"></div>';
        doDia(dia).forEach(function(s){
          var minutos = (s.quando.getHours() - H0) * 60 + s.quando.getMinutes();
          if (minutos < 0) minutos = 0;
          var topo = minutos * (44 / 60);
          var cor = corDe(s.conta);
          h += '<button type="button" class="cal-marca' +
               (s.estado === 'publicado' ? ' saiu' : '') +
               '" data-post="' + s.i + '" style="top:' + topo.toFixed(1) +
               'px;--ev-cor:' + cor +
               ';--ev-fundo:color-mix(in srgb,' + cor + ' 15%,transparent)">' +
               '<i></i><b>' + seguro(s.titulo) + '</b><span>' + hhmm(s.quando) +
               '</span></button>';
        });
        h += '</div>';
      }
      return h + '</div>';
    }

    /* ---------------------------------------------------------------- visão de lista */
    function lista(){
      var ini = so(new Date()), fim = new Date(ini); fim.setDate(ini.getDate() + 30);
      var porDia = {}, ordem = [];
      saidas.filter(function(s){ return s.quando >= ini && s.quando <= fim && passou(s); })
            .sort(function(a,b){ return a.quando - b.quando; })
            .forEach(function(s){
              var k = chave(s.quando);
              if (!porDia[k]){ porDia[k] = []; ordem.push(k); }
              porDia[k].push(s);
            });
      if (!ordem.length)
        return '<div class="cal-vazio">nada nos próximos 30 dias. ' +
          (saidas.length ? 'O acervo tem ' + saidas.length +
            ' publicação(ões), e elas aparecem no mês em que saíram.'
          : 'Nada publicado e nada programado ainda.') + '</div>';
      return ordem.map(function(k){
        var itens = porDia[k], d = itens[0].quando;
        return '<div class="cal-lista-dia"><b>' + maiuscula(DIAS[d.getDay()]) + ', ' + d.getDate() +
          ' de ' + MESES[d.getMonth()] + '<span>' + itens.length +
          (itens.length === 1 ? ' saída' : ' saídas') + '</span></b><div>' +
          itens.map(function(s){
            return '<button type="button" class="cal-item" data-post="' + s.i +
              '" style="--ev-cor:' + corDe(s.conta) + '">' +
              '<span class="h">' + hhmm(s.quando) + '</span><i></i><b>' +
              seguro(s.titulo) + '</b><span class="q">@' + seguro(s.conta) + '</span>' +
              (s.estado === 'erro' ? '<span class="pino ruim">falhou</span>' :
               s.estado === 'publicado' ? '<span class="q">publicado</span>' : '') +
              '</button>';
          }).join('') + '</div></div>';
      }).join('');
    }


    /* ------------------------------------------------- o mês cabe na tela, sem rolagem
       A grade recebe a altura que sobra abaixo dela e divide entre as seis linhas. Depois
       o número de fichas por dia é recalculado pela altura real da célula: é melhor dizer
       "+3 mais" do que cortar uma ficha ao meio. */
    function encaixar(){
      var grade = corpo.querySelector('.cal-mes');
      if (!grade) return;
      var topo = grade.getBoundingClientRect().top;
      /* O respiro do fim da pagina conta: o palco reserva 60 pixels embaixo, e ignorar
         isso deixava a pagina rolando 38 pixels, que e' justamente o que nao pode. */
      var palco = document.querySelector('.palco');
      var pe = palco ? parseFloat(getComputedStyle(palco).paddingBottom) || 0 : 0;
      var altura = Math.max(360, window.innerHeight - topo - pe - 2);
      grade.style.height = altura + 'px';
      var celula = altura / 6;
      var cabem = Math.max(1, Math.floor((celula - 30) / 21));
      if (cabem !== porCelula){ porCelula = cabem; corpo.innerHTML = mes();
                                corpo.querySelector('.cal-mes').style.height = altura + 'px'; }
    }
    var aoRedimensionar = null;
    window.addEventListener('resize', function(){
      if (visao !== 'mes') return;
      clearTimeout(aoRedimensionar);
      aoRedimensionar = setTimeout(encaixar, 150);
    });

    /* ------------------------------------------------------------------- desenhar */
    /* Mes sem nada nao pode ser so' uma grade em branco: quem abre precisa saber se e'
       porque nao ha' nada, ou porque esta' olhando o mes errado. */
    function recado(){
      if (saidas.length) return '';
      return '<div class="cal-recado">nenhuma publicação e nenhuma saída programada. ' +
             'O que já saiu aparece aqui sozinho; o que vai sair nasce quando você ' +
             'programar.</div>';
    }
    function ondeTem(){
      if (!saidas.length) return '';
      var mesmo = saidas.filter(function(s){
        return s.quando.getMonth() === foco.getMonth() &&
               s.quando.getFullYear() === foco.getFullYear(); });
      if (mesmo.length) return '';
      var u = saidas.map(function(s){ return s.quando; })
                    .sort(function(a,b){ return b - a; })[0];
      return '<div class="cal-recado">nada neste mês. A publicação mais recente foi em ' +
             String(u.getDate()).padStart(2,'0') + '/' +
             String(u.getMonth()+1).padStart(2,'0') + '.</div>';
    }

    function pintar(){
      if (visao === 'mes'){
        titulo.textContent = maiuscula(MESES[foco.getMonth()]) + ' de ' +
                             foco.getFullYear();
        corpo.innerHTML = recado() + ondeTem() + mes();
        encaixar();
      } else if (visao === 'semana'){
        var ini = new Date(foco); ini.setDate(foco.getDate() - foco.getDay());
        var fim = new Date(ini); fim.setDate(ini.getDate() + 6);
        titulo.textContent = ini.getDate() + ' a ' + fim.getDate() + ' de ' +
                             maiuscula(MESES[fim.getMonth()]);
        corpo.innerHTML = semana();
      } else {
        titulo.textContent = 'Próximos 30 dias';
        corpo.innerHTML = lista();
      }
    }

    document.getElementById('pag-calendario').addEventListener('click', function(e){
      var v = e.target.closest('[data-visao]');
      if (v){
        visao = v.dataset.visao;
        document.querySelectorAll('#pag-calendario [data-visao]').forEach(function(b){
          b.classList.toggle('ativo', b === v);
        });
        return pintar();
      }
      var n = e.target.closest('[data-cal]');
      if (n){
        var passo = visao === 'mes' ? 'mes' : 'semana';
        if (n.dataset.cal === 'hoje'){
          foco = new Date();
          pintar();
          var alvoHoje = corpo.querySelector('.cal-dia.hoje');
          if (alvoHoje){
            alvoHoje.classList.remove('pulsa');
            void alvoHoje.offsetWidth;              // reinicia a animação
            alvoHoje.classList.add('pulsa');
          }
          return;
        }
        if (false) foco = new Date();
        else {
          var lado = n.dataset.cal === 'antes' ? -1 : 1;
          if (passo === 'mes') foco = new Date(foco.getFullYear(),
                                               foco.getMonth() + lado, 1);
          else { foco = new Date(foco); foco.setDate(foco.getDate() + lado * 7); }
        }
        return pintar();
      }
      var alvoPost = e.target.closest('[data-post]');
      if (alvoPost && window.abrirPost){
        var s = saidas[Number(alvoPost.dataset.post)];
        if (s) window.abrirPost({conta: s.conta, titulo: s.titulo, data: s.quando,
                                 estado: s.estado, fmt: s.fmt, sc: s.sc, i: s.i,
                                 arquivo: s.arquivo, pasta: s.pasta});
        return;
      }
      var mais = e.target.closest('[data-abrir]');
      if (mais){ abertos[mais.dataset.abrir] = 1; return pintar(); }
    });

    window.abrirCalendario = function(){
      if (carregou) return;
      carregou = true;
      carregar()
        .then(function(){ return window.recarregarFiltros(); })
        .then(pintar);
    };
  })();

  /* -------------------------------------------------------- fichas de filtro */
  document.querySelectorAll('.filtros').forEach(function(grupo){
    var blocos = [], atual = [];
    Array.prototype.forEach.call(grupo.children, function(el){
      if (el.classList.contains('rot-filtro') || el.classList.contains('sep')){
        if (atual.length) blocos.push(atual);
        atual = [];
      } else if (el.classList.contains('chip')) atual.push(el);
    });
    if (atual.length) blocos.push(atual);
    blocos.forEach(function(bloco){
      bloco.forEach(function(c){
        c.addEventListener('click', function(){
          bloco.forEach(function(o){ o.classList.remove('on'); });
          c.classList.add('on');
        });
      });
    });
  });

  /* AS DUAS LISTAS CHUMBADAS SAIRAM EM 29/08/2026.

     Eram `RASCUNHO`, com dez contas das quais OITO ERAM INVENTADAS (@dossie.frio,
     @linha.dagua e companhia), e `CONTAS`, com o retrato das duas contas reais
     congelado em 17/08 e mais de dez mil caracteres de imagem em base64. Nenhuma das
     duas era lida por ninguem: a tabela de Contas ja vinha de `/painel/rede` e o
     assistente de programar monta a lista dele. Ficavam sendo baixadas em toda
     visita, e dado inventado a um passo de aparecer na tela por engano.

     Quem responde hoje: `/contas/estado`, que pergunta a Meta de verdade. */

  /* Com retrato usa o retrato; sem retrato, as iniciais. As telas de rascunho ainda
     nao tem foto, e nao ha porque ter dois desenhos de perfil por causa disso. */
  function perfil(c){
    var face = c.avatar
      ? '<img class="av" src="' + c.avatar + '" alt="">'
      : '<span class="av" style="background:' + c.cor + '">' + c.ini + '</span>';
    var a = c.arroba.charAt(0) === '@' ? c.arroba : '@' + c.arroba;
    return '<div class="perfil">' + face + '<div><div class="nome">' + a +
           '</div><div class="pp">' + (c.nome || c.nicho || '') + '</div></div></div>';
  }

  /* O botao do Instagram e' o FlowButton da casa com o selo dentro, igual ao do Social
     Tracker. Sai em nova aba, com `noopener` porque a pagina de destino nao precisa de
     referencia de volta para esta. */
  function botaoIg(arroba){
    var u = arroba.replace('@', '');
    return '<a class="btn brasa" href="https://www.instagram.com/' + u + '/" ' +
           'target="_blank" rel="noopener" ' +
           'aria-label="Abrir ' + arroba + ' no Instagram">' +
           '<svg class="seta seta-esq" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
           '<span class="txt">' +
             '<svg class="ig-selo" aria-hidden="true"><use href="#i-ig"/></svg>' +
             'Instagram</span>' +
           '<span class="circ"></span>' +
           '<svg class="seta seta-dir" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
           '</a>';
  }


  /* ------------------------------------------------ mercado e etiquetas por conta
     Dado que so' existe porque o Gabriel digitou: nem a API do Instagram nem o motor
     sabem em que mercado uma conta joga. Fica no mesmo banco do livro-caixa, e e' o que
     alimenta os filtros do calendário. */
  var META = {};
  function metaDe(a){
    a = String(a).replace('@','').toLowerCase();
    if (!META[a]) META[a] = {mercado:'', etiquetas:[]};
    return META[a];
  }
  function gravarMeta(a, campos){
    var corpo = {arroba: String(a).replace('@','').toLowerCase()};
    if ('mercado' in campos) corpo.mercado = campos.mercado;
    if ('etiquetas' in campos) corpo.etiquetas = campos.etiquetas;
    return fetch('/contas/meta', {method:'POST',
        headers:{'Content-Type':'application/json'}, body: JSON.stringify(corpo)})
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d && d.arroba) META[d.arroba] = {mercado:d.mercado, etiquetas:d.etiquetas};
        if (window.recarregarFiltros) window.recarregarFiltros();
        return d;
      });
  }
  function celulaMercado(a){
    var m = metaDe(a).mercado;
    return '<span class="campo' + (m ? '' : ' vazio') + '" data-mercado="' +
           String(a).replace('@','') + '">' + (m || 'definir') + '</span>';
  }
  function celulaEtiquetas(a){
    var e = metaDe(a).etiquetas, u = String(a).replace('@','');
    return '<span class="etqs" data-etqs="' + u + '">' +
      e.map(function(t){
        return '<span class="etq">' + t + '<button data-tirar="' + t +
               '" aria-label="Tirar ' + t + '">×</button></span>';
      }).join('') +
      '<button class="etq-mais" data-por="' + u + '">+ etiqueta</button></span>';
  }

  /* A edição acontece na própria célula: clicou, virou campo; Enter ou sair, gravou. */
  document.getElementById('pag-contas').addEventListener('click', function(e){
    var m = e.target.closest('[data-mercado]');
    if (m && !m.querySelector('input')){
      var atual = metaDe(m.dataset.mercado).mercado;
      m.classList.remove('vazio');
      m.innerHTML = '<input value="' + atual.replace(/"/g,'&quot;') +
                    '" placeholder="mercado">';
      var campo = m.querySelector('input');
      campo.focus(); campo.select();
      var fim = function(){
        var v = campo.value.trim();
        gravarMeta(m.dataset.mercado, {mercado: v}).then(function(){
          m.outerHTML = celulaMercado(m.dataset.mercado);
        });
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
      var lista = metaDe(u).etiquetas.filter(function(t){ return t !== tirar.dataset.tirar; });
      return gravarMeta(u, {etiquetas: lista}).then(function(){
        caixa.outerHTML = celulaEtiquetas(u);
      });
    }
    var por = e.target.closest('[data-por]');
    if (por){
      var cx = por.closest('[data-etqs]'), uu = cx.dataset.etqs;
      por.outerHTML = '<input class="etq-novo" placeholder="nome da etiqueta">';
      var novo = cx.querySelector('.etq-novo');
      novo.style.cssText = 'border:1px dashed var(--rule-solid);border-radius:999px;' +
        'padding:4px 10px;font:inherit;font-size:12px;width:110px;outline:none;' +
        'background:none;color:var(--ink)';
      novo.focus();
      var fechar = function(){
        var v = novo.value.trim().toLowerCase();
        var lista2 = metaDe(uu).etiquetas.slice();
        if (v && lista2.indexOf(v) === -1) lista2.push(v);
        gravarMeta(uu, {etiquetas: lista2}).then(function(){
          cx.outerHTML = celulaEtiquetas(uu);
        });
      };
      novo.addEventListener('blur', fechar);
      novo.addEventListener('keydown', function(ev){
        if (ev.key === 'Enter') novo.blur();
        if (ev.key === 'Escape'){ novo.value = ''; novo.blur(); }
      });
    }
  });

  /* ============================================================ a aba de Contas
     DUAS COLUNAS MENTIAM ATE 29/08/2026. "Conexao" repetia o campo "esta ligada", que
     e' outra pergunta, e "Publicacoes" era um traco escrito no codigo. Uma conta com o
     acesso morto apareceria como viva ate' o dia em que uma publicacao falhasse.

     Agora quem responde e' `/contas/estado`: chamada de verdade a Meta, feita pelo
     `contas.py`, que tambem renova o acesso sozinho antes de vencer. Cada coluna abaixo
     tem uma fonte, e a que nao tiver fonte nao entra na tela.  */
  var ACESSO = {};          // arroba -> a ficha que a Meta devolveu

  function fichaDe(a){
    return ACESSO[String(a).replace('@','').toLowerCase()] || null;
  }

  /* O ESTADO DA CONEXAO E O DA CHAMADA, e nao o de um selo guardado. */
  function celulaConexao(c){
    var f = fichaDe(c.arroba);
    if (!f) return '<span class="pino off">Sem acesso aqui</span>';
    var classe = {viva:'ok', vencendo:'', caiu:'ruim'}[f.estado] || 'off';
    var rotulo = {viva:'Viva', vencendo:'Vencendo', caiu:'Caiu'}[f.estado] || 'Sem acesso';
    return '<span class="pino ' + classe + '" title="' + (f.detalhe || '') + '">' +
           rotulo + '</span>';
  }

  /* A VALIDADE E O AVISO. Sessenta dias e a janela; a barra mostra quanto dela ja
     correu, e o numero diz quantos dias sobram. */
  function celulaAcesso(c){
    var f = fichaDe(c.arroba);
    if (!f || f.dias_para_vencer === null || f.dias_para_vencer === undefined)
      return '<span class="pp">sem validade anotada</span>';
    var faltam = f.dias_para_vencer;
    var pct = Math.max(0, Math.min(100, Math.round((60 - faltam) / 60 * 100)));
    var tom = faltam <= 7 ? ' class="ruim"' : (faltam <= 14 ? ' class="meio"' : '');
    var quando = String(f.vence_em || '').slice(0, 10).split('-').reverse().join('/');
    return '<div class="acesso"><span class="quanto">' + faltam + ' dias</span>' +
           '<div class="barra"><i' + tom + ' style="width:' + pct + '%"></i></div>' +
           '<span class="quando">até ' + (quando.slice(0, 5) || '?') +
           (f.renovacoes ? ' · renovado ' + f.renovacoes + 'x' : '') + '</span></div>';
  }

  var corpoContas = document.getElementById('tab-contas');
  var avisoContas = document.getElementById('contas-aviso');

  function desenharContas(lista){
    corpoContas.innerHTML = '';
    if (!(lista || []).length){
      corpoContas.innerHTML = '<tr><td colspan="11"><div class="vazio">' +
        'Nenhuma conta ligada ao publicador.</div></td></tr>';
      return;
    }
    (lista || []).forEach(function(c){
      var f = fichaDe(c.arroba) || {};
      var tr = document.createElement('tr');
      var quem = String(c.arroba || '').replace('@', '');
      tr.innerHTML =
        '<td>' + perfil({avatar: c.avatar, ini: (quem[0] || '?').toUpperCase(),
                         cor: 'var(--soft)', arroba: c.arroba, nome: c.nome}) + '</td>' +
        '<td>' + celulaMercado(c.arroba) + '</td>' +
        '<td>' + celulaEtiquetas(c.arroba) + '</td>' +
        '<td><span class="pino ' + (c.ligada ? 'ok' : 'off') + '">' +
          (c.ligada ? 'Ativa' : 'Desligada') + '</span></td>' +
        '<td>' + celulaConexao(c) + '</td>' +
        '<td>' + celulaAcesso(c) + '</td>' +
        '<td class="n">' + (f.seguidores === null || f.seguidores === undefined
            ? '<span class="pp">–</span>' : f.seguidores) + '</td>' +
        '<td class="n">' + (f.publicacoes === null || f.publicacoes === undefined
            ? '<span class="pp">–</span>' : f.publicacoes) + '</td>' +
        '<td class="n">' + (f.teto_total
            ? '<b>' + (f.teto_usado || 0) + '</b> <span class="pp">de ' +
              f.teto_total + '</span>'
            : '<span class="pp">–</span>') + '</td>' +
        '<td class="n">' + (c.erros24h
            ? '<span class="pino ruim">' + c.erros24h + '</span>'
            : '<span class="pp">0</span>') + '</td>' +
        '<td class="n">' + botaoIg(c.arroba) + '</td>';
      corpoContas.appendChild(tr);
    });
  }

  /* O AVISO SO APARECE QUANDO HA O QUE AVISAR. Painel limpo e a rede de pe. */
  function desenharAviso(d){
    if (!avisoContas) return;
    var caidas = d.caidas || 0, vencendo = d.vencendo || 0;
    if (!caidas && !vencendo && !d.aviso){
      avisoContas.innerHTML = '';
      return;
    }
    var texto;
    if (d.aviso) texto = d.aviso;
    else if (caidas) texto = caidas === 1
      ? '<b>Uma conta está com o acesso morto</b> e precisa ser religada pelo Instagram.'
      : '<b>' + caidas + ' contas estão com o acesso morto</b> e precisam ser religadas.';
    else texto = vencendo === 1
      ? '<b>Uma conta vence em menos de duas semanas.</b> A renovação automática entra' +
        ' faltando 10 dias.'
      : '<b>' + vencendo + ' contas vencem em menos de duas semanas.</b> A renovação' +
        ' automática entra faltando 10 dias.';
    avisoContas.innerHTML =
      '<div class="aviso ' + (caidas ? 'grave' : '') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4"/>' +
      '<circle cx="12" cy="16.6" r=".7" fill="currentColor" stroke="none"/>' +
      '<path d="M10.3 3.9 2.4 17.5A1.9 1.9 0 0 0 4 20.4h16a1.9 1.9 0 0 0 1.6-2.9L13.7' +
      ' 3.9a1.9 1.9 0 0 0-3.4 0Z"/></svg><span>' + texto + '</span></div>';
  }

  function lerAcesso(forcar){
    var pedido = forcar
      ? fetch('/contas/testar', {method:'POST',
          headers:{'Content-Type':'application/json'}, body:'{}'})
      : fetch('/contas/estado', {cache:'no-store'});
    return pedido.then(function(r){ return r.json(); }).then(function(d){
      ACESSO = {};
      (d.contas || []).forEach(function(f){
        ACESSO[String(f.arroba).replace('@','').toLowerCase()] = f;
      });
      desenharAviso(d);
      var carimbo = document.getElementById('contas-lido');
      if (carimbo) carimbo.textContent = d.contas && d.contas.length
        ? 'conexão conferida ' + (d.do_guardado ? 'há pouco' : 'agora')
        : '';
      return d;
    }).catch(function(){ return {}; });
  }

  function carregarContas(forcar){
    return fetch('/contas/meta', {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){ META = d.contas || {}; })
      .then(function(){ return lerAcesso(forcar); })
      .then(function(){ return fetch('/painel/rede'); })
      .then(function(r){ return r.json(); })
      .then(function(d){ desenharContas(d.contas || []); })
      .catch(function(){ desenharContas([]); });
  }

  var botaoTestar = document.getElementById('contas-testar');
  if (botaoTestar) botaoTestar.addEventListener('click', function(){
    var antes = botaoTestar.textContent;
    botaoTestar.textContent = 'Perguntando À Meta…';
    botaoTestar.disabled = true;
    carregarContas(true).then(function(){
      botaoTestar.textContent = antes;
      botaoTestar.disabled = false;
    });
  });

  carregarContas(false);


  /* A TABELA DE AGENDA SAIU DAQUI em 18/08: o calendario de verdade ocupou o lugar do
     rascunho, e o pedaco que enchia aquela tabela ficou apontando para um elemento que
     nao existe mais. Elemento faltando derruba o resto do arquivo, entao ele sai junto. */

})();
