/**
 * TipLabs - Seletor de Voz (GenAIPro / Edge-TTS)
 * Componente reutilizável: usado na tela "Novo Projeto" e na aba Áudio do Inspector.
 * Cada instância controla seu próprio conjunto de elementos (ids passados no construtor).
 *
 * As vozes vêm ao vivo da biblioteca da GenAIPro (as mesmas vozes da ElevenLabs), filtradas por
 * idioma, gênero e busca, cada uma com botão pra ouvir a prévia. A barra de filtros, o saldo de
 * créditos e a dica de custo são montados aqui mesmo, logo acima da grade — não precisam de
 * marcação própria no index.html, então as duas instâncias ganham tudo sem duplicar HTML.
 */

class VoicePicker {
  // Consultas guardadas pra página inteira: a mesma combinação de filtros só busca uma vez.
  static _catalogPromises = {};
  static _creditosPromise = null;
  // Uma prévia tocando por vez na página inteira, mesmo com dois seletores abertos.
  static _audio = null;
  static _tocando = null;

  static async catalog(idioma = 'pt', genero = '', busca = '') {
    const chave = `${idioma}|${genero}|${busca.toLowerCase()}`;
    if (!VoicePicker._catalogPromises[chave]) {
      VoicePicker._catalogPromises[chave] = API.getVozesGenaipro({ idioma, genero, busca }).then(res => {
        // erro não fica em cache: a próxima tentativa busca de novo
        if (res.erro) delete VoicePicker._catalogPromises[chave];
        return res;
      });
    }
    return VoicePicker._catalogPromises[chave];
  }

  static creditos() {
    if (!VoicePicker._creditosPromise) VoicePicker._creditosPromise = API.getCreditosGenaipro();
    return VoicePicker._creditosPromise;
  }

  /**
   * ids: {
   *   btnGenaipro, btnEdge,          // botões de alternância de provedor
   *   painelGenaipro, painelEdge,    // painéis mostrados conforme o provedor
   *   voiceGrid,                     // container da grade de cartões de voz
   *   modelo,                        // <select> de modelo
   *   estabilidade, similaridade, estilo, velocidade, // <input type=range>
   *   valorEstabilidade, valorSimilaridade, valorEstilo, valorVelocidade, // <span> de valor
   *   vozEdge,                       // <select> de voz Edge-TTS (pode ser null se não existir aqui)
   *   velocidadeEdge,                // <select> de velocidade Edge-TTS
   * }
   */
  constructor(ids) {
    this.ids = ids;
    this.provedor = 'genaipro';
    this.idioma = 'pt';
    this.genero = '';
    this.busca = '';
    this.voiceId = null;
    this.vozNome = '';
    this.vozes = [];
    this.el = {};
    for (const key of Object.keys(ids)) {
      this.el[key] = ids[key] ? document.getElementById(ids[key]) : null;
    }
    this._montarBarra();
    this._bindStaticEvents();
  }

  async init() {
    if (!this._iniciado) {
      this._iniciado = this._carregar();
      this._mostrarCreditos();
    }
    await this._iniciado;
    if (!this.voiceId && this.vozes.length > 0) this._escolher(this.vozes[0]);
    this._renderVoiceGrid();
  }

  /* ---------------------------------------------------------
     Barra acima da grade: saldo, idioma, gênero e busca
     --------------------------------------------------------- */
  _montarBarra() {
    const grade = this.el.voiceGrid;
    if (!grade) return;
    const barra = document.createElement('div');
    barra.className = 'voice-toolbar';
    barra.innerHTML = `
      <div class="voice-creditos" hidden></div>
      <div class="voice-idioma-row"></div>
      <div class="voice-filtros">
        <input type="search" class="form-control voice-busca" placeholder="Buscar voz pelo nome ou estilo (ex.: narrador, calma)">
        <select class="form-control voice-genero" aria-label="Gênero da voz">
          <option value="">Todas</option>
          <option value="male">Masculinas</option>
          <option value="female">Femininas</option>
        </select>
      </div>
      <div class="voice-status" hidden></div>
    `;
    grade.parentElement.insertBefore(barra, grade);
    this.el.creditos = barra.querySelector('.voice-creditos');
    this.el.idiomaRow = barra.querySelector('.voice-idioma-row');
    this.el.busca = barra.querySelector('.voice-busca');
    this.el.genero = barra.querySelector('.voice-genero');
    this.el.status = barra.querySelector('.voice-status');

    let espera = null;
    this.el.busca.addEventListener('input', () => {
      clearTimeout(espera);
      espera = setTimeout(() => this._filtrar({ busca: this.el.busca.value.trim() }), 450);
    });
    this.el.genero.addEventListener('change', () => this._filtrar({ genero: this.el.genero.value }));

    if (this.el.modelo) {
      const dica = document.createElement('div');
      dica.className = 'voice-custo';
      (this.el.modelo.closest('.select-wrapper') || this.el.modelo).insertAdjacentElement('afterend', dica);
      this.el.custo = dica;
      this.el.modelo.addEventListener('change', () => this._aplicarModelo());
    }
  }

  async _mostrarCreditos() {
    if (!this.el.creditos) return;
    const c = await VoicePicker.creditos();
    if (!c || !c.configurada) {
      this.el.creditos.hidden = false;
      this.el.creditos.classList.add('voice-creditos-alerta');
      this.el.creditos.textContent = c && c.erro
        ? c.erro
        : 'Falta a chave da GenAIPro. Cole em GENAIPRO_API no .env do backend.';
      return;
    }
    const numero = n => Number(n || 0).toLocaleString('pt-BR');
    const vence = (c.pacotes || []).map(p => p.vence).filter(Boolean).sort()[0];
    const data = vence ? new Date(vence).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
    const horas = Math.floor((c.minutos_de_narracao || 0) / 60);
    this.el.creditos.hidden = false;
    this.el.creditos.classList.toggle('voice-creditos-alerta', (c.minutos_de_narracao || 0) < 60);
    this.el.creditos.innerHTML = `
      <strong>${numero(c.creditos)}</strong> créditos na GenAIPro
      <span>· cerca de ${horas > 0 ? `${horas} h` : `${c.minutos_de_narracao} min`} de narração${data ? ` · vencem em ${data}` : ''}</span>
    `;
  }

  _renderSeletorIdioma() {
    if (!this.el.idiomaRow) return;
    this.el.idiomaRow.innerHTML = '';
    (this.idiomas || []).forEach(idi => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'voice-idioma-btn' + (idi.id === this.idioma ? ' active' : '');
      btn.innerHTML = `<span>${idi.bandeira || ''}</span> ${idi.nome}`;
      btn.addEventListener('click', () => this.setIdioma(idi.id));
      this.el.idiomaRow.appendChild(btn);
    });
  }

  /** Troca de idioma pelo clique do usuário: começa do zero, primeira voz da lista nova. */
  async setIdioma(idioma) {
    if (idioma === this.idioma) return;
    await this._filtrar({ idioma }, true);
  }

  /** Aplica um filtro novo e redesenha. Com escolherPrimeira, a voz passa a ser a primeira da lista. */
  async _filtrar(mudancas, escolherPrimeira = false) {
    Object.assign(this, mudancas);
    await this._carregar();
    if (escolherPrimeira && this.vozes.length) this._escolher(this.vozes[0]);
    this._renderVoiceGrid();
  }

  /** Busca (ou reaproveita do cache) as vozes dos filtros atuais e redesenha a barra e os modelos.
   *  Não mexe na voz escolhida — quem decide isso é quem chama. */
  async _carregar() {
    const pedido = `${this.idioma}|${this.genero}|${this.busca}`;
    this._ultimoPedido = pedido;
    this._status('Carregando vozes da GenAIPro...');
    const res = await VoicePicker.catalog(this.idioma, this.genero, this.busca);
    if (this._ultimoPedido !== pedido) return;  // chegou resposta de um filtro que já mudou
    this.vozes = res.vozes || [];
    this.modelos = res.modelos || this.modelos;
    this.idiomas = res.idiomas || this.idiomas;
    this.precoPorMil = res.preco_por_mil ?? this.precoPorMil;
    if (res.erro) this._status(res.erro, true);
    else if (!this.vozes.length) this._status(this.busca ? 'Nenhuma voz com essa busca. Tente outra palavra, em inglês funciona melhor.' : 'Nenhuma voz encontrada.');
    else this._status('');
    this._renderSeletorIdioma();
    this._renderModelos();
  }

  _status(texto, erro = false) {
    if (!this.el.status) return;
    this.el.status.hidden = !texto;
    this.el.status.textContent = texto;
    this.el.status.classList.toggle('voice-status-erro', erro);
  }

  _escolher(voz) {
    this.voiceId = voz.voice_id;
    this.vozNome = voz.nome || '';
  }

  _renderVoiceGrid() {
    const grade = this.el.voiceGrid;
    if (!grade) return;
    grade.innerHTML = '';
    let lista = this.vozes || [];
    // a voz escolhida antes (vinda do projeto ou de outro filtro) fica sempre visível no topo
    if (this.voiceId && !lista.some(v => v.voice_id === this.voiceId)) {
      lista = [{ voice_id: this.voiceId, nome: this.vozNome || 'Voz escolhida', descricao: 'Voz escolhida antes. Continua valendo até você escolher outra.', fixa: true }, ...lista];
    }
    lista.forEach(v => grade.appendChild(this._cartao(v)));
    this._updateVoiceGridSelection();
  }

  _cartao(v) {
    const card = document.createElement('div');
    card.className = 'voice-card' + (v.fixa ? ' voice-card-fixa' : '');
    card.dataset.voiceId = v.voice_id;
    card.title = v.descricao || '';
    const detalhes = [v.genero, v.idade, v.sotaque].filter(Boolean).join(' · ');
    card.innerHTML = `
      <div class="voice-card-topo">
        <span class="voice-card-nome"></span>
        ${v.previa ? '<button type="button" class="voice-play" aria-label="Ouvir prévia">▶</button>' : ''}
      </div>
      ${detalhes ? '<span class="voice-card-meta"></span>' : ''}
      <span class="voice-card-desc"></span>
    `;
    // texto da biblioteca entra como texto, nunca como HTML
    card.querySelector('.voice-card-nome').textContent = v.nome;
    if (detalhes) card.querySelector('.voice-card-meta').textContent = detalhes;
    card.querySelector('.voice-card-desc').textContent = v.descricao || '';
    card.addEventListener('click', () => {
      this._escolher(v);
      this._updateVoiceGridSelection();
    });
    const play = card.querySelector('.voice-play');
    if (play) {
      play.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._tocar(v.previa, play);
      });
    }
    return card;
  }

  _tocar(url, botao) {
    const atual = VoicePicker._tocando;
    if (VoicePicker._audio) VoicePicker._audio.pause();
    if (atual) atual.textContent = '▶';
    VoicePicker._tocando = null;
    if (atual === botao) return;  // segundo clique no mesmo botão só para
    const audio = new Audio(url);
    VoicePicker._audio = audio;
    VoicePicker._tocando = botao;
    botao.textContent = '■';
    audio.addEventListener('ended', () => {
      botao.textContent = '▶';
      if (VoicePicker._tocando === botao) VoicePicker._tocando = null;
    });
    audio.play().catch(() => { botao.textContent = '▶'; });
  }

  _updateVoiceGridSelection() {
    if (!this.el.voiceGrid) return;
    this.el.voiceGrid.querySelectorAll('.voice-card').forEach(card => {
      card.classList.toggle('active', card.dataset.voiceId === this.voiceId);
    });
  }

  _renderModelos() {
    if (!this.el.modelo || !(this.modelos || []).length) return;
    const escolhido = this.el.modelo.value;
    this.el.modelo.innerHTML = '';
    this.modelos.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.nome} — ${m.descricao || m.custo || ''}`;
      if (m.recomendado) opt.selected = true;
      this.el.modelo.appendChild(opt);
    });
    // o modelo é o mesmo catálogo pra qualquer filtro, então preserva a escolha ao trocar
    if (escolhido && [...this.el.modelo.options].some(o => o.value === escolhido)) {
      this.el.modelo.value = escolhido;
    }
    this._aplicarModelo();
  }

  /** O v3 ignora a velocidade, então o controle fica travado nele. A dica mostra o custo, igual em todos. */
  _aplicarModelo() {
    const v3 = this.el.modelo && this.el.modelo.value === 'eleven_v3';
    if (this.el.velocidade) {
      this.el.velocidade.disabled = v3;
      this.el.velocidade.title = v3 ? 'O modelo v3 ignora a velocidade' : '';
    }
    if (this.el.custo) {
      const preco = this.precoPorMil ? ` (US$ ${Number(this.precoPorMil).toFixed(3).replace('.', ',')} por mil)` : '';
      this.el.custo.textContent = `Todos os modelos gastam 1 crédito por caractere${preco}.`;
    }
  }

  _bindStaticEvents() {
    if (this.el.btnGenaipro) {
      this.el.btnGenaipro.addEventListener('click', () => this.setProvedor('genaipro'));
    }
    if (this.el.btnEdge) {
      this.el.btnEdge.addEventListener('click', () => this.setProvedor('edge-tts'));
    }
    const sliders = [
      ['estabilidade', 'valorEstabilidade', (v) => v.toFixed(2)],
      ['similaridade', 'valorSimilaridade', (v) => v.toFixed(2)],
      ['estilo', 'valorEstilo', (v) => v.toFixed(2)],
      ['velocidade', 'valorVelocidade', (v) => v.toFixed(2) + 'x'],
    ];
    sliders.forEach(([sliderKey, labelKey, formatar]) => {
      const slider = this.el[sliderKey];
      const label = this.el[labelKey];
      if (slider && label) {
        slider.addEventListener('input', () => {
          label.textContent = formatar(parseFloat(slider.value));
        });
      }
    });
  }

  setProvedor(provedor) {
    // "elevenlabs" é o nome antigo: projetos de antes da troca voltam como GenAIPro
    provedor = provedor === 'edge-tts' ? 'edge-tts' : 'genaipro';
    this.provedor = provedor;
    if (this.el.btnGenaipro) this.el.btnGenaipro.classList.toggle('active', provedor === 'genaipro');
    if (this.el.btnEdge) this.el.btnEdge.classList.toggle('active', provedor === 'edge-tts');
    if (this.el.painelGenaipro) this.el.painelGenaipro.style.display = provedor === 'genaipro' ? '' : 'none';
    if (this.el.painelEdge) this.el.painelEdge.style.display = provedor === 'edge-tts' ? '' : 'none';
    if (provedor !== 'genaipro' && VoicePicker._audio) VoicePicker._audio.pause();
  }

  /** Aplica um objeto de voz já existente (vindo do projeto) nos controles.
   *  Assíncrono porque pode precisar buscar as vozes de outro idioma primeiro. */
  async setValue(voz) {
    voz = voz || {};
    this.setProvedor(voz.provedor);

    if (voz.voice_id && !String(voz.voice_id).includes('COLE')) {
      const idioma = voz.idioma || 'pt';
      if (idioma !== this.idioma || !this.vozes.length) {
        this.idioma = idioma;
        await this._carregar();
      }
      const naLista = this.vozes.find(v => v.voice_id === voz.voice_id);
      this.voiceId = voz.voice_id;
      this.vozNome = (naLista && naLista.nome) || voz.nome || '';
      this._renderVoiceGrid();
    }
    if (this.el.modelo && voz.modelo && [...this.el.modelo.options].some(o => o.value === voz.modelo)) {
      this.el.modelo.value = voz.modelo;
      this._aplicarModelo();
    }

    const aplicarSlider = (sliderKey, labelKey, valor, formatar) => {
      if (valor === undefined || valor === null) return;
      const slider = this.el[sliderKey];
      const label = this.el[labelKey];
      if (slider) slider.value = valor;
      if (label) label.textContent = formatar(parseFloat(valor));
    };
    aplicarSlider('estabilidade', 'valorEstabilidade', voz.estabilidade, (v) => v.toFixed(2));
    aplicarSlider('similaridade', 'valorSimilaridade', voz.similaridade, (v) => v.toFixed(2));
    aplicarSlider('estilo', 'valorEstilo', voz.estilo, (v) => v.toFixed(2));
    aplicarSlider('velocidade', 'valorVelocidade', voz.velocidade, (v) => v.toFixed(2) + 'x');

    if (this.el.vozEdge && voz.voz_edge) this.el.vozEdge.value = voz.voz_edge;
    if (this.el.velocidadeEdge && voz.velocidade_edge) this.el.velocidadeEdge.value = voz.velocidade_edge;
  }

  /** Lê os controles e devolve o payload de ajuste de voz pra mandar pro backend. */
  getValue() {
    if (this.provedor === 'edge-tts') {
      return {
        provedor: 'edge-tts',
        voz_edge: this.el.vozEdge ? this.el.vozEdge.value : undefined,
        velocidade_edge: this.el.velocidadeEdge ? this.el.velocidadeEdge.value : undefined,
      };
    }
    return {
      provedor: 'genaipro',
      idioma: this.idioma,
      voice_id: this.voiceId,
      nome: this.vozNome || undefined,
      modelo: this.el.modelo ? this.el.modelo.value : undefined,
      estabilidade: this.el.estabilidade ? parseFloat(this.el.estabilidade.value) : undefined,
      similaridade: this.el.similaridade ? parseFloat(this.el.similaridade.value) : undefined,
      estilo: this.el.estilo ? parseFloat(this.el.estilo.value) : undefined,
      velocidade: this.el.velocidade ? parseFloat(this.el.velocidade.value) : undefined,
    };
  }
}

window.VoicePicker = VoicePicker;
