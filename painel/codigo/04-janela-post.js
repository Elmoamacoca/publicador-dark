// GERADO PELO CORTE DO ARQUIVO UNICO (fase 2). Ordem numerica e lei.
/* ------------------------------------------------------------- a janela de um post
   Ela e' de leitura. Nao existe campo, salvar nem apagar aqui dentro: mexer em post e'
   trabalho de outra tela, e misturar as duas coisas e' como se apaga alguma coisa sem
   querer.

   O NUMERO SO' APARECE SE EXISTIR. Post que ainda nao saiu nao tem alcance nem curtida, e
   mostrar zero nesse caso faria uma saida de amanha parecer um fracasso de ontem. */
(function(){
  var caixa = document.getElementById('jp'),
      cabeca = document.getElementById('jp-cabeca'),
      corpo = document.getElementById('jp-corpo');
  if (!caixa) return;
  var ACERVO = null, CONTAS_JP = {}, POR_CONTA = {};

  function seguro(t){
    return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
             .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function num(v){ return (v || 0).toLocaleString('pt-BR'); }
  function quando(d){
    var dias = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    var mes = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto',
               'setembro','outubro','novembro','dezembro'];
    return dias[d.getDay()] + ', ' + d.getDate() + ' de ' + mes[d.getMonth()] + ' às ' +
           String(d.getHours()).padStart(2,'0') + 'h' +
           String(d.getMinutes()).padStart(2,'0');
  }

  function carregarAcervo(){
    if (ACERVO) return Promise.resolve(ACERVO);
    return fetch('/analytics.json', {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){
        ACERVO = {}; POR_CONTA = {};
        (d.perfis || []).forEach(function(p){ CONTAS_JP[p.u] = p; });
        Object.keys(d.fundo || {}).forEach(function(u){
          POR_CONTA[u] = [];
          (d.fundo[u].posts || []).forEach(function(p){
            ACERVO[p.sc] = {conta:u, fmt:p.fmt, quando:p.quando, cur:p.cur, com:p.com,
                            views:p.views, eng:p.eng};
            POR_CONTA[u].push(p.sc);
          });
        });
        return ACERVO;
      })
      .catch(function(){ ACERVO = {}; return ACERVO; });
  }

  /* --------------------------------------------------------------------- a mídia */
  function midia(post){
    var fmt = post.fmt || 'reel';
    if (fmt === 'carrossel'){
      var fotos = post.fotos || [];
      if (!fotos.length) return semMidia('o carrossel ainda não foi baixado.');
      return '<div class="jp-tira" id="jp-tira">' + fotos.map(function(f){
          return '<div><img src="' + seguro(f) + '" alt=""></div>'; }).join('') +
        '</div><div class="jp-pontos">' + fotos.map(function(_, i){
          return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div>';
    }
    var classe = fmt === 'reel' ? 'reel' : 'feed';
    if (!post.capa) return '<div class="jp-midia ' + classe + '">' +
      semMidia(fmt === 'reel' ? 'o vídeo ainda não foi baixado.'
                              : 'a imagem ainda não foi baixada.') + '</div>';
    var h = '<div class="jp-midia ' + classe + '" id="jp-midia">' +
            '<img src="' + seguro(post.capa) + '" alt="">';
    /* O REEL RODA QUANDO O MOUSE PARA EM CIMA, e nao num botao.
       Medido pelo Social Tracker e confirmado aqui: a capa que o Instagram oferece para
       reel tem 640 de largura contra 1080 do feed, e o endereco e' assinado com o tamanho
       dentro, entao pedir maior devolve 403. O video e' a unica forma de ver aquele reel
       nitido, e por isso ele acompanha a capa. */
    if (fmt === 'reel' && post.video)
      h += '<span class="jp-dica"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/>' +
           '</svg>passe o mouse para ver</span>';
    return h + '</div>';
  }
  function semMidia(t){ return '<div class="jp-semmidia">' + t + '</div>'; }

  /* ------------------------------------------------------------------ os números */
  function numeros(post){
    if (post.estado !== 'publicado')
      return '<div class="jp-nada"><b>Ainda não saiu.</b> Número só existe depois da ' +
             'publicação, e mostrar zero aqui faria uma saída de amanhã parecer um ' +
             'fracasso de ontem.</div>';
    var m = post.metricas;
    if (!m)
      return '<div class="jp-nada">este post saiu, mas os números dele ainda não foram ' +
             'lidos da API.</div>';
    var linhas = [['Reproduções', m.views], ['Engajamento', m.eng],
                  ['Curtidas', m.cur], ['Comentários', m.com]];
    return '<div class="jp-nums">' + linhas.map(function(l){
      return '<div class="jp-num"><span>' + l[0] + '</span><b>' + num(l[1]) +
             '</b></div>'; }).join('') + '</div>';
  }

  function ficha(post){
    var l = [];
    l.push(['Quando', quando(post.data)]);
    l.push(['Formato', post.fmt === 'reel' ? 'Reel'
                     : post.fmt === 'carrossel' ? 'Carrossel' : 'Imagem']);
    l.push(['Estado', post.estado === 'publicado' ? 'Publicado'
                    : post.estado === 'erro' ? 'Falhou' : 'Programado']);
    if (post.arquivo) l.push(['Arquivo', post.arquivo]);
    if (post.pasta) l.push(['Pasta', post.pasta]);
    return '<div class="jp-ficha">' + l.map(function(x){
      return '<div class="jp-linha"><span>' + x[0] + '</span><b>' + seguro(x[1]) +
             '</b></div>'; }).join('') + '</div>';
  }

  function abrir(post){
    var c = CONTAS_JP[String(post.conta).replace('@','')] || {};
    var face = c.avatar ? '<img class="av" src="' + c.avatar + '" alt="">'
                        : '<span class="av">' + seguro(post.conta.charAt(0)) + '</span>';
    cabeca.innerHTML = face +
      '<span class="jp-quem"><b>@' + seguro(post.conta) + '</b><span>' +
      seguro(c.nome || '') + '</span></span>' +
      (post.link ? '<a class="jp-bt" href="' + seguro(post.link) + '" target="_blank" ' +
        'rel="noopener" aria-label="Abrir no Instagram" title="Abrir no Instagram">' +
        '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/>' +
        '<circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" ' +
        'fill="currentColor" stroke="none"/></svg></a>' : '') +
      '<button class="jp-bt" type="button" data-jp-fechar aria-label="Fechar" ' +
      'title="Fechar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>';
    corpo.innerHTML = '<div class="jp-corpo"><div>' + midia(post) + '</div><div>' +
      '<div class="jp-tit">' + seguro(post.titulo) + '</div>' +
      '<div class="jp-sub">' + quando(post.data) + '</div>' +
      (post.exemplo ? '<div class="jp-nada" style="margin-bottom:14px">' +
        '<b>Conteúdo de exemplo.</b> A capa e os números abaixo são de um reel de ' +
        'verdade da conta, emprestados para você ver o desenho. Quando houver ' +
        'programação real, cada janela mostra o post dela.</div>' : '') +
      numeros(post) + ficha(post) + '</div></div>';
    caixa.hidden = false;
    document.body.style.overflow = 'hidden';
    if (post.video) prontoParaRodar(post.video);
  }
  /* O video nasce invisivel e so' aparece quando tem quadro para mostrar: ele pinta o
     proprio fundo enquanto esta' vazio, e era isso o retangulo preto ao passar o mouse.
     O `poster` cobre esse intervalo com a mesma imagem que ja' estava ali.

     E o `src` e' limpo ao sair: sem isso o Chrome segue baixando um video que ninguem
     esta' mais olhando. */
  function prontoParaRodar(arquivo){
    var cx = document.getElementById('jp-midia');
    if (!cx) return;
    var img = cx.querySelector('img');
    cx.addEventListener('mouseenter', function(){
      if (cx.querySelector('video')) return;
      var v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.preload = 'auto'; v.className = 'jp-video';
      if (img) v.poster = img.getAttribute('src');
      v.addEventListener('loadeddata', function(){ v.classList.add('pronto'); });
      v.src = arquivo;
      cx.appendChild(v);
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function(){});
    });
    cx.addEventListener('mouseleave', function(){
      var v = cx.querySelector('video');
      if (v){ v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
    });
  }

  function fechar(){
    caixa.hidden = true;
    document.body.style.overflow = '';
    corpo.innerHTML = '';
  }
  caixa.addEventListener('click', function(e){
    if (e.target.closest('[data-jp-fechar]')) return fechar();

  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !caixa.hidden) fechar();
  });

  /* A tela do calendario chama por aqui. O acervo so' e' buscado no primeiro clique. */
  window.abrirPost = function(post){
    return carregarAcervo().then(function(a){
      /* NO MODO EXEMPLO a saida nao tem post de verdade atras dela. Em vez de abrir uma
         janela vazia, ela empresta a capa e os numeros de um reel real da propria conta,
         em rodizio, e a janela diz na cara que aquilo e' emprestado. */
      if (!post.sc && post.exemplo){
        var pool = POR_CONTA[String(post.conta).replace('@','')] || [];
        if (pool.length) post.sc = pool[Math.abs(post.i || 0) % pool.length];
      }
      var d = post.sc && a[post.sc];
      if (d){
        post.fmt = post.fmt || d.fmt;
        /* A CAPA VEM DO ARQUIVO CHEIO. A miniatura de 320 servia para a faixa do
           acervo; numa janela de 300 por 533 ela aparece esticada e suja. */
        post.capa = post.capa || ('midia/' + post.sc + '.jpg');
        if (post.fmt === 'reel') post.video = 'midia/' + post.sc + '.mp4';
        post.link = 'https://www.instagram.com/p/' + post.sc + '/';
        if (post.estado === 'publicado')
          post.metricas = {views:d.views, eng:d.eng, cur:d.cur, com:d.com};
      }
      abrir(post);
    });
  };
})();
