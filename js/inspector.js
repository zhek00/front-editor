/**
 * TipLabs - Inspector Panel
 * Gerencia a edição direta de cenas visuais, áudio e efeitos sonoros (SFX).
 */

class StudioInspector {
  constructor() {
    this.currentScene = null;
    this.project = null;
    this._antigasRequestId = 0;

    // Abas
    this.tabs = document.querySelectorAll('.inspector-tab');
    this.panes = document.querySelectorAll('.tab-pane');

    // Elementos da Aba Cena
    this.sceneTitleEl = document.getElementById('inspector-scene-title');
    this.sceneTimePillEl = document.getElementById('inspector-time-pill');
    this.radioCards = document.querySelectorAll('.type-radio-card');
    this.promptField = document.getElementById('field-prompt');
    this.buscaField = document.getElementById('field-busca');
    this.promptGroup = document.getElementById('group-prompt');
    this.buscaGroup = document.getElementById('group-busca');
    this.provedorImagemGroup = document.getElementById('group-provedor-imagem');
    this.dropzone = document.getElementById('dropzone-media');
    this.fileInput = document.getElementById('input-file-media');
    this.antigasGallery = document.getElementById('antigas-gallery');
    this.antigasSection = document.getElementById('section-antigas');
    this.btnRefazerIA = document.getElementById('btn-refazer-ia');
    this.btnRefazerBusca = document.getElementById('btn-refazer-busca');
    this.btnImgProvedorGoogle = document.getElementById('btn-img-provedor-google-insp');
    this.btnImgProvedorKie = document.getElementById('btn-img-provedor-kie-insp');

    // Elementos da Aba Áudio
    this.audioNarrationText = document.getElementById('audio-narration-text');
    this.fieldRoteiroCompleto = document.getElementById('field-roteiro-completo');
    this.selectVozVelocidade = document.getElementById('select-voz-velocidade');
    this.voicePicker = new VoicePicker({
      btnElevenlabs: 'btn-voz-provedor-elevenlabs-insp',
      btnEdge: 'btn-voz-provedor-edge-insp',
      painelElevenlabs: 'painel-voz-elevenlabs-insp',
      painelEdge: 'painel-voz-edge-insp',
      voiceGrid: 'voice-card-grid-insp',
      modelo: 'select-modelo-elevenlabs-insp',
      estabilidade: 'slider-estabilidade-insp',
      similaridade: 'slider-similaridade-insp',
      estilo: 'slider-estilo-insp',
      velocidade: 'slider-velocidade-insp',
      valorEstabilidade: 'valor-estabilidade-insp',
      valorSimilaridade: 'valor-similaridade-insp',
      valorEstilo: 'valor-estilo-insp',
      valorVelocidade: 'valor-velocidade-insp',
      velocidadeEdge: 'select-voz-velocidade',
    });
    this.voicePicker.setProvedor('elevenlabs');
    this.voicePicker.init();
    this.btnRegerarAudio = document.getElementById('btn-regerar-audio');
    this.btnPlaySceneAudio = document.getElementById('btn-play-scene-audio');
    this.musicSelect = document.getElementById('select-music-track');
    this.btnPreviewMusic = document.getElementById('btn-preview-music');

    // Elementos da Aba SFX
    this.sfxToggle = document.getElementById('toggle-sfx');
    this.sfxBody = document.getElementById('sfx-controls-body');
    this.sfxDescField = document.getElementById('field-sfx-desc');
    this.sfxInicioField = document.getElementById('field-sfx-inicio');
    this.sfxDuracaoField = document.getElementById('field-sfx-duracao');
    this.sfxPalavraField = document.getElementById('field-sfx-palavra');
    this.btnPlaySfxPreview = document.getElementById('btn-play-sfx-preview');
    this.sfxLibrarySelect = document.getElementById('select-sfx-library');
    this.sfxPlayerCard = document.getElementById('sfx-player-card');
    this.sfxPlayerTitle = document.getElementById('sfx-player-title');
    this.sfxPlayerDur = document.getElementById('sfx-player-dur');

    this.bindEvents();
  }

  bindEvents() {
    // Alternância de Abas
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Seletor de Tipo de Cena (IA, Foto Real, Vídeo Real)
    this.radioCards.forEach(card => {
      card.addEventListener('click', () => {
        if (!this.currentScene) return;
        const tipo = card.dataset.type;
        this.currentScene.tipo = tipo;
        this.updateTypeRadioUI(tipo);
        this.notifyChange();
      });
    });

    // Edição de Prompt e Busca
    if (this.promptField) {
      this.promptField.addEventListener('input', (e) => {
        if (!this.currentScene) return;
        this.currentScene.prompt = e.target.value;
        this.currentScene.prompt_manual = e.target.value;
        this.notifyChange();
      });
    }

    if (this.buscaField) {
      this.buscaField.addEventListener('input', (e) => {
        if (!this.currentScene) return;
        this.currentScene.busca = e.target.value;
        this.notifyChange();
      });
    }

    // Drag and Drop para troca direta de imagem ou vídeo
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', () => this.fileInput.click());

      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone.classList.add('dragover');
      });

      this.dropzone.addEventListener('dragleave', () => {
        this.dropzone.classList.remove('dragover');
      });

      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleMediaUpload(e.dataTransfer.files[0]);
        }
      });

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleMediaUpload(e.target.files[0]);
        }
      });
    }

    // Botões de Ação para Refazer Cena
    if (this.btnRefazerIA) {
      this.btnRefazerIA.addEventListener('click', () => {
        if (!this.currentScene || !this.project) return;
        window.App.refazerCenaIA(this.currentScene);
      });
    }

    if (this.btnRefazerBusca) {
      this.btnRefazerBusca.addEventListener('click', () => {
        if (!this.currentScene || !this.project) return;
        window.App.refazerCenaBusca(this.currentScene);
      });
    }

    // Provedor de imagem de IA (Google/Nano Banana 2 ou Kie.ai), vale pro projeto inteiro
    if (this.btnImgProvedorGoogle) {
      this.btnImgProvedorGoogle.addEventListener('click', () => this.setImgProvedor('google'));
    }
    if (this.btnImgProvedorKie) {
      this.btnImgProvedorKie.addEventListener('click', () => this.setImgProvedor('kie'));
    }

    // Botão Regerar Áudio
    if (this.btnRegerarAudio) {
      this.btnRegerarAudio.addEventListener('click', () => {
        if (!this.project) return;
        const novoRoteiro = this.fieldRoteiroCompleto ? this.fieldRoteiroCompleto.value : null;
        const vel = this.selectVozVelocidade ? this.selectVozVelocidade.value : '+0%';
        window.App.regerarAudio(novoRoteiro, vel, this.voicePicker.getValue());
      });
    }

    // Aba Áudio: Tocar apenas esta cena
    if (this.btnPlaySceneAudio) {
      this.btnPlaySceneAudio.addEventListener('click', () => {
        if (!this.currentScene || !window.Player) return;
        // fim da cena capturado agora, não lido de this.currentScene a cada frame: clicar em
        // "ouvir trecho" de outra cena antes deste loop acabar não pode fazer ele parar no
        // tempo da cena nova. O token cancela o loop anterior em vez de deixar dois rodando.
        const fimAlvo = this.currentScene.fim;
        const meuToken = (this._playSceneToken = (this._playSceneToken || 0) + 1);
        window.Player.seek(this.currentScene.ini);
        window.Player.play();
        // Parar ao final da cena
        const checkEnd = () => {
          if (meuToken !== this._playSceneToken) return;
          if (window.Player.currentTime >= fimAlvo) {
            window.Player.pause();
          } else if (window.Player.isPlaying) {
            requestAnimationFrame(checkEnd);
          }
        };
        requestAnimationFrame(checkEnd);
      });
    }

    // Aba SFX: Toggle Habilitar/Desabilitar
    if (this.sfxToggle) {
      this.sfxToggle.addEventListener('change', (e) => {
        if (!this.currentScene) return;
        const habilitado = e.target.checked;
        this.sfxBody.style.display = habilitado ? 'flex' : 'none';

        if (habilitado) {
          if (!this.currentScene.efeito) {
            this.currentScene.efeito = {
              descricao: 'distant rolling thunder',
              palavra: '',
              duracao: 2.0,
              inicio: 0.0
            };
          }
        } else {
          this.currentScene.efeito = null;
        }

        this.fillSfxFields(this.currentScene.efeito);
        this.notifyChange();
        if (window.Timeline) window.Timeline.render();
      });
    }

    // Campos de SFX
    const updateSfx = () => {
      if (!this.currentScene || !this.currentScene.efeito) return;
      this.currentScene.efeito.descricao = this.sfxDescField.value;
      this.currentScene.efeito.palavra = this.sfxPalavraField.value;
      this.currentScene.efeito.inicio = parseFloat(this.sfxInicioField.value) || 0.0;
      this.currentScene.efeito.duracao = parseFloat(this.sfxDuracaoField.value) || 2.0;

      if (this.sfxPlayerTitle) this.sfxPlayerTitle.textContent = this.currentScene.efeito.descricao;
      if (this.sfxPlayerDur) this.sfxPlayerDur.textContent = `${this.currentScene.efeito.duracao}s`;

      this.notifyChange();
      if (window.Timeline) window.Timeline.render();
    };

    [this.sfxDescField, this.sfxInicioField, this.sfxDuracaoField, this.sfxPalavraField].forEach(field => {
      if (field) field.addEventListener('input', updateSfx);
    });

    // Pré-escuta de SFX
    if (this.btnPlaySfxPreview) {
      this.btnPlaySfxPreview.addEventListener('click', () => {
        if (!this.currentScene || !this.currentScene.efeito) return;
        if (window.Player) {
          window.Player.playSfx(this.currentScene);
        }
      });
    }

    // Seleção a partir da Biblioteca de SFX
    if (this.sfxLibrarySelect) {
      this.sfxLibrarySelect.addEventListener('change', (e) => {
        if (!e.target.value || !this.currentScene || !this.currentScene.efeito) return;
        const opt = e.target.selectedOptions[0];
        this.currentScene.efeito.descricao = opt.dataset.desc || opt.textContent;
        this.sfxDescField.value = this.currentScene.efeito.descricao;
        this.currentScene.efeito_url = opt.dataset.url;
        this.currentScene.efeito_arquivo_existe = true;
        updateSfx();
      });
    }
  }

  switchTab(tabName) {
    this.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    this.panes.forEach(p => p.classList.toggle('active', p.id === `tab-pane-${tabName}`));
  }

  async setProject(projectData) {
    this.project = projectData;
    if (this.fieldRoteiroCompleto && projectData.roteiro) {
      this.fieldRoteiroCompleto.value = projectData.roteiro;
    }
    await this.voicePicker.init();
    await this.voicePicker.setValue(projectData.voz);
    this.updateImgProvedorUI((projectData.imagens || {}).provedor || 'google');
    this.populateSfxLibrary();
    this.populateMusicLibrary();
  }

  updateImgProvedorUI(provedor) {
    if (this.btnImgProvedorGoogle) this.btnImgProvedorGoogle.classList.toggle('active', provedor !== 'kie');
    if (this.btnImgProvedorKie) this.btnImgProvedorKie.classList.toggle('active', provedor === 'kie');
  }

  async setImgProvedor(provedor) {
    if (!this.project) return;
    this.updateImgProvedorUI(provedor);
    try {
      await API.setImagensProvedor(this.project.name, provedor);
      this.project.imagens = { ...(this.project.imagens || {}), provedor };
      window.App.notify(`Provedor de imagem trocado para ${provedor === 'kie' ? 'Kie.ai' : 'Nano Banana 2'}. Vale a partir da próxima imagem gerada.`, 'success');
    } catch (err) {
      window.App.notify('Erro ao trocar o provedor de imagem: ' + err.message, 'error');
    }
  }

  selectScene(cena, switchTab = true) {
    this.currentScene = cena;
    if (!cena) return;

    // Cabeçalho do Inspetor
    if (this.sceneTitleEl) {
      this.sceneTitleEl.textContent = `Cena ${cena.n}`;
    }
    if (this.sceneTimePillEl) {
      const dur = (cena.fim - cena.ini).toFixed(2);
      this.sceneTimePillEl.textContent = `${cena.ini.toFixed(1)}s - ${cena.fim.toFixed(1)}s (${dur}s)`;
    }

    // 1. Aba Cena (Visual)
    this.updateTypeRadioUI(cena.tipo);
    if (this.promptField) this.promptField.value = cena.prompt || '';
    if (this.buscaField) this.buscaField.value = cena.busca || '';

    // Carregar galeria de versões anteriores (antigas/)
    this.loadAntigas(cena.n);

    // 2. Aba Áudio
    if (this.audioNarrationText) {
      this.audioNarrationText.textContent = cena.texto || 'Sem narração para esta cena.';
    }

    // 3. Aba SFX
    const temEfeito = !!(cena.efeito && cena.efeito.descricao);
    if (this.sfxToggle) this.sfxToggle.checked = temEfeito;
    if (this.sfxBody) this.sfxBody.style.display = temEfeito ? 'flex' : 'none';
    this.fillSfxFields(cena.efeito);

    // Destaque visual na lista da esquerda
    const cards = document.querySelectorAll('.scene-card');
    cards.forEach(c => {
      c.classList.toggle('selected', parseInt(c.dataset.cena) === cena.n);
    });
  }

  updateTypeRadioUI(tipo) {
    this.radioCards.forEach(c => {
      c.classList.toggle('active', c.dataset.type === tipo);
    });

    const isIA = tipo === 'ia';
    if (this.promptGroup) this.promptGroup.style.display = isIA ? 'flex' : 'none';
    if (this.buscaGroup) this.buscaGroup.style.display = !isIA ? 'flex' : 'none';
    // o provedor de imagem de IA (Nano Banana 2 / Kie.ai) só faz sentido quando a cena
    // é do tipo IA — pra Foto/Vídeo Real a busca é sempre no Pixabay/Pexels, nunca IA
    if (this.provedorImagemGroup) this.provedorImagemGroup.style.display = isIA ? 'flex' : 'none';

    if (this.btnRefazerIA) this.btnRefazerIA.style.display = isIA ? 'inline-flex' : 'none';
    if (this.btnRefazerBusca) this.btnRefazerBusca.style.display = !isIA ? 'inline-flex' : 'none';
  }

  fillSfxFields(efeito) {
    if (!efeito) {
      if (this.sfxDescField) this.sfxDescField.value = '';
      if (this.sfxInicioField) this.sfxInicioField.value = '0.0';
      if (this.sfxDuracaoField) this.sfxDuracaoField.value = '2.0';
      if (this.sfxPalavraField) this.sfxPalavraField.value = '';
      if (this.sfxPlayerTitle) this.sfxPlayerTitle.textContent = 'Nenhum som';
      if (this.sfxPlayerDur) this.sfxPlayerDur.textContent = '0s';
      return;
    }

    if (this.sfxDescField) this.sfxDescField.value = efeito.descricao || '';
    if (this.sfxInicioField) this.sfxInicioField.value = efeito.inicio !== undefined ? efeito.inicio : 0.0;
    if (this.sfxDuracaoField) this.sfxDuracaoField.value = efeito.duracao || 2.0;
    if (this.sfxPalavraField) this.sfxPalavraField.value = efeito.palavra || '';
    if (this.sfxPlayerTitle) this.sfxPlayerTitle.textContent = efeito.descricao || 'Efeito';
    if (this.sfxPlayerDur) this.sfxPlayerDur.textContent = `${efeito.duracao || 2}s`;
  }

  async loadAntigas(n) {
    if (!this.antigasGallery || !this.project) return;
    this.antigasGallery.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Carregando versões...</span>';
    const pedidoAtual = ++this._antigasRequestId;

    try {
      const data = await API.getAntigas(this.project.name, n);
      // Se o usuário já trocou de cena de novo enquanto isso carregava, ignora esta resposta.
      if (pedidoAtual !== this._antigasRequestId) return;
      this.antigasGallery.innerHTML = '';

      if (!data.antigas || data.antigas.length === 0) {
        this.antigasGallery.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Nenhuma versão anterior salva.</span>';
        return;
      }

      data.antigas.forEach(antiga => {
        const item = document.createElement('div');
        item.className = 'antiga-item';

        if (antiga.is_video) {
          const vid = document.createElement('video');
          vid.className = 'antiga-thumb';
          vid.src = antiga.url;
          vid.muted = true;
          vid.preload = 'metadata';
          item.appendChild(vid);
        } else {
          const img = document.createElement('img');
          img.className = 'antiga-thumb';
          img.src = antiga.url;
          item.appendChild(img);
        }

        const btn = document.createElement('button');
        btn.className = 'antiga-restore-btn';
        btn.textContent = 'Restaurar';
        btn.onclick = async () => {
          try {
            if (window.Player && window.Player.soltarVideos) window.Player.soltarVideos();
            await API.restoreAntiga(this.project.name, n, antiga.filename);
            window.App.notify('Versão restaurada com sucesso!', 'success');
            window.App.atualizarSoAsCenas();
          } catch (err) {
            window.App.notify('Erro ao restaurar versão: ' + err.message, 'error');
          }
        };

        item.appendChild(btn);
        this.antigasGallery.appendChild(item);
      });
    } catch (e) {
      if (pedidoAtual !== this._antigasRequestId) return;
      this.antigasGallery.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Sem histórico.</span>';
    }
  }

  async handleMediaUpload(file) {
    if (!this.currentScene || !this.project) return;
    window.App.notify(`Enviando ${file.name}...`, 'info');

    try {
      if (window.Player && window.Player.soltarVideos) window.Player.soltarVideos();
      await API.uploadSceneMedia(this.project.name, this.currentScene.n, file);
      window.App.notify('Mídia da cena atualizada com sucesso!', 'success');
      window.App.atualizarSoAsCenas();
    } catch (err) {
      window.App.notify('Falha no upload: ' + err.message, 'error');
    }
  }

  async populateSfxLibrary() {
    if (!this.sfxLibrarySelect) return;
    try {
      const data = await API.getSfxLibrary();
      this.sfxLibrarySelect.innerHTML = '<option value="">-- Escolher som existente da biblioteca --</option>';
      (data.sfx || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.path;
        opt.textContent = `${s.description || s.name}`;
        opt.dataset.desc = s.description;
        opt.dataset.url = s.url;
        this.sfxLibrarySelect.appendChild(opt);
      });
    } catch (e) {
      console.warn('Erro ao carregar biblioteca SFX:', e);
    }
  }

  async populateMusicLibrary() {
    if (!this.musicSelect) return;
    try {
      const data = await API.getMusicLibrary();
      this.musicSelect.innerHTML = '<option value="">-- Trilha padrão do perfil --</option>';
      (data.music || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.path;
        opt.textContent = `${m.category} / ${m.name}`;
        opt.dataset.url = m.url;
        this.musicSelect.appendChild(opt);
      });
    } catch (e) {
      console.warn('Erro ao carregar biblioteca de música:', e);
    }
  }

  notifyChange() {
    if (window.App) {
      window.App.markChangesPending();
    }
  }
}

window.StudioInspector = StudioInspector;
