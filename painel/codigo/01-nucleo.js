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

  /* --------------------------------------------------- dados de rascunho */
  /* AS DUAS PRIMEIRAS SAO REAIS, lidas da API do Instagram em 17/08/2026 com os tokens
     que estao no Postiz. As oito de baixo continuam sendo rascunho, e ficam ai so para
     dar volume e a gente julgar a tabela cheia. */
  var RASCUNHO = [
    { ini:'BD', cor:'var(--chart-1)', arroba:'@borusaof', nicho:'IA e negócios',
      ativa:true, publicando:false,
      fase:'madura',   teto:3, hoje:0, ultimo:'21/06',   fila:0,  con:['ok','de pé'] },
    { ini:'ED', cor:'var(--chart-2)', arroba:'@eduardo_devereux', nicho:'trading e investimentos',
      ativa:true, publicando:true,
      fase:'dia 1/21', teto:1, hoje:1, ultimo:'hoje',    fila:0,  con:['ok','de pé'] },
    { ini:'AO', cor:'var(--chart-3)', arroba:'@arquivo.oculto',   nicho:'curiosidades',
      ativa:true, publicando:true,
      fase:'madura',   teto:3, hoje:2, ultimo:'há 41min', fila:24, con:['ok','de pé'] },
    { ini:'RS', cor:'var(--chart-4)', arroba:'@rotina.severa',    nicho:'rotina · foco',
      ativa:true, publicando:true,
      fase:'dia 9/21', teto:1, hoje:1, ultimo:'há 2h07', fila:12, con:['ok','de pé'] },
    { ini:'DF', cor:'var(--chart-5)', arroba:'@dossie.frio',      nicho:'negócios',
      ativa:true, publicando:true,
      fase:'semana 6', teto:2, hoje:1, ultimo:'há 3h32', fila:16, con:['ok','de pé'] },
    { ini:'LD', cor:'var(--chart-1)', arroba:'@linha.dagua',      nicho:'rotina · foco',
      ativa:true, publicando:true,
      fase:'madura',   teto:3, hoje:1, ultimo:'há 5h',   fila:3,  con:['aviso','fila acabando'] },
    { ini:'VT', cor:'var(--chart-2)', arroba:'@verso.tardio',     nicho:'poesia · cortes',
      ativa:true, publicando:false,
      fase:'semana 9', teto:2, hoje:0, ultimo:'ontem',   fila:14, con:['ruim','2 recusas'] },
    { ini:'ND', cor:'var(--chart-3)', arroba:'@nuvem.densa',      nicho:'curiosidades',
      ativa:false, publicando:false,
      fase:'semana 5', teto:2, hoje:0, ultimo:'16/08',   fila:9,  con:['ruim','caiu'] },
    { ini:'PT', cor:'var(--chart-4)', arroba:'@passo.torto',      nicho:'cortes · motivação',
      ativa:true, publicando:true,
      fase:'dia 3/21', teto:1, hoje:1, ultimo:'há 6h18', fila:11, con:['ok','de pé'] },
    { ini:'CB', cor:'var(--chart-5)', arroba:'@campo.baixo',      nicho:'negócios',
      ativa:false, publicando:false,
      fase:'pausada',  teto:0, hoje:0, ultimo:'10/08',   fila:0,  con:['','pausada'] }
  ];

  /* AS CONTAS SAO REAIS, sem rascunho nenhum: lidas em 17/08/2026 da API do
     Instagram (avatar, arroba, total de publicacoes) e do banco do Postiz
     (programadas, erros nas ultimas 24 horas, se a conta esta desligada).
     O avatar vem embutido em base64 porque o endereco que a Meta devolve vence em
     algumas horas: linkar direto daria retrato quebrado amanha. */
  var CONTAS = window.CONTAS = [
    { arroba:"borusaof", nome:"Borusa Digital", avatar:"data:image/jpeg;base64,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",
      ativa:true, publicando:false, conexao:true, vence:"14/10",
      publicacoes:7, programadas:0, erros24h:0 },
    { arroba:"eduardo_devereux", nome:"Eduardo Devereux", avatar:"data:image/jpeg;base64,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",
      ativa:true, publicando:false, conexao:true, vence:"14/10",
      publicacoes:1, programadas:0, erros24h:0 }
  ];

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

  var corpoContas = document.getElementById('tab-contas');
function desenharContas(lista){
    corpoContas.innerHTML = '';
    (lista || []).forEach(function(c){
      var tr = document.createElement('tr');
      
      var c_ini = c.arroba ? c.arroba[0].toUpperCase() : '?';
      if(c.arroba && c.arroba.startsWith('@') && c.arroba.length > 1) {
          c_ini = c.arroba[1].toUpperCase();
      }
      var fakeC = {
          avatar: c.avatar, 
          ini: c_ini, 
          cor: '#333', 
          arroba: c.arroba, 
          nome: c.nome
      };

      tr.innerHTML =
        '<td>' + perfil(fakeC) + '</td>' +
        '<td>' + celulaMercado(c.arroba) + '</td>' +
        '<td>' + celulaEtiquetas(c.arroba) + '</td>' +
        '<td><span class="pino ' + (c.ligada ? 'ok' : 'off') + '">' +
          (c.ligada ? 'Ativa' : 'Desligada') + '</span></td>' +
        '<td><span class="pino ' + (c.publicando ? 'ok' : 'off') + '">' +
          (c.publicando ? 'Publicando' : 'Parada') + '</span></td>' +
        '<td><span class="pino ' + (c.ligada ? 'ok' : 'ruim') + '">' +
          (c.ligada ? 'Ativa' : 'Caiu') + '</span></td>' +
        '<td class="n">-</td>' +
        '<td class="n">' + (c.fila || '<span class="pp">0</span>') + '</td>' +
        '<td class="n">' + (c.erros24h
            ? '<span class="pino ruim">' + c.erros24h + '</span>'
            : '<span class="pp">0</span>') + '</td>' +
        '<td class="n">' + botaoIg(c.arroba) + '</td>';
      corpoContas.appendChild(tr);
    });
  }
  fetch('/contas/meta', {cache:'no-store'})
    .then(function(r){ return r.json(); })
    .then(function(d){ META = d.contas || {}; })
    .then(function(){ return fetch('/painel/rede'); })
    .then(function(r){ return r.json(); })
    .then(function(d){ desenharContas(d.contas || []); })
    .catch(function(){});


  /* A TABELA DE AGENDA SAIU DAQUI em 18/08: o calendario de verdade ocupou o lugar do
     rascunho, e o pedaco que enchia aquela tabela ficou apontando para um elemento que
     nao existe mais. Elemento faltando derruba o resto do arquivo, entao ele sai junto. */

})();
