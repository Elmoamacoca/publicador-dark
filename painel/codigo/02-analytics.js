// GERADO PELO CORTE DO ARQUIVO UNICO (fase 2). Ordem numerica e lei.
window.etiquetaHTML = function(nome){
  var t = String(nome == null ? "" : nome);
  var seguro = t.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var adulta = t.toLowerCase().indexOf("modelo") !== -1;
  var h = 0;
  for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
  return '<span class="badge badge-etq' + (adulta ? ' adulto' : '') + '"' +
         (adulta ? '' : ' style="--etq-h:' + h + '"') + '>' +
         '<svg viewBox="0 0 24 24"><use href="#' +
         (adulta ? 'i-adulto' : 'i-etq') + '"/></svg>' + seguro + '</span>';
};

window.montarSelect = function(pre, opcoes, escolhido, aoEscolher){
  var gat = document.getElementById(pre + "g"), val = document.getElementById(pre + "v"),
      lis = document.getElementById(pre + "l"), gru = document.getElementById(pre + "gr");
  if (!gat || !lis) return function(){ return escolhido; };
  var atual = escolhido;
  var MARCA = '<span class="sel-marca"><svg viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
  function rotulo(v){
    var o = opcoes.filter(function(x){ return x.v === v; })[0];
    return o ? o.r : "";
  }
  function pintar(){
    gru.innerHTML = opcoes.map(function(o){
      return '<button class="sel-item" type="button" role="option" data-v="' +
        String(o.v).replace(/"/g, "&quot;") + '" aria-selected="' + (o.v === atual) +
        '"><span class="sel-item-texto">' + o.r + '</span>' +
        (o.v === atual ? MARCA : '') + '</button>';
    }).join("");
  }
  gat.addEventListener("click", function(){
    var abre = !lis.classList.contains("aberta");
    if (abre) pintar();
    lis.classList.toggle("aberta", abre);
    gat.setAttribute("aria-expanded", abre ? "true" : "false");
  });
  lis.addEventListener("click", function(ev){
    var b = ev.target.closest(".sel-item");
    if (!b) return;
    atual = b.dataset.v;
    val.textContent = rotulo(atual);
    lis.classList.remove("aberta");
    gat.setAttribute("aria-expanded", "false");
    aoEscolher(atual);
  });
  // Clicar fora fecha. O caminho do evento e' lido com `composedPath` porque a lista e'
  // reescrita a cada abertura, e `closest` num no' ja' descartado devolve nada.
  document.addEventListener("click", function(ev){
    var c = ev.composedPath ? ev.composedPath() : [ev.target];
    var dentro = c.some(function(x){
      return x && x.matches && x.matches("#" + pre + ", #" + pre + " *"); });
    if (!dentro){ lis.classList.remove("aberta");
                  gat.setAttribute("aria-expanded", "false"); }
  });
  val.textContent = rotulo(atual);
  return function(){ return atual; };
};

// A PAGINACAO E' DE TELA. Todos os itens ja' vieram dentro da pagina; virar de pagina e'
// esconder e mostrar, sem tocar a rede. Com cento e cinquenta publicacoes isso e'
// instantaneo. Quando o acervo passar de alguns milhares, e' aqui que entra a busca por
// pedaco: a marcacao continua a mesma, muda so' quem enche a lista.
window.montarPaginacao = function(pre, alvo, tam){
  var num = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
  var id = function(s){ return document.getElementById(s); };
  var todos = [].slice.call(alvo.children), lista = todos, pag = 1;
  var conta = id(pre + "-conta"),
      bIni = id(pre + "-ini"), bAnt = id(pre + "-ant"),
      bProx = id(pre + "-prox"), bFim = id(pre + "-fim");
  function pintar(){
    var paginas = Math.max(1, Math.ceil(lista.length / tam));
    if (pag > paginas) pag = paginas;
    todos.forEach(function(el){ el.hidden = true; });
    lista.slice((pag - 1) * tam, (pag - 1) * tam + tam)
         .forEach(function(el){ el.hidden = false; });
    conta.textContent = "Pág. " + pag + "/" + paginas + " · " + num(lista.length) +
                        (lista.length === 1 ? " item" : " itens");
    // Quem entrou na pagina agora tambem precisa da animacao de entrada. Sem isto, a
    // pagina 2 aparece parada, porque o observador so' conhecia os nos do primeiro sorteio.
    if (window.olharPecas) window.olharPecas(alvo);
    bIni.disabled = bAnt.disabled = (pag === 1);
    bProx.disabled = bFim.disabled = (pag === paginas);
  }
  bIni.addEventListener("click", function(){ pag = 1; pintar(); });
  bAnt.addEventListener("click", function(){ pag = Math.max(1, pag - 1); pintar(); });
  bProx.addEventListener("click", function(){ pag = pag + 1; pintar(); });
  bFim.addEventListener("click", function(){
    pag = Math.max(1, Math.ceil(lista.length / tam)); pintar(); });
  pintar();
  return {
    tamanho: function(t){ tam = Number(t) || tam; pag = 1; pintar(); },
    // Reordenar e' recolocar os nos na ordem nova: a pagina 1 tem que mostrar o primeiro
    // da ordem escolhida, e nao o primeiro que foi escrito no HTML.
    definir: function(nova){
      lista = nova;
      nova.forEach(function(el){ alvo.appendChild(el); });
      pag = 1; pintar();
    }
  };
};

(function(){
  // O REEL RODA QUANDO O MOUSE PARA EM CIMA, e nao antes.
  //
  // ELE MORA AQUI, e nao na aba de Insights, porque as galerias do perfil usam o mesmo
  // cartao. Em reel isto nao e' enfeite: a capa que o Instagram oferece para reel tem 640
  // de largura contra 1080 do feed (medido em 16/08, e o endereco e' assinado com o
  // tamanho dentro, entao pedir maior devolve 403). O video e' a unica forma de ver aquele
  // reel nitido, e por isso ele acompanha o cartao para onde o cartao for. A animacao nao veio dentro da
  // pagina: ela e' buscada no primeiro passar de mouse daquele quadradinho e fica
  // guardada, entao a segunda vez e' instantanea. Uma galeria de oitenta reels abre com
  // zero animacao carregada, e so' custa o que o Gabriel realmente olhou.
  function rodar(cartao){
    var thumb = cartao.querySelector(".gthumb");
    if (!thumb || thumb.querySelector("video")) return;
    var v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.preload = "auto"; v.className = "video";
    // O VIDEO NASCE INVISIVEL E SO' APARECE QUANDO TEM QUADRO PARA MOSTRAR.
    //
    // Ele entra por cima da imagem parada, e um video ainda vazio pinta o proprio fundo:
    // era isso o retangulo preto que aparecia ao passar o mouse. O quadro nao vem no
    // mesmo instante em que o elemento entra, entao entre um e outro o cartao ficava
    // preto justamente enquanto a pessoa olhava para ele.
    //
    // O `poster` cobre esse intervalo com a mesma imagem que ja' estava ali, e o
    // `loadeddata` so' revela o video quando existe imagem de verdade dentro dele.
    var img = thumb.querySelector("img.cheia");
    if (img && img.getAttribute("src")) v.poster = img.getAttribute("src");
    v.addEventListener("loadeddata", function(){ v.classList.add("pronto"); });
    v.src = cartao.dataset.mid;
    thumb.appendChild(v);
    var p = v.play();
    if (p && p.catch) p.catch(function(){});
  }
  function parar(cartao){
    var v = cartao.querySelector(".gthumb video");
    // O `src` e' limpo antes de tirar o no': sem isso o Chrome segue baixando o video
    // de um quadradinho que ninguem esta' mais olhando.
    if (v){ v.pause(); v.removeAttribute("src"); v.load(); v.remove(); }
  }
  document.addEventListener("mouseover", function(ev){
    var c = ev.target.closest ? ev.target.closest('.gpost[data-mov="1"]') : null;
    if (c) rodar(c);
  });
  document.addEventListener("mouseout", function(ev){
    var c = ev.target.closest ? ev.target.closest('.gpost[data-mov="1"]') : null;
    if (c && !c.contains(ev.relatedTarget)) parar(c);
  });
})();

// ARRASTA E ROLA, no lugar da barra de rolagem.
//
// ELE MORA AQUI, e nao na aba de Insights, porque TRES telas usam o gesto: o ranking
// dos Insights, a fita de recordes do perfil e a fita de stories. Este arquivo e' o
// pacote que as tres carregam, e uma copia por tela seria tres gestos que um dia
// divergem.
//
// A barra ocupava altura embaixo de cada faixa e, com tres faixas, virava tres barras
// cinzas na tela. Arrastar e' o gesto que a propria fila sugere: ela e' horizontal, e
// horizontal se empurra.
//
// O CLIQUE CONTINUA FUNCIONANDO. So' vira arrasto depois de cinco pixels de movimento;
// abaixo disso e' clique, e o cartao abre a publicacao como sempre. Sem esse limiar,
// todo clique com a mao tremida deixaria de abrir o post.
window.arrastarParaRolar = function(tira){
  // Sem fita nao ha' gesto: quem chama passa um `getElementById`,
  // que vem vazio quando a aba nao tem o que mostrar.
  if (!tira) return;
  var pegando = false, arrastou = false, x0 = 0, rolagem0 = 0;
  tira.addEventListener("mousedown", function(ev){
    if (ev.button !== 0) return;
    pegando = true; arrastou = false;
    x0 = ev.clientX; rolagem0 = tira.scrollLeft;
    tira.classList.add("pegando");
  });
  window.addEventListener("mousemove", function(ev){
    if (!pegando) return;
    var d = ev.clientX - x0;
    if (Math.abs(d) > 5) arrastou = true;
    if (arrastou){ tira.scrollLeft = rolagem0 - d; ev.preventDefault(); }
  });
  window.addEventListener("mouseup", function(){
    if (!pegando) return;
    pegando = false;
    tira.classList.remove("pegando");
    // Solta a trava um quadro depois, senao o clique que encerra o arrasto abriria o
    // post que estava debaixo do dedo no fim do movimento.
    if (arrastou) setTimeout(function(){ arrastou = false; }, 0);
  });
  tira.addEventListener("click", function(ev){
    if (arrastou){ ev.preventDefault(); ev.stopPropagation(); }
  }, true);
};

// ====================================================== O TEMPO, PARA TODOS OS DESENHOS
//
// TRES PERGUNTAS QUE TODO DESENHO DESTE SISTEMA FAZ, e que ate' 16/08 cada um respondia
// do seu jeito: em que unidade a janela e' contada, onde cada ponto cai no papel, e como
// a data e' escrita embaixo. Tres respostas diferentes para a mesma pergunta e' o comeco
// de tres desenhos que discordam entre si.
//
// A UNIDADE SAI DA JANELA ESCOLHIDA, e nao do que por acaso ha' de dado. Era esse o
// defeito: uma conta com cinco dias de leitura desenhava a mesma coisa em 30, 90, 180 e
// 365 dias, porque o vao dos dados era o mesmo nos quatro. Quem manda e' o periodo que a
// pessoa clicou; onde nao ha' dado, o desenho fica vazio e a barra de periodo avisa.
window.tempoUtil = (function(){
  function pad(n){ return ("0" + n).slice(-2); }
  // O carimbo do balde e' LOCAL, e nao UTC. Misturar os dois punha a publicacao das 22 h
  // no balde do dia seguinte para quem esta' a oeste de Greenwich.
  function carimbo(d){
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
           "T" + pad(d.getHours()) + ":00:00";
  }

  // A JANELA ESCOLHIDA DECIDE A UNIDADE. Os cortes sao os que deixam a contagem de
  // colunas legivel: 24 colunas em 24 h, 30 em 30 dias, 13 em 90, 26 em 180, 12 em um ano.
  var ESCADA = [
    {ate: 2,    passo: "hora",   rot: "por hora",   uni: "uma hora"},
    {ate: 45,   passo: "dia",    rot: "por dia",    uni: "um dia"},
    {ate: 200,  passo: "semana", rot: "por semana", uni: "uma semana"},
    {ate: 1e9,  passo: "mes",    rot: "por mês",    uni: "um mês"}
  ];
  function balde(dias){
    for (var i = 0; i < ESCADA.length; i++)
      if (dias <= ESCADA[i].ate) return ESCADA[i];
    return ESCADA[ESCADA.length - 1];
  }

  function inicio(quando, passo){
    var d = new Date(quando);
    if (isNaN(d)) return "";
    if (passo === "hora"){ d.setMinutes(0, 0, 0); }
    else if (passo === "dia"){ d.setHours(0, 0, 0, 0); }
    else if (passo === "mes"){ d.setHours(0, 0, 0, 0); d.setDate(1); }
    else { d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); }
    return carimbo(d);
  }
  function proximo(chave, passo){
    var d = new Date(chave);
    if (passo === "hora") d.setHours(d.getHours() + 1);
    else if (passo === "dia") d.setDate(d.getDate() + 1);
    else if (passo === "semana") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return carimbo(d);
  }
  // TODAS AS COLUNAS DA JANELA, inclusive as vazias. Sem elas, uma conta que so' publicou
  // na terca teria uma coluna so' no meio de trinta dias de nada, e o desenho diria que a
  // janela inteira e' aquela terca.
  function grade(t0, t1, passo){
    var fora = [], k = inicio(t0, passo), guarda = 0;
    while (Date.parse(k) <= t1 && guarda++ < 500){
      fora.push(k);
      k = proximo(k, passo);
    }
    return fora;
  }
  // Soma os pares [quando, valor] dentro de cada coluna da grade.
  function somar(pares, passo, colunas){
    var mapa = {};
    (pares || []).forEach(function(p){
      var k = inicio(p[0], passo);
      if (k) mapa[k] = (mapa[k] || 0) + p[1];
    });
    if (!colunas) colunas = Object.keys(mapa).sort();
    return colunas.map(function(k){ return [k, mapa[k] || 0]; });
  }
  // O ultimo valor conhecido dentro de cada coluna (serve para nivel, e nao para soma).
  function ultimoDe(pares, passo, colunas){
    var mapa = {};
    (pares || []).forEach(function(p){
      var k = inicio(p[0], passo);
      if (k) mapa[k] = p[1];
    });
    return (colunas || Object.keys(mapa).sort()).map(function(k){
      return [k, mapa[k]]; }).filter(function(p){ return p[1] != null; });
  }

  var MES = ["jan", "fev", "mar", "abr", "mai", "jun",
             "jul", "ago", "set", "out", "nov", "dez"];
  // O rotulo CURTO de uma coluna, para caber embaixo dela na regua.
  function marcaCurta(chave, passo){
    var d = new Date(chave);
    if (isNaN(d)) return String(chave);
    var dm = pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
    if (passo === "hora") return dm + " " + pad(d.getHours()) + "h";
    if (passo === "mes")  return MES[d.getMonth()] + "/" + String(d.getFullYear()).slice(2);
    return dm;
  }
  function rotulo(chave, passo){
    var d = new Date(chave);
    if (isNaN(d)) return String(chave);
    var dm = pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
    if (passo === "hora") return dm + " " + pad(d.getHours()) + "h";
    if (passo === "mes")  return MES[d.getMonth()] + "/" + String(d.getFullYear()).slice(2);
    if (passo === "semana") return "semana de " + dm;
    return dm + "/" + String(d.getFullYear()).slice(2);
  }

  // AS MARCAS DA REGUA CAEM EM TEMPOS REDONDOS: 1 h, 6 h, um dia, uma semana, um mes, um
  // ano. Dividir o vao em oito partes iguais dava marca em "16:32" no meio de uma fileira
  // de dias, e uma regua com marca em hora quebrada nao e' regua.
  var PASSOS = [3600e3, 3 * 3600e3, 6 * 3600e3, 12 * 3600e3, 86400e3, 2 * 86400e3,
                7 * 86400e3, 14 * 86400e3, 30 * 86400e3, 90 * 86400e3, 365 * 86400e3];
  function marcas(t0, t1, larg, porRotulo){
    var cabem = Math.max(2, Math.floor(larg / (porRotulo || 100)));
    var minimo = (t1 - t0) / cabem, passoT = PASSOS[PASSOS.length - 1];
    for (var i = 0; i < PASSOS.length; i++)
      if (PASSOS[i] >= minimo){ passoT = PASSOS[i]; break; }
    var fora = [];
    // Mes e ano andam por calendario, e nao por trinta dias: "01/09, 01/10, 01/11" e'
    // regua; "01/09, 01/10, 31/10" e' o vao dividido por trinta.
    if (passoT >= 30 * 86400e3){
      var d = new Date(t0);
      d.setHours(0, 0, 0, 0); d.setDate(1);
      var salto = passoT >= 365 * 86400e3 ? 12 : (passoT >= 90 * 86400e3 ? 3 : 1);
      while (d.getTime() < t0) d.setMonth(d.getMonth() + salto);
      for (var g = 0; d.getTime() <= t1 && g < 200; g++){
        fora.push({t: d.getTime(),
                   rot: MES[d.getMonth()] + "/" + String(d.getFullYear()).slice(2)});
        d.setMonth(d.getMonth() + salto);
      }
      return fora;
    }
    var a = new Date(t0);
    a.setHours(0, 0, 0, 0);
    var tm = a.getTime();
    while (tm < t0 - passoT) tm += passoT;
    for (var h = 0; tm <= t1 && h < 400; h++, tm += passoT){
      if (tm < t0) continue;
      var x = new Date(tm);
      fora.push({t: tm, rot: passoT < 86400e3
        ? pad(x.getDate()) + "/" + pad(x.getMonth() + 1) + " " + pad(x.getHours()) + "h"
        : pad(x.getDate()) + "/" + pad(x.getMonth() + 1)});
    }
    return fora;
  }

  return {balde: balde, inicio: inicio, proximo: proximo, grade: grade,
          somar: somar, ultimoDe: ultimoDe, rotulo: rotulo, marcaCurta: marcaCurta,
          marcas: marcas, MES: MES};
})();

window.montarGrafico = function(raiz){
  // OS DADOS PODEM CHEGAR PRONTOS. Na aba de Insights a pagina e' escrita em Python e as
  // series viajam num `script` de JSON ao lado do desenho; no perfil, que e' escrito no
  // proprio navegador, elas ja' estao na memoria e passar por texto seria uma volta a toa.
  var dados = raiz.dadosProntos;
  if (!dados){
    var fonte = document.getElementById(raiz.dataset.dados);
    if (!fonte) return;
    dados = JSON.parse(fonte.textContent);
  }
  var tela  = raiz.querySelector(".grafico-tela"),
      balao = raiz.querySelector(".grafico-balao"),
      abas  = [].slice.call(raiz.querySelectorAll(".gaba"));
  // O EIXO E' O TEMPO quando todo ponto traz data, e nao a posicao na lista. Duas series
  // de tamanhos diferentes esticadas pela largura toda punham o ponto 3 de uma em cima do
  // ponto 18 da outra: duas curvas contando dias diferentes no mesmo lugar do papel.
  //
  // O DOMINIO PODE VIR DE FORA (`dados.dominio`), e e' assim que o periodo escolhido
  // manda no desenho: escolher 90 dias desenha 90 dias, mesmo que so' os ultimos cinco
  // tenham medida. Sem isso, 30, 90, 180 e 365 saiam identicos numa conta nova.
  function _t(p){ var v = Date.parse(p[0]); return isNaN(v) ? null : v; }
  var temTempo = dados.chaves.every(function(c){
    return !c.vals.length || c.vals.every(function(p){ return _t(p) != null; }); });
  var dt0 = null, dt1 = null;
  if (temTempo){
    if (dados.dominio){ dt0 = dados.dominio[0]; dt1 = dados.dominio[1]; }
    else {
      dados.chaves.forEach(function(c){
        c.vals.forEach(function(p){
          var v = _t(p);
          if (dt0 === null || v < dt0) dt0 = v;
          if (dt1 === null || v > dt1) dt1 = v;
        });
      });
    }
    if (dt0 === null || !(dt1 > dt0)) temTempo = false;
  }

  var ligadas = dados.chaves.filter(function(c){ return c.ligada && c.vals.length; })
                            .map(function(c){ return c.k; });
  if (!ligadas.length){
    var pri = dados.chaves.filter(function(c){ return c.vals.length; })[0];
    if (pri) ligadas = [pri.k];
  }
  var geo = null;

  function serie(k){
    for (var i = 0; i < dados.chaves.length; i++)
      if (dados.chaves[i].k === k) return dados.chaves[i];
    return null;
  }
  function vivas(){
    return ligadas.map(serie).filter(function(s){ return s && s.vals.length; });
  }
  function n(v){ return (v || 0).toLocaleString("pt-BR"); }
  // A CASA DECIMAL SAI DO PASSO DA REGUA, e nao do valor. Uma casa fixa escrevia
  // "104,4M" em cinco marcas seguidas: uma conta de cem milhoes que anda cinquenta mil
  // por leitura tem a regua inteira dentro da mesma primeira casa. E regua que repete o
  // mesmo rotulo nao e' regua.
  function curto(v, pa){
    var s = v < 0 ? "-" : "";
    v = Math.abs(v);
    pa = Math.abs(pa) || v;
    function corta(x, base){
      var casas = Math.max(0, Math.min(3,
        Math.ceil(-Math.log(pa / base) / Math.LN10)));
      return (x / base).toFixed(casas).replace(".", ",").replace(/,0+$/, "");
    }
    if (v >= 1e6) return s + corta(v, 1e6) + "M";
    if (v >= 1e3) return s + corta(v, 1e3) + "k";
    return s + n(Math.round(v));
  }
  function quando(iso){
    var s = String(iso);
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(s)) return s;
    var hora = s.slice(11, 16);
    // "00:00" e' o carimbo de uma COLUNA de dia, de semana ou de mes, e nao uma leitura
    // da meia-noite: escrever a hora ali inventaria uma precisao que a coluna nao tem.
    return s.slice(8, 10) + "/" + s.slice(5, 7) +
           (hora && hora !== "00:00" ? " · " + hora : "");
  }
  function passo(bruto){
    if (!(bruto > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10)), r = bruto / p;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
  }

  // CADA SERIE TEM A PROPRIA ESCALA. Curtida anda na casa dos cento e sessenta mil e
  // comentario na dos mil: num eixo so', a curva de comentario vira uma linha reta
  // colada no chao e a comparacao nao diz nada. Com escala propria, o que se compara e'
  // o FORMATO das duas curvas, que e' a pergunta ("as duas subiram junto?"). Por isso o
  // eixo da esquerda so' mostra numero quando ha' uma serie escolhida: com duas ou mais,
  // numero ali seria de qual delas? O valor de verdade de cada uma esta' no balao.
  function escala(s, alt, topo){
    var vals = s.vals.map(function(v){ return v[1]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    // SERIE TODA EM ZERO NAO DESENHA EIXO DE -1 A 1. Contagem nao tem valor negativo, e
    // "menos um post" nao existe: o chao e' o zero e o teto vira um.
    if (hi === lo && lo === 0){ hi = 1; }
    else if (hi === lo){ hi = lo + 1; lo = Math.min(lo - 1, 0); }
    var pa = passo((hi - lo) / 3);
    var piso = Math.floor(lo / pa) * pa, teto = Math.ceil(hi / pa) * pa;
    if (teto === piso) teto = piso + pa;
    return {piso: piso, teto: teto, pa: pa,
            y: function(v){ return topo + alt - alt * (v - piso) / (teto - piso); }};
  }

  function desenhar(){
    tela.innerHTML = "";
    esconder();
    var ss = vivas();
    if (!ss.length){
      var q = serie(ligadas[0]) || dados.chaves[0];
      tela.innerHTML = '<p class="grafico-sem">' +
        ((q && q.motivo) || "ainda sem série suficiente para o gráfico") + "</p>";
      geo = null;
      return;
    }
    var L = Math.max(260, Math.round(tela.clientWidth));
    var A = Math.max(220, Math.round(tela.clientHeight) || 300);
    // A DIREITA PRECISA DE FOLGA: a ultima data e' escrita a partir do ultimo ponto, e
    // com a folga velha de 14 pixels ela saia meia letra para fora do cartao.
    // O EIXO DA ESQUERDA ENCOLHE QUANDO O DESENHO E' ESTREITO. Com dois cartoes por
    // linha sobram uns 340 pixels de grafico: 56 so' para os numeros do eixo seriam um
    // sexto do desenho gasto em rotulo. Com duas ou mais series o eixo nem aparece, e ai'
    // a folga da esquerda e' so' a que a curva precisa para nao encostar na borda.
    var esq = ss.length === 1 ? (L < 480 ? 54 : 64) : 14;
    var dire = L < 480 ? 26 : 34, topo = 18, baixo = 28;
    var larg = L - esq - dire, alt = A - topo - baixo;
    var base = ss[0], ult = base.vals.length - 1;
    var barra = raiz.dataset.vista === "barra";

    // A VAGA E' O MENOR PASSO DE TEMPO entre dois pontos vizinhos, e e' dela que sai a
    // largura da barra. Com a largura tirada da CONTAGEM de pontos, trinta colunas numa
    // janela de trinta dias e cinco colunas numa de cinco dias saiam com a mesma
    // espessura, e o desenho perdia a nocao de quanto tempo cada coluna cobre.
    var vagaMs = Infinity, j2;
    if (temTempo)
      ss.forEach(function(s){
        for (j2 = 1; j2 < s.vals.length; j2++)
          vagaMs = Math.min(vagaMs, _t(s.vals[j2]) - _t(s.vals[j2 - 1]));
      });
    if (!(vagaMs > 0) || vagaMs === Infinity) vagaMs = (dt1 - dt0) / 30;
    var maxN = Math.max.apply(null, ss.map(function(s){ return s.vals.length; }));
    var vagaPx = temTempo ? larg * vagaMs / (dt1 - dt0) : larg / Math.max(1, maxN);
    var lb = barra ? Math.max(1.2, Math.min(46, vagaPx * .72 / ss.length)) : 0;
    var folga = barra ? Math.min(larg * .06, lb * ss.length / 2) : 0;

    // SERIE DE COLUNAS OU SERIE DE PONTOS? Uma serie agregada -- ganho por mes, publicacao
    // por semana -- tem o carimbo no COMECO da coluna, e a barra dela precisa cobrir a
    // coluna. Uma serie de pontos -- uma leitura, uma publicacao -- e' um instante, e a
    // barra fica centrada nele. O que separa as duas e' o passo: coluna tem passo
    // constante, ponto nao tem. Mes varia de 28 a 31 dias, entao a folga e' generosa.
    // O DESLOCAMENTO E' POR SERIE, e nao do desenho inteiro: um cartao pode ter a curva
    // de seguidores (pontos soltos no tempo) ao lado do ganho por mes (colunas). Medir os
    // dois com a mesma regua deslocaria a curva meio mes sem motivo.
    var algumaColuna = false;
    ss.forEach(function(s){
      s._desl = 0;
      if (!temTempo || s.vals.length < 2) return;
      var passos = [];
      for (var q = 1; q < s.vals.length; q++)
        passos.push(_t(s.vals[q]) - _t(s.vals[q - 1]));
      var mn = Math.min.apply(null, passos), mx = Math.max.apply(null, passos);
      // Coluna tem passo constante; ponto nao tem. Mes varia de 28 a 31 dias, entao a
      // folga e' generosa.
      if (mx <= mn * 1.6){
        s._coluna = mn;
        s._desl = larg * mn / (dt1 - dt0) / 2;
        algumaColuna = true;
      }
    });
    var x = temTempo
      ? function(i, s){
          var d = (s || base);
          var v = _t(d.vals[i]);
          // O PONTO DE UMA COLUNA MORA NO MEIO DELA. Carimbado no comeco, o ponto de
          // agosto cai no dia 1o e a curva anda meio mes atrasada em relacao ao rotulo.
          return esq + folga + (larg - 2 * folga) * (v - dt0) / (dt1 - dt0) +
                 (barra ? 0 : (d._desl || 0));
        }
      : function(i, s){
          var n = ((s || base).vals.length - 1) || 1;
          return esq + folga + (larg - 2 * folga) * i / n;
        };

    var grade = "", defs = "", areas = "", curvas = "", rot = "";
    var e0 = escala(base, alt, topo);
    var marcos = [];
    for (var v = e0.piso; v <= e0.teto + 1e-9; v += e0.pa) marcos.push(v);
    // O EIXO NÃO PODE REPETIR O MESMO RÓTULO. Encurtar 4.150 e 4.200 dá "4,2k" nos dois,
    // e aí a régua diz que dois traços diferentes valem o mesmo. Quando o encurtado
    // repete, todos voltam inteiros: é a mesma saída do rótulo de "de → para".
    var curtos = marcos.map(function(v){ return curto(v, e0.pa); });
    var repete = curtos.some(function(c, i){ return curtos.indexOf(c) !== i; });
    marcos.forEach(function(v, i){
      var yy = e0.y(v);
      grade += '<line class="gg" x1="' + esq + '" y1="' + yy.toFixed(1) +
               '" x2="' + (esq + larg) + '" y2="' + yy.toFixed(1) + '"/>';
      if (ss.length === 1)
        rot += '<text class="gt" x="' + (esq - 10) + '" y="' + (yy + 4).toFixed(1) +
               '" text-anchor="end">' + (repete ? n(v) : curtos[i]) + "</text>";
    });

    // O DEGRADE EMBAIXO DA CURVA E' DE TODAS AS SERIES, sempre. Eu tinha desligado ele
    // quando havia mais de uma, com medo de uma tampar a outra; o Gabriel viu isso como
    // o efeito sumindo ao escolher a segunda metrica, e ele tem razao. A saida certa nao
    // e' tirar o degrade, e' baixar a tinta dele quando ha' companhia: com duas ou mais,
    // ele entra pela metade da forca e as duas continuam se vendo.
    var forte = ss.length === 1 ? ".26" : ".13";
    var barras = "", marcas = "";

    // A LOGO DA SERIE, DENTRO DO DESENHO. Com uma linha por conta, legenda em texto
    // obriga a ir e voltar entre a fileira e a curva. O retrato na ponta resolve isso
    // de uma olhada. So' entra quando a serie traz `logo`.
    function selo(sr, cx, cy, k2){
      if (!sr.logo) return;
      // PRESA DENTRO DO PAPEL. Em cima da barra mais alta, ou na ponta de uma curva que
      // encosta no teto, o retrato saia pela borda e aparecia cortado ao meio.
      cx = Math.max(esq + 17, Math.min(cx, esq + larg - 17));
      cy = Math.max(topo + 17, Math.min(cy, topo + alt - 17));
      var id = (raiz.dataset.dados || "g") + "-selo" + k2;
      marcas += '<clipPath id="' + id + '"><circle cx="' + cx.toFixed(1) + '" cy="' +
        cy.toFixed(1) + '" r="13"/></clipPath>' +
        '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="14.5" fill="var(--branco)" style="stroke:' + sr.cor + '" stroke-width="2.5"/>' +
        '<image href="' + sr.logo + '" x="' + (cx - 13).toFixed(1) + '" y="' +
        (cy - 13).toFixed(1) + '" width="26" height="26" clip-path="url(#' + id + ')" ' +
        'preserveAspectRatio="xMidYMid slice"/>';
    }
    ss.forEach(function(s, k){
      var e = escala(s, alt, topo), u = s.vals.length - 1;
      s._e = e; s._u = u;
      if (barra){
        // O CHAO E' O ZERO, PRESO DENTRO DA FAIXA DA REGUA. Numa serie que cruza o zero
        // ele fica no meio e a barra desce; numa que nunca chega perto dele -- cem
        // milhoes de seguidores que andam mil por dia -- ele e' o pe' do desenho, e o
        // rotulo do eixo ali do lado diz de onde a barra esta' saindo. Forcar o zero
        // nesse caso desenharia sessenta blocos identicos.
        var chao = e.y(Math.min(Math.max(0, e.piso), e.teto));
        var ultimoX = null;
        for (var b = 0; b <= u; b++){
          ultimoX = x(b, s) + s._desl - lb * ss.length / 2 + k * lb + lb / 2;
          // COLUNA DE ZERO NAO VIRA TRACO. Com a altura minima de um pixel, os onze
          // meses sem publicacao desenhavam onze risquinhos em cima do eixo, e a linha
          // do zero virava tracejado.
          if (!s.vals[b][1]) continue;
          var yv = e.y(s.vals[b][1]);
          s._ultimaBarra = [x(b, s) + s._desl - lb * ss.length / 2 + k * lb + lb / 2,
                            Math.min(yv, chao)];
          barras += '<rect class="gb" style="fill:' + s.cor + '" x="' +
            (x(b, s) + s._desl - lb * ss.length / 2 + k * lb).toFixed(1) + '" y="' +
            Math.min(yv, chao).toFixed(1) + '" width="' + lb.toFixed(1) +
            '" height="' + Math.max(1, Math.abs(yv - chao)).toFixed(1) +
            '" rx="' + Math.min(2, lb / 3).toFixed(1) + '"/>';
        }
        if (s._ultimaBarra) selo(s, s._ultimaBarra[0], s._ultimaBarra[1] - 15, k);
        else if (ultimoX !== null) selo(s, ultimoX, chao - 15, k);
        return;
      }
      var d = "M" + x(0, s).toFixed(1) + "," + e.y(s.vals[0][1]).toFixed(1);
      for (var j = 1; j <= u; j++){
        var m = (x(j-1, s) + x(j, s)) / 2;
        d += " C" + m.toFixed(1) + "," + e.y(s.vals[j-1][1]).toFixed(1) +
             " " + m.toFixed(1) + "," + e.y(s.vals[j][1]).toFixed(1) +
             " " + x(j, s).toFixed(1) + "," + e.y(s.vals[j][1]).toFixed(1);
      }
      s._d = d;
      // O NOME DO DEGRADE PRECISA SER UNICO NA PAGINA INTEIRA, e nao dentro do cartao.
      // `url(#nome)` procura o nome no documento todo e para no primeiro que encontra:
      // com dois cartoes lado a lado, os dois chamavam "grd0-334" e o segundo pintava
      // com o degrade do primeiro. Mexer numa metrica da conta A repintava a conta B.
      // O nome do proprio grafico ja' carrega o codigo da publicacao, entao serve de raiz.
      var g = raiz.dataset.dados + "-grd" + k;
      defs += '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + s.cor + '" stop-opacity="' + forte + '"/>' +
        '<stop offset="100%" stop-color="' + s.cor + '" stop-opacity=".02"/>' +
        "</linearGradient>";
      areas += '<path class="ga" fill="url(#' + g + ')" d="' + d + " L" +
        x(u, s).toFixed(1) + "," + (topo + alt) + " L" + x(0, s).toFixed(1) + "," +
        (topo + alt) + ' Z"/>';
      curvas += '<path class="gl" style="stroke:' + s.cor + '" d="' + d + '"/>';
      var pt = u;
      while (pt > 0 && !s.vals[pt][1]) pt--;
      selo(s, x(pt, s), e.y(s.vals[pt][1]), k);
    });
    var fundo = "<defs>" + defs + "</defs>" + grade + areas + barras;

    // A REGUA DE DATAS CAI EM TEMPOS REDONDOS, e e' a mesma regua da linha do tempo:
    // uma unica funcao responde por ela nos dois desenhos.
    var i;
    // A REGUA SEGUE AS COLUNAS quando existem colunas: o rotulo fica debaixo da barra a
    // que pertence, e nao na borda esquerda dela.
    var serieCol = null;
    ss.forEach(function(s){ if (s._coluna && (!serieCol || s.vals.length > serieCol.vals.length)) serieCol = s; });
    if (temTempo && serieCol){
      // O NOME DA UNIDADE SAI DO TAMANHO DA COLUNA, e nao da janela: uma coluna de trinta
      // dias e' um mes, e escrever "01/08" nela e' escrever o primeiro dia dela no lugar
      // do nome do mes.
      var diasCol = serieCol._coluna / 86400000;
      var passoCol = diasCol >= 27 ? "mes" : diasCol >= 6 ? "semana"
                   : diasCol >= .9 ? "dia" : "hora";
      var caber = Math.max(1, Math.ceil(serieCol.vals.length /
                                        Math.max(2, larg / (larg < 480 ? 74 : 96))));
      serieCol.vals.forEach(function(v, j){
        if (j % caber) return;
        var px = x(j, serieCol) + (barra ? serieCol._desl : 0);
        if (px < esq - 1 || px > esq + larg + 1) return;
        var anc = px - esq < 22 ? "start" : (esq + larg - px < 22 ? "end" : "middle");
        rot += '<text class="gt" x="' + px.toFixed(1) + '" y="' + (A - 8) +
               '" text-anchor="' + anc + '">' +
               window.tempoUtil.marcaCurta(v[0], passoCol) + "</text>";
      });
    } else if (temTempo){
      window.tempoUtil.marcas(dt0, dt1, larg, larg < 480 ? 74 : 96)
        .forEach(function(m){
          var px = esq + folga + (larg - 2 * folga) * (m.t - dt0) / (dt1 - dt0);
          var anc = px - esq < 22 ? "start" : (esq + larg - px < 22 ? "end" : "middle");
          rot += '<text class="gt" x="' + px.toFixed(1) + '" y="' + (A - 8) +
                 '" text-anchor="' + anc + '">' + m.rot + "</text>";
        });
    } else {
      var salto = Math.max(1, Math.ceil(base.vals.length /
                                        Math.max(2, Math.floor(larg / 74))));
      for (i = 0; i <= ult; i += salto){
        var px2 = x(i), anc2 = px2 - esq < 22 ? "start"
                            : (esq + larg - px2 < 22 ? "end" : "middle");
        rot += '<text class="gt" x="' + px2.toFixed(1) + '" y="' + (A - 8) +
               '" text-anchor="' + anc2 + '">' + base.vals[i][0] + "</text>";
      }
    }

    var pontas = ss.map(function(s, k){
      return '<circle class="gponto" data-k="' + k + '" r="4" style="display:none;' +
             'stroke:' + s.cor + '"/>';
    }).join("");
    // O MESMO CINTO DE SEGURANCA DA LINHA DO TEMPO. A regua fica fora dele, porque
    // mora nas beiradas.
    var corte = (raiz.dataset.dados || "g") + "-corte";
    tela.innerHTML =
      '<svg width="' + L + '" height="' + A + '" viewBox="0 0 ' + L + ' ' + A + '">' +
      '<defs><clipPath id="' + corte + '"><rect x="' + (esq - 1) + '" y="' + (topo - 8) +
      '" width="' + (larg + 2) + '" height="' + (alt + 16) + '"/></clipPath></defs>' +
      '<g clip-path="url(#' + corte + ')">' + fundo + curvas + '</g>' + marcas + rot +
      '<line class="gcursor" x1="0" y1="' + topo + '" x2="0" y2="' + (topo + alt) +
        '" style="display:none"/>' + pontas + "</svg>";
    geo = {ss: ss, x: x, esq: esq, larg: larg, ult: ult, base: base};
  }

  // LARGURA NOVA, DESENHO NOVO. O SVG nasce com a largura da caixa; quando o menu abre
  // ou fecha, ou a janela muda, a caixa encolhe e o desenho velho fica maior que ela.
  if (window.ResizeObserver && !raiz._olho){
    var lg = Math.round(tela.clientWidth), esperando;
    raiz._olho = new ResizeObserver(function(){
      var novo = Math.round(tela.clientWidth);
      if (!novo || Math.abs(novo - lg) < 8) return;
      lg = novo;
      clearTimeout(esperando);
      esperando = setTimeout(function(){ if (raiz.redesenhar) raiz.redesenhar(); }, 120);
    });
    raiz._olho.observe(tela);
  }

  function esconder(){
    balao.hidden = true;
    var c = tela.querySelector(".gcursor");
    if (c) c.style.display = "none";
    [].forEach.call(tela.querySelectorAll(".gponto"), function(o){ o.style.display = "none"; });
  }

  // O CURSOR PROCURA POR PIXEL, e nao por posicao na lista. Com o eixo no tempo, a
  // posicao na lista deixou de dizer onde o ponto esta': duas series podem ter contagens
  // diferentes cobrindo o mesmo vao.
  function perto(s, px){
    var i = 0, melhor = Infinity;
    for (var j = 0; j < s.vals.length; j++){
      var dx = Math.abs(geo.x(j, s) - px);
      if (dx < melhor){ melhor = dx; i = j; }
    }
    return i;
  }
  function mover(ev){
    if (!geo) return;
    var r = tela.getBoundingClientRect();
    var px = ev.clientX - r.left;
    var i = perto(geo.base, px);
    var vx = geo.x(i);
    var c = tela.querySelector(".gcursor");
    c.setAttribute("x1", vx); c.setAttribute("x2", vx); c.style.display = "";
    var linhas = "";
    geo.ss.forEach(function(s, k){
      var j = perto(s, vx);
      var o = tela.querySelector('.gponto[data-k="' + k + '"]');
      o.setAttribute("cx", geo.x(j, s)); o.setAttribute("cy", s._e.y(s.vals[j][1]));
      o.style.display = "";
      linhas += '<div class="glinha"><span class="gdot" style="background:' + s.cor +
                '"></span><span class="gnome">' + s.rot + '</span>' +
                '<span class="gval">' + n(s.vals[j][1]) + "</span></div>";
    });
    balao.innerHTML = '<div class="glabel">' + quando(geo.base.vals[i][0]) + "</div>" + linhas;
    balao.hidden = false;
    var lb = balao.offsetWidth, esq2 = vx + 14;
    if (esq2 + lb > r.width) esq2 = vx - lb - 14;
    balao.style.left = Math.max(0, esq2) + "px";
    balao.style.top = Math.max(0, (ev.clientY - r.top) - balao.offsetHeight - 14) + "px";
  }

  function pintarAbas(){
    abas.forEach(function(b){
      b.setAttribute("aria-selected", ligadas.indexOf(b.dataset.k) >= 0 ? "true" : "false");
    });
  }

  abas.forEach(function(b){
    b.addEventListener("click", function(){
      if (b.disabled) return;
      var k = b.dataset.k, i = ligadas.indexOf(k);
      // CLICAR SOMA E TIRA, e nao troca. E' o que permite comparar duas curvas no mesmo
      // desenho. A ultima escolhida nao sai: um grafico sem serie nenhuma nao existe.
      if (i >= 0){ if (ligadas.length > 1) ligadas.splice(i, 1); }
      else {
        // UMA METRICA QUE E' A SOMA DAS OUTRAS NAO DIVIDE O DESENHO COM ELAS. Engajamento
        // e' curtida mais comentario, e comentario e' um por cento do total: desenhado ao
        // lado de curtidas, ele vira uma segunda curva colada na primeira dizendo a mesma
        // coisa duas vezes, e foi o que o Gabriel viu como "nao traz". Escolher a soma
        // apaga as partes, e escolher uma parte apaga a soma.
        var nova = serie(k);
        if (nova && nova.sozinha) ligadas = [k];
        else {
          ligadas = ligadas.filter(function(x){
            var s = serie(x);
            return !(s && s.sozinha);
          });
          ligadas.push(k);
        }
      }
      pintarAbas();
      desenhar();
    });
  });
  tela.addEventListener("mousemove", mover);
  tela.addEventListener("mouseleave", esconder);
  raiz.redesenhar = desenhar;
  var antes = "";
  new ResizeObserver(function(){
    var m = Math.round(tela.clientWidth) + "x" + Math.round(tela.clientHeight);
    if (tela.clientWidth && m !== antes){ antes = m; desenhar(); }
  }).observe(tela);
  pintarAbas();
  desenhar();
};
(function(){
  var num = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
  function seguro(s){
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
             .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var PERFIS = [];
  function carregarPerfis(){
    if (PERFIS.length) return Promise.resolve(PERFIS);
    return fetch("perfis", {cache: "no-store"})
      .then(function(r){ return r.ok ? r.json() : {perfis: []}; })
      .then(function(j){ PERFIS = j.perfis || []; return PERFIS; })
      .catch(function(){ return PERFIS; });
  }
  function metaDe(u){
    var p = null;
    PERFIS.forEach(function(x){ if (x.u === u) p = x; });
    return {nome: (p && p.nome) || "", etqs: (p && p.tags) || [],
            nicho: (p && p.nicho) || "", taxa: Number(p && p.taxa) || 0,
            avatar: (p && p.avatar) || ""};
  }

  // ------------------------------------------------------------------ perfil
  //
  // A PAGINA DE UMA CONTA SO'. O acervo fundo dela nao viaja com a pagina: ele e' pedido
  // na rota "conta" no momento em que o perfil abre. E' o que permite a aba continuar
  // leve com o acervo crescendo, e e' o mesmo desenho que ja' vale para as miniaturas.
  var onde = document.getElementById("pf-conteudo");

  // ============================================================ O PERFIL, EM DUAS COLUNAS
  //
  // A PLANTA QUE O GABRIEL APROVOU em 14/08. Duas colunas de propósito:
  //
  //   ESQUERDA, que não rola: quem é a conta, o veredito, os três números que mandam e a
  //   saúde da coleta. É o contexto, e contexto que sai de vista faz a pessoa esquecer de
  //   quem era o perfil no meio do mergulho.
  //
  //   DIREITA, que rola e ela mesma se divide em duas: o mergulho, bloco a bloco.
  //
  // A RÉGUA DE CONTEÚDO É "UM DADO, UM LUGAR". O desenho anterior repetia seguidores em
  // três lugares, transformava formato em tabela e punha um subtítulo explicando o óbvio
  // debaixo de cada bloco. Aqui, se o gráfico já diz, não tem frase repetindo; e se um
  // número já aparece dentro de um bloco, ele não vira cartão também.

  // O MOLDE DE GRAFICO COM EIXO SAIU EM 15/08, junto com o cartao que o usava.
  // A faixa de numeros passou a usar o cartao do painel, onde o desenho e' o FUNDO
  // do cartao e nao tem eixo escrito: e' o que permite o grafico ser grande sem o
  // cartao ser grande. Os outros blocos do perfil (linha do tempo, curva de vida,
  // ritmo e formatos) sempre desenharam o proprio SVG, entao ninguem mais o chamava.

  function _dia(iso){
    if (!iso) return "—";
    return iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(2, 4);
  }

  // AS PUBLICACOES CONTADAS POR SEMANA, ancoradas na PRIMEIRA PUBLICACAO do acervo, e nao
  // no dia em que o monitoramento comecou. A ancora errada estraga contas novas: a NASA
  // tem duas semanas de coleta e meses de publicacao, e contar a partir do cadastro dava
  // uma semana so', ou seja, ponto nenhum para desenhar.
  //
  // Semana sem publicacao entra como zero, e nao sai da serie: buraco omitido vira linha
  // reta e mente sobre a constancia da conta.
  // O PONTO DA SERIE E' [rotulo cheio, valor, instante]. O rotulo cheio vai para a caixa
  // de valores e pode ser longo; o instante vai cru, em ISO, porque quem decide como
  // escrever a data embaixo do eixo e' o desenho, que e' quem conhece o vao da serie.
  function ponto(iso, v){
    return [_dia(iso) + (iso.slice(11, 16) ? " · " + iso.slice(11, 16) : ""), v, iso];
  }

  // ------------------------------------------------------------------ 1. linha do tempo
  //
  // O BLOCO PRINCIPAL DO PERFIL, com a linha inteira para ele. Ele funde num eixo de tempo
  // unico: quantos seguidores ela tinha, quanta gente entrou e saiu em cada janela, e
  // quando ela publicou -- separando o que estourou do que foi normal.
  //
  // A DINAMICA E' A MESMA DOS CARTOES DE CIMA: uma fileira de abas, cada uma com o total
  // da sua metrica, e clicar SOMA ou TIRA aquela camada do desenho. Sem isso o desenho
  // obrigava a ver tudo de uma vez, inclusive a barra de quem nao veio ver barra.
  //
  // O DESENHO USA O MESMO VOCABULARIO do `chart.tsx` do shadcn, ja' traduzido no cartao
  // de destaque, e as MESMAS CLASSES (.gaba, .gg, .gt, .gl, .ga, .gcursor, .gponto,
  // .grafico-balao): um ajuste de estilo pega os dois desenhos.
  //
  // O QUE CONTA COMO ESTOURO NAO E' DECIDIDO AQUI. Cada publicacao chega marcada do
  // `fundo.py`, pela regua do `analise.py`: escore z modificado sobre a mediana e o MAD
  // da propria conta, so' contra publicacoes maduras do mesmo formato.
  var TU = window.tempoUtil;

  // O DOMINIO DA JANELA, em milissegundos.
  //
  // O FIM E' O INSTANTE MAIS RECENTE QUE O SISTEMA CONHECE desta conta, e nao "agora": a
  // coleta roda em ciclos, e ancorar em agora empurraria o desenho inteiro para a
  // esquerda entre uma coleta e a seguinte, sem que nada tivesse mudado.
  //
  // O COMECO SAI DO PERIODO CLICADO, e nao do primeiro dado que houver. Era esse o
  // defeito: numa conta com cinco dias de leitura, 30, 90, 180 e 365 dias desenhavam
  // exatamente a mesma coisa, porque o vao dos dados era o mesmo nos quatro. Agora
  // noventa dias desenha noventa dias, e o pedaco sem medida fica vazio -- que e' a
  // resposta certa, e a barra de periodo ja' diz quantos dias existem de verdade.
  function dominioDaJanela(d, rec, janela){
    function instantes(o){
      var qs = [];
      (o.curva || []).forEach(function(p){ if (p[1]) qs.push(Date.parse(p[0])); });
      (o.posts || []).forEach(function(p){ qs.push(Date.parse(p.quando)); });
      return qs.filter(function(v){ return !isNaN(v); });
    }
    var todos = instantes(d);
    if (!todos.length) return null;
    var fim = Math.max.apply(null, todos);
    // A JANELA COMECA NO INICIO DE UMA COLUNA INTEIRA. Um ano contado como "hoje menos
    // 365 dias" comeca em 15/08/25, no meio de agosto: a marca de mes cai no dia 1o,
    // entao agosto do ano passado aparecia no desenho sem nome nenhum. Puxando o comeco
    // para o dia 1o, a volta fecha de ago/25 a ago/26 e as duas pontas se leem.
    // O VAO COBRE COLUNAS INTEIRAS, DAS DUAS PONTAS.
    //
    // O carimbo de uma coluna e' o COMECO dela: agosto e' "01/08". Terminando o desenho na
    // ultima leitura, dia 15, a coluna de agosto ficava com metade do lugar dela no papel
    // e a barra saia pela borda direita. Terminando no fim da coluna, ela cabe inteira, e
    // o pedaco do mes que ainda nao aconteceu fica vazio, que e' a verdade.
    function janelaDe(dias){
      var passo = TU.balde(dias).passo;
      var ini = Date.parse(TU.inicio(fim - dias * 86400000, passo));
      var fimCol = Date.parse(TU.proximo(TU.inicio(fim, passo), passo));
      return [isNaN(ini) ? fim - dias * 86400000 : ini, isNaN(fimCol) ? fim : fimCol];
    }
    if (janela) return janelaDe(janela);
    var seus = instantes(rec);
    if (seus.length < 2) return janelaDe(1);
    var de = Math.min.apply(null, seus);
    return janelaDe(Math.max(1, (fim - de) / 86400000));
  }

  function tlPasso(bruto){
    if (!(bruto > 0)) return 1;
    var m = Math.pow(10, Math.floor(Math.log(bruto) / Math.LN10)), r = bruto / m;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * m;
  }
  // A CASA DECIMAL SAI DO PASSO DA REGUA, e nao do valor: uma conta de cem milhoes que
  // anda cinquenta mil por leitura tem a regua inteira dentro da mesma primeira casa.
  function tlCurto(v, pa){
    var s = v < 0 ? "-" : "";
    v = Math.abs(v);
    pa = Math.abs(pa) || v || 1;
    function corta(x, base){
      var casas = Math.max(0, Math.min(3, Math.ceil(-Math.log(pa / base) / Math.LN10)));
      return (x / base).toFixed(casas).replace(".", ",").replace(/,0+$/, "");
    }
    if (v >= 1e6) return s + corta(v, 1e6) + "M";
    if (v >= 1e3) return s + corta(v, 1e3) + "k";
    return s + num(Math.round(v));
  }
  function tlDia(iso){ return iso.slice(8, 10) + "/" + iso.slice(5, 7); }
  function tlDiaLongo(iso){ return tlDia(iso) + "/" + iso.slice(2, 4); }

  var TL_SINAL = {
    estouro: "estourou",
    recorde: "recorde da conta",
    queda:   "abaixo do normal dela"
  };

  function montarLinhaDoTempo(onde2, rec, janela, tudo){
    var curva = (rec.curva || []).filter(function(p){ return p[1]; });
    var posts = (rec.posts || []).slice().sort(function(a, b){
      return (a.quando || "").localeCompare(b.quando || ""); });

    if (curva.length < 2 && !posts.length){
      onde2.innerHTML = '<div class="pf-tl"><p class="grafico-sem">a linha do tempo ' +
        'nasce com a segunda leitura desta conta. Nesta janela ainda não há duas.</p>' +
        '</div>';
      return;
    }

    // ---- o vao. E' a UNIAO da curva com as publicacoes, e nao so' a da curva.
    //
    // O acervo guarda meses de publicacao e a curva guarda as ultimas leituras. Preso ao
    // vao da curva, o desenho jogaria fora toda publicacao anterior a ela -- e "quando ela
    // estourou" e' uma pergunta sobre o passado. Preso ao das publicacoes, a curva seria
    // esticada por cima de um tempo em que ninguem mediu nada. Entao: vao da uniao, curva
    // desenhada SO' onde existe, e uma palavra dizendo desde quando ha' leitura.
    var dom = dominioDaJanela(tudo || rec, rec, janela);
    var t0 = dom[0], t1 = dom[1];
    if (!(t1 > t0)) t1 = t0 + 3600000;
    var vaoDias = janela || (t1 - t0) / 86400000;
    var balde = TU.balde(vaoDias);
    var colunas = TU.grade(t0, t1, balde.passo);

    // ---- as camadas, cada uma no balde da janela
    var viradas = [];
    curva.forEach(function(p, i){
      if (i) viradas.push([p[0], p[1] - curva[i - 1][1]]);
    });
    // AS TRES SERIES COBREM TODAS AS COLUNAS DA JANELA, inclusive as vazias: sem elas,
    // uma conta que so' publicou numa terca teria uma coluna so' no meio de trinta dias
    // de nada, e o desenho diria que a janela inteira e' aquela terca.
    var vEntrou = TU.somar(viradas.filter(function(p){ return p[1] > 0; }),
                           balde.passo, colunas);
    var vSaiu = TU.somar(viradas.filter(function(p){ return p[1] < 0; })
      .map(function(p){ return [p[0], -p[1]]; }), balde.passo, colunas);
    var vPub = TU.somar(posts.map(function(p){ return [p.quando, 1]; }),
                        balde.passo, colunas);
    var estouros = posts.filter(function(p){
      return p.sinal && p.sinal !== "queda"; });

    var somaE = vEntrou.reduce(function(a, p){ return a + p[1]; }, 0);
    var somaS = vSaiu.reduce(function(a, p){ return a + p[1]; }, 0);
    var seg = curva.length ? curva[curva.length - 1][1] : 0;
    var segDia = {};
    curva.forEach(function(p){ segDia[TU.inicio(p[0], balde.passo)] = p[1]; });

    var CAMADAS = [
      {k: "seguidores", cor: "var(--chart-2)", total: curva.length ? kCurto(seg) : "—",
       tem: curva.length > 1, on: true},
      {k: "entraram", cor: "var(--chart-1)", total: somaE ? "+" + num(somaE) : "—",
       tem: somaE > 0, on: true},
      {k: "saíram", cor: "var(--chart-5)", total: somaS ? "−" + num(somaS) : "—",
       tem: somaS > 0, on: true},
      {k: "publicações", cor: "var(--soft)", total: num(posts.length),
       tem: posts.length > 0, on: true},
      {k: "estouraram", cor: "var(--chart-3)", total: num(estouros.length),
       tem: estouros.length > 0, on: true}
    ];
    var ligadas = {};
    CAMADAS.forEach(function(c){ ligadas[c.k] = c.on && c.tem; });

    var abas = CAMADAS.map(function(c){
      return '<button type="button" class="gaba" data-k="' + c.k + '" role="tab"' +
        ' style="--cor-serie:' + c.cor + '"' +
        ' aria-selected="' + (ligadas[c.k] ? "true" : "false") + '"' +
        (c.tem ? "" : " disabled") + '><span>' + c.k + '</span><b>' +
        c.total + '</b></button>';
    }).join("");

    // ELA MORA NA MESMA CAIXA DOS OUTROS BLOCOS. Entregue crua, ela era o unico bloco da
    // pagina sem fundo e sem borda, e parecia solta no meio do papel.
    onde2.innerHTML =
      '<div class="pf-cx pf-tl grafico">' +
        '<div class="pf-tl-topo"><span class="pf-tl-uni">cada coluna é <b>' +
          balde.uni + '</b></span></div>' +
        '<div class="grafico-abas pf-tl-abas" role="tablist">' + abas + '</div>' +
        '<div class="grafico-tela pf-tl-tela"></div>' +
        '<div class="grafico-balao" hidden></div>' +
        '<div class="tl-card" hidden></div>' +
        '<div class="pf-tl-pe"><span class="pf-tl-reg">' + REGRA_ESTOURO +
          '</span><span class="pf-tl-av"></span></div>' +
      '</div>';

    var raiz  = onde2.querySelector(".pf-tl"),
        tela  = raiz.querySelector(".grafico-tela"),
        balao = raiz.querySelector(".grafico-balao"),
        card  = raiz.querySelector(".tl-card"),
        aviso = raiz.querySelector(".pf-tl-av");

    if (curva.length > 1 && Date.parse(curva[0][0]) - t0 > (t1 - t0) * .06)
      aviso.innerHTML = 'leitura de seguidores só desde <b>' +
                        tlDiaLongo(curva[0][0]) + '</b>';

    var geo = null, grupos = [];

    function desenhar(){
      var L = Math.max(360, Math.round(tela.clientWidth));
      var A = Math.max(280, Math.round(tela.clientHeight) || 340);
      // A TIRA DAS PUBLICACOES E' UMA FAIXA PROPRIA, embaixo da area e em cima da regua de
      // datas: dentro da area, o traco encostaria na curva e os dois pareceriam a mesma
      // coisa. Quando ninguem pediu publicacao, a tira nao existe e a area cresce.
      var comTira = ligadas["publicações"] || ligadas["estouraram"];
      var esq = 68, dir = 20, topo = 18, TIRA = comTira ? 22 : 0, PE = 30;
      var larg = L - esq - dir, alt = A - topo - TIRA - PE;
      var yTira = topo + alt;
      var X = function(iso){
        return esq + larg * (Date.parse(iso) - t0) / (t1 - t0);
      };

      // ---- quanto sobe e quanto desce, antes da regua: e' o que decide onde fica o zero
      var temE = ligadas.entraram && somaE > 0, temS = ligadas["saíram"] && somaS > 0;
      var maiorE = 0, maiorS = 0;
      if (temE) vEntrou.forEach(function(p){ maiorE = Math.max(maiorE, p[1]); });
      if (temS) vSaiu.forEach(function(p){ maiorS = Math.max(maiorS, p[1]); });

      // ---- a regua da esquerda. Ela e' a de SEGUIDORES quando seguidores esta' no ar;
      // sem ele, e' a das barras, que passam a ser o assunto do desenho -- e ai' ela
      // desce abaixo do zero, porque quem saiu desce.
      // `partes` e' o que entra no corte; `regua` e' o que fica fora dele, nas beiradas:
      // o numero da esquerda e a data de baixo moram fora da area do desenho.
      var partes = [], regua = [], i;
      var vals = curva.map(function(p){ return p[1]; });
      var lo, hi;
      if (ligadas.seguidores && vals.length){
        lo = Math.min.apply(null, vals); hi = Math.max.apply(null, vals);
      } else {
        lo = -maiorS; hi = maiorE || 1;
      }
      if (hi === lo){ hi = lo + 1; lo = Math.max(0, lo - 1); }
      // QUATRO DIVISOES, E NAO TRES. Com tres, uma faixa de 158 mil pedia passo de 53 mil
      // e o arredondamento para cima levava a 100 mil: a regua ia de -100k a 200k para
      // medir uma perda de 6,8 mil. Com quatro, o passo cai para 50 mil e a regua encosta
      // no que existe.
      var pa = tlPasso((hi - lo) / 4);
      var piso = Math.floor(lo / pa) * pa, teto = Math.ceil(hi / pa) * pa;
      if (teto <= piso) teto = piso + pa;
      var Y = function(v){ return topo + alt - alt * (v - piso) / (teto - piso); };
      for (var v = piso; v <= teto + pa * 1e-9; v += pa){
        partes.push('<line class="gg' + (Math.abs(v) < pa * 1e-9 ? " zero" : "") +
                    '" x1="' + esq + '" y1="' + Y(v).toFixed(1) +
                    '" x2="' + (esq + larg) + '" y2="' + Y(v).toFixed(1) + '"/>');
        regua.push('<text class="gt" x="' + (esq - 10) + '" y="' + (Y(v) + 4).toFixed(1) +
                   '" text-anchor="end">' + tlCurto(v, pa) + '</text>');
      }

      // ---- o balanco do periodo: QUEM ENTRA SOBE, QUEM SAI DESCE.
      //
      // Lado a lado, entrada e saida eram duas barras que subiam do mesmo chao e a saida
      // parecia mais um ganho. Com o zero no meio, o desenho vira um balanco: da' para
      // ver de relance a semana em que sairam mais do que entraram.
      if (temE || temS){
        // COM A CURVA NO AR AS BARRAS SAO PANO DE FUNDO e ficam no terco de baixo, com
        // regua propria; sem ela, sao o assunto e usam a regua da esquerda.
        var Yb;
        if (ligadas.seguidores){
          var faixaB = alt * .34, fimB = topo + alt, iniB = fimB - faixaB;
          var total = (maiorE + maiorS) || 1;
          var zeroB = maiorS > 0 ? iniB + faixaB * maiorE / total : fimB;
          Yb = function(g){
            return g >= 0 ? zeroB - (zeroB - iniB) * (g / (maiorE || 1))
                          : zeroB + (fimB - zeroB) * (-g / (maiorS || 1));
          };
          partes.push('<line class="tl-zero" x1="' + esq + '" y1="' + zeroB.toFixed(1) +
                      '" x2="' + (esq + larg) + '" y2="' + zeroB.toFixed(1) + '"/>');
        } else {
          Yb = Y;
        }
        var zeroL = Yb(0);
        var lb = Math.max(1.5, Math.min(38, larg / Math.max(1, colunas.length) * .72));
        [[temE ? vEntrou : [], 1, "ent"], [temS ? vSaiu : [], -1, "sai"]]
          .forEach(function(par){
            par[0].forEach(function(p){
              if (!p[1]) return;
              // O CARIMBO E' O COMECO DA COLUNA: a barra fica no meio dela, entre o
              // carimbo e o proximo. Centrada no carimbo, metade da barra de agosto
              // cairia dentro de julho.
              var x = X(p[0]) + meiaVaga(balde.passo, p[0], X) - lb / 2;
              if (x + lb < esq || x > esq + larg) return;
              var y = Yb(p[1] * par[1]);
              partes.push('<rect class="tl-b ' + par[2] + '" x="' + x.toFixed(1) +
                '" y="' + Math.min(y, zeroL).toFixed(1) + '" width="' + lb.toFixed(1) +
                '" height="' + Math.max(2, Math.abs(y - zeroL)).toFixed(1) +
                '" rx="' + Math.min(2, lb / 3).toFixed(1) + '"/>');
            });
          });
      }

      // ---- a curva de seguidores, suave, com area em degrade, so' onde houve leitura
      if (ligadas.seguidores && curva.length > 1){
        var d = "M" + X(curva[0][0]).toFixed(1) + "," + Y(curva[0][1]).toFixed(1);
        for (i = 1; i < curva.length; i++){
          var m = (X(curva[i - 1][0]) + X(curva[i][0])) / 2;
          d += " C" + m.toFixed(1) + "," + Y(curva[i - 1][1]).toFixed(1) +
               " " + m.toFixed(1) + "," + Y(curva[i][1]).toFixed(1) +
               " " + X(curva[i][0]).toFixed(1) + "," + Y(curva[i][1]).toFixed(1);
        }
        partes.push('<defs><linearGradient id="tl-grd" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="var(--chart-2)" stop-opacity=".24"/>' +
          '<stop offset="100%" stop-color="var(--chart-2)" stop-opacity=".02"/>' +
          '</linearGradient></defs>');
        partes.push('<path class="ga" fill="url(#tl-grd)" d="' + d + ' L' +
          X(curva[curva.length - 1][0]).toFixed(1) + ',' + (topo + alt) + ' L' +
          X(curva[0][0]).toFixed(1) + ',' + (topo + alt) + ' Z"/>');
        partes.push('<path class="gl tl-seg" d="' + d + '"/>');
      }

      // ---- a tira das publicacoes
      //
      // CADA MARCA E' UM ALVO. Antes so' a bolinha do estouro abria cartao, e as outras
      // cinquenta e cinco publicacoes eram risco sem nome. AS QUE CAEM NO MESMO PONTO DO
      // PAPEL viram um alvo so': numa janela de um ano, dez publicacoes da mesma semana
      // ocupam o mesmo pixel, e dez alvos empilhados no mesmo lugar nao sao dez alvos.
      grupos = [];
      if (comTira){
        partes.push('<line class="tl-base" x1="' + esq + '" y1="' + yTira + '" x2="' +
                    (esq + larg) + '" y2="' + yTira + '"/>');
        var porPonto = {};
        posts.forEach(function(p, j){
          var forte = p.sinal && p.sinal !== "queda";
          if (forte ? !ligadas["estouraram"] : !ligadas["publicações"]) return;
          var x = X(p.quando);
          if (x < esq - 2 || x > esq + larg + 2) return;
          var ch = Math.round(x / 6);
          var g = porPonto[ch];
          if (!g){ g = porPonto[ch] = {x: x, itens: [], forte: false}; grupos.push(g); }
          g.itens.push(j);
          if (forte){ g.forte = true; g.x = x; }
        });
        grupos.forEach(function(g, k){
          partes.push('<line class="tl-p' + (g.forte ? " forte" : "") + '" x1="' +
            g.x.toFixed(1) + '" y1="' + (yTira + 3) + '" x2="' + g.x.toFixed(1) +
            '" y2="' + (yTira + (g.forte ? 17 : 11)) + '"/>');
          // A ZONA DE TOQUE E' MAIOR QUE O TRACO: um risco de tres pixels e' alvo de
          // mira, e nao de mouse.
          partes.push('<rect class="tl-alvo" data-g="' + k + '" x="' +
            (g.x - 5).toFixed(1) + '" y="' + (yTira - 2) + '" width="10" height="' +
            (TIRA + 2) + '"/>');
          var p = posts[g.itens[0]];
          if (g.forte && ligadas.seguidores && curva.length > 1 &&
              Date.parse(p.quando) >= Date.parse(curva[0][0]) &&
              Date.parse(p.quando) <= Date.parse(curva[curva.length - 1][0])){
            var yv = Y(segDia[TU.inicio(p.quando, balde.passo)] || lo);
            partes.push('<line class="tl-sobe" x1="' + g.x.toFixed(1) + '" y1="' +
              yv.toFixed(1) + '" x2="' + g.x.toFixed(1) + '" y2="' + yTira + '"/>');
            partes.push('<circle class="tl-bola" data-g="' + k + '" cx="' +
              g.x.toFixed(1) + '" cy="' + yv.toFixed(1) + '" r="' +
              (p.sinal === "recorde" ? 5.5 : 4.5) + '"/>');
          }
        });
      }

      // ---- a regua de datas. Ela mora FORA do corte, porque fica embaixo do desenho.
      //
      // A MARCA CAI NO MEIO DA COLUNA, e nao no comeco dela. O carimbo de agosto e'
      // "01/08"; escrito ali, o rotulo fica na borda esquerda do mes e a barra, que ocupa
      // o meio, aparece sem nenhuma data embaixo. Usando as proprias colunas como marca,
      // cada rotulo fica exatamente debaixo da sua coluna.
      var caber = Math.max(1, Math.ceil(colunas.length / Math.max(2, larg / 104)));
      colunas.forEach(function(k, j){
        if (j % caber) return;
        var px = X(k) + meiaVaga(balde.passo, k, X);
        if (px < esq - 1 || px > esq + larg + 1) return;
        var anc = px - esq < 26 ? "start" : (esq + larg - px < 26 ? "end" : "middle");
        regua.push('<text class="gt" x="' + px.toFixed(1) + '" y="' + (A - 8) +
                   '" text-anchor="' + anc + '">' +
                   TU.marcaCurta(k, balde.passo) + '</text>');
      });
      // A LINHA QUE SEPARA UMA COLUNA DA OUTRA, quando ha' poucas: com doze meses no
      // papel, ela e' o que mostra onde agosto comeca e onde termina.
      if (colunas.length <= 40)
        colunas.forEach(function(k, j){
          if (!j) return;
          var px = X(k);
          partes.push('<line class="tl-div" x1="' + px.toFixed(1) + '" y1="' + topo +
                      '" x2="' + px.toFixed(1) + '" y2="' + (topo + alt) + '"/>');
        });

      partes.push('<line class="gcursor" x1="0" y1="' + topo + '" x2="0" y2="' +
                  (yTira + (comTira ? 18 : 0)) + '" style="display:none"/>');
      partes.push('<circle class="gponto tl-cur" r="4.5" style="display:none"/>');

      // O CORTE E' O CINTO DE SEGURANCA. Uma barra larga na ponta, uma curva que sobe
      // depois da ultima marca ou um ponto meio pixel fora ja' vazaram por cima da borda
      // do cartao; com o corte, o que nasce fora do quadro simplesmente nao aparece.
      tela.innerHTML = '<svg width="' + L + '" height="' + A + '" viewBox="0 0 ' + L +
        ' ' + A + '"><defs><clipPath id="tl-corte"><rect x="' + (esq - 1) + '" y="' +
        (topo - 8) + '" width="' + (larg + 2) + '" height="' +
        (yTira + TIRA + 10 - topo) + '"/></clipPath></defs>' +
        '<g clip-path="url(#tl-corte)">' + partes.join("") + '</g>' +
        regua.join("") + '</svg>';
      geo = {esq: esq, larg: larg, topo: topo, alt: alt, Y: Y, X: X, A: A};
      ligarBolinhas();
    }

    // ---------------------------------------------------------- o cartao da publicacao
    //
    // E' o UNICO elemento com cartao proprio, e e' de proposito: as outras camadas sao
    // numeros de uma janela, e o balao do cursor da' conta delas. Uma publicacao e' uma
    // coisa, tem capa, tem endereco e da' para abrir.
    var sumir = null;
    function fecharCartao(){ card.hidden = true; }
    function ligarBolinhas(){
      [].forEach.call(tela.querySelectorAll("[data-g]"), function(b){
        b.addEventListener("pointerenter", function(){
          clearTimeout(sumir);
          var g = grupos[+b.dataset.g];
          if (!g) return;
          balao.hidden = true;
          card.innerHTML = cartaoDoGrupo(g);
          card.hidden = false;
          var r = tela.getBoundingClientRect();
          var bx = g.x, by = b.tagName === "circle" ? +b.getAttribute("cy")
                                                    : (+b.getAttribute("y") + 10);
          // O CARTAO FICA AO LADO DA BOLINHA, e nao em cima dela. Centrado por cima,
          // ele cobre o proprio ponto que o abriu: o cursor perde o alvo e o cartao
          // pisca. Ao lado, o caminho do mouse ate' o botao passa por dentro dele.
          var lg = card.offsetWidth, la = card.offsetHeight;
          var esq2 = bx + 16;
          if (esq2 + lg > r.width) esq2 = bx - lg - 16;
          card.style.left = Math.max(2, esq2).toFixed(1) + "px";
          card.style.top = Math.max(2, Math.min(r.height - la - 2,
                                               by - la / 2)).toFixed(1) + "px";
        });
        b.addEventListener("pointerleave", function(){
          sumir = setTimeout(fecharCartao, 260);
        });
      });
    }
    card.addEventListener("pointerenter", function(){ clearTimeout(sumir); });
    card.addEventListener("pointerleave", fecharCartao);

    function cartaoDoGrupo(g){
      var itens = g.itens.slice(0, 4);
      var cabeca = g.itens.length > 1
        ? '<div class="tl-card-n">' + num(g.itens.length) + ' publicações neste ponto' +
          (g.itens.length > 4 ? ' · as 4 primeiras' : "") + '</div>' : "";
      return cabeca + itens.map(function(j){
        return umaPublicacao(posts[j]);
      }).join("");
    }

    function umaPublicacao(p){
      var rot = TL_SINAL[p.sinal] || "";
      return '<a class="tl-card-in" href="https://www.instagram.com/p/' + seguro(p.sc) +
        '/" target="_blank" rel="noopener">' +
        '<div class="tl-card-capa"><img src="img?sc=' + seguro(p.sc) + '" alt="" ' +
          'loading="lazy" decoding="async" onerror="this.remove()"></div>' +
        '<div class="tl-card-txt">' +
          (rot ? '<b class="tl-card-sin">' + rot +
            (p.mult ? ' · ' + vg(p.mult, 1) + 'x o normal dela' : "") + '</b>' : "") +
          '<span>' + seguro(p.fmt) + ' · ' + tlDiaLongo(p.quando) + ' às ' +
            p.quando.slice(11, 16) + '</span>' +
          '<span><b>' + num(p.eng || 0) + '</b> de engajamento' +
            (p.views ? ' · <b>' + num(p.views) + '</b> reproduções' : "") + '</span>' +
          '<span class="tl-card-ir">Abrir no Instagram' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-seta"/></svg>' +
          '</span>' +
        '</div></a>';
    }

    // ------------------------------------------------------------------------ o cursor
    function esconder(){
      balao.hidden = true;
      var c = tela.querySelector(".gcursor"), o = tela.querySelector(".tl-cur");
      if (c) c.style.display = "none";
      if (o) o.style.display = "none";
    }

    // O CURSOR ANDA DE BALDE EM BALDE, que e' a unidade do desenho naquela janela: numa
    // de um ano ele para em cima de um mes, e numa de sete dias, de um dia.
    // O CURSOR SEGUE O MOUSE, e nao salta de coluna em coluna.
    //
    // Preso ao centro da coluna, numa janela de um ano ele pulava um mes inteiro por vez:
    // entre um salto e outro nao havia como parar em nada. Agora a guia acompanha o
    // ponteiro, os numeros sao os da coluna que esta' debaixo dele, e o ponto da curva
    // cai na leitura mais proxima daquele instante.
    function mover(ev){
      if (!geo || !card.hidden) return;
      var r = tela.getBoundingClientRect();
      var px = Math.max(geo.esq, Math.min(geo.esq + geo.larg, ev.clientX - r.left));
      var quando = t0 + (px - geo.esq) / geo.larg * (t1 - t0);
      var chave = TU.inicio(quando, balde.passo);

      var c = tela.querySelector(".gcursor");
      c.setAttribute("x1", px.toFixed(1)); c.setAttribute("x2", px.toFixed(1));
      c.style.display = "";

      var linhas = [], bola = tela.querySelector(".tl-cur");
      // A LEITURA MAIS PROXIMA DAQUELE INSTANTE, e nao a da coluna: dentro de um mes de
      // coluna ha' mil e quatrocentas leituras, e o ponto tem que cair na do cursor.
      var melhor = null, dist = Infinity;
      curva.forEach(function(p){
        var dx = Math.abs(Date.parse(p[0]) - quando);
        if (dx < dist){ dist = dx; melhor = p; }
      });
      if (ligadas.seguidores && melhor && dist <= (t1 - t0) / 40){
        bola.setAttribute("cx", geo.X(melhor[0]).toFixed(1));
        bola.setAttribute("cy", geo.Y(melhor[1]).toFixed(1));
        bola.style.display = "";
        linhas.push(tlLinha("var(--chart-2)", "seguidores", num(melhor[1])));
      } else {
        bola.style.display = "none";
        if (ligadas.seguidores)
          linhas.push(tlLinha("var(--soft)", "seguidores", "sem leitura aqui"));
      }
      if (ligadas.entraram) linhas.push(tlLinha("var(--chart-1)", "entraram",
        "+" + num(acheNoBalde(vEntrou, chave))));
      if (ligadas["saíram"]) linhas.push(tlLinha("var(--chart-5)", "saíram",
        "−" + num(acheNoBalde(vSaiu, chave))));
      if (ligadas["publicações"] || ligadas["estouraram"]){
        var q = acheNoBalde(vPub, chave);
        var qe = posts.filter(function(p){
          return p.sinal && p.sinal !== "queda" &&
                 TU.inicio(p.quando, balde.passo) === chave; }).length;
        linhas.push(tlLinha("var(--soft)", "publicações", num(q) +
                    (qe ? " · " + qe + " estourou" + (qe > 1 ? "ram" : "") : "")));
      }

      balao.innerHTML = '<div class="glabel">' + TU.rotulo(chave, balde.passo) +
                        '</div>' + linhas.join("");
      balao.hidden = false;
      var lb = balao.offsetWidth, e2 = px + 16;
      if (e2 + lb > r.width) e2 = px - lb - 16;
      balao.style.left = Math.max(0, e2).toFixed(1) + "px";
      balao.style.top = Math.max(0, Math.min(r.height - balao.offsetHeight - 4,
        (ev.clientY - r.top) - balao.offsetHeight / 2)).toFixed(1) + "px";
    }

    [].forEach.call(raiz.querySelectorAll(".gaba"), function(b){
      b.addEventListener("click", function(){
        if (b.disabled) return;
        var k = b.dataset.k;
        // A ULTIMA CAMADA NAO SAI: um desenho sem nada nao e' um desenho.
        var quantas = Object.keys(ligadas).filter(function(x){ return ligadas[x]; }).length;
        if (ligadas[k] && quantas <= 1) return;
        ligadas[k] = !ligadas[k];
        b.setAttribute("aria-selected", ligadas[k] ? "true" : "false");
        esconder();
        fecharCartao();
        desenhar();
      });
    });

    tela.addEventListener("mousemove", mover);
    tela.addEventListener("mouseleave", esconder);
    var antesM = "";
    new ResizeObserver(function(){
      var m = Math.round(tela.clientWidth) + "x" + Math.round(tela.clientHeight);
      if (tela.clientWidth && m !== antesM){ antesM = m; desenhar(); }
    }).observe(tela);
    desenhar();
  }

  // A BARRA MORA NO MEIO DA COLUNA, e nao no comeco dela: a coluna de agosto ancorada no
  // dia 1o nasce metade fora do papel e parece ser do fim de julho.
  function meiaVaga(passo, chave, X){
    return (X(TU.proximo(chave, passo)) - X(chave)) / 2;
  }
  function acheNoBalde(serie, chave){
    for (var i = 0; i < serie.length; i++) if (serie[i][0] === chave) return serie[i][1];
    return 0;
  }
  var REGRA_ESTOURO = "estouro: acima do normal dela, medido pela mediana e pelo " +
    "desvio das publicações maduras do mesmo formato, com o corte da aba de " +
    "Configurações.";

  function tlLinha(cor, nome, valor){
    return '<div class="glinha"><span class="gdot" style="background:' + cor +
           '"></span><span class="gnome">' + seguro(nome) + '</span>' +
           '<span class="gval">' + valor + '</span></div>';
  }

  // O PERCURSO, O MAPA DE DIA E HORA, A DIVISAO POR FORMATO E A CURVA DE VIDA SAIRAM
  // em 16/08, por decisao do Gabriel.
  //
  // Os tres primeiros respondiam perguntas que o cartao de Ritmo la' de cima passou a
  // responder, e a mesma pergunta em dois lugares e' o comeco de duas respostas que
  // discordam. O percurso ninguem lia. O codigo delas saiu junto: funcao que ninguem
  // chama continua pesando no arquivo publicado, que tem teto, e continua pedindo
  // leitura de quem vier depois.

  // A ABA "ESTOUROU" SAIU em 16/08. Ela era uma terceira lista das mesmas publicacoes,
  // depois de Recordes e de Publicacoes; o sinal de estouro passou a viajar no selo do
  // proprio cartao, onde ele e' visto sem precisar trocar de aba.


  // OS STORIES E AS PUBLICACOES MUDARAM DE ENDERECO em 16/08: eles moram no bloco do
  // acervo, la' embaixo, junto com os recordes e os reels. As quatro abas passaram a ser
  // desenhadas pelas mesmas pecas, e mante-las em dois lugares do arquivo era manter duas
  // metades de uma coisa so'.



  // ---------------------------------------------------------------------- o veredito
  //
  // ELE COMPARA A CONTA COM AS OUTRAS DO MESMO MERCADO, e não com um número universal.
  // Taxa de cinco por cento é ótima num mercado e fraca noutro; o que decide alguma
  // coisa é onde ela está entre as contas que o Gabriel escolheu acompanhar.
  function veredito(u, d, meta){
    var curva = (d.curva || []).filter(function(p){ return p[1]; });
    var ganho = curva.length > 1 ? curva[curva.length - 1][1] - curva[0][1] : 0;
    var dias = curva.length > 1
      ? Math.max(1, Math.round((new Date(curva[curva.length - 1][0]) -
                                new Date(curva[0][0])) / 86400000)) : 0;
    var estado = ganho > 0 ? "crescendo" : (ganho < 0 ? "caindo" : "parada");

    var frase = "";
    if (ganho && dias) frase = "<b>" + (ganho > 0 ? "+" : "") + num(ganho) +
      "</b> seguidores em " + dias + (dias === 1 ? " dia" : " dias") + ". ";

    // A comparação sai da própria tabela que está atrás do pop-up: ela já traz a taxa de
    // cada conta e o mercado de cada uma. Nada é pedido à rede para isto.
    var minha = meta.taxa, nicho = meta.nicho;
    if (minha && nicho){
      var pares = taxasDoMercado(nicho);
      // TRES CONTAS E' O MINIMO para a palavra "mediana" valer alguma coisa: com duas, o
      // "0,1x a mediana do mercado" que saia daqui era a razao entre duas contas com nome
      // de estatistica, e ele contradizia a propria nota do bloco logo abaixo.
      if (pares.length > 2){
        var medNicho = pares[Math.floor(pares.length / 2)];
        var razao = medNicho ? minha / medNicho : 0;
        if (razao) frase += "Engajamento <b>" + razao.toFixed(1).replace(".", ",") +
          "x</b> a mediana do mercado <b>" + seguro(nicho) + "</b>.";
      }
    }
    return '<div class="pf-veredito"><span class="pf-vl ' + estado + '">' + estado +
      '</span>' + (frase ? "<p>" + frase + "</p>" : "") + '</div>';
  }

  function vg(v, casas){
    return v.toFixed(casas == null ? 1 : casas).replace(".", ",").replace(/,0$/, "");
  }

  // ============================================================= O RECORTE DE PERIODO
  //
  // O QUE ELE GOVERNA, e o que ele nao governa. Ele recorta a CURVA e as PUBLICACOES, que
  // sao series com data e podem ser cortadas sem mentir. Formatos, curva de vida,
  // percurso e mediana chegam somados do banco sobre o acervo INTEIRO, e recorta-los aqui
  // daria um numero que nenhum outro lugar do sistema conhece. Por isso cada bloco diz de
  // que base ele fala, e os que nao obedecem ao periodo dizem isso na propria linha.
  // TODAS AS JANELAS CLICAVEIS, do dia ao ano. Elas ja' nasceram de dois jeitos errados:
  // primeiro uma lista fixa que comecava em sete dias (e como toda conta tem cinco dias de
  // leitura, tudo nascia desligado); depois uma lista que se encolhia para o tamanho da
  // conta (e ai' sumiam 30, 90 e o ano). O certo e' o obvio: a janela e' uma PERGUNTA, e
  // perguntar "e nos ultimos 90 dias?" numa conta de cinco dias tem resposta, que e' "o
  // que existe sao estes cinco". Quem diz isso e' a nota do lado, e nao um botao morto.
  var JANELAS = [{d: 1, r: "24 h"}, {d: 7, r: "7 dias"}, {d: 30, r: "30"},
                 {d: 90, r: "90"}, {d: 180, r: "180"}, {d: 365, r: "1 ano"},
                 {d: 0, r: "tudo"}];

  function vaoEmDias(d){
    var c = (d.curva || []).filter(function(p){ return p[1]; });
    if (c.length < 2) return 0;
    return Math.max(1, Math.round((new Date(c[c.length - 1][0]) -
                                   new Date(c[0][0])) / 86400000));
  }

  function recortar(d, dias){
    var c = (d.curva || []).filter(function(p){ return p[1]; });
    if (!dias || !c.length) return d;
    var corte = new Date(c[c.length - 1][0]).getTime() - dias * 86400000;
    var fora = {};
    for (var k in d) fora[k] = d[k];
    fora.curva = c.filter(function(p){
      return new Date(p[0]).getTime() >= corte; });
    fora.posts = (d.posts || []).filter(function(p){
      return new Date(p.quando).getTime() >= corte; });
    return fora;
  }

  // UMA LEITURA POR DIA, a ultima de cada dia. O ganho diario sai daqui, e nao da lista
  // crua: a nuvem le' a mesma conta varias vezes por dia, e a diferenca entre duas
  // leituras da mesma tarde nao e' o ganho do dia.
  function porDiaSeg(curva){
    var mapa = {}, ordem = [];
    curva.forEach(function(p){
      var dia = p[0].slice(0, 10);
      if (!(dia in mapa)) ordem.push(dia);
      mapa[dia] = p;
    });
    return ordem.map(function(dia){ return mapa[dia]; });
  }

  // ================================================================ A FAIXA DE NUMEROS
  //
  // O DESENHO E' O MESMO DA ABA DE INSIGHTS, e nao um segundo parecido. La', no cartao de
  // destaque, esta pergunta ja' estava resolvida: uma fileira de ABAS em cima, cada aba
  // com o nome de uma metrica e o total dela, e clicar SOMA ou TIRA aquela serie do
  // desenho. E' assim que da' para ver curtida sozinha, comentario sozinho, ou os dois
  // juntos. Duas copias do mesmo componente e' o comeco de dois desenhos diferentes, e
  // foi exatamente o que aconteceu aqui entre 15 e 16/08.
  //
  // O QUE ESTA FAIXA ACRESCENTA ao componente e' o par de botoes de vista, curva ou
  // barra, que o painel tem e o cartao de destaque nao tinha.
  var ICO_CURVA = '<path d="M3 15c3 0 4-8 7-8s4 6 7 6 4-4 4-4"/>';
  var ICO_BARRA = '<path d="M4 20V10M10 20V4M16 20v-7M22 20v-3"/>';
  var pfSeq = 0, cartoesDaFaixa = [];

  // Uma metrica do cartao: o que a aba escreve e o que a curva desenha.
  //   k, rot   o nome dela
  //   cor      a variavel de tema, nunca a cor
  //   total    o numero grande da aba, ja' escrito
  //   vals     pares [instante, valor]
  //   motivo   o que a aba diz quando nao ha' serie, no lugar de sumir da fileira
  function metrica(k, cor, total, vals, motivo, ligada, sozinha){
    // UM PONTO SO' NAO E' UMA SERIE: a curva nasce com o segundo. E se a aba nao vai
    // desenhar nada, ela tambem nao escreve total: numero grande numa aba apagada faz
    // parecer que o desenho dela existe e nao abriu.
    var vale = vals.length > 1;
    return {k: k, rot: k, cor: cor, total: vale ? total : "—", sozinha: !!sozinha,
            vals: vale ? vals : [], motivo: motivo, ligada: !!ligada && vale};
  }

  function tile(c){
    var i = cartoesDaFaixa.length;
    cartoesDaFaixa.push(c);
    var bt = function(v, ico, rot){
      return '<button type="button" data-v="' + v + '" title="' + rot + '" ' +
             'aria-label="' + rot + '" class="' + (c.tipo === v ? "on" : "") + '">' +
             '<svg viewBox="0 0 24 24">' + ico + '</svg></button>';
    };
    var abas = c.metricas.map(function(m){
      return '<button type="button" class="gaba" data-k="' + seguro(m.k) + '" role="tab"' +
        ' style="--cor-serie:' + m.cor + '"' +
        ' aria-selected="' + (m.ligada ? "true" : "false") + '"' +
        (m.vals.length ? "" : " disabled") +
        '><span>' + seguro(m.rot) + '</span><b>' + m.total + '</b></button>';
    }).join("");
    return '<div class="pf-nm" data-i="' + i + '">' +
      '<div class="pf-nm-cab"><span>' + c.rot +
        (c.selo ? '<i class="pf-selo">' + c.selo + '</i>' : "") + '</span>' +
        '<div class="vtoggle pf-vt">' + bt("area", ICO_CURVA, "curva") +
          bt("barra", ICO_BARRA, "barras") + '</div></div>' +
      '<div class="grafico" data-dados="pf-g' + (++pfSeq) + '" ' +
           'data-vista="' + (c.tipo || "area") + '">' +
        '<div class="grafico-abas" role="tablist">' + abas + '</div>' +
        '<div class="grafico-tela"></div>' +
        '<div class="grafico-balao" hidden></div>' +
      '</div>' +
      '<i class="pf-nm-nota ' + (c.classe || "") + '">' + c.nota + '</i>' +
    '</div>';
  }

  function pintarCartoes(){
    cartoesDaFaixa.forEach(function(c, i){
      var el = onde.querySelector('.pf-nm[data-i="' + i + '"]');
      if (!el) return;
      var g = el.querySelector(".grafico");
      // AS SERIES VAO PRONTAS, e nao por um `script` de JSON ao lado. Na aba de Insights
      // a pagina e' escrita em Python e elas precisam viajar em texto; aqui a pagina e'
      // escrita no navegador e elas ja' estao na memoria.
      g.dadosProntos = {chaves: c.metricas, dominio: cartoesDaFaixa.dominio};
      window.montarGrafico(g);

      [].forEach.call(el.querySelectorAll("[data-v]"), function(b){
        b.addEventListener("click", function(){
          g.dataset.vista = b.dataset.v;
          [].forEach.call(el.querySelectorAll("[data-v]"), function(o){
            o.classList.toggle("on", o === b);
          });
          if (g.redesenhar) g.redesenhar();
        });
      });
    });
  }

  // Uma amostra ESPALHADA pela lista, e nao um pedaco dela: o primeiro e o ultimo ponto
  // entram sempre, e o meio e' colhido em passo constante.
  function amostrar(lista, quantos){
    if (lista.length <= quantos) return lista.slice();
    var fora = [], passo = (lista.length - 1) / (quantos - 1);
    for (var j = 0; j < quantos; j++) fora.push(lista[Math.round(j * passo)]);
    return fora;
  }

  // Os dias entre a primeira e a ultima publicacao, todos, inclusive os vazios: sem eles
  // o ritmo desenharia uma reta ligando terca a sabado como se sexta nao tivesse
  // existido, quando o que aconteceu na sexta foi justamente nao publicar.
  function diasEntre(de, ate){
    var fora = [], t = Date.parse(de.slice(0, 10) + "T12:00:00");
    var fim = Date.parse(ate.slice(0, 10) + "T12:00:00");
    if (isNaN(t) || isNaN(fim) || fim < t) return fora;
    while (t <= fim && fora.length < 400){
      fora.push(new Date(t).toISOString().slice(0, 10));
      t += 86400000;
    }
    return fora;
  }

  // O vao da janela em dias, olhando a curva E as publicacoes: sao duas fontes com
  // alcances diferentes, e quem manda no balde e' a maior das duas.
  function numeros(d, rec, meta, janela, tudo){
    var curva = (rec.curva || []).filter(function(p){ return p[1]; });
    var diario = porDiaSeg(curva);
    var seg = curva.length ? curva[curva.length - 1][1] : 0;
    var ganho = curva.length > 1 ? seg - curva[0][1] : 0;
    var dias = Math.max(0, diario.length - 1);

    // ---- GANHO E PERDA SAO DUAS METRICAS, e nao uma serie que troca de sinal. Sao duas
    // perguntas: quanta gente nova entrou, e quanta gente foi embora. Numa serie so' um
    // dia de mil entradas e novecentas saidas aparece como cem, que e' o que nenhuma das
    // duas perguntas queria saber.
    //
    // E ELAS SAEM DAS VIRADAS ENTRE LEITURAS, e nao da diferenca de um dia para o outro.
    // Um dia em que entraram mil e sairam novecentas fecha em cem: pela conta do dia, a
    // perda de novecentas nunca existiu. Lendo de meia em meia hora, cada subida entra no
    // ganho do dia e cada descida entra na perda do dia, e o saldo continua sendo a soma
    // das duas. Foi por isso que "seguidores perdidos" aparecia vazio numa conta que
    // perde gente todo dia.
    var ganhoDia = {}, perdaDia = {}, somaG = 0, somaP = 0;
    for (var i = 1; i < curva.length; i++){
      var dif = curva[i][1] - curva[i - 1][1];
      var qdia = (curva[i][0] || "").slice(0, 10);
      if (!qdia || !dif) continue;
      if (dif > 0){ ganhoDia[qdia] = (ganhoDia[qdia] || 0) + dif; somaG += dif; }
      else { perdaDia[qdia] = (perdaDia[qdia] || 0) - dif; somaP += -dif; }
    }
    // AS DUAS SERIES COBREM OS MESMOS DIAS, inclusive os de zero: sem o dia de zero, uma
    // conta que so' perdeu numa terca teria uma serie de um ponto so'.
    diario.forEach(function(p){
      var q = (p[0] || "").slice(0, 10);
      if (!q) return;
      if (!(q in ganhoDia)) ganhoDia[q] = 0;
      if (!(q in perdaDia)) perdaDia[q] = 0;
    });
    // O BALDE DA JANELA VALE AQUI TAMBEM. Numa janela de um ano, "ganho por dia" sao
    // trezentas e sessenta e cinco colunas de cinco pixels; a pergunta que aquela janela
    // faz e' "quanto ela ganhou em cada mes". O rotulo da aba diz qual balde esta'
    // valendo, entao o numero nunca fica sem unidade.
    var dom = dominioDaJanela(tudo || d, rec, janela);
    var balde = TU.balde(janela || (dom ? (dom[1] - dom[0]) / 86400000 : 1));
    var colunas = dom ? TU.grade(dom[0], dom[1], balde.passo) : [];
    function porColuna(mapa){
      return TU.somar(Object.keys(mapa).sort().map(function(q){
        return [q + "T12:00:00", mapa[q]]; }), balde.passo, colunas);
    }
    var vGanho = porColuna(ganhoDia);
    var vPerda = porColuna(perdaDia);
    var viradas = [];
    for (var w = 1; w < diario.length; w++)
      viradas.push(diario[w][1] - diario[w - 1][1]);
    var ordenadas = viradas.slice().sort(function(a, b){ return a - b; });
    var medGanho = ordenadas.length ? ordenadas[Math.floor(ordenadas.length / 2)] : 0;
    var vSeg = amostrar(curva, 60).map(function(p){ return [p[0], p[1]]; });

    // ---- ENGAJAMENTO: cada medida uma aba. Curtida e' clique, comentario e' gente
    // parando para escrever, reproducao so' existe em video: sao tres coisas, e somar as
    // tres numa linha so' esconde qual delas se moveu.
    var recentes = (rec.posts || []).slice(0, 24).reverse();
    var vCur = recentes.map(function(p){ return [p.quando, p.cur || 0]; });
    var vCom = recentes.map(function(p){ return [p.quando, p.com || 0]; });
    var vEng = recentes.map(function(p){
      return [p.quando, (p.cur || 0) + (p.com || 0)]; });
    // REPRODUCAO SO' ENTRA ONDE EXISTE. Marcar zero na foto desenharia um pente: a linha
    // mergulha no chao por causa do formato do post, e nao de uma medida.
    var vRep = recentes.filter(function(p){ return p.views; })
      .map(function(p){ return [p.quando, p.views]; });

    function mediana(vals){
      if (!vals.length) return 0;
      var o = vals.map(function(v){ return v[1]; }).sort(function(a, b){ return a - b; });
      return o[Math.floor(o.length / 2)];
    }

    // ---- comentario por cem curtidas, para a nota do cartao de engajamento
    var cur = 0, com = 0;
    (rec.posts || []).forEach(function(p){ cur += p.cur || 0; com += p.com || 0; });
    var conversa = cur ? 100 * com / cur : 0;

    // ---- a taxa vem da TABELA que esta' atras do pop-up, que e' a mesma regua da coluna
    // "engajamento" e do cartao do topo. Recalcular aqui daria um segundo numero com o
    // mesmo nome, e dois numeros com o mesmo nome e' o comeco de nao acreditar em nenhum.
    var taxa = meta.taxa, nicho = meta.nicho;
    var vizinhas = taxasDoMercado(nicho);
    var corTaxa = "", notaMercado = "";
    if (taxa && vizinhas.length > 2){
      var med = vizinhas[Math.floor(vizinhas.length / 2)];
      if (med){
        notaMercado = " · " + vg(taxa / med, 1) + "x a mediana do mercado";
        corTaxa = taxa >= med ? "sobe" : "desce";
      }
    }

    // ---- RITMO: quantas publicacoes por dia, e quantas de cada formato por dia. O
    // formato deixou de ser um bloco a parte no pe' do cartao e virou aba: e' a mesma
    // pergunta ("o que ela publica, e quando") no mesmo desenho.
    var posts = (rec.posts || []).slice().sort(function(a, b){
      return (a.quando || "").localeCompare(b.quando || ""); });
    var porDia = {}, porFmt = {}, contaFmt = {};
    posts.forEach(function(p){
      var dia = (p.quando || "").slice(0, 10);
      if (!dia) return;
      porDia[dia] = (porDia[dia] || 0) + 1;
      var f = p.fmt || "feed";
      porFmt[f] = porFmt[f] || {};
      porFmt[f][dia] = (porFmt[f][dia] || 0) + 1;
      contaFmt[f] = (contaFmt[f] || 0) + 1;
    });
    var grade = posts.length
      ? diasEntre(posts[0].quando, posts[posts.length - 1].quando) : [];
    function porDiaDe(mapa){
      return TU.somar(grade.map(function(dia){
        return [dia + "T12:00:00", mapa[dia] || 0]; }), balde.passo, colunas);
    }
    var vPub = grade.length ? porDiaDe(porDia) : [];

    // ---- ritmo pelo CONTADOR DA PROPRIA CONTA, e nao pela contagem do acervo. O acervo
    // carrega as publicacoes mais recentes; o contador do perfil conta todas.
    var ritmoSem = 0, notaRitmo = "por semana, pelo contador";
    if (dias && diario[0][3] != null && diario[diario.length - 1][3] != null)
      ritmoSem = (diario[diario.length - 1][3] - diario[0][3]) / dias * 7;
    if (!ritmoSem && dias){
      ritmoSem = posts.length / dias * 7;
      notaRitmo = "por semana, pelo acervo recente";
    }
    var porHora = {}, dPico = "";
    posts.forEach(function(p){
      var h = new Date(p.quando).getHours();
      porHora[h] = (porHora[h] || 0) + 1;
    });
    Object.keys(porHora).forEach(function(h){
      if (!dPico || porHora[h] > porHora[dPico]) dPico = h;
    });

    var C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)",
        C4 = "var(--chart-4)", C5 = "var(--chart-5)";
    var CORFMT = {reel: C2, carrossel: C3, feed: C4, imagem: C5};

    var abasFmt = Object.keys(contaFmt).sort(function(a, b){
      return contaFmt[b] - contaFmt[a]; }).slice(0, 3).map(function(f){
      return metrica(f, CORFMT[f] || C5, num(contaFmt[f]),
                     grade.length ? porDiaDe(porFmt[f]) : [],
                     "nenhuma publicação em " + f + " nesta janela");
    });

    // TRES CARTOES, e cada um e' um assunto. Dentro dele, uma aba por metrica: o desenho
    // mostra a que estiver escolhida, e escolher duas desenha as duas juntas.
    // O DOMINIO DA JANELA VIAJA COM ELES: e' o que faz noventa dias desenhar noventa
    // dias, e nao o vao do pouco que houver medido.
    cartoesDaFaixa.dominio = dom;
    return [
      tile({rot: "Seguidores", selo: balde.rot, tipo: "area",
            classe: ganho > 0 ? "sobe" :
                                                     (ganho < 0 ? "desce" : ""),
            nota: (ganho
              ? (ganho > 0 ? "▲ " : "▼ ") + num(Math.abs(ganho)) +
                (dias ? " em " + dias + (dias === 1 ? " dia" : " dias") : "")
              : "sem virada no período") +
              (viradas.length ? " · mediana de " + (medGanho > 0 ? "+" : "") +
                                num(medGanho) + " por dia" : ""),
            metricas: [
              metrica("total", C1, kCurto(seg), vSeg,
                      "sem leitura de seguidores nesta janela", true),
              metrica("novos", C2, "+" + num(somaG), vGanho,
                      "sem leitura suficiente para contar o ganho"),
              metrica("perdidos", C5, "−" + num(somaP), vPerda,
                      "sem leitura suficiente para contar a perda")
            ]}),

      tile({rot: "Engajamento", selo: "por publicação", tipo: "area",
            classe: corTaxa,
            nota: "mediana por publicação · " +
                  (taxa ? vg(taxa, 3) + "% sobre os seguidores"
                        : "taxa ainda não calculada") + notaMercado +
                  (conversa ? " · " + vg(conversa, 1) + " comentários por 100 curtidas"
                            : ""),
            metricas: [
              // ENGAJAMENTO E' A SOMA DAS OUTRAS DUAS, entao ele nao divide o desenho
              // com elas: escolher ele apaga as partes, escolher uma parte apaga ele.
              metrica("engajamento", C1, kCurto(mediana(vEng)), vEng,
                      "nenhuma publicação medida nesta janela", true, true),
              metrica("curtidas", C2, kCurto(mediana(vCur)), vCur,
                      "nenhuma curtida medida nesta janela"),
              metrica("comentários", C3, kCurto(mediana(vCom)), vCom,
                      "nenhum comentário medido nesta janela"),
              metrica("reproduções", C4, kCurto(mediana(vRep)), vRep,
                      "nenhum vídeo nesta janela: reprodução só existe em vídeo")
            ]}),

      tile({rot: "Ritmo", selo: balde.rot, tipo: "barra",
            nota: (ritmoSem ? num(Math.round(ritmoSem)) + " " + notaRitmo
                            : "sem base para contar") +
                  (dPico ? " · publica mais às " + dPico + "h" : ""),
            metricas: [metrica("publicações", C1, num(posts.length), vPub,
                               "sem publicação nesta janela", true)].concat(abasFmt)})
    ].join("");
  }

  // O numero curto, o mesmo que as abas escrevem.
  function kCurto(v){
    var s = v < 0 ? "-" : ""; v = Math.abs(v);
    if (v >= 1e6) return s + vg(v / 1e6, 1) + "M";
    if (v >= 1e4) return s + vg(v / 1e3, 1) + "k";
    return s + num(Math.round(v));
  }

  function dias(n){ return n + (n === 1 ? " dia" : " dias"); }

  function barraDePeriodo(vao, escolhido, lidos){
    var bts = JANELAS.map(function(p){
      return '<button type="button" data-per="' + p.d + '"' +
        ' class="' + (p.d === escolhido ? "on" : "") + '">' + p.r + '</button>';
    }).join("");

    // O AVISO DE JANELA CURTA, e ele e' a peca que faltava. Escolher 30 dias numa conta
    // com 5 dias de coleta nao muda desenho nenhum, e sem uma palavra ali o filtro parece
    // quebrado. Nao esta': o que existe sao cinco dias. Quem diz isso e' este aviso, e ele
    // e' amarelo e tem sinal porque precisa ser visto, nao procurado.
    //
    // O VAO E' DE CADA CONTA. Uma cadastrada ontem tem um dia; a NASA tem cinco; daqui a
    // um mes elas terao trinta e o mesmo aviso deixara' de aparecer sozinho.
    var recado;
    if (escolhido && escolhido > vao){
      recado = '<span class="pf-per-av">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01' +
        'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' +
        '</svg>não temos ' + dias(escolhido) + ' desta conta. O sistema guardou <b>' +
        dias(vao) + '</b> até agora, e é isso que está desenhado.</span>';
    } else {
      recado = '<span class="pf-per-n">' +
        (escolhido ? (escolhido === 1 ? 'as últimas <b>24 horas</b>'
                                      : 'os últimos <b>' + dias(escolhido) + '</b>') +
                     ', de ' + dias(vao) + ' guardados'
                   : 'tudo que o sistema guardou: <b>' + dias(vao) + '</b>') +
        (lidos ? ' · <b>' + num(lidos) + '</b> leituras' : "") + '</span>';
    }
    return '<div class="pf-per"><span class="pf-per-r">período</span>' + bts +
           recado + '</div>';
  }

  // ================================================================== ONDE ELA ESTA
  //
  // A COMPARACAO E' COM O MERCADO DELA, e nunca com um numero universal. Taxa de cinco por
  // cento e' otima num mercado e fraca noutro. E ela sai da propria tabela que esta' atras
  // do pop-up, que ja' traz a taxa e o mercado de cada conta: nada e' pedido a' rede.
  // AS VIZINHAS DE MERCADO, com a taxa medida. So' entram as que tem taxa: conta
  // recem-cadastrada tem zero, e zero nao e' "engajamento nenhum", e' "ainda nao
  // medi". Deixar ela na regua puxaria a mediana do mercado para baixo por nada.
  function vizinhas(nicho){
    if (!nicho) return [];
    var fora = [];
    PERFIS.forEach(function(p){
      if (p.nicho === nicho && Number(p.taxa) > 0)
        fora.push({u: p.u, t: Number(p.taxa)});
    });
    return fora.sort(function(a, b){ return a.t - b.t; });
  }
  function taxasDoMercado(nicho){
    return vizinhas(nicho).map(function(p){ return p.t; });
  }

  // ============================================================== ONDE ELA ESTA
  //
  // ERA UMA FAIXA COM OS ARROBAS ESCRITOS EM CIMA DE UMA REGUA, e ela tinha dois
  // defeitos que o Gabriel viu: ocupava quatrocentos pixels de altura para dizer duas
  // porcentagens, e com mais de tres contas no mercado os nomes caiam um por cima do
  // outro, porque numa regua a posicao do nome e' o valor -- e valores proximos dao
  // nomes sobrepostos.
  //
  // AGORA E' UM RANKING, que e' a forma certa da pergunta "onde ela esta". Cada conta
  // ocupa uma linha, a barra diz o tamanho, e a posicao diz o lugar. Nome nao encosta em
  // nome, e sete contas cabem no espaco que duas ocupavam.
  function ondeEla(u, d, meta){
    var nicho = meta.nicho || d.nicho || "";
    var pares = vizinhas(nicho).slice().reverse();   // da maior taxa para a menor
    var pos = 0;
    pares.forEach(function(p, i){ if (p.u === u) pos = i + 1; });

    var lista = "";
    if (pares.length > 1){
      var maior = pares[0].t || 1;
      // ATE' SEIS LINHAS, e a dela entra sempre. Num mercado de trinta contas, trinta
      // linhas viram uma tabela que ninguem le'; as cinco primeiras mais ela respondem
      // "quem lidera e onde eu estou".
      var mostrar = pares.slice(0, 6);
      if (pos > 6) mostrar = pares.slice(0, 5).concat([pares[pos - 1]]);
      lista = '<ol class="pf-rk">' + mostrar.map(function(p){
        var i = pares.indexOf(p) + 1, eu = p.u === u;
        return '<li class="pf-rk-l' + (eu ? " eu" : "") + '">' +
          '<span class="pf-rk-p">' + i + '</span>' +
          '<span class="pf-rk-u">@' + seguro(p.u) + '</span>' +
          '<span class="pf-rk-b"><i style="width:' +
            Math.max(2, p.t / maior * 100).toFixed(1) + '%"></i></span>' +
          '<b class="pf-rk-v">' + vg(p.t, 3) + '%</b></li>';
      }).join("") + '</ol>';
    }

    // A HONESTIDADE DA BASE CURTA. Com duas contas a "mediana do mercado" e' so' um
    // numero com cara de estatistica: a tela mostra as contas e diz que nao da' para
    // tirar mediana disso, em vez de tirar assim mesmo.
    var nota;
    if (!nicho) nota = "esta conta não está em nenhum mercado. Sem mercado não há com " +
                       "quem comparar.";
    else if (pares.length < 2) nota = "só esta conta tem taxa medida em <b>" +
      seguro(nicho) + "</b>. Comparação precisa de vizinha.";
    else if (pares.length < 3) nota = "duas contas em <b>" + seguro(nicho) +
      "</b>: abaixo de três, mediana não significa nada.";
    else nota = "<b>" + pos + "º de " + pares.length + "</b> em <b>" + seguro(nicho) +
      "</b>, por engajamento sobre os seguidores.";

    var sits = d.situacoes || [];
    var maiorM = 0, puxou = 0;
    sits.forEach(function(s){
      maiorM = Math.max(maiorM, s.vezes || 0); puxou += s.puxou || 0; });

    return '<div class="pf-cx pf-onde">' + veredito(u, d, meta) +
      '<p class="pf-mc-nota">' + nota + '</p>' + lista +
      '<dl class="pf-par pf-par-mini">' +
        '<div><dt>situações abertas</dt><dd>' + num(sits.length) + '</dd></div>' +
        '<div><dt>maior múltiplo</dt><dd>' +
          (maiorM ? vg(maiorM, 1) + "x" : "nenhum") + '</dd></div>' +
        '<div><dt>seguidores atribuídos</dt><dd>' +
          (puxou ? num(puxou) : "não atribuído") + '</dd></div>' +
      '</dl></div>';
  }


  // ======================================================================= O ACERVO
  //
  // QUATRO PORTAS PARA O MESMO ACERVO -- Recordes, Publicacoes, Reels e Stories -- E AS
  // QUATRO NO MOLDE DA ABA DE INSIGHTS. Nao "parecido com": as MESMAS pecas.
  //
  //   o cartao      `.gpost.cheio`, o mesmo do `card_de_galeria` completo
  //   a grade       `.gal.gal-4.solto`
  //   a ordem       `window.montarSelect`
  //   as paginas    `window.montarPaginacao`
  //   os recordes   `.rank-tira`, a fita que arrasta do ranking
  //   os stories    `.st-fita`, a fita de story
  //
  // Nenhuma delas nasceu aqui, e e' esse o ponto. Esta aba ja' teve galeria propria: botao
  // de "melhores/piores" que Insights nao tem, quadradinho quadrado onde Insights usa 4:5,
  // e folha de estilo propria que ainda por cima estava sendo atropelada por outra, mais
  // abaixo no mesmo arquivo, com o mesmo nome de classe. Duas telas que mostram a mesma
  // coisa com dois codigos viram duas telas diferentes na primeira vez que uma muda.
  //
  // O QUE MUDA DE INSIGHTS, e por que. La' a grade mistura contas, e por isso ela filtra
  // por nicho e por etiqueta; aqui e' uma conta so', e esses dois filtros teriam uma opcao
  // cada. O que sobra e' a ORDEM, e ela e' a mesma peca.
  var ABAS = [{k: "rec", r: "Recordes"}, {k: "pub", r: "Publicações"},
              {k: "reel", r: "Reels"}, {k: "str", r: "Stories"}];
  // DEZ POR PAGINA, e nao os doze do Insights: aqui a caixa e' mais larga e cabem cinco
  // por linha, entao dez sao duas linhas cheias. Doze deixavam uma terceira linha com dois
  // cartoes e um vao do tamanho de tres. Decisao do Gabriel em 16/08.
  var POR_PAGINA_PF = [{v: "10", r: "10"}, {v: "20", r: "20"}, {v: "40", r: "40"}];
  var NA_PAGINA = 10;
  var UM_DIA = 24 * 60 * 60 * 1000;

  function ehReel(p){ return p.fmt === "reel"; }
  // PUBLICACOES E' FEED E CARROSSEL, e reel tem aba propria: e' o corte do Insights. Com
  // reel dentro das duas, o mesmo reel apareceria em duas abas e a soma das quatro
  // contagens nao bateria com o acervo.
  function doFeed(p){ return p.fmt !== "reel"; }

  function daAba(k, d){
    if (k === "rec") return d.melhores || [];
    if (k === "pub") return (d.posts || []).filter(doFeed);
    if (k === "reel") return (d.posts || []).filter(ehReel);
    return (d.stories || {}).todos || [];
  }
  function contaDaAba(k, d){ return daAba(k, d).length; }

  // AS DUAS PECAS DE TELA do Insights, escritas aqui porque la' quem as desenha e' o
  // Python e aqui e' o navegador. O COMPORTAMENTO das duas continua vindo de uma fonte
  // so': `window.montarSelect` e `window.montarPaginacao`, os mesmos objetos.
  function selHTML(pre, valor){
    return '<div class="sel" id="' + pre + '">' +
      '<button class="sel-gatilho" id="' + pre + 'g" type="button" ' +
        'aria-haspopup="listbox" aria-expanded="false">' +
        '<span class="sel-valor" id="' + pre + 'v">' + valor + '</span>' +
        '<svg class="sel-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="m6 9 6 6 6-6"/></svg></button>' +
      '<div class="sel-lista" id="' + pre + 'l" role="listbox">' +
        '<div class="sel-grupo" id="' + pre + 'gr"></div></div></div>';
  }

  function barraHTML(pre){
    return '<div class="pag"><span>Itens por página</span>' +
      selHTML(pre + "-tam", String(NA_PAGINA)) + '<span class="nav">' +
      '<button id="' + pre + '-ini" type="button" aria-label="Primeira página">' +
        '&laquo;</button>' +
      '<button id="' + pre + '-ant" type="button" aria-label="Página anterior">' +
        '&lsaquo;</button>' +
      '<span class="conta" id="' + pre + '-conta"></span>' +
      '<button id="' + pre + '-prox" type="button" aria-label="Próxima página">' +
        '&rsaquo;</button>' +
      '<button id="' + pre + '-fim" type="button" aria-label="Última página">' +
        '&raquo;</button></span></div>';
  }

  // O BOTAO DA CASA, com os quatro filhos na ordem que ele exige: seta, texto, circulo,
  // seta. E' o mesmo molde do `botao()` do lado do servidor.
  function botaoIr(texto, href){
    return '<a class="btn" href="' + href + '" target="_blank" rel="noopener">' +
      '<svg class="seta seta-esq" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
      '<span class="txt">' + texto + '</span><span class="circ"></span>' +
      '<svg class="seta seta-dir" viewBox="0 0 24 24"><use href="#i-seta"/></svg></a>';
  }

  // A IDENTIDADE DA CONTA dentro do cartao. Ela e' igual nos doze cartoes, porque a pagina
  // e' de uma conta so', E MESMO ASSIM ela fica: o cartao e' o de Insights, e cartao que
  // muda de forma quando muda de tela deixa de ser o mesmo cartao. E' montada uma vez por
  // perfil e reusada em todos, entao repetir nao custa desenho.
  function quemHTML(u, meta){
    var av = '<span class="pcard-avatar av-' + u + '"' +
      (meta.avatar ? ' style="background-image:url(' + meta.avatar + ')"' : "") + '>' +
      (meta.avatar ? "" : seguro(u.slice(0, 1)).toUpperCase()) + '</span>';
    return '<div class="pcard-quem"><span class="pcard-retrato">' + av + '</span>' +
      '<div class="pcard-id"><h3>' + seguro(meta.nome || "@" + u) + '</h3>' +
      '<span class="pcard-arroba">' + (meta.nome ? "@" + seguro(u) : "") +
        '<a class="pcard-ig" href="https://www.instagram.com/' + seguro(u) + '/" ' +
        'target="_blank" rel="noopener" aria-label="Abrir o perfil no Instagram">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ig-cor"/></svg>' +
        '</a></span></div></div>';
  }

  // QUANDO A FOTO NAO VEM, O CARTAO DIZ ISSO. Um retangulo cinza mudo parece defeito da
  // tela; "sem prévia" e' uma resposta. Acontece com reel de que o coletor nao guardou o
  // endereco da capa, e sobra so' o mp4, que uma tag de imagem nao desenha.
  //
  // ELA E' UMA FUNCAO E NAO UM `onerror` ESCRITO INTEIRO no atributo: la' dentro seriam
  // aspas dentro de atributo dentro de texto de programa, tres niveis de escape, e foi
  // exatamente ali que esta pagina quebrou uma vez.
  window.semPrevia = function(img){
    var caixa = img.parentNode;
    img.remove();
    if (caixa && !caixa.querySelector(".vazio")){
      var aviso = document.createElement("span");
      aviso.className = "vazio";
      aviso.textContent = "sem prévia";
      caixa.appendChild(aviso);
    }
  };

  // O CARTAO DO INSIGHTS. A capa leva a' PUBLICACAO e o selo do arroba leva ao PERFIL: sao
  // dois destinos no mesmo cartao, e e' por isso que ele nao e' um link inteiro. Link
  // dentro de link nao existe em HTML.
  function cartaoDePost(p, quem, med){
    var url = "https://www.instagram.com/p/" + p.sc + "/";
    var reel = p.fmt === "reel";
    // Reel se mede em visualizacao e o resto em engajamento: sao as reguas de cada um, e
    // trocar uma pela outra faz reel parecer fraco ao lado de carrossel.
    var numero = reel && p.views ? num(p.views) : num(p.eng);
    var rot = reel && p.views ? "views" : "engaj.";
    // O SINAL DE ESTOURO VIAJA NO SELO, e foi por isso que a aba "Estourou" saiu: ela era
    // uma terceira lista das mesmas publicacoes.
    var forte = p.sinal && p.sinal !== "queda";
    var selo = forte ? (p.sinal === "recorde" ? "recorde" : "estourou") : (p.fmt || "");
    // O VIDEO NO CARTAO, quando existe. Sao os dois campos que o toca-video procura, e
    // eles sao os mesmos da aba de Insights: passar o mouse toca o reel por cima da capa.
    var toca = reel && p.mid ? ' data-mov="1" data-mid="' + p.mid + '"' : "";
    return '<div class="gpost cheio"' + toca + ' data-eng="' + (p.eng || 0) +
        '" data-views="' + (p.views || 0) +
        '" data-quando="' + (p.quando || "").slice(0, 10) + '">' +
      '<a class="gthumb" href="' + url + '" target="_blank" rel="noopener" ' +
        'aria-label="Abrir a publicação">' +
        '<img class="cheia" src="img?sc=' + p.sc + '" alt="" loading="lazy" ' +
          'decoding="async" onerror="window.semPrevia(this)">' +
        '<span class="fmt">' + selo + '</span>' +
        // A RODA SO' APARECE ONDE HA' VIDEO PARA TOCAR, como no Insights. Ela promete
        // uma coisa: passe o mouse e isto roda. Desenhada em reel que nao tem endereco de
        // video guardado, ela promete e nao cumpre -- e vira o jeito mais rapido de saber,
        // olhando, se aquele cartao esta' ligado ao video ou nao.
        (toca ? '<span class="roda"></span>' : "") + '</a>' + quem +
      '<div class="gpe"><span class="gnum"><b>' + numero + '</b> ' + rot + '</span>' +
        // O MULTIPLO SO' ENTRA EM RECORDES, e nao nas galerias. Duas razoes: em Insights o
        // pe' do cartao e' so' a data, e onde o numero mostrado e' visualizacao o multiplo
        // seria de ENGAJAMENTO sobre a mediana -- "14 milhoes de views · 1,9x" sao duas
        // reguas diferentes escritas na mesma linha.
        '<span class="gdata">' +
          (med && !reel ? vg(p.eng / med, 1) + "x · " : "") + _dia(p.quando) + '</span>' +
        botaoIr("Ver o post", url) + '</div></div>';
  }

  // A GALERIA SERVE AS DUAS ABAS: Publicacoes e Reels sao a mesma lista com um filtro a
  // mais. Duas funcoes iguais e' o comeco de duas galerias que envelhecem diferente.
  function galeriaHTML(pre, itens, quem, segunda){
    if (!itens.length)
      return '<div class="gal-vazia">nada nesta aba do acervo ainda.</div>';
    return '<div class="pf-gal-cab"><span class="sub">ordenar</span>' +
        selHTML(pre + "-ordem", "Mais recentes") + '</div>' +
      '<div class="gal gal-4 solto" id="' + pre + '">' +
        itens.map(function(p){ return cartaoDePost(p, quem, 0); }).join("") +
      '</div>' + barraHTML(pre);
  }

  function ligarGaleria(pre, segunda){
    var alvo = document.getElementById(pre);
    if (!alvo || !document.getElementById(pre + "-conta")) return;
    var api = window.montarPaginacao(pre, alvo, NA_PAGINA);
    var itens = [].slice.call(alvo.children);
    window.montarSelect(pre + "-tam", POR_PAGINA_PF, String(NA_PAGINA),
                        function(v){ api.tamanho(v); });

    // ORDENAR ANTES DE PAGINAR, como no Insights: a lista inteira e' reordenada e a
    // paginacao recomeca em cima dela, entao a pagina 1 traz mesmo o primeiro da ordem.
    function ordenar(v){
      var l = itens.slice();
      if (v === "segunda"){
        var campo = segunda === "views" ? "views" : "eng";
        l.sort(function(a, b){
          return Number(b.dataset[campo]) - Number(a.dataset[campo]); });
      } else {
        l.sort(function(a, b){
          return (b.dataset.quando || "").localeCompare(a.dataset.quando || ""); });
      }
      api.definir(l);
    }
    // A SEGUNDA ORDEM MUDA COM O FORMATO, igual ao Insights: no feed e' engajamento, em
    // reel e' visualizacao. Ordenar reel por engajamento faria um reel de um milhao de
    // views parecer fraco ao lado de um carrossel com muito comentario.
    window.montarSelect(pre + "-ordem", [
      {v: "recente", r: "Mais recentes"},
      {v: "segunda", r: segunda === "views" ? "Mais vistos" : "Maior engajamento"}],
      "recente", ordenar);
    ordenar("recente");
  }

  // OS RECORDES SAO DO ACERVO INTEIRO, e nao das sessenta que a lista carrega: o recorde
  // de uma conta pode ser de tres meses atras e sumiria na janela recente.
  //
  // NUMA LINHA SO', que se arrasta para o lado. Em duas linhas eles viravam mais uma grade
  // como as outras abas, e recorde nao e' grade: e' uma FILA, do primeiro ao decimo, e
  // fila se le' para o lado. Quebrada em duas linhas, o primeiro e o quinto ficam na mesma
  // altura e o posto se perde. E' a `.rank-tira` do ranking do Insights, inteira.
  function recordesHTML(d, quem){
    var lista = d.melhores || [], med = d.mediana || 0;
    if (!lista.length)
      return '<div class="gal-vazia">nenhuma publicação medida ainda.</div>';
    return '<div class="rank-tira" id="pf-recs">' + lista.map(function(m, i){
        return '<div class="rank-item"><div class="pos">' + (i + 1) + 'º</div>' +
          cartaoDePost(m, quem, med) + '</div>';
      }).join("") + '</div>' +
      '<div class="rank-nota">arraste a faixa para o lado · os maiores do acervo inteiro, ' +
      'e não da janela recente</div>';
  }

  // OS STORIES NA FITA DO INSIGHTS: um retangulo de 200 por 356 por story, numerado, com a
  // hora na base. DO MAIS ANTIGO PARA O MAIS RECENTE, porque story se le' em sequencia e a
  // sequencia de quem publicou comeca no primeiro. O `fundo` entrega do mais novo para o
  // mais velho, entao a ordem e' virada aqui.
  function storiesHTML(d, u){
    var todos = ((d.stories || {}).todos || []).slice().reverse();
    if (!todos.length)
      return '<div class="gal-vazia">nenhum story visto ainda. A varredura passa de hora ' +
             'em hora, e depende da sessão do Instagram.</div>';
    var agora = Date.now(), noAr = 0;
    todos.forEach(function(s){
      if (agora - Date.parse(s.quando) < UM_DIA) noAr++; });
    var pecas = todos.map(function(s, i){
      var velho = agora - Date.parse(s.quando) >= UM_DIA;
      // SEM MINIATURA GUARDADA nao ha' o que desenhar: o story ja' passou e o endereco
      // dele morreu junto. Se o arquivo foi salvo no Drive, a tela diz isso, porque e' a
      // diferenca entre "perdi" e "esta' guardado la'".
      var dentro = s.tem
        ? '<img src="img?sc=st:' + s.id + '" loading="lazy" alt="">'
        : '<span class="st-vazio">' + (s.salvo ? "no Drive" : "expirado") + '</span>';
      return '<a class="st-item' + (velho ? " arquivado" : "") + '" target="_blank" ' +
        'rel="noopener" href="https://www.instagram.com/stories/' + seguro(u) + '/' +
        s.id + '/" aria-label="Abrir o story ' + (i + 1) + '">' + dentro +
        '<span class="st-n">' + (i + 1) + '</span>' +
        (s.tipo === "video" ? '<span class="st-video"></span>' : "") +
        '<span class="st-hora">' + _dia(s.quando) + " " +
        (s.quando || "").slice(11, 16) + '</span></a>';
    });
    // SEM A MOLDURA `.st-perfil` do Insights, e so' ela. La' a fita e' de uma conta entre
    // varias, e a moldura separa uma da outra; aqui a fita ja' esta' dentro da caixa do
    // acervo, e uma caixa dentro da outra e' so' borda.
    return '<div class="st-cab"><span class="st-ordem">do mais antigo ao mais recente' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/>' +
      '<path d="m12 5 7 7-7 7"/></svg></span>' +
      '<span class="conta">no ar ' + noAr + ' · arquivados ' + (todos.length - noAr) +
      '</span></div><div class="st-fita" id="pf-fita">' + pecas.join("") + '</div>';
  }

  function acervo(d){
    return '<section class="pf-bl largo" id="pf-acervo">' +
      '<div class="pf-bl-cab"><h3>Acervo</h3>' +
        '<span>tudo que o sistema guardou desta conta</span></div>' +
      '<div class="pf-cx pf-acv">' +
        '<div class="pf-abas" role="tablist">' + ABAS.map(function(a, i){
          return '<button type="button" role="tab" data-aba="' + a.k + '"' +
            ' aria-selected="' + (i ? "false" : "true") + '" class="' + (i ? "" : "on") +
            '">' + a.r + '<span class="pf-aba-c">' + num(contaDaAba(a.k, d)) +
            '</span></button>';
        }).join("") + '</div>' +
        '<div class="pf-aba-corpo"></div>' +
      '</div></section>';
  }

  function pintarAcervo(d, u, meta){
    var caixa = onde.querySelector("#pf-acervo");
    if (!caixa) return;
    var corpo = caixa.querySelector(".pf-aba-corpo");
    var bts = [].slice.call(caixa.querySelectorAll("[data-aba]"));
    var quem = quemHTML(u, meta), med = d.mediana || 0;

    function abrir(k){
      bts.forEach(function(b){
        var on = b.dataset.aba === k;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (k === "rec"){
        corpo.innerHTML = recordesHTML(d, quem);
        window.arrastarParaRolar(document.getElementById("pf-recs"));
      } else if (k === "str"){
        corpo.innerHTML = storiesHTML(d, u);
        window.arrastarParaRolar(document.getElementById("pf-fita"));
      } else {
        var regua = k === "reel" ? "views" : "eng";
        corpo.innerHTML = galeriaHTML("pf-" + k, daAba(k, d), quem, regua);
        ligarGaleria("pf-" + k, regua);
      }
    }
    bts.forEach(function(b){
      b.addEventListener("click", function(){ abrir(b.dataset.aba); });
    });
    abrir("rec");
  }

  // ====================================================================== A MAQUINA
  //
  // OS DOIS BLOCOS QUE FALAM DO TRACKER, e nao da conta: se a coleta esta' de pe' e o que
  // ela de fato pegou de tudo que a conta publicou. Eles ficam por ultimo de proposito, e
  // por isso mesmo ficam COMPLETOS: mandar para o fim e' hierarquia, encolher ate' virar
  // rodape' seria esconder. Foi a correcao do Gabriel em 15/08.
  function maquina(d, onde3){
    var col = d.coleta || {};
    var saude = '<div class="pf-cx"><div class="pf-sd-cab">estado da coleta' +
      (col.erro ? '<span class="pino ruim">com erro</span>'
                : '<span class="pino ok">sem erro</span>') + '</div>' +
      '<dl class="pf-par">' +
        '<div><dt>monitorada desde</dt><dd>' + _dia(d.desde) + '</dd></div>' +
        '<div><dt>última leitura</dt><dd>' + _dia(col.ultima) +
          '<i>' + (col.ultima || "").slice(11, 16) + '</i></dd></div>' +
        '<div><dt>leituras no acervo</dt><dd>' + num(col.leituras || 0) + '</dd></div>' +
      '</dl>' +
      (col.erro ? '<p class="pf-sd-erro">' + seguro(String(col.erro).slice(0, 120)) +
                  '</p>' : "") + '</div>';
    return '<div class="pf-l2 pf-maq">' +
      caixa("Onde ela está", "comparada com o mercado dela", onde3) +
      caixa("Saúde da coleta", "se a máquina está de pé", saude) +
      '</div>';
  }

  // A CAIXA COM CABECALHO. Titulo, uma linha fina do lado dizendo do que aquilo fala, e o
  // canto direito para a base do numero quando ela nao e' obvia.
  function caixa(titulo, sub, corpo, dir_, dobrado){
    return '<section class="pf-bl' + (dobrado ? " dobrado" : "") + '">' +
      '<div class="pf-bl-cab"><h3>' + titulo + '</h3>' +
      (sub ? '<span>' + sub + '</span>' : "") +
      (dir_ ? '<span class="dir">' + dir_ + '</span>' : "") + '</div>' + corpo +
      '</section>';
  }

  // ------------------------------------------------------------------------ o desenho
  //
  // CINCO ZONAS, E CADA UMA RESPONDE UMA PERGUNTA SO'. A planta que o Gabriel aprovou em
  // 15/08, no lugar das duas colunas de 14/08:
  //
  //   1. QUEM E' A CONTA, numa faixa presa no topo. Ela some da leitura e nao da tela, e
  //      isso devolveu os 380 pixels que a coluna fixa comia so' para nao sair de vista.
  //   2. OS SEIS NUMEROS, com o periodo mandando neles.
  //   3. A HISTORIA: a linha do tempo, e ao lado onde ela esta' no mercado dela.
  //   4. O QUE FUNCIONA NELA: formatos, ritmo e curva de vida, lado a lado para o olho
  //      comparar sem descer meia tela.
  //   5. O ACERVO em abas, e por ultimo a maquina.
  //
  // A REGUA DE CONTEUDO CONTINUA SENDO "UM DADO, UM LUGAR": se o grafico ja' diz, nao tem
  // frase repetindo; se um numero ja' esta' dentro de um bloco, ele nao vira cartao.
  function desenharPerfil(u, d){
    var meta = metaDe(u);
    var etqs = meta.etqs, nome = meta.nome;
    var vao = vaoEmDias(d);
    // TRINTA DIAS QUANDO A CONTA TEM MAIS QUE ISSO, e tudo quando ela tem menos. O mes e' a
    // janela em que se lê crescimento; numa conta de seis dias, recortar sete esconderia
    // justamente o comeco dela.
    var periodo = vao > 30 ? 30 : 0;

    onde.innerHTML =
      // ---------------------------------------------------------- 1. quem e' a conta
      '<header class="pf-topo">' +
        '<span class="pcard-retrato pf-retrato"><span class="pcard-avatar av-' + u +
          '"' + (meta.avatar ? ' style="background-image:url(' + meta.avatar + ')"' : "") +
          '>' + (meta.avatar ? "" : seguro(u.slice(0, 1)).toUpperCase()) +
          '</span></span>' +
        '<div class="pf-topo-quem"><h2>' + seguro(nome || "sem nome no perfil") + '</h2>' +
          '<p>@' + seguro(u) + '</p></div>' +
        '<div class="pf-marcas">' +
          (d.nicho ? '<span class="pf-nicho">' + seguro(d.nicho) + '</span>' : "") +
          etqs.map(window.etiquetaHTML).join("") +
        '</div>' +
        // O BOTAO E' O DA CASA, com seta, circulo e o selo do Instagram dentro do texto:
        // o mesmo do resto do sistema, e nao um retangulo qualquer.
        '<a class="btn pf-btn-ig" href="https://www.instagram.com/' + u +
          '/" target="_blank" rel="noopener">' +
          '<svg class="seta seta-esq" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
          '<span class="txt"><svg class="pf-ig-selo" aria-hidden="true">' +
            '<use href="#i-ig-cor"/></svg>Abrir no Instagram</span>' +
          '<span class="circ"></span>' +
          '<svg class="seta seta-dir" viewBox="0 0 24 24"><use href="#i-seta"/></svg>' +
        '</a>' +
      '</header>' +

      // ------------------------------------------------------------- 2. os numeros
      '<div class="pf-faixa grf-mae" id="pf-faixa"></div>' +

      // ------------------------------------------------------------- 3. a historia
      // A LINHA DO TEMPO OCUPA A LINHA INTEIRA. Dividindo espaço com "Onde ela está"
      // ela ficava com metade da largura, e é o bloco que mais precisa de largura: o
      // eixo dela é o tempo, e tempo espremido junta publicações que aconteceram em
      // dias diferentes no mesmo pixel.
      '<div class="pf-l1">' +
        caixa("Linha do tempo",
              "seguidores, ganho do dia e cada publicação na mesma régua",
              '<div id="pf-tl"></div>', num((d.coleta || {}).leituras || 0) +
              " leituras") +
      '</div>' +

      // O MAPA DE DIA E HORA E A CURVA DE VIDA SAIRAM DAQUI.
      //
      // O mapa dizia a mesma coisa que o cartao de Ritmo la' de cima, e a divisao por
      // formato virou aba dele: tres lugares para a mesma pergunta e' onde nascem tres
      // respostas que discordam. A curva de vida saiu por decisao do Gabriel em 16/08.

      // --------------------------------------------------- 5. o acervo e a maquina
      acervo(d) +

      // ONDE ELA ESTA' FECHA A PAGINA, ao lado da saude da coleta.
      //
      // Ela desceu de cima porque la' competia com a linha do tempo, que e' a leitura
      // principal do perfil. Sozinha numa linha inteira ela ficava larga demais para o
      // que diz; a saude da coleta e' curta e cabe do lado.
      maquina(d, ondeEla(u, d, meta));

    // O PERIODO REDESENHA SO' O QUE ELE GOVERNA. Redesenhar a pagina inteira perderia a
    // aba aberta do acervo e a pagina da galeria, que nao tem nada a ver com periodo.
    var faixa = onde.querySelector("#pf-faixa");
    var alvoTl = onde.querySelector("#pf-tl");

    function pintarPeriodo(dias){
      periodo = dias;
      var rec = recortar(d, dias);
      // A LISTA DE CARTOES E' REFEITA A CADA PERIODO: cada um guarda a propria serie e a
      // propria vista, e o `pintarCartoes` desenha depois que o HTML esta' na tela.
      cartoesDaFaixa = [];
      faixa.innerHTML = barraDePeriodo(vao, dias, (rec.curva || []).length) +
        '<div class="pf-nums grf-mae">' + numeros(d, rec, meta, dias, d) + '</div>';
      pintarCartoes();
      montarLinhaDoTempo(alvoTl, rec, dias, d);
      [].forEach.call(faixa.querySelectorAll("[data-per]"), function(b){
        b.addEventListener("click", function(){
          if (!b.disabled) pintarPeriodo(Number(b.dataset.per));
        });
      });
    }

    pintarPeriodo(periodo);
    pintarAcervo(d, u, meta);
  }


  // A FORMA DO PERFIL, desenhada em osso, para ocupar o lugar enquanto o acervo vem da
  // rede. Ela copia a anatomia real (retrato redondo, seis numeros, grafico) para o que
  // chega depois cair exatamente no mesmo lugar, sem nada saltar.
  var OSSO =
    '<div class="pf-osso">' +
      '<div class="pf-osso-id"><div class="redondo"></div>' +
        '<div class="linhas"><i style="height:22px;width:210px"></i>' +
          '<i style="height:13px;width:130px"></i>' +
          '<i style="height:22px;width:250px"></i></div></div>' +
      '<div class="pf-osso-numeros">' +
        '<i></i><i></i><i></i><i></i><i></i><i></i></div>' +
      '<i class="pf-osso-grafico"></i>' +
      '<i style="height:150px;border:1px solid var(--rule-solid)"></i>' +
    '</div>';

  // ABRIR UMA CONTA: o esqueleto agora, o acervo quando a rede responder.
  //
  // AS DUAS BUSCAS SAO UMA ESPERA SO': o acervo desta conta e a ficha de todas elas. A
  // ficha e' o mesmo arquivo que o painel usa e, depois da primeira vez, ja' esta' na mao.
  function abrirConta(u, aoTerminar){
    if (!onde) return Promise.resolve();
    onde.className = "";
    onde.innerHTML = OSSO;
    return Promise.all([
      fetch("conta?u=" + encodeURIComponent(u), {cache: "no-store"})
        .then(function(r){ return r.json(); }),
      carregarPerfis()
    ]).then(function(par){
      var d = par[0];
      if (d.erro) throw new Error(d.erro);
      desenharPerfil(u, d);
      // O conteudo entra escalonado, na ordem em que se le'. A classe e' posta no quadro
      // seguinte para o navegador enxergar o estado inicial da animacao.
      requestAnimationFrame(function(){
        onde.className = "chegando";
        if (aoTerminar) aoTerminar();
      });
    }).catch(function(err){
      onde.innerHTML = '<div class="gal-vazia">não consegui abrir @' + seguro(u) +
        ': ' + seguro(err.message) + '</div>';
    });
  }

  window.Perfil = {desenhar: desenharPerfil, carregar: carregarPerfis, abrir: abrirConta};
})();

