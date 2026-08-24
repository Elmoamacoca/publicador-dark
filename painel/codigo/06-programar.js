// GERADO PELO CORTE DO ARQUIVO UNICO (fase 2). Ordem numerica e lei.
(function(){
  var tela = document.getElementById('pag-programar');
  if (!tela) return;
  var palco = document.getElementById('pr-palco');
  var bolas = document.getElementById('pr-bolas');

  var CHECK = '<svg viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg>';
  var DIAS = ['seg','ter','qua','qui','sex','sáb','dom'];
  var PASSOS = ['conta', 'pasta', 'proxima'];

  var CONTAS = [], PASTAS = [], passo = 0;
  var escolha = {conta:null, pasta:null, porDia:3, de:'09:00', ate:'21:00',
                 dias:[1,1,1,1,1,1,1], inicio:null};

  function seguro(t){
    return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
             .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function gravar(){
    // RASCUNHO E' LOTE COMECADO, e nao tela aberta. So' nasce quando a conta ja' foi
    // escolhida E o passo 1 ficou para tras: sem isso, excluir um rascunho e continuar
    // mexendo na tela recriava na hora o que tinha acabado de ser apagado.
    if (!escolha.conta || passo < 1) return;
    fetch('/painel/rascunho', {method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({dados:{escolha:escolha, passo:passo}})}).catch(function(){});
  }
  function apagar(){
    return fetch('/painel/rascunho', {method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({apagar:true})}).catch(function(){});
  }

  function pintarBolas(){
    bolas.innerHTML = PASSOS.map(function(p, i){
      return '<i class="fc-bola' + (i === passo ? ' on' : (i < passo ? ' feito' : '')) +
             '"></i>';
    }).join('');
  }

  /* Cada troca de passo repinta o palco inteiro: e' o que faz a animacao de entrada
     rodar de novo, sem precisar de estado de animacao em lugar nenhum. */
  function ir(n){
    passo = Math.max(0, Math.min(n, PASSOS.length - 1));
    pintarBolas();
    ({0:passoConta, 1:passoPasta, 2:passoProxima})[passo]();
    gravar();
    scrollTo({top:0, behavior:'instant'});
  }

  function cabeca(conta, titulo, sub){
    return '<div class="fc-conta">' + conta + '</div><h2>' + titulo + '</h2>' +
           '<p class="fc-sub">' + sub + '</p>';
  }
  function pe(voltar, adiante, dica){
    return '<div class="fc-pe" data-pe>' + dentroDoPe(voltar, adiante, dica) + '</div>';
  }
  function dentroDoPe(voltar, adiante, dica){
    return (voltar ? '<button class="bt" id="pr-tras">Voltar</button>' : '') +
      (adiante ? '<button class="btn brasa" id="pr-frente" type="button">' +
        '<svg class="seta seta-esq" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
        '<span class="txt">' + adiante + '</span><span class="circ"></span>' +
        '<svg class="seta seta-dir" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
        '</button>' : '') +
      (dica ? '<span class="pp">' + dica + '</span>' : '');
  }
  /* TROCAR SO' O RODAPE, sem repintar o passo. Repintar o passo inteiro fazia a animacao
     de entrada rodar de novo a cada clique, e era isso que piscava a tela. */
  function trocarPe(voltar, adiante, dica){
    var cx = palco.querySelector('[data-pe]');
    if (!cx) return;
    cx.innerHTML = dentroDoPe(voltar, adiante, dica);
    ligarPe();
  }
  function ligarPe(){
    var t = document.getElementById('pr-tras'), f = document.getElementById('pr-frente');
    if (t) t.addEventListener('click', function(){ ir(passo - 1); });
    if (f) f.addEventListener('click', function(){ ir(passo + 1); });
  }

  /* ------------------------------------------------------------- 1. a conta */
  function desdeQuando(iso){
    if (!iso) return 'nenhum post lido ainda';
    var d = new Date(iso + 'T12:00:00'), hoje = new Date();
    hoje.setHours(12,0,0,0);
    var n = Math.round((hoje - d) / 86400000);
    if (n <= 0) return 'publicou hoje';
    if (n === 1) return 'último post ontem';
    if (n < 30) return 'último post há ' + n + ' dias';
    return 'último post em ' + ('0'+d.getDate()).slice(-2) + '/' +
           ('0'+(d.getMonth()+1)).slice(-2);
  }

  function passoConta(){
    var ligadas = CONTAS.filter(function(c){ return c.ligada; });
    palco.innerHTML =
      cabeca('Passo 1 de 3', 'Para qual conta?',
             'Um lote é de uma conta só. O ritmo e a pasta são decisões dela.') +
      '<div class="fc-grade">' + ligadas.map(function(c){
        var cara = c.avatar
          ? '<img class="rosto" src="' + c.avatar + '" alt="">'
          : '<span class="rosto">' + seguro(c.arroba.charAt(0).toUpperCase()) + '</span>';
        return '<button type="button" class="fc-tile' +
          (escolha.conta === c.arroba ? ' on' : '') + '" data-c="' + seguro(c.arroba) + '">' +
          '<span class="marca">' + CHECK + '</span>' + cara +
          '<b>@' + seguro(c.arroba) + '</b>' +
          '<span class="selo-fila' + (c.fila ? ' cheia' : '') + '">' +
          (c.fila ? c.fila + (c.fila === 1 ? ' vídeo na fila' : ' vídeos na fila')
                  : 'sem fila') + '</span>' +
          '<span class="ult">' + desdeQuando(c.ultimo) + '</span></button>';
      }).join('') + '</div>' +
      pe(false, escolha.conta ? 'Continuar' : '',
         escolha.conta ? '' : 'escolha uma conta para seguir');

    palco.querySelectorAll('[data-c]').forEach(function(b){
      b.addEventListener('click', function(){
        // Desmarcar e' permitido e nao machuca o rascunho: `gravar` nao grava escolha
        // vazia, entao o lote guardado continua intacto ate' alguem apertar excluir.
        escolha.conta = (escolha.conta === b.dataset.c) ? null : b.dataset.c;
        palco.querySelectorAll('[data-c]').forEach(function(o){
          o.classList.toggle('on', o.dataset.c === escolha.conta);
        });
        trocarPe(false, escolha.conta ? 'Continuar' : '',
                 escolha.conta ? '' : 'escolha uma conta para seguir');
        gravar();
      });
    });
    ligarPe();
  }

  /* -------------------------------------------------------------- 2. a pasta */
  function passoPasta(){
    var corpo;
    if (!PASTAS.length){
      corpo = '<div class="fc-aviso"><p>Nenhuma pasta de vídeo ligada. Sem pasta não há ' +
        'arquivo para programar.</p><button class="bt mini forte" id="pr-midia">' +
        'Ligar uma pasta</button></div>';
    } else {
      corpo = '<div class="fc-lista">' + PASTAS.map(function(p){
        return '<button type="button" class="fc-op' +
          (escolha.pasta === p.id ? ' on' : '') + '" data-p="' + seguro(p.id) + '">' +
          '<span class="ini">' + (p.novos != null ? p.novos : (p.total || 0)) + '</span>' +
          '<span class="quem"><b>' + seguro(p.nome) + '</b><span>' +
          (p.novos != null ? p.novos + ' vídeos sem uso' : 'na prateleira') +
          '</span></span><span class="marca">' + CHECK + '</span></button>';
      }).join('') + '</div>';
    }
    palco.innerHTML =
      cabeca('Passo 2 de 3', 'De qual pasta?',
             'Os vídeos saem daqui, na ordem em que estão, sem repetir o que já foi.') +
      corpo + pe(true, escolha.pasta ? 'Continuar' : '',
                 escolha.pasta ? '' : 'escolha a pasta para seguir');
    palco.querySelectorAll('[data-p]').forEach(function(b){
      b.addEventListener('click', function(){
        if (escolha.pasta === b.dataset.p) return;
        escolha.pasta = b.dataset.p;
        passoPasta(); gravar();
      });
    });
    var m = document.getElementById('pr-midia');
    if (m) m.addEventListener('click', function(){
      sair(); var a = document.querySelector('.menu [data-pag="midia"]'); if (a) a.click();
    });
    ligarPe();
  }

  /* --------------------------------------------------- 3. a proxima etapa
     O RITMO E A CONFERENCIA SAIRAM DAQUI. Eles eram desenho meu, e o Gabriel vai
     definir esta etapa a partir do que a Ferramenta 1 entrega. Ate' la', a tela diz
     isso em vez de inventar campo. O que ja' foi escolhido fica guardado. */
  function passoProxima(){
    var pasta = PASTAS.filter(function(p){ return p.id === escolha.pasta; })[0];
    palco.innerHTML =
      cabeca('Passo 3 de 3', 'A próxima etapa está sendo definida',
             'A conta e a pasta já estão guardadas neste rascunho.') +
      '<div class="fc-parede"><span class="selo-obra">em construção</span>' +
        '<p>O lote é de <b>@' + seguro(escolha.conta || '') + '</b>, saindo da pasta <b>' +
        seguro(pasta ? pasta.nome : '—') + '</b>. O que vem depois disso ainda depende ' +
        'do que a Ferramenta 1 vai entregar.</p></div>' +
      pe(true, '', 'seu rascunho fica guardado');
    ligarPe();
  }

  /* ------------------------------------------------------- entrada e saida */
  var LIXO = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6"/>' +
    '<path d="M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/>' +
    '<path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></svg>';

  function idade(iso){
    var d = new Date(iso), n = Math.round((Date.now() - d) / 60000);
    if (isNaN(d)) return '';
    if (n < 1) return 'agora';
    if (n < 60) return 'há ' + n + ' min';
    if (n < 1440) return 'há ' + Math.round(n / 60) + 'h';
    return 'em ' + ('0'+d.getDate()).slice(-2) + '/' + ('0'+(d.getMonth()+1)).slice(-2);
  }

  /* A LISTA DE RASCUNHOS. Eles se acumulam, um por conta, e so' saem daqui pelo
     excluir. O excluir pergunta antes: rascunho perdido nao volta. */
  function linhaRascunho(r, i){
    var c = CONTAS.filter(function(x){ return x.arroba === r.conta; })[0] || {};
    var cara = c.avatar ? '<img src="' + c.avatar + '" alt="">'
                        : '<span class="ini">' +
                          seguro((r.conta || '?').charAt(0).toUpperCase()) + '</span>';
    return '<div class="fc-op" data-r="' + i + '">' + cara +
      '<span class="quem"><b>@' + seguro(r.conta) + '</b><span>passo ' +
      (((r.dados || {}).passo || 0) + 1) + ' de 3 · mexido ' + idade(r.mexido_em) +
      '</span></span>' +
      '<button type="button" class="lixo" data-x="' + i +
      '" aria-label="Excluir o rascunho de @' + seguro(r.conta) + '">' + LIXO +
      '</button></div>';
  }

  function tituloLista(n){
    return n === 1 ? 'Você tem um lote pela metade'
                   : 'Você tem ' + n + ' lotes pela metade';
  }

  function entrada(lista){
    bolas.innerHTML = '';
    palco.innerHTML =
      cabeca('Programar publicações', tituloLista(lista.length),
             'Continue de onde parou, exclua o que não vale mais, ou comece um novo.') +
      '<div class="fc-lista" id="pr-lista">' +
        lista.map(linhaRascunho).join('') +
        '<button type="button" class="fc-op fc-novo" id="pr-zerar">' +
          '<span class="ini">+</span><span class="quem"><b>Começar um lote novo</b>' +
          '<span>os rascunhos acima continuam guardados</span></span></button>' +
      '</div>';
    ligarLista(lista);
  }

  /* Os cliques da lista ficam num lugar so', porque a lista e' repintada em pedacos:
     uma linha vira pergunta, a pergunta vira linha de novo, a linha some. */
  function ligarLista(lista){
    palco.querySelectorAll('[data-r]').forEach(function(el){
      el.onclick = function(e){
        if (e.target.closest('[data-x]')) return;      // o lixo tem dono proprio
        var r = lista[+el.dataset.r];
        escolha = r.dados.escolha; ir(r.dados.passo || 0);
      };
    });
    palco.querySelectorAll('[data-x]').forEach(function(b){
      b.onclick = function(e){ e.stopPropagation(); confirmar(lista, +b.dataset.x); };
    });
    var z = document.getElementById('pr-zerar');
    if (z) z.onclick = function(){
      escolha = {conta:null, pasta:null, porDia:3, de:'09:00', ate:'21:00',
                 dias:[1,1,1,1,1,1,1], inicio:hoje()};
      ir(0);
    };
  }

  /* PERGUNTAR NA PROPRIA LINHA, e trocar so' ela. Repintar a lista inteira fazia a
     animacao de entrada rodar de novo a cada clique, e era isso que piscava. */
  function confirmar(lista, i){
    var el = palco.querySelector('[data-r="' + i + '"]');
    if (!el) return;
    var r = lista[i];
    var caixa = document.createElement('div');
    caixa.className = 'fc-conf';
    caixa.dataset.r = i;
    caixa.innerHTML = '<p>Excluir o rascunho de <b>@' + seguro(r.conta) +
      '</b>? Não dá para desfazer.</p>' +
      '<button class="bt ruim" data-sim="1">Excluir</button>' +
      '<button class="bt" data-nao="1">Manter</button>';
    el.replaceWith(caixa);

    caixa.querySelector('[data-nao]').onclick = function(){
      var volta = document.createElement('div');
      volta.innerHTML = linhaRascunho(r, i);
      caixa.replaceWith(volta.firstChild);
      ligarLista(lista);
    };
    caixa.querySelector('[data-sim]').onclick = function(){
      fetch('/painel/rascunho', {method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({apagar: r.id})}).catch(function(){})
        .then(function(){
          var restam = lista.filter(function(x){ return x.id !== r.id; });
          if (!restam.length){
            // sem rascunho nenhum, a tela vira o passo 1: ai' a animacao e' bem-vinda,
            // porque e' troca de tela e nao de linha
            escolha = {conta:null, pasta:null, porDia:3, de:'09:00', ate:'21:00',
                       dias:[1,1,1,1,1,1,1], inicio:hoje()};
            return ir(0);
          }
          caixa.classList.add('fc-op');
          caixa.classList.add('saindo');
          setTimeout(function(){
            caixa.remove();
            var h = palco.querySelector('h2');
            if (h) h.textContent = tituloLista(restam.length);
            // os indices mudam quando uma linha sai: a lista velha vira a nova
            palco.querySelectorAll('[data-r]').forEach(function(el2){
              var quem = el2.querySelector('b').textContent.replace('@','');
              el2.dataset.r = restam.findIndex(function(x){ return x.conta === quem; });
            });
            palco.querySelectorAll('[data-x]').forEach(function(b2){
              b2.dataset.x = b2.closest('[data-r]').dataset.r;
            });
            ligarLista(restam);
          }, 260);
        });
    };
  }

  function hoje(){
    var d = new Date();
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' +
           ('0'+d.getDate()).slice(-2);
  }

  function sair(){
    document.documentElement.removeAttribute('data-tela');
    document.querySelectorAll('.pagina').forEach(function(p){
      p.classList.toggle('ativa', p.id === 'pag-painel');
    });
    document.querySelectorAll('.menu [data-pag]').forEach(function(b){
      b.classList.toggle('ativo', b.dataset.pag === 'painel');
    });
    if (window.abrirPainel) window.abrirPainel();
    scrollTo({top:0, behavior:'instant'});
  }
  document.getElementById('pr-voltar').addEventListener('click', sair);

  function abrir(){
    // O MENU SAI DA TELA: aqui so' se faz uma coisa, e a saida esta' escrita no topo.
    document.documentElement.setAttribute('data-tela', 'foco');
    document.querySelectorAll('.pagina').forEach(function(p){
      p.classList.toggle('ativa', p.id === 'pag-programar');
    });
    palco.innerHTML = '';
    bolas.innerHTML = '';
    if (!escolha.inicio) escolha.inicio = hoje();
    Promise.all([
      fetch('/painel/rede', {cache:'no-store'}).then(function(x){ return x.json(); })
        .catch(function(){ return {contas:[]}; }),
      fetch('/midia/ligadas', {cache:'no-store'}).then(function(x){ return x.json(); })
        .catch(function(){ return {pastas:[]}; }),
      fetch('/painel/rascunho', {cache:'no-store'}).then(function(x){ return x.json(); })
        .catch(function(){ return {rascunhos:[]}; })
    ]).then(function(r){
      CONTAS = r[0].contas || [];
      PASTAS = r[1].pastas || [];
      var lista = (r[2].rascunhos || []).filter(function(x){
        return x.dados && x.dados.escolha && x.dados.escolha.conta; });
      if (lista.length) entrada(lista);
      else ir(0);
    });
  }

  window.abrirProgramar = abrir;
  ['pn-programar', 'menu-programar'].forEach(function(id){
    var bt = document.getElementById(id);
    if (bt) bt.addEventListener('click', abrir);
  });
})();
