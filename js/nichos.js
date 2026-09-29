/**
 * TipLabs - Procurar Nichos
 * Busca vídeos recentes com visualização muito acima do tamanho do canal —
 * o sinal mais forte de nicho quente — usando só dados públicos do YouTube.
 */

class NichosPage {
  constructor(app) {
    this.app = app;
    this.resultados = [];
    this.canalAtual = null;
    this.proximaPagina = null;

    this.form = document.getElementById('form-buscar-nichos');
    this.input = document.getElementById('input-busca-nichos');
    this.btnBuscar = document.getElementById('btn-buscar-nichos');
    this.status = document.getElementById('nichos-status');
    this.grade = document.getElementById('nichos-grade');

    this.modalCanal = document.getElementById('modal-canal-videos');
    this.btnModalCanalClose = document.getElementById('btn-modal-canal-close');
    this.canalModalAvatar = document.getElementById('canal-modal-avatar');
    this.canalModalNome = document.getElementById('canal-modal-nome');
    this.canalModalGrade = document.getElementById('canal-modal-grade');
    this.btnCarregarMais = document.getElementById('btn-canal-carregar-mais');

    this.bind();
  }

  bind() {
    document.getElementById('btn-voltar-nichos')?.addEventListener('click', () => this.app.showView('dashboard'));

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.buscar();
    });

    this.btnModalCanalClose?.addEventListener('click', () => this.fecharCanal());
    this.modalCanal?.addEventListener('click', (e) => {
      if (e.target === this.modalCanal) this.fecharCanal();
    });
    this.btnCarregarMais?.addEventListener('click', () => this.carregarMaisVideosCanal());
  }

  /* ---------------------------------------------------------
     Busca
     --------------------------------------------------------- */
  async buscar() {
    const termo = (this.input?.value || '').trim();
    if (!termo) {
      this.mostrarStatus('Digite um nicho ou palavra-chave para buscar.', true);
      return;
    }

    this.btnBuscar.disabled = true;
    this.btnBuscar.textContent = 'Buscando…';
    this.mostrarStatus('Buscando no YouTube…');
    if (this.grade) this.grade.innerHTML = '';

    try {
      const dados = await API.buscarNichos(termo, 30);
      this.resultados = dados.videos || [];
      this.desenharResultados();
    } catch (err) {
      this.mostrarStatus(err.message, true);
    } finally {
      this.btnBuscar.disabled = false;
      this.btnBuscar.textContent = 'Buscar';
    }
  }

  mostrarStatus(texto, erro = false) {
    if (!this.status) return;
    this.status.textContent = texto;
    this.status.classList.toggle('nichos-status-erro', !!erro);
  }

  desenharResultados() {
    if (!this.grade) return;
    this.grade.innerHTML = '';

    if (!this.resultados.length) {
      this.mostrarStatus('Nenhum vídeo com esse nível de visualização nos últimos 30 dias. Tente outro termo.');
      return;
    }
    const qtd = this.resultados.length;
    this.mostrarStatus(`${qtd} vídeo${qtd === 1 ? '' : 's'} encontrado${qtd === 1 ? '' : 's'}, do mais pra o menos acima do normal do canal.`);

    const frag = document.createDocumentFragment();
    this.resultados.forEach(v => frag.appendChild(this.cartaoVideo(v)));
    this.grade.appendChild(frag);
  }

  cartaoVideo(v) {
    const card = document.createElement('div');
    card.className = 'nicho-card';

    const thumbWrap = document.createElement('a');
    thumbWrap.href = `https://youtube.com/watch?v=${v.video_id}`;
    thumbWrap.target = '_blank';
    thumbWrap.rel = 'noopener noreferrer';
    thumbWrap.className = 'nicho-thumb-wrap';
    thumbWrap.title = 'Abrir no YouTube';

    const thumb = document.createElement('img');
    thumb.src = v.miniatura;
    thumb.loading = 'lazy';
    thumb.alt = '';
    thumbWrap.appendChild(thumb);

    const taxa = document.createElement('span');
    taxa.className = 'nicho-taxa';
    taxa.textContent = `${this.numero(v.taxa)}x inscritos`;
    thumbWrap.appendChild(taxa);
    card.appendChild(thumbWrap);

    const titulo = document.createElement('div');
    titulo.className = 'nicho-titulo';
    titulo.textContent = v.titulo;
    card.appendChild(titulo);

    const stats = document.createElement('div');
    stats.className = 'nicho-stats';
    const diasTexto = v.dias_no_ar < 1 ? 'hoje' : `há ${Math.round(v.dias_no_ar)} dia${Math.round(v.dias_no_ar) === 1 ? '' : 's'}`;
    [`${this.numero(v.visualizacoes)} visualizações`, `${this.numero(v.visualizacoes_por_dia)}/dia`, diasTexto].forEach(texto => {
      const span = document.createElement('span');
      span.textContent = texto;
      stats.appendChild(span);
    });
    card.appendChild(stats);

    const canal = document.createElement('button');
    canal.type = 'button';
    canal.className = 'nicho-canal';
    canal.title = 'Ver todos os vídeos desse canal';

    const avatar = document.createElement('img');
    avatar.src = v.canal_avatar;
    avatar.alt = '';
    avatar.className = 'nicho-canal-avatar';
    canal.appendChild(avatar);

    const info = document.createElement('span');
    info.className = 'nicho-canal-info';
    const nome = document.createElement('strong');
    const bandeira = this.bandeira(v.canal_pais);
    nome.textContent = bandeira ? `${bandeira} ${v.canal_nome}` : v.canal_nome;
    const numeros = document.createElement('small');
    numeros.textContent = `${this.numero(v.canal_inscritos)} inscritos · ${this.numero(v.canal_total_videos)} vídeos`;
    info.append(nome, numeros);
    canal.appendChild(info);

    canal.addEventListener('click', () => this.abrirCanal(v));
    card.appendChild(canal);

    return card;
  }

  numero(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }

  /** Converte o código do país (ex: "US") na bandeira emoji correspondente.
   *  Vazio quando o canal não preencheu o país no YouTube. */
  bandeira(codigo) {
    if (!codigo || codigo.length !== 2) return '';
    return codigo.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }

  /* ---------------------------------------------------------
     Modal: todos os vídeos de um canal
     --------------------------------------------------------- */
  async abrirCanal(v) {
    this.canalAtual = v.canal_id;
    this.proximaPagina = null;

    if (this.canalModalAvatar) this.canalModalAvatar.src = v.canal_avatar;
    if (this.canalModalNome) this.canalModalNome.textContent = v.canal_nome;
    if (this.canalModalGrade) {
      this.canalModalGrade.innerHTML = '';
      const carregando = document.createElement('p');
      carregando.className = 'nichos-status';
      carregando.textContent = 'Carregando vídeos…';
      this.canalModalGrade.appendChild(carregando);
    }
    if (this.btnCarregarMais) this.btnCarregarMais.style.display = 'none';
    this.modalCanal?.classList.add('open');

    await this.carregarVideosCanal(true);
  }

  fecharCanal() {
    this.modalCanal?.classList.remove('open');
    this.canalAtual = null;
  }

  async carregarVideosCanal(primeira) {
    if (!this.canalAtual) return;
    try {
      const dados = await API.videosDoCanal(this.canalAtual, primeira ? undefined : this.proximaPagina);
      this.proximaPagina = dados.proxima_pagina || null;
      if (primeira && this.canalModalGrade) this.canalModalGrade.innerHTML = '';
      const frag = document.createDocumentFragment();
      (dados.videos || []).forEach(v => frag.appendChild(this.thumbCanal(v)));
      this.canalModalGrade?.appendChild(frag);
      if (this.btnCarregarMais) this.btnCarregarMais.style.display = this.proximaPagina ? 'block' : 'none';
    } catch (err) {
      this.app.notify('Não consegui carregar os vídeos do canal: ' + err.message, 'error');
    }
  }

  async carregarMaisVideosCanal() {
    this.btnCarregarMais.disabled = true;
    this.btnCarregarMais.textContent = 'Carregando…';
    await this.carregarVideosCanal(false);
    this.btnCarregarMais.disabled = false;
    this.btnCarregarMais.textContent = 'Carregar mais';
  }

  thumbCanal(v) {
    const a = document.createElement('a');
    a.href = `https://youtube.com/watch?v=${v.video_id}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'canal-video-card';

    const img = document.createElement('img');
    img.src = v.miniatura;
    img.loading = 'lazy';
    img.alt = '';
    a.appendChild(img);

    const titulo = document.createElement('span');
    titulo.textContent = v.titulo;
    a.appendChild(titulo);

    return a;
  }
}
