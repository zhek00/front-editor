/**
 * TipLabs - Player & Synchronization Engine (Ultra-Smooth 60FPS Edition)
 * Suporte a transição suave de imagens (crossfade duplo sem flashes pretos),
 * loop de animação contínuo (requestAnimationFrame a 60 FPS) e pré-carregamento de mídias.
 */

class StudioPlayer {
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';

    // Elementos da UI - Camadas Duplas para Crossfade Suave
    this.viewportEl = document.getElementById('cinema-box');
    this.imageA = document.getElementById('cinema-image-a');
    this.imageB = document.getElementById('cinema-image-b');
    this.videoA = document.getElementById('cinema-video-a') || document.getElementById('cinema-video');
    this.videoB = document.getElementById('cinema-video-b') || document.getElementById('cinema-video');
    this.videoEl = this.videoA;
    this.emptyEl = document.getElementById('cinema-empty');
    this.subtitleEl = document.getElementById('subtitle-text');
    this.sfxFlashEl = document.getElementById('cinema-sfx-flash');
    this.sfxFlashTextEl = document.getElementById('sfx-flash-text');
    
    // Controle de camadas duplas para vídeo e imagem
    this.activeImageLayer = 'A';
    this.activeVideoLayer = 'A';
    this.activeLayerType = null;
    this.currentVisibleEl = null;
    this.preloadedImages = new Map();

    // Overlays de texto em tela
    this.overlayBadgeEl = document.getElementById('overlay-badge');
    this.badgeTitleEl = document.getElementById('overlay-badge-title');
    this.badgeSubEl = document.getElementById('overlay-badge-sub');
    this.overlayHighlightEl = document.getElementById('overlay-highlight');
    this.highlightTextEl = document.getElementById('overlay-highlight-text');

    // Controles de transporte
    this.timecodeCurrentEl = document.getElementById('timecode-current');
    this.timecodeTotalEl = document.getElementById('timecode-total');
    this.btnPlay = document.getElementById('btn-play');
    this.btnPlayIcon = document.getElementById('btn-play-icon');
    this.volumeSlider = document.getElementById('volume-slider');

    // Estado do player
    this.project = null;
    this.cenas = [];
    this.alinhamento = null;
    this.currentScene = null;
    this.isPlaying = false;
    this.duration = 0;
    this.playbackRate = 1.0;
    this.kenBurnsEnabled = true;

    // Relógio suave de alta precisão (interpolação a 60 FPS)
    this._lastAudioTime = 0;
    this._lastPerfTime = 0;
    this._smoothTime = 0;

    // Loop de animação de 60fps
    this._rafId = null;

    // Assegura que os vídeos sejam reproduzidos mudos para não conflitar com a narração
    if (this.videoA) this.videoA.muted = true;
    if (this.videoB) this.videoB.muted = true;
    if (this.videoEl) this.videoEl.muted = true;

    // Cache de efeitos sonoros já disparados nesta passagem
    this.triggeredSfx = new Set();
    this.activeSfxAudio = null;

    this.bindEvents();
  }

  bindEvents() {
    this.audioElement.addEventListener('ended', () => this.onEnded());
    this.audioElement.addEventListener('play', () => this.onPlayState(true));
    this.audioElement.addEventListener('pause', () => this.onPlayState(false));

    // Fallback de tempo quando pausado
    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.isPlaying) {
        this.syncToTime(this.audioElement.currentTime);
      }
    });

    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.togglePlay());
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        this.audioElement.volume = parseFloat(e.target.value);
      });
    }

    const speedSelect = document.getElementById('speed-select');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.setSpeed(parseFloat(e.target.value));
      });
    }

    const btnPrev = document.getElementById('btn-prev-scene');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.prevScene());
    }

    const btnNext = document.getElementById('btn-next-scene');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextScene());
    }

    const btnBack1 = document.getElementById('btn-back-1s');
    if (btnBack1) {
      btnBack1.addEventListener('click', () => this.seek(this.currentTime - 1));
    }

    const btnFwd1 = document.getElementById('btn-fwd-1s');
    if (btnFwd1) {
      btnFwd1.addEventListener('click', () => this.seek(this.currentTime + 1));
    }

    const btnKenBurns = document.getElementById('btn-ken-burns');
    if (btnKenBurns) {
      btnKenBurns.addEventListener('click', () => {
        this.kenBurnsEnabled = !this.kenBurnsEnabled;
        btnKenBurns.classList.toggle('active', this.kenBurnsEnabled);
        if (this.imageA) this.imageA.classList.toggle('ken-burns', this.kenBurnsEnabled);
        if (this.imageB) this.imageB.classList.toggle('ken-burns', this.kenBurnsEnabled);
      });
    }
  }

  loadProject(projectData) {
    this.project = projectData;
    this.cenas = projectData.cenas || [];
    this.alinhamento = projectData.alinhamento || null;
    this.legendas = projectData.legendas || [];
    this.duration = projectData.duracao || (this.alinhamento ? this.alinhamento.duracao : 0);

    if (this.cenas.length > 0 && this.duration === 0) {
      this.duration = this.cenas[this.cenas.length - 1].fim;
    }

    // Pré-carregamento e pré-decodificação imediata de todas as mídias
    this.preloadProjectAssets();

    // Configurar áudio mestre
    if (projectData.narracao_url) {
      this.audioElement.src = projectData.narracao_url;
      this.audioElement.load();
    } else {
      this.audioElement.src = '';
    }

    this.updateTimeDisplay(0, this.duration);
    this.seek(0);
  }

  // Solta as conexões de áudio/vídeo com o backend (o Windows trava o arquivo
  // enquanto o navegador está com a stream aberta, mesmo pausada). Chamar antes
  // de qualquer operação que precise apagar ou mover esses arquivos no disco.
  unload() {
    this.pause();
    this.audioElement.removeAttribute('src');
    this.audioElement.load();
    if (this.videoA) {
      this.videoA.pause();
      this.videoA.removeAttribute('src');
      this.videoA.load();
    }
    if (this.videoB) {
      this.videoB.pause();
      this.videoB.removeAttribute('src');
      this.videoB.load();
    }
  }

  // Troca só a lista de cenas (depois de pesquisar ou regerar uma cena), sem recarregar a narração nem voltar
  // para o começo. Antes o editor recarregava o projeto inteiro, e a reprodução quebrava até tudo baixar de novo.
  atualizarCenas(cenas) {
    const tocando = this.isPlaying;
    const t = this.currentTime;
    this.cenas = cenas || [];
    if (this.project) this.project.cenas = this.cenas;
    this.preloadedImages.clear();
    const indice = this.cenas.findIndex(c => t >= c.ini && t < c.fim);
    this.preCarregarAFrente(Math.max(0, indice), 6);
    this.currentScene = null;  // força redesenhar a cena atual com a mídia nova
    this.syncToTime(t);
    if (tocando && this.audioElement.paused) this.audioElement.play().catch(() => {});
  }

  // Solta o vídeo que estiver na tela: no Windows a fábrica não consegue mover um arquivo que o navegador
  // está tocando, e a troca de mídia da cena falhava ou deixava o player preso.
  soltarVideos() {
    for (const v of [this.videoA, this.videoB]) {
      if (!v) continue;
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
    this.currentScene = null;
  }

  // Pré-carrega só o começo do vídeo. Antes baixava a foto de TODAS as cenas (484 num vídeo de 28 min),
  // e isso disputava a conexão com o áudio e os vídeos: o player travava no meio. O resto vem aos poucos,
  // numa janela de poucas cenas à frente de onde a reprodução está (preCarregarAFrente).
  preloadProjectAssets() {
    this.preloadedImages.clear();
    this.preCarregarAFrente(0, 8);
  }

  preCarregarAFrente(indiceInicial, quantas = 5) {
    for (const c of this.cenas.slice(Math.max(0, indiceInicial), indiceInicial + quantas)) {
      if (this.preloadedImages.has(c.n)) continue;
      const url = this.urlParaTela(c);
      if (!url || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) continue;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      this.preloadedImages.set(c.n, img);
    }
  }

  // Endereço que o player mostra: nunca o original pesado. Foto usa a prévia de 1280px (o original chega a
  // 20 MB) e vídeo usa a prévia de 480p só com o trecho da cena (o original de banco é 1080p e chega a 111 MB):
  // pelo túnel do Cloudflare o player esperava o download e travava.
  urlParaTela(cena) {
    const original = cena.url_midia || cena.img_ia_url || (cena.midia ? cena.midia_url : null);
    if (!original) return null;
    if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(original)) {
      return cena.previa_video_url ? API.resolverMidia(cena.previa_video_url) : original;
    }
    return cena.previa_url || original;
  }

  get currentTime() {
    return this.audioElement.currentTime || 0;
  }

  getCurrentSmoothTime() {
    if (!this.isPlaying || this.audioElement.paused) {
      return this.audioElement.currentTime || 0;
    }

    const now = performance.now();
    const rawTime = this.audioElement.currentTime || 0;

    // Sincroniza o relógio de alta precisão sempre que o áudio der tick
    if (rawTime !== this._lastAudioTime) {
      this._lastAudioTime = rawTime;
      this._lastPerfTime = now;
      if (Math.abs(this._smoothTime - rawTime) > 0.12) {
        this._smoothTime = rawTime;
      }
    }

    // Interpolação contínua a 60 FPS
    const dt = ((now - this._lastPerfTime) / 1000) * this.playbackRate;
    const targetTime = this._lastAudioTime + dt;

    // Suavização exponencial suave (sem saltos de 50ms)
    this._smoothTime += (targetTime - this._smoothTime) * 0.35;
    return Math.max(0, Math.min(this._smoothTime, this.duration || 1000));
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.audioElement.src) return;
    this.audioElement.play().catch(e => console.warn('Play suspenso pelo browser:', e));
  }

  pause() {
    this.audioElement.pause();
  }

  seek(time) {
    time = Math.max(0, Math.min(time, this.duration || 1000));
    this.audioElement.currentTime = time;
    this._lastAudioTime = time;
    this._lastPerfTime = performance.now();
    this._smoothTime = time;
    this.triggeredSfx.clear();
    this.syncToTime(time);

    // Quando o usuário busca manualmente, atualizamos o painel inspetor completo
    if (this.currentScene && window.Inspector) {
      window.Inspector.selectScene(this.currentScene, false);
    }
  }

  setSpeed(rate) {
    this.playbackRate = rate;
    this.audioElement.playbackRate = rate;
    if (this.videoA) this.videoA.playbackRate = rate;
    if (this.videoB) this.videoB.playbackRate = rate;
  }

  onPlayState(playing) {
    this.isPlaying = playing;
    if (this.btnPlayIcon) {
      this.btnPlayIcon.textContent = playing ? '⏸' : '▶';
    }

    if (playing) {
      this.start60FpsLoop();
      const curVid = (this.activeVideoLayer === 'A') ? this.videoA : this.videoB;
      if (this.activeLayerType === 'video' && curVid && curVid.classList.contains('active')) {
        curVid.play().catch(() => {});
      }
    } else {
      this.stop60FpsLoop();
      if (this.videoA) this.videoA.pause();
      if (this.videoB) this.videoB.pause();
      if (this.currentScene && window.Inspector) {
        window.Inspector.selectScene(this.currentScene, false);
      }
    }
  }

  start60FpsLoop() {
    this.stop60FpsLoop();
    this._lastAudioTime = this.audioElement.currentTime || 0;
    this._lastPerfTime = performance.now();
    this._smoothTime = this._lastAudioTime;

    const tick = () => {
      if (!this.isPlaying) return;
      const t = this.getCurrentSmoothTime();
      this.syncToTime(t);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  stop60FpsLoop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  onEnded() {
    this.onPlayState(false);
    this.seek(0);
  }

  getSceneAtTime(t) {
    if (!this.cenas || this.cenas.length === 0) return null;
    for (let i = 0; i < this.cenas.length; i++) {
      const c = this.cenas[i];
      const isLast = (i === this.cenas.length - 1);
      if (t >= c.ini && (t < c.fim || (isLast && t <= c.fim + 0.15))) {
        return c;
      }
    }
    if (t <= this.cenas[0].ini) return this.cenas[0];
    return this.cenas[this.cenas.length - 1];
  }

  syncToTime(t) {
    this.updateTimeDisplay(t, this.duration);

    // 1. Encontrar cena correspondente de forma contínua
    const cena = this.getSceneAtTime(t);
    if (cena && cena !== this.currentScene) {
      this.transitionToScene(cena);
    }

    // Se a cena ativa for de vídeo, sincroniza o timecode do vídeo ativo sem congelamento
    const activeVid = (this.activeVideoLayer === 'A') ? this.videoA : this.videoB;
    if (this.activeLayerType === 'video' && activeVid && !activeVid.paused) {
      const targetVideoTime = Math.max(0, t - (cena ? cena.ini : 0));
      if (Math.abs(activeVid.currentTime - targetVideoTime) > 0.25) {
        activeVid.currentTime = targetVideoTime;
      }
    }

    // Pré-carregamento do próximo take antes do corte. 0,6 s não dava tempo de o vídeo chegar pelo túnel;
    // com a prévia leve, 2,5 s bastam para ele estar pronto no corte, sem tela parada
    if (cena && this.isPlaying) {
      const tempoRestante = cena.fim - t;
      if (tempoRestante > 0 && tempoRestante <= 2.5) {
        this.prepararProximaCena(cena.n);
      }
    }

    // 2. Atualizar legenda contínua
    this.updateSubtitles(t, cena);

    // 3. Atualizar Overlays de Texto na Tela
    this.updateOverlays(t, cena);

    // 4. Disparar SFX se houver
    this.checkSfxTriggers(t, cena);

    // 5. Movimentar agulha na timeline suavemente a 60 FPS
    if (window.Timeline) {
      window.Timeline.updatePlayhead(t);
    }
  }

  transitionToScene(cena) {
    this.currentScene = cena;
    const mediaUrl = this.urlParaTela(cena);
    const ehVideo = !!(mediaUrl && /\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl));

    // Elemento que estava visível anteriormente
    const outgoingEl = this.currentVisibleEl;

    // Mantém o elemento anterior 100% visível por baixo enquanto o novo elemento se prepara
    if (outgoingEl) {
      outgoingEl.classList.add('underneath');
      outgoingEl.classList.remove('active');
    }

    if (ehVideo) {
      if (this.emptyEl) this.emptyEl.style.display = 'none';

      const incomingVideo = (this.activeVideoLayer === 'A') ? this.videoB : this.videoA;
      const otherVideo = (this.activeVideoLayer === 'A') ? this.videoA : this.videoB;
      this.activeVideoLayer = (this.activeVideoLayer === 'A') ? 'B' : 'A';
      this.activeLayerType = 'video';
      this.videoEl = incomingVideo;
      this.currentVisibleEl = incomingVideo;

      incomingVideo.muted = true;
      // enquanto o vídeo não chega, a capa dele (um quadro do próprio vídeo) fica no lugar da tela preta
      const capa = cena.previa_url ? API.resolverMidia(cena.previa_url) : '';
      if (incomingVideo.getAttribute('poster') !== capa) {
        if (capa) incomingVideo.setAttribute('poster', capa);
        else incomingVideo.removeAttribute('poster');
      }
      if (incomingVideo.src !== mediaUrl) {
        incomingVideo.src = mediaUrl;
      }

      const targetTime = Math.max(0, (this._smoothTime || this.currentTime) - cena.ini);
      try {
        if (Math.abs(incomingVideo.currentTime - targetTime) > 0.05) {
          incomingVideo.currentTime = targetTime;
        }
      } catch (e) {}

      let ativado = false;
      const activateIncomingVideo = () => {
        if (ativado) return;
        ativado = true;
        incomingVideo.classList.add('active');
        incomingVideo.classList.remove('underneath');
        if (this.isPlaying) {
          incomingVideo.play().catch(() => {});
        }
        // Remove a camada anterior somente após o novo frame estar na tela (sem tela preta)
        requestAnimationFrame(() => {
          if (outgoingEl && outgoingEl !== incomingVideo) {
            outgoingEl.classList.remove('active', 'underneath');
            if (outgoingEl.tagName === 'VIDEO') {
              outgoingEl.pause();
            }
          }
          if (otherVideo && otherVideo !== incomingVideo) {
            otherVideo.classList.remove('active', 'underneath');
            otherVideo.pause();
          }
          if (this.imageA) this.imageA.classList.remove('active', 'underneath');
          if (this.imageB) this.imageB.classList.remove('active', 'underneath');
        });
      };

      if (incomingVideo.readyState >= 2) {
        activateIncomingVideo();
      } else {
        const onReady = () => {
          incomingVideo.removeEventListener('loadeddata', onReady);
          incomingVideo.removeEventListener('canplay', onReady);
          activateIncomingVideo();
        };
        incomingVideo.addEventListener('loadeddata', onReady, { once: true });
        incomingVideo.addEventListener('canplay', onReady, { once: true });
        // a cena anterior continua na tela enquanto o primeiro quadro chega. Antes trocava em 80 ms e, pelo
        // túnel, o vídeo ainda não tinha chegado: ficava a tela preta. Passado 1,5 s troca assim mesmo, e a
        // capa do vídeo aparece até ele tocar
        setTimeout(activateIncomingVideo, 1500);
      }
    } else if (mediaUrl) {
      if (this.emptyEl) this.emptyEl.style.display = 'none';

      const incomingImage = (this.activeImageLayer === 'A') ? this.imageB : this.imageA;
      const otherImage = (this.activeImageLayer === 'A') ? this.imageA : this.imageB;
      this.activeImageLayer = (this.activeImageLayer === 'A') ? 'B' : 'A';
      this.activeLayerType = 'image';
      this.currentVisibleEl = incomingImage;

      incomingImage.src = mediaUrl;

      // Reinicia a animação Ken Burns suavemente para a cena ativa
      incomingImage.classList.remove('ken-burns');
      if (this.kenBurnsEnabled) {
        void incomingImage.offsetWidth;
        incomingImage.classList.add('ken-burns');
      }

      let ativado = false;
      const activateIncomingImage = () => {
        if (ativado) return;
        ativado = true;
        incomingImage.classList.add('active');
        incomingImage.classList.remove('underneath');
        requestAnimationFrame(() => {
          if (outgoingEl && outgoingEl !== incomingImage) {
            outgoingEl.classList.remove('active', 'underneath');
            if (outgoingEl.tagName === 'VIDEO') {
              outgoingEl.pause();
            }
          }
          if (this.videoA) {
            this.videoA.classList.remove('active', 'underneath');
            this.videoA.pause();
          }
          if (this.videoB) {
            this.videoB.classList.remove('active', 'underneath');
            this.videoB.pause();
          }
          if (otherImage && otherImage !== incomingImage) {
            otherImage.classList.remove('active', 'underneath');
          }
        });
      };

      if (incomingImage.complete && incomingImage.naturalWidth > 0) {
        activateIncomingImage();
      } else {
        incomingImage.onload = activateIncomingImage;
        setTimeout(activateIncomingImage, 60);
      }
    } else {
      if (outgoingEl) {
        outgoingEl.classList.remove('active', 'underneath');
      }
      if (this.imageA) this.imageA.classList.remove('active', 'underneath');
      if (this.imageB) this.imageB.classList.remove('active', 'underneath');
      if (this.videoA) { this.videoA.classList.remove('active', 'underneath'); this.videoA.pause(); }
      if (this.videoB) { this.videoB.classList.remove('active', 'underneath'); this.videoB.pause(); }
      if (this.emptyEl) this.emptyEl.style.display = 'flex';
      this.currentVisibleEl = null;
    }

    this.highlightActiveSceneCard(cena.n);
  }

  prepararProximaCena(currentSceneNum) {
    const nextScene = this.cenas.find(c => c.n === currentSceneNum + 1);
    const indice = this.cenas.findIndex(c => c.n === currentSceneNum);
    if (indice >= 0) this.preCarregarAFrente(indice + 1, 5);
    if (!nextScene || nextScene._preparada) return;
    nextScene._preparada = true;
    const mediaUrl = this.urlParaTela(nextScene);
    if (!mediaUrl) return;
    const ehVideo = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl);
    if (ehVideo) {
      const standbyVideo = (this.activeVideoLayer === 'A') ? this.videoB : this.videoA;
      if (standbyVideo && standbyVideo.src !== mediaUrl) {
        standbyVideo.preload = 'auto';
        standbyVideo.src = mediaUrl;
        try { standbyVideo.currentTime = 0; } catch (e) {}
      }
    } else {
      const pre = new Image();
      pre.src = mediaUrl;
    }
  }

  highlightActiveSceneCard(n) {
    const cards = document.querySelectorAll('.scene-card');
    cards.forEach(c => {
      const isCurrent = parseInt(c.dataset.cena) === n;
      c.classList.toggle('selected', isCurrent);
      if (isCurrent && this.isPlaying) {
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  updateSubtitles(t, cena) {
    if (!this.subtitleEl) return;

    // 1. Prioridade absoluta: legendas sincronizadas de tela (1 frase curta de 1 linha por bloco)
    if (this.legendas && this.legendas.length > 0) {
      const leg = this.legendas.find(l => t >= l.ini && t <= l.fim);
      if (leg && leg.texto) {
        const texto = leg.texto.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
        if (texto) {
          if (this.subtitleEl.textContent !== texto) {
            this.subtitleEl.textContent = texto;
          }
          this.subtitleEl.style.display = 'inline-block';
          return;
        }
      }
      this.subtitleEl.style.display = 'none';
      return;
    }

    // 2. Unidades de alinhamento com corte automático para no máximo 1 linha (36 caracteres)
    if (this.alinhamento && this.alinhamento.unidades) {
      const unidade = this.alinhamento.unidades.find(u => t >= u.ini && t <= u.fim);
      if (unidade && unidade.texto) {
        let texto = unidade.texto.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
        if (texto.length > 36) {
          const pedacos = this.fatiarEmUmaLinha(texto, 36);
          const durPedaco = Math.max(0.1, (unidade.fim - unidade.ini) / pedacos.length);
          const idx = Math.min(pedacos.length - 1, Math.max(0, Math.floor((t - unidade.ini) / durPedaco)));
          texto = pedacos[idx];
        }
        if (this.subtitleEl.textContent !== texto) {
          this.subtitleEl.textContent = texto;
        }
        this.subtitleEl.style.display = 'inline-block';
        return;
      }
    }

    // 3. Fallback de cena: fatia o texto da cena em frases curtas de 1 linha
    if (cena && cena.texto) {
      const textoCompleto = cena.texto.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
      const pedacos = this.fatiarEmUmaLinha(textoCompleto, 36);
      const durTotal = Math.max(0.1, cena.fim - cena.ini);
      const progresso = Math.min(0.999, Math.max(0, (t - cena.ini) / durTotal));
      const idx = Math.floor(progresso * pedacos.length);
      const textoLinha = pedacos[idx] || pedacos[0];

      if (this.subtitleEl.textContent !== textoLinha) {
        this.subtitleEl.textContent = textoLinha;
      }
      this.subtitleEl.style.display = 'inline-block';
    } else {
      this.subtitleEl.style.display = 'none';
    }
  }

  fatiarEmUmaLinha(texto, maxChars = 36) {
    if (!texto) return [''];
    const palavras = texto.split(/\s+/);
    const linhas = [];
    let atual = '';
    for (const p of palavras) {
      if (!atual) {
        atual = p;
      } else if ((atual + ' ' + p).length <= maxChars) {
        atual += ' ' + p;
      } else {
        linhas.push(atual);
        atual = p;
      }
    }
    if (atual) linhas.push(atual);
    return linhas.length > 0 ? linhas : [texto];
  }

  updateOverlays(t, cena) {
    if (!cena || !cena.texto_tela) {
      if (this.overlayBadgeEl) this.overlayBadgeEl.classList.remove('active');
      if (this.overlayHighlightEl) this.overlayHighlightEl.classList.remove('active');
      return;
    }

    const tt = cena.texto_tela;
    const inicioRel = tt.inicio || 0;
    const inicioAbs = cena.ini + inicioRel;
    const duracaoVisivel = 3.5;
    const visivel = t >= inicioAbs && t <= inicioAbs + duracaoVisivel;

    if (tt.tipo === 'rotulo' || tt.tipo === 'capitulo') {
      if (visivel) {
        this.badgeTitleEl.textContent = tt.titulo || (tt.tipo === 'capitulo' ? 'CAPÍTULO' : 'TÓPICO');
        this.badgeSubEl.textContent = tt.texto || '';
        this.overlayBadgeEl.classList.add('active');
      } else {
        this.overlayBadgeEl.classList.remove('active');
      }
      if (this.overlayHighlightEl) this.overlayHighlightEl.classList.remove('active');
    } else if (tt.tipo === 'destaque') {
      if (visivel) {
        let textoHtml = tt.texto || '';
        if (tt.destaque && textoHtml.includes(tt.destaque)) {
          textoHtml = textoHtml.replace(tt.destaque, `<span class="overlay-highlight-word">${tt.destaque}</span>`);
        }
        this.highlightTextEl.innerHTML = textoHtml;
        this.overlayHighlightEl.classList.add('active');
      } else {
        this.overlayHighlightEl.classList.remove('active');
      }
      if (this.overlayBadgeEl) this.overlayBadgeEl.classList.remove('active');
    }
  }

  checkSfxTriggers(t, cena) {
    if (!cena || !cena.efeito) return;
    const efeito = cena.efeito;
    const triggerTime = cena.ini + (efeito.inicio || 0);

    if (t >= triggerTime && t < triggerTime + 0.35) {
      const sfxKey = `${cena.n}_${triggerTime.toFixed(2)}`;
      if (!this.triggeredSfx.has(sfxKey)) {
        this.triggeredSfx.add(sfxKey);
        this.playSfx(cena);
      }
    }
  }

  playSfx(cena) {
    if (!cena || !cena.efeito_url) return;

    try {
      const sfxAudio = new Audio(cena.efeito_url);
      sfxAudio.volume = Math.min(1.0, this.audioElement.volume * 1.1);
      sfxAudio.play().catch(() => {});
    } catch (e) {
      console.warn('Erro ao tocar SFX:', e);
    }

    if (this.sfxFlashEl) {
      if (this.sfxFlashTextEl) {
        this.sfxFlashTextEl.textContent = cena.efeito.descricao || 'SFX';
      }
      this.sfxFlashEl.classList.add('trigger');
      setTimeout(() => {
        this.sfxFlashEl.classList.remove('trigger');
      }, 1000);
    }
  }

  prevScene() {
    if (!this.currentScene) return;
    const idx = this.cenas.indexOf(this.currentScene);
    if (idx > 0) {
      this.seek(this.cenas[idx - 1].ini);
    } else {
      this.seek(0);
    }
  }

  nextScene() {
    if (!this.currentScene) return;
    const idx = this.cenas.indexOf(this.currentScene);
    if (idx < this.cenas.length - 1) {
      this.seek(this.cenas[idx + 1].ini);
    }
  }

  updateTimeDisplay(current, total) {
    if (this.timecodeCurrentEl) {
      this.timecodeCurrentEl.textContent = this.formatTimecode(current);
    }
    if (this.timecodeTotalEl) {
      this.timecodeTotalEl.textContent = this.formatTimecode(total);
    }
  }

  formatTimecode(sec) {
    sec = Math.max(0, sec || 0);
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }
}

window.StudioPlayer = StudioPlayer;
