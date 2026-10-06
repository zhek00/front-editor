/**
 * TipLabs - Aviso de "APIs gratuitas esgotadas".
 *
 * A fábrica usa só modelos gratuitos (Groq e os gratuitos do OpenRouter). Quando todos chegam ao limite, a tarefa
 * para e espera, sem gastar nada, até a pessoa decidir aqui: liberar o modelo pago neste vídeo até o fim do dia,
 * ou continuar esperando os gratuitos voltarem (a tarefa segue sozinha quando um deles volta).
 *
 * O aviso chega por dois caminhos: o campo pago_pendente de toda consulta de andamento (API.getStatus) e uma
 * consulta leve a /pago a cada 15 s enquanto o editor de um projeto está aberto.
 */
const PagoAviso = {
  nome: null,
  adiadoAte: {},   // projeto -> até quando a pessoa pediu para esperar os gratuitos (o aviso não volta antes)
  el: null,

  iniciar() {
    setInterval(() => this.conferir(), 15000);
    window.addEventListener('hashchange', () => this.conferir());
    this.conferir();
  },

  projetoDaTela() {
    const m = (window.location.hash || '').match(/^#\/editor\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  },

  async conferir() {
    const nome = this.projetoDaTela();
    if (!nome) return;
    try {
      const res = await API.req(`/api/projetos/${encodeURIComponent(nome)}/pago`);
      if (!res.ok) return;
      const dados = await res.json();
      this.mostrar(nome, dados.pendente);
    } catch (_) { /* fábrica fora do ar: a tela de conexão já avisa */ }
  },

  /** Chamado com o pago_pendente da fábrica (null quando nada espera). */
  mostrar(nome, pendente) {
    if (!pendente) {
      if (this.nome === nome) this.fechar();
      return;
    }
    if (Date.now() < (this.adiadoAte[nome] || 0)) return;
    this.nome = nome;
    this.montar();
    const dinheiro = (v) => `US$ ${Number(v).toFixed(v < 0.01 ? 4 : 2).replace('.', ',')}`;
    const porChamada = pendente.custo_por_chamada_usd
      ? `uns ${dinheiro(pendente.custo_por_chamada_usd)} por chamada, medido neste vídeo`
      : 'o custo por chamada aparece em Custos depois do uso';
    this.el.querySelector('[data-pago="etapa"]').textContent = pendente.etapa || 'uma etapa';
    this.el.querySelector('[data-pago="modelo"]').textContent = pendente.modelo || '';
    this.el.querySelector('[data-pago="preco"]').textContent = porChamada;
    this.el.querySelector('[data-pago="hoje"]').textContent = dinheiro(pendente.gasto_pago_hoje_usd || 0);
    this.el.querySelector('[data-pago="projeto"]').textContent = nome;
    this.el.querySelector('[data-pago="erro"]').textContent = '';
    this.el.classList.add('open');
  },

  fechar() {
    if (this.el) this.el.classList.remove('open');
  },

  esperar() {
    // os gratuitos voltam sozinhos (o limite do minuto em segundos, o do dia no dia seguinte): a tarefa segue com eles
    if (this.nome) this.adiadoAte[this.nome] = Date.now() + 10 * 60 * 1000;
    this.fechar();
  },

  async liberar() {
    const nome = this.nome;
    const botao = this.el.querySelector('[data-pago="liberar"]');
    botao.disabled = true;
    try {
      const res = await API.req(`/api/projetos/${encodeURIComponent(nome)}/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liberar: true }),
      });
      if (!res.ok) throw new Error(`a fábrica respondeu ${res.status}`);
      this.fechar();
    } catch (erro) {
      this.el.querySelector('[data-pago="erro"]').textContent = `Não deu para liberar: ${erro.message}`;
    } finally {
      botao.disabled = false;
    }
  },

  montar() {
    if (this.el) return;
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.style.zIndex = '2000';  // por cima da janela de progresso da criação e do render
    el.innerHTML = `
      <div class="modal-card" style="max-width: 560px;">
        <div class="modal-header">
          <span class="modal-title">APIs gratuitas esgotadas</span>
          <span class="badge" data-pago="projeto"></span>
        </div>
        <div class="modal-body" style="padding: 18px; line-height: 1.55;">
          <p style="margin: 0 0 12px;">
            Todos os modelos gratuitos (Groq e os gratuitos do OpenRouter) chegaram ao limite na etapa
            <strong data-pago="etapa"></strong>. A fábrica parou e está <strong>esperando, sem gastar nada</strong>.
          </p>
          <p style="margin: 0 0 12px;">
            Para seguir agora, ela usaria o modelo pago <strong data-pago="modelo"></strong>
            (<span data-pago="preco"></span>). Hoje este vídeo já gastou <strong data-pago="hoje"></strong> em modelo pago.
          </p>
          <p style="margin: 0; color: var(--text-muted, #9aa3b2); font-size: 13px;">
            Se preferir esperar, a tarefa continua sozinha quando um gratuito voltar: o limite por minuto volta em
            segundos, e o limite do dia volta no dia seguinte. Liberar vale só para este vídeo, até o fim do dia.
          </p>
          <p data-pago="erro" style="margin: 10px 0 0; color: #f87171;"></p>
        </div>
        <div class="modal-footer" style="padding: 12px 18px; border-top: 1px solid var(--border-subtle); display: flex; gap: 10px; justify-content: flex-end; background: var(--bg-surface);">
          <button class="btn btn-secondary" data-pago="esperar">Esperar os gratuitos</button>
          <button class="btn btn-cta" data-pago="liberar">Usar a API paga</button>
        </div>
      </div>`;
    el.querySelector('[data-pago="esperar"]').addEventListener('click', () => this.esperar());
    el.querySelector('[data-pago="liberar"]').addEventListener('click', () => this.liberar());
    document.body.appendChild(el);
    this.el = el;
  },
};

window.PagoAviso = PagoAviso;
document.addEventListener('DOMContentLoaded', () => PagoAviso.iniciar());
