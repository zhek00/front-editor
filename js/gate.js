/**
 * TipLabs - Portão de acesso
 *
 * Cobre a tela inteira até a própria fábrica confirmar que o token serve.
 * Pede o token toda vez que o site é carregado, mesmo que um token válido já
 * tenha sido usado numa visita anterior e continue salvo no navegador — não
 * existe liberação automática. Quem decide se o token vale é sempre o
 * servidor, nunca o navegador.
 */

const Gate = {
  overlay: null,
  form: null,
  inputUrl: null,
  inputToken: null,
  status: null,
  btnEntrar: null,

  /** Mostra o portão e espera a pessoa digitar o token. Não pula a pergunta
   *  mesmo que já tenha um token salvo de uma visita anterior — cada
   *  carregamento do site pede de novo, de propósito. Só chama `aoLiberar`
   *  depois de a fábrica confirmar o token de verdade. */
  async exigir(aoLiberar) {
    this.overlay = document.getElementById('gate-token');
    this.form = document.getElementById('gate-form');
    this.inputUrl = document.getElementById('gate-input-url');
    this.inputToken = document.getElementById('gate-input-token');
    this.status = document.getElementById('gate-status');
    this.btnEntrar = document.getElementById('gate-btn-entrar');

    if (!this.overlay || !this.form) {
      // painel corrompido sem o portão no HTML: não libera nada
      return;
    }

    // só o endereço vem preenchido, por conveniência; o token nunca, mesmo
    // que exista um salvo — a pessoa tem que digitar de novo sempre
    const conexao = API.getConexao();
    if (this.inputUrl) this.inputUrl.value = conexao.url || '';

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.tentar(aoLiberar);
    });

    this.mostrarStatus('');
  },

  async tentar(aoLiberar) {
    const url = this.inputUrl?.value || '';
    const token = this.inputToken?.value || '';

    if (!token.trim()) {
      this.mostrarStatus('Digite o token de acesso.', true);
      return;
    }

    API.setConexao({ url, token });
    this.btnEntrar.disabled = true;
    this.btnEntrar.textContent = 'Verificando…';
    this.mostrarStatus('Verificando com a fábrica…');

    const ok = await this.testar();

    this.btnEntrar.disabled = false;
    this.btnEntrar.textContent = 'Entrar';

    if (ok) {
      this.liberar(aoLiberar);
    }
  },

  /** true só quando a fábrica de verdade aceitou o token — nunca confia em
   *  "o campo não está vazio" como se fosse prova de nada. */
  async testar() {
    try {
      await API.testarConexao();
      return true;
    } catch (err) {
      this.mostrarStatus(err.message || 'Não consegui confirmar o token.', true);
      return false;
    }
  },

  liberar(aoLiberar) {
    this.overlay.classList.add('gate-liberado');
    document.getElementById('app-shell')?.classList.add('gate-ok');
    aoLiberar();
  },

  mostrarStatus(texto, erro = false) {
    if (!this.status) return;
    this.status.textContent = texto;
    this.status.classList.toggle('gate-status-erro', !!erro);
  },
};
