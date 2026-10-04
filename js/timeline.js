/**
 * TipLabs - Multi-Track Timeline
 * Renderiza faixas de animação (motion), vídeo, narração, efeitos sonoros (SFX) e música de fundo.
 * Permite scrub interativo, zoom e seleção de blocos.
 */

class StudioTimeline {
  constructor() {
    this.container = document.getElementById('timeline-tracks-scroll');
    this.canvasWrapper = document.getElementById('timeline-canvas-container');
    this.rulerEl = document.getElementById('time-ruler');
    this.tracksBodyEl = document.getElementById('tracks-body');
    this.playheadEl = document.getElementById('timeline-playhead');
    this.playheadHandleEl = document.getElementById('playhead-handle');

    this.trackMotionEl = document.getElementById('track-motion');
    this.trackVideoEl = document.getElementById('track-video');
    this.trackAudioEl = document.getElementById('track-audio');
    this.trackSfxEl = document.getElementById('track-sfx');
    this.trackMusicEl = document.getElementById('track-music');

    this.project = null;
    this.cenas = [];
    this.motion = [];
    this.duration = 0;
    this.pixelsPerSecond = 35; // Nível de zoom inicial
    this.minZoom = 15;
    this.maxZoom = 120;

    this.isDraggingPlayhead = false;

    this.bindEvents();
    this.initResizeHandle();
  }

  initResizeHandle() {
    const handle = document.getElementById('timeline-resize-handle');
    const secao = document.getElementById('timeline-section');
    if (!handle || !secao) return;

    // Lembra a altura escolhida da última vez, só neste navegador
    try {
      // nunca menor que o necessário para as cinco faixas (Motion entrou acima das Cenas)
      const salva = localStorage.getItem('fabrica-studio-altura-timeline');
      if (salva) secao.style.height = `${Math.max(parseInt(salva, 10) || 0, 245)}px`;
    } catch (_) {}

    let arrastando = false;
    let alturaInicial = 0;
    let yInicial = 0;

    const aoMover = (e) => {
      if (!arrastando) return;
      const deltaY = yInicial - (e.touches ? e.touches[0].clientY : e.clientY);
      const min = parseInt(getComputedStyle(secao).minHeight, 10) || 120;
      const max = parseInt(getComputedStyle(secao).maxHeight, 10) || 600;
      const novaAltura = Math.min(max, Math.max(min, alturaInicial + deltaY));
      secao.style.height = `${novaAltura}px`;
    };

    const aoSoltar = () => {
      if (!arrastando) return;
      arrastando = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem('fabrica-studio-altura-timeline', String(secao.offsetHeight));
      } catch (_) {}
    };

    const aoComecar = (e) => {
      arrastando = true;
      yInicial = e.touches ? e.touches[0].clientY : e.clientY;
      alturaInicial = secao.offsetHeight;
      handle.classList.add('dragging');
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    handle.addEventListener('mousedown', aoComecar);
    handle.addEventListener('touchstart', aoComecar, { passive: false });
    window.addEventListener('mousemove', aoMover);
    window.addEventListener('touchmove', aoMover, { passive: false });
    window.addEventListener('mouseup', aoSoltar);
    window.addEventListener('touchend', aoSoltar);

    // Duplo clique volta pro tamanho padrão
    handle.addEventListener('dblclick', () => {
      secao.style.height = '245px';
      try { localStorage.setItem('fabrica-studio-altura-timeline', '245'); } catch (_) {}
    });
  }

  bindEvents() {
    const btnExcluirTodas = document.getElementById('btn-motion-excluir-todas');
    if (btnExcluirTodas) {
      btnExcluirTodas.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.App && typeof window.App.excluirMotion === 'function') window.App.excluirMotion(null);
      });
    }

    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => this.setZoom(this.pixelsPerSecond * 1.3));
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => this.setZoom(this.pixelsPerSecond / 1.3));
    }

    // Scrubbing por clique ou arraste na timeline
    if (this.container) {
      this.container.addEventListener('mousedown', (e) => {
        // Se não clicou num botão específico de ação
        if (e.target.closest('.timeline-cue-sfx') && e.shiftKey) return;
        this.isDraggingPlayhead = true;
        this.handleTimelineScrub(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDraggingPlayhead) {
          this.handleTimelineScrub(e);
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDraggingPlayhead = false;
      });
    }
  }

  setZoom(pps) {
    this.pixelsPerSecond = Math.max(this.minZoom, Math.min(this.maxZoom, pps));
    this.render();
    if (window.Player) {
      this.updatePlayhead(window.Player.currentTime);
    }
  }

  loadProject(projectData) {
    this.project = projectData;
    this.cenas = projectData.cenas || [];
    this.motion = projectData.motion || [];
    this.duration = projectData.duracao || (projectData.alinhamento ? projectData.alinhamento.duracao : 0);

    if (this.cenas.length > 0 && this.duration === 0) {
      this.duration = this.cenas[this.cenas.length - 1].fim;
    }

    this.render();
  }

  render() {
    if (!this.duration) return;

    const totalWidth = Math.max(this.container.clientWidth, this.duration * this.pixelsPerSecond + 100);
    this.canvasWrapper.style.width = `${totalWidth}px`;

    this.renderRuler(totalWidth);
    this.renderMotionTrack();
    this.renderVideoTrack();
    this.renderAudioTrack();
    this.renderSfxTrack();
    this.renderMusicTrack();
  }

  renderRuler(totalWidth) {
    this.rulerEl.innerHTML = '';
    const stepSeconds = this.pixelsPerSecond > 60 ? 1 : (this.pixelsPerSecond > 25 ? 5 : 10);
    const totalMarks = Math.ceil(this.duration / stepSeconds);
    const fragmento = document.createDocumentFragment();

    for (let i = 0; i <= totalMarks; i++) {
      const sec = i * stepSeconds;
      const left = sec * this.pixelsPerSecond;

      const mark = document.createElement('div');
      mark.className = 'ruler-mark';
      mark.style.left = `${left}px`;

      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      mark.textContent = `${m}:${String(s).padStart(2, '0')}`;
      fragmento.appendChild(mark);
    }
    this.rulerEl.appendChild(fragmento);
  }

  // Faixa Motion: cada animação com a duração dela (3 a 8 s, pelo que está escrito), passando por cima das cenas
  renderMotionTrack() {
    if (!this.trackMotionEl) return;
    this.trackMotionEl.innerHTML = '';
    const fragmento = document.createDocumentFragment();
    const nomes = { frase: 'Frase', numero: 'Número', contraste: 'Contraste', radial: 'Radial', lista: 'Lista',
                    fluxo: 'Fluxo', linha_do_tempo: 'Linha do tempo', mapa: 'Mapa' };

    this.motion.forEach((m) => {
      const dur = m.fim - m.ini;
      const block = document.createElement('div');
      block.className = 'timeline-block-motion';
      block.dataset.motion = m.id;
      block.style.left = `${m.ini * this.pixelsPerSecond}px`;
      block.style.width = `${Math.max(16, dur * this.pixelsPerSecond)}px`;
      block.title = `Animação (${nomes[m.modelo] || m.modelo || 'motion'}, ${dur.toFixed(1)}s): ${m.texto || ''}`;

      const tipo = document.createElement('span');
      tipo.className = 'motion-block-tipo';
      tipo.textContent = `${nomes[m.modelo] || 'Motion'} ${dur.toFixed(1)}s`;
      block.appendChild(tipo);

      const texto = document.createElement('span');
      texto.className = 'motion-block-texto';
      texto.textContent = m.texto || '';
      block.appendChild(texto);

      const excluir = document.createElement('button');
      excluir.type = 'button';
      excluir.className = 'motion-block-excluir';
      excluir.textContent = '×';
      excluir.title = 'Excluir esta animação do vídeo';
      excluir.addEventListener('mousedown', (e) => e.stopPropagation());
      excluir.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.App && typeof window.App.excluirMotion === 'function') window.App.excluirMotion(m);
      });
      block.appendChild(excluir);

      block.addEventListener('mousedown', (e) => e.stopPropagation());
      block.addEventListener('click', (e) => {
        e.stopPropagation();
        // a cena em que a animação começa: o inspetor mostra o cartão de animação dela
        const cena = this.cenas.find(c => m.ini + 0.05 >= c.ini && m.ini + 0.05 < c.fim);
        if (cena) this.selectSceneBlock(cena.n);
        if (window.Player) window.Player.seek(m.ini);
      });

      fragmento.appendChild(block);
    });

    this.trackMotionEl.appendChild(fragmento);
  }

  marcarMotionTocando(id) {
    if (!this.trackMotionEl || this._motionTocando === id) return;
    this._motionTocando = id;
    this.trackMotionEl.querySelectorAll('.timeline-block-motion').forEach(b => {
      b.classList.toggle('tocando', b.dataset.motion === id);
    });
  }

  renderVideoTrack() {
    this.trackVideoEl.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    this.cenas.forEach((cena) => {
      const left = cena.ini * this.pixelsPerSecond;
      const width = Math.max(16, (cena.fim - cena.ini) * this.pixelsPerSecond);

      const block = document.createElement('div');
      block.className = 'timeline-block-scene';
      block.dataset.cena = cena.n;
      if (cena.sem_arquivo) block.classList.add('sem-arquivo');
      block.style.left = `${left}px`;
      block.style.width = `${width}px`;

      // Miniatura
      // miniatura de 320px feita pela fábrica; o original pesado só se ela ainda não existir
      let thumbSrc = cena.thumb_url || cena.capa_url || (cena.tipo === "foto_real" ? cena.midia_url : null) || (cena.img_ia_url || "");
      const thumb = document.createElement('img');
      thumb.className = 'scene-block-thumb';
      thumb.src = thumbSrc;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      thumb.onerror = () => { thumb.style.display = 'none'; };
      block.appendChild(thumb);

      // Info
      const info = document.createElement('div');
      info.className = 'scene-block-info';

      const title = document.createElement('span');
      title.className = 'scene-block-title';
      title.textContent = `Cena ${cena.n}`;
      info.appendChild(title);

      const dur = document.createElement('span');
      dur.className = 'scene-block-dur';
      dur.textContent = `${(cena.fim - cena.ini).toFixed(1)}s`;
      info.appendChild(dur);

      block.appendChild(info);

      block.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectSceneBlock(cena.n);
        if (window.Player) {
          window.Player.seek(cena.ini);
        }
      });

      fragmento.appendChild(block);
    });

    this.trackVideoEl.appendChild(fragmento);
  }

  renderAudioTrack() {
    // Um bloco por cena (não por palavra): com alinhamento fino um vídeo longo
    // teria milhares de blocos de palavra, deixando a faixa lenta e poluída.
    this.trackAudioEl.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    this.cenas.forEach((cena) => {
      const left = cena.ini * this.pixelsPerSecond;
      const width = Math.max(8, (cena.fim - cena.ini) * this.pixelsPerSecond);

      const block = document.createElement('div');
      block.className = 'timeline-block-audio';
      block.style.left = `${left}px`;
      block.style.width = `${width}px`;

      const text = document.createElement('span');
      text.className = 'audio-block-text';
      text.textContent = cena.texto || '';
      block.appendChild(text);

      fragmento.appendChild(block);
    });

    this.trackAudioEl.appendChild(fragmento);
  }

  renderSfxTrack() {
    this.trackSfxEl.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    this.cenas.forEach((cena) => {
      if (!cena.efeito || !cena.efeito.descricao) return;

      const triggerSec = cena.ini + (cena.efeito.inicio || 0);
      const durSec = cena.efeito.duracao || 2.0;

      const left = triggerSec * this.pixelsPerSecond;
      const width = Math.max(34, durSec * this.pixelsPerSecond);

      const cue = document.createElement('div');
      cue.className = 'timeline-cue-sfx';
      cue.style.left = `${left}px`;
      cue.style.width = `${width}px`;
      cue.title = `SFX: ${cena.efeito.descricao} (${durSec}s) - Cena ${cena.n}`;

      const label = document.createElement('span');
      label.className = 'sfx-cue-label';
      label.textContent = `SFX: ${cena.efeito.descricao}`;
      cue.appendChild(label);

      cue.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectSceneBlock(cena.n);
        if (window.Inspector) {
          window.Inspector.switchTab('sfx');
        }
        if (window.Player) {
          window.Player.seek(triggerSec);
          window.Player.playSfx(cena);
        }
      });

      fragmento.appendChild(cue);
    });

    this.trackSfxEl.appendChild(fragmento);
  }

  renderMusicTrack() {
    this.trackMusicEl.innerHTML = '';
    const totalWidth = this.duration * this.pixelsPerSecond;

    const musicBlock = document.createElement('div');
    musicBlock.className = 'timeline-block-music';
    musicBlock.style.width = `${totalWidth}px`;
    musicBlock.textContent = 'Trilha Sonora';

    this.trackMusicEl.appendChild(musicBlock);
  }

  selectSceneBlock(n, abrirNoInspetor = true) {
    const blocks = this.trackVideoEl.querySelectorAll('.timeline-block-scene');
    blocks.forEach(b => {
      b.classList.toggle('selected', parseInt(b.dataset.cena) === n);
    });
    if (!abrirNoInspetor) return;

    const cena = this.cenas.find(c => c.n === n);
    if (cena && window.Inspector) {
      window.Inspector.selectScene(cena);
    }
  }

  updatePlayhead(currentTime) {
    const left = currentTime * this.pixelsPerSecond;
    if (this.playheadEl) {
      this.playheadEl.style.transform = `translate3d(${left}px, 0, 0)`;
    }

    // Parado (clique numa cena da lista, nos botões de cena, na régua): a agulha nunca fica fora da tela. Antes a
    // timeline só acompanhava tocando, e escolher uma cena na lista deixava a agulha escondida
    if (this.container && !(window.Player && window.Player.isPlaying) && !this.isDraggingPlayhead) {
      const scrollLeft = this.container.scrollLeft;
      const clientWidth = this.container.clientWidth;
      if (left < scrollLeft + 20 || left > scrollLeft + clientWidth - 20) {
        this.container.scrollLeft = Math.max(0, left - clientWidth * 0.3);
      }
      return;
    }

    // Acompanhamento suave e contínuo da agulha (sem saltos bruscos)
    if (window.Player && window.Player.isPlaying && this.container) {
      const scrollLeft = this.container.scrollLeft;
      const clientWidth = this.container.clientWidth;
      const triggerX = scrollLeft + clientWidth * 0.65;
      
      if (left > triggerX) {
        // Deslocamento contínuo suave estilo câmera de playback
        const targetScroll = left - clientWidth * 0.35;
        this.container.scrollLeft += (targetScroll - scrollLeft) * 0.08;
      } else if (left < scrollLeft) {
        this.container.scrollLeft = Math.max(0, left - 40);
      }
    }
  }

  handleTimelineScrub(e) {
    const rect = this.canvasWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(x / this.pixelsPerSecond, this.duration));

    if (window.Player) {
      window.Player.seek(time);
    }
  }
}

window.StudioTimeline = StudioTimeline;
