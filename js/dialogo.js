/**
 * TipLabs - Janela de confirmação e avisos rápidos do editor.
 *
 * Dialogo.confirmar(...) substitui o window.confirm do navegador, que mostrava "localhost:8080 says" e não aceitava
 * o visual do editor (pedido do usuário em 2026-10-09). Devolve uma Promise<boolean>. Esc cancela, Enter confirma,
 * clicar fora cancela.
 *
 *   await Dialogo.confirmar({
 *     titulo: 'Retomar a criação',
 *     aviso: { tipo: 'parado', titulo: 'Onde parou', texto: 'OpenRouter: acabou o crédito...' },  // opcional
 *     texto: 'A criação continua de onde parou...',                                                  // opcional
 *     itens: [{ rotulo: 'Cenas de acervo', valor: '0', nota: 'grátis' }],                            // opcional
 *     custo: 'até US$ 0,12',                                                                         // opcional
 *     confirmar: 'Continuar', cancelar: 'Cancelar', perigo: false,
 *   })
 *
 * Aviso.mostrar(texto, tipo) desenha os avisos rápidos do canto da tela (o App.notify chama ele): ícone, faixa de
 * cor do tipo (success, error, warning, info), botão de fechar e uma barra que mostra o tempo que falta e pausa
 * com o mouse em cima. O texto entra como texto, nunca como HTML.
 */
(function () {
  const ICONES = {
    success: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    error: '<path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    warning: '<path d="M12 7.5v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.4" fill="currentColor"/>',
    info: '<path d="M12 11v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="7.4" r="1.4" fill="currentColor"/>',
    parado: '<rect x="8" y="7" width="2.6" height="10" rx="1" fill="currentColor"/><rect x="13.4" y="7" width="2.6" height="10" rx="1" fill="currentColor"/>',
    pergunta: '<path d="M9.2 9.2a2.9 2.9 0 1 1 4.1 2.7c-.9.4-1.3 1-1.3 1.9v.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.3" fill="currentColor"/>',
  };
  const icone = (tipo) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[tipo] || ICONES.info}</svg>`;

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  // -------------------------------------------------------------------------------------------- confirmação
  let aberta = null;

  function confirmar(opcoes) {
    const o = Object.assign({ titulo: 'Confirmar', confirmar: 'Continuar', cancelar: 'Cancelar', perigo: false }, opcoes || {});
    if (aberta) aberta.fechar(false);
    return new Promise((resolver) => {
      const fundo = el('div', 'dlg-fundo');
      const janela = el('div', 'dlg' + (o.perigo ? ' dlg-perigo' : ''));
      janela.setAttribute('role', 'dialog');
      janela.setAttribute('aria-modal', 'true');
      const idTitulo = 'dlg-titulo-' + Date.now();
      janela.setAttribute('aria-labelledby', idTitulo);

      const topo = el('div', 'dlg-topo');
      const marca = el('div', 'dlg-icone');
      marca.innerHTML = icone(o.perigo ? 'error' : 'pergunta');
      const titulo = el('h2', 'dlg-titulo', o.titulo);
      titulo.id = idTitulo;
      topo.append(marca, titulo);
      janela.appendChild(topo);

      const corpo = el('div', 'dlg-corpo');
      if (o.aviso && o.aviso.texto) {
        const tipo = o.aviso.tipo || 'parado';
        const caixa = el('div', `dlg-aviso dlg-aviso-${tipo}`);
        const ic = el('span', 'dlg-aviso-icone');
        ic.innerHTML = icone(tipo === 'erro' ? 'error' : tipo);
        const textos = el('div', 'dlg-aviso-textos');
        if (o.aviso.titulo) textos.appendChild(el('strong', null, o.aviso.titulo));
        textos.appendChild(el('span', null, o.aviso.texto));
        caixa.append(ic, textos);
        corpo.appendChild(caixa);
      }
      if (o.texto) corpo.appendChild(el('p', 'dlg-texto', o.texto));
      if (o.itens && o.itens.length) {
        const lista = el('dl', 'dlg-itens');
        o.itens.forEach((it) => {
          const linha = el('div', 'dlg-item' + (it.destaque ? ' dlg-item-forte' : ''));
          linha.appendChild(el('dt', null, it.rotulo));
          const valor = el('dd', null, String(it.valor));
          if (it.nota) valor.appendChild(el('small', null, it.nota));
          linha.appendChild(valor);
          lista.appendChild(linha);
        });
        corpo.appendChild(lista);
      }
      if (o.custo) {
        const custo = el('div', 'dlg-custo');
        custo.appendChild(el('span', null, 'Custo estimado'));
        custo.appendChild(el('strong', null, o.custo));
        corpo.appendChild(custo);
      }
      janela.appendChild(corpo);

      const rodape = el('div', 'dlg-rodape');
      const nao = el('button', 'btn btn-secondary dlg-botao', o.cancelar);
      const sim = el('button', 'btn dlg-botao ' + (o.perigo ? 'btn-danger dlg-sim-perigo' : 'btn-cta'), o.confirmar);
      nao.type = sim.type = 'button';
      rodape.append(nao, sim);
      janela.appendChild(rodape);
      fundo.appendChild(janela);
      document.body.appendChild(fundo);

      const antes = document.activeElement;
      const teclas = (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); fechar(false); }
        else if (ev.key === 'Enter' && document.activeElement !== nao) { ev.preventDefault(); fechar(true); }
        else if (ev.key === 'Tab') {  // o foco fica dentro da janela
          ev.preventDefault();
          (document.activeElement === sim ? nao : sim).focus();
        }
      };
      function fechar(resposta) {
        document.removeEventListener('keydown', teclas, true);
        fundo.classList.remove('aberto');
        setTimeout(() => fundo.remove(), 180);
        aberta = null;
        if (antes && typeof antes.focus === 'function') antes.focus();
        resolver(resposta);
      }
      nao.addEventListener('click', () => fechar(false));
      sim.addEventListener('click', () => fechar(true));
      fundo.addEventListener('mousedown', (ev) => { if (ev.target === fundo) fechar(false); });
      document.addEventListener('keydown', teclas, true);
      aberta = { fechar };
      requestAnimationFrame(() => { fundo.classList.add('aberto'); (o.perigo ? nao : sim).focus(); });
    });
  }

  // -------------------------------------------------------------------------------------------- avisos rápidos
  const DURACAO = { success: 4000, info: 4500, warning: 6500, error: 7000 };
  const TITULOS = { success: 'Pronto', info: 'Aviso', warning: 'Atenção', error: 'Algo deu errado' };

  function mostrar(texto, tipo) {
    tipo = DURACAO[tipo] ? tipo : 'info';
    const lugar = document.getElementById('toast-container');
    if (!lugar) return;
    const aviso = el('div', `toast toast-${tipo}`);
    aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    const ic = el('span', 'toast-icone');
    ic.innerHTML = icone(tipo);
    const textos = el('div', 'toast-textos');
    textos.appendChild(el('strong', 'toast-titulo', TITULOS[tipo]));
    textos.appendChild(el('span', 'toast-msg', texto));
    const fechar = el('button', 'toast-fechar', '×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Fechar aviso');
    const barra = el('i', 'toast-barra');
    aviso.append(ic, textos, fechar, barra);
    lugar.appendChild(aviso);
    // no máximo 4 na tela: o mais antigo sai
    while (lugar.children.length > 4) lugar.firstElementChild.remove();

    let resta = DURACAO[tipo], desde = 0, relogio = null, saiu = false;
    const sair = () => {
      if (saiu) return;
      saiu = true;
      clearTimeout(relogio);
      aviso.classList.add('saindo');
      setTimeout(() => aviso.remove(), 220);
    };
    const correr = () => {
      desde = Date.now();
      barra.style.transition = `transform ${resta}ms linear`;
      barra.style.transform = 'scaleX(0)';
      relogio = setTimeout(sair, resta);
    };
    const pausar = () => {
      clearTimeout(relogio);
      resta = Math.max(400, resta - (Date.now() - desde));
      const atual = getComputedStyle(barra).transform;
      barra.style.transition = 'none';
      barra.style.transform = atual === 'none' ? 'scaleX(1)' : atual;
    };
    aviso.addEventListener('mouseenter', pausar);
    aviso.addEventListener('mouseleave', correr);
    fechar.addEventListener('click', sair);
    requestAnimationFrame(() => { aviso.classList.add('entrou'); requestAnimationFrame(correr); });
  }

  window.Dialogo = { confirmar };
  window.Aviso = { mostrar };
})();
