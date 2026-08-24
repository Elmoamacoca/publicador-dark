// GERADO PELO CORTE DO ARQUIVO UNICO (fase 2). Ordem numerica e lei.
/* O TROCADOR DE CONTA. A tela de la' abre uma conta por vez e le' qual no endereco da
   pagina. Aqui nao ha' endereco: o publicador tem poucas contas e todas cabem numa
   linha de botoes, entao a escolha fica no cabecalho da aba.

   E ela so' acorda no primeiro clique em Analytics. Carregar retrato e miniatura de
   toda conta na abertura do painel pagaria por uma tela que talvez ninguem abra. */
(function(){
  var caixa = document.getElementById('troca-conta');
  var atual = null, montado = false;

  /* AS MINIATURAS DO ACERVO PRECISAM SER PEDIDAS NA HORA. Elas nascem com carga
     preguicosa, que e' o certo la' no Social Tracker: aquela pagina abre uma conta por
     vez, com centenas de publicacoes, e adiantar todas seria puxar megabytes que
     ninguem vai rolar. Aqui a foto ja' viaja dentro do proprio arquivo de dados, do
     tamanho de miniatura, e sao poucas por conta: o adiantamento nao custa nada.

     E preguicosa ela dependia de a faixa entrar em tela para chegar, o que nao acontece
     enquanto a aba esta' fechada nem quando alguem so' passa o olho. Resultado visivel:
     faixa do acervo em branco. O vigia abaixo troca o pedido para imediato assim que
     cada miniatura nasce, inclusive nas trocas de aba dentro do acervo. */
  function acordarImagens(raiz){
    raiz.querySelectorAll('img[loading="lazy"]').forEach(function(i){
      i.loading = 'eager';
      i.setAttribute('src', i.getAttribute('src'));
    });
  }
  new MutationObserver(function(mudancas){
    mudancas.forEach(function(m){
      m.addedNodes.forEach(function(no){
        if (no.nodeType === 1) acordarImagens(no.matches && no.matches('img') ? no.parentNode : no);
      });
    });
  }).observe(document.getElementById('pf-conteudo'), {childList:true, subtree:true});

  function abrir(u){
    if (u === atual) return;
    atual = u;
    caixa.querySelectorAll('[data-conta]').forEach(function(b){
      b.classList.toggle('on', b.dataset.conta === u);
    });
    window.Perfil.abrir(u);
  }

  window.abrirAnalytics = function(){
    if (montado) return;
    montado = true;
    window.Perfil.carregar().then(function(contas){
      if (!contas.length){
        caixa.innerHTML = '';
        document.getElementById('pf-conteudo').innerHTML =
          '<div class="gal-vazia">nenhuma conta ligada no publicador.</div>';
        return;
      }
      caixa.innerHTML = contas.map(function(c){
        return '<button class="chip" type="button" data-conta="' + c.u + '">@' +
               c.u + '</button>';
      }).join('');
      caixa.addEventListener('click', function(e){
        var b = e.target.closest('[data-conta]');
        if (b) abrir(b.dataset.conta);
      });
      abrir(contas[0].u);
    });
  };
})();
