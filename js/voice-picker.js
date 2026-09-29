/**
 * TipLabs - Seletor de Voz (ElevenLabs / Edge-TTS)
 * Componente reutilizável: usado na tela "Novo Projeto" e na aba Áudio do Inspector.
 * Cada instância controla seu próprio conjunto de elementos (ids passados no construtor).
 *
 * ElevenLabs tem 3 vozes por idioma (pt, es, en). O seletor de idioma é montado
 * sozinho, na hora, logo acima da grade de vozes — não precisa de marcação própria
 * no index.html, então as duas instâncias (Novo Vídeo e Inspector) ganham o seletor
 * de graça, sem duplicar HTML.
 */

class VoicePicker {
  // Catálogo por idioma: cada idioma busca uma vez só e fica em cache pra página inteira.
  static _catalogPromises = {};

  static async catalog(idioma = 'pt') {
    if (!VoicePicker._catalogPromises[idioma]) {
      VoicePicker._catalogPromises[idioma] = API.getVozesElevenLabs(idioma);
    }
    return VoicePicker._catalogPromises[idioma];
  }

  /**
   * ids: {
   *   btnElevenlabs, btnEdge,        // botões de alternância de provedor
   *   painelElevenlabs, painelEdge,  // painéis mostrados conforme o provedor
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
    this.provedor = 'elevenlabs';
    this.idioma = 'pt';
    this.voiceId = null;
    this.el = {};
    for (const key of Object.keys(ids)) {
      this.el[key] = ids[key] ? document.getElementById(ids[key]) : null;
    }
    this._montarSeletorIdioma();
    this._bindStaticEvents();
  }

  async init() {
    await this._carregarIdioma(this.idioma);
    if (!this.voiceId && (this.vozes || []).length > 0) {
      this.voiceId = this.vozes[0].voice_id;
    }
    this._updateVoiceGridSelection();
  }

  /* ---------------------------------------------------------
     Seletor de idioma — três botões (bandeira + nome), acima da grade
     --------------------------------------------------------- */
  _montarSeletorIdioma() {
    if (!this.el.voiceGrid) return;
    const linha = document.createElement('div');
    linha.className = 'voice-idioma-row';
    this.el.voiceGrid.parentElement.insertBefore(linha, this.el.voiceGrid);
    this.el.idiomaRow = linha;
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
    await this._carregarIdioma(idioma);
    this.voiceId = (this.vozes || [])[0]?.voice_id || null;
    this._updateVoiceGridSelection();
  }

  /** Busca (ou reaproveita do cache) o catálogo de um idioma e redesenha a tela.
   *  Não mexe no voiceId escolhido — quem decide isso é quem chama. */
  async _carregarIdioma(idioma) {
    const { vozes, modelos, idiomas } = await VoicePicker.catalog(idioma);
    this.idioma = idioma;
    this.vozes = vozes;
    this.modelos = modelos;
    this.idiomas = idiomas || this.idiomas;
    this._renderSeletorIdioma();
    this._renderVoiceGrid();
    this._renderModelos();
  }

  _renderVoiceGrid() {
    if (!this.el.voiceGrid) return;
    this.el.voiceGrid.innerHTML = '';
    (this.vozes || []).forEach(v => {
      const card = document.createElement('div');
      card.className = 'voice-card';
      card.dataset.voiceId = v.voice_id;
      card.innerHTML = `
        <span class="voice-card-nome">${v.nome} <span style="color:var(--text-muted);font-weight:400">· ${v.genero || ''}</span></span>
        <span class="voice-card-desc">${v.descricao || ''}</span>
      `;
      card.addEventListener('click', () => {
        this.voiceId = v.voice_id;
        this._updateVoiceGridSelection();
      });
      this.el.voiceGrid.appendChild(card);
    });
  }

  _updateVoiceGridSelection() {
    if (!this.el.voiceGrid) return;
    this.el.voiceGrid.querySelectorAll('.voice-card').forEach(card => {
      card.classList.toggle('active', card.dataset.voiceId === this.voiceId);
    });
  }

  _renderModelos() {
    if (!this.el.modelo) return;
    const escolhido = this.el.modelo.value;
    this.el.modelo.innerHTML = '';
    (this.modelos || []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.nome} — ${m.custo}`;
      if (m.recomendado) opt.selected = true;
      this.el.modelo.appendChild(opt);
    });
    // o modelo é o mesmo catálogo pros três idiomas, então preserva a escolha ao trocar
    if (escolhido && [...this.el.modelo.options].some(o => o.value === escolhido)) {
      this.el.modelo.value = escolhido;
    }
  }

  _bindStaticEvents() {
    if (this.el.btnElevenlabs) {
      this.el.btnElevenlabs.addEventListener('click', () => this.setProvedor('elevenlabs'));
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
    this.provedor = provedor;
    if (this.el.btnElevenlabs) this.el.btnElevenlabs.classList.toggle('active', provedor === 'elevenlabs');
    if (this.el.btnEdge) this.el.btnEdge.classList.toggle('active', provedor === 'edge-tts');
    if (this.el.painelElevenlabs) this.el.painelElevenlabs.style.display = provedor === 'elevenlabs' ? '' : 'none';
    if (this.el.painelEdge) this.el.painelEdge.style.display = provedor === 'edge-tts' ? '' : 'none';
  }

  /** Aplica um objeto de voz já existente (vindo do projeto) nos controles.
   *  Assíncrono porque pode precisar buscar o catálogo de outro idioma primeiro. */
  async setValue(voz) {
    voz = voz || {};
    const provedor = voz.provedor === 'edge-tts' ? 'edge-tts' : 'elevenlabs';
    this.setProvedor(provedor);

    if (voz.voice_id) {
      const idioma = voz.idioma || 'pt';
      if (idioma !== this.idioma || !(this.vozes || []).length) {
        await this._carregarIdioma(idioma);
      }
      this.voiceId = voz.voice_id;
      this._updateVoiceGridSelection();
    }
    if (this.el.modelo && voz.modelo) this.el.modelo.value = voz.modelo;

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
      provedor: 'elevenlabs',
      idioma: this.idioma,
      voice_id: this.voiceId,
      modelo: this.el.modelo ? this.el.modelo.value : undefined,
      estabilidade: this.el.estabilidade ? parseFloat(this.el.estabilidade.value) : undefined,
      similaridade: this.el.similaridade ? parseFloat(this.el.similaridade.value) : undefined,
      estilo: this.el.estilo ? parseFloat(this.el.estilo.value) : undefined,
      velocidade: this.el.velocidade ? parseFloat(this.el.velocidade.value) : undefined,
    };
  }
}

window.VoicePicker = VoicePicker;
