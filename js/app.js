/**
 * TipLabs - Main Application Controller
 * Orquestra projetos, lista de cenas, atalhos de teclado, terminal de execução e salvamento.
 */

class StudioApp {
  constructor() {
    this.currentProjectName = null;
    this.currentProjectData = null;
    this._switchToken = 0;   // descarta a resposta de um switchProject antigo se outro começou depois
    this.sceneMonitorInterval = null;
    this.hasUnsavedChanges = false;
    this.currentFilter = 'all';

    // Elementos da UI
    this.badgeDuracao = document.getElementById('badge-duracao');
    this.badgeCenas = document.getElementById('badge-cenas');
    this.badgeStatus = document.getElementById('badge-status');
    this.sceneListContainer = document.getElementById('scene-list-scroll');
    this.filterPills = document.querySelectorAll('.filter-pill');

    // Botões globais
    this.btnSave = document.getElementById('btn-save');
    this.btnRender = document.getElementById('btn-render');
    this.btnVerFinal = document.getElementById('btn-ver-final');
    this.btnVerFinalVertical = document.getElementById('btn-ver-final-vertical');
    this.btnReload = document.getElementById('btn-reload');
    this.btnLimparMidia = document.getElementById('btn-limpar-midia');
    this.btnContinuar = document.getElementById('btn-continuar');
    this.btnExcluirProjeto = document.getElementById('btn-excluir-projeto');

    // Modal de Custos Reais (do vídeo aberto no momento)
    this.btnAbrirCustos = document.getElementById('btn-abrir-custos');
    this.modalCustos = document.getElementById('modal-custos');
    this.btnModalCustosClose = document.getElementById('btn-modal-custos-close');
    this.custosProjetoNome = document.getElementById('custos-projeto-nome');
    this.custosVazio = document.getElementById('custos-vazio');
    this.custosConteudo = document.getElementById('custos-conteudo');
    this.custosTotalValor = document.getElementById('custos-total-valor');
    this.custosCategorias = document.getElementById('custos-categorias');
    this.custosLista = document.getElementById('custos-lista');
    this.custosNarracao = document.getElementById('custos-narracao');
    this.custosModelos = document.getElementById('custos-modelos');

    // Modal de Confirmação de Exclusão de Projeto
    this.modalExcluirProjeto = document.getElementById('modal-excluir-projeto');
    this.btnModalExcluirClose = document.getElementById('btn-modal-excluir-close');
    this.btnCancelarExcluir = document.getElementById('btn-cancelar-excluir');
    this.btnConfirmarExcluir = document.getElementById('btn-confirmar-excluir');
    this.excluirProjetoNome = document.getElementById('excluir-projeto-nome');

    // Terminal Drawer
    this.terminalDrawer = document.getElementById('terminal-drawer');
    this.terminalClose = document.getElementById('btn-terminal-close');
    this.terminalClear = document.getElementById('btn-terminal-clear');
    this.terminalToggle = document.getElementById('btn-terminal-toggle');
    this.terminalBody = document.getElementById('terminal-body');
    this.terminalTitle = document.getElementById('terminal-title');
    this.statusDot = document.getElementById('status-dot');

    // Modais de Renderização, Progresso e Vídeo Final
    this.modalRenderOptions = document.getElementById('modal-render-options');
    this.btnModalRenderClose = document.getElementById('btn-modal-render-close');
    this.btnCancelRender = document.getElementById('btn-cancel-render');
    this.btnConfirmRender = document.getElementById('btn-confirm-render');

    this.modalRenderProgress = document.getElementById('modal-render-progress');
    this.renderProgressPct = document.getElementById('render-progress-pct');
    this.renderProgressFill = document.getElementById('render-progress-fill');
    this.renderProgressStage = document.getElementById('render-progress-stage');
    this.renderStatusBadge = document.getElementById('render-status-badge');

    this.modalFinal = document.getElementById('modal-final-video');
    this.modalFinalVideo = document.getElementById('modal-final-player');
    this.modalFinalClose = document.getElementById('btn-modal-final-close');
    this.finalVideoDur = document.getElementById('final-video-dur');
    this.finalVideoSize = document.getElementById('final-video-size');
    this.btnDownloadFinal = document.getElementById('btn-download-final');
    this.btnCopyCredits = document.getElementById('btn-copy-credits');

    // Modal Publicar no YouTube
    this.btnAbrirYoutubePublicar = document.getElementById('btn-abrir-youtube-publicar');
    this.modalYoutube = document.getElementById('modal-youtube-publicar');
    this.btnModalYoutubeClose = document.getElementById('btn-modal-youtube-close');
    this.ytNaoConectado = document.getElementById('yt-nao-conectado');
    this.linkYoutubeConectar = document.getElementById('link-youtube-conectar');
    this.btnYoutubeJaConectei = document.getElementById('btn-youtube-ja-conectei');
    this.ytConectadoInfo = document.getElementById('yt-conectado-info');
    this.ytCanalAvatar = document.getElementById('yt-canal-avatar');
    this.ytCanalNome = document.getElementById('yt-canal-nome');
    this.btnYoutubeDesconectar = document.getElementById('btn-youtube-desconectar');
    this.ytJaPublicado = document.getElementById('yt-ja-publicado');
    this.ytJaPublicadoTexto = document.getElementById('yt-ja-publicado-texto');
    this.ytJaPublicadoLink = document.getElementById('yt-ja-publicado-link');
    this.btnYoutubePublicarDeNovo = document.getElementById('btn-youtube-publicar-de-novo');
    this.formYoutubePublicar = document.getElementById('form-youtube-publicar');
    this.ytInputTitulo = document.getElementById('yt-input-titulo');
    this.ytInputDescricao = document.getElementById('yt-input-descricao');
    this.ytInputTags = document.getElementById('yt-input-tags');
    this.ytInputPrivacidade = document.getElementById('yt-input-privacidade');
    this.ytInputAgendar = document.getElementById('yt-input-agendar');
    this.ytAgendarCampo = document.getElementById('yt-agendar-campo');
    this.ytInputData = document.getElementById('yt-input-data');
    this.btnYoutubeEnviar = document.getElementById('btn-youtube-enviar');
    this.ytProgresso = document.getElementById('yt-progresso');
    this.ytProgressoFill = document.getElementById('yt-progresso-fill');
    this.ytProgressoTexto = document.getElementById('yt-progresso-texto');
    this.ytStatus = document.getElementById('yt-status');

    // Telas
    this.viewEditor = document.getElementById('view-editor');
    this.viewNovoProjeto = document.getElementById('view-novo-projeto');
    this.viewDashboard = document.getElementById('view-dashboard');
    this.viewNichos = document.getElementById('view-nichos');
    this.btnNovoProjeto = document.getElementById('btn-novo-projeto');
    this.formNovoProjeto = document.getElementById('form-novo-projeto');
    this.selectPerfilNovo = document.getElementById('select-perfil-novo');
    this.inputNomeProjeto = document.getElementById('input-nome-projeto');
    this.textareaRoteiro = document.getElementById('textarea-roteiro');
    this.selectVoz = document.getElementById('select-voz');
    this.voicePicker = new VoicePicker({
      btnGenaipro: 'btn-voz-provedor-genaipro',
      btnEdge: 'btn-voz-provedor-edge',
      painelGenaipro: 'painel-voz-genaipro',
      painelEdge: 'painel-voz-edge',
      voiceGrid: 'voice-card-grid-novo',
      modelo: 'select-modelo-genaipro',
      estabilidade: 'slider-estabilidade-novo',
      similaridade: 'slider-similaridade-novo',
      estilo: 'slider-estilo-novo',
      velocidade: 'slider-velocidade-novo',
      valorEstabilidade: 'valor-estabilidade-novo',
      valorSimilaridade: 'valor-similaridade-novo',
      valorEstilo: 'valor-estilo-novo',
      valorVelocidade: 'valor-velocidade-novo',
      vozEdge: 'select-voz',
    });
    this.voicePicker.setProvedor('genaipro');
    this.imgProvedor = 'openrouter';
    this.btnImgProvedorOpenrouter = document.getElementById('btn-img-provedor-openrouter');
    this.btnImgProvedorKie = document.getElementById('btn-img-provedor-kie');
    this.btnCancelarNovo = document.getElementById('btn-cancelar-novo');
    this.btnCriarProjeto = document.getElementById('btn-criar-projeto');
    this.roteiroCharCount = document.getElementById('roteiro-char-count');
    this.roteiroWordCount = document.getElementById('roteiro-word-count');

    // Elementos do Modal com Stepper de 4 Etapas
    this.modalCriacaoStepper = document.getElementById('modal-criacao-stepper');
    this.criacaoProjBadge = document.getElementById('criacao-proj-badge');
    this.criacaoStatusPill = document.getElementById('criacao-status-pill');
    this.criacaoStatusMsg = document.getElementById('criacao-status-msg');
    this.criacaoProgressPct = document.getElementById('criacao-progress-pct');
    this.criacaoProgressFill = document.getElementById('criacao-progress-fill');
    this.criacaoSuccessBanner = document.getElementById('criacao-success-banner');
    this.criacaoMapa = document.getElementById('criacao-mapa');
    this.btnModalStepperMinimize = document.getElementById('btn-modal-stepper-minimize');
    this.btnModalStepperClose = document.getElementById('btn-modal-stepper-close');

    // Widget Flutuante de Progresso Minimizado
    this.criacaoMinimizedWidget = document.getElementById('criacao-minimized-widget');
    this.floatingProjName = document.getElementById('floating-proj-name');
    this.floatingPct = document.getElementById('floating-pct');
    this.floatingStage = document.getElementById('floating-stage');
    this.btnFloatingExpand = document.getElementById('btn-floating-expand');

    this.init();
  }

  async init() {
    // Instanciar subsistemas
    window.Player = new StudioPlayer();
    window.Timeline = new StudioTimeline();
    window.Inspector = new StudioInspector();

    this.dashboard = new StudioDashboard(this);
    this.nichos = new NichosPage(this);

    this.bindEvents();
    this.initRouting();
    await this.loadVozes();
    await this.loadPerfis();
    await this.voicePicker.init();

    // a URL decide onde o app abre (padrão: painel)
    await this.handleHashChange();
  }

  bindEvents() {
    // Provedor de imagem de IA (tela Novo Vídeo)
    if (this.btnImgProvedorOpenrouter) {
      this.btnImgProvedorOpenrouter.addEventListener('click', () => this.setImgProvedor('openrouter'));
    }
    if (this.btnImgProvedorKie) {
      this.btnImgProvedorKie.addEventListener('click', () => this.setImgProvedor('kie'));
    }

    // Botão "+ Novo Vídeo"
    if (this.btnNovoProjeto) {
      this.btnNovoProjeto.addEventListener('click', () => {
        this.showView('novo');
      });
    }

    // Botão "Procurar Nichos"
    document.getElementById('btn-abrir-nichos')?.addEventListener('click', () => {
      this.showView('nichos');
    });

    // Botão "Voltar ao painel"
    if (this.btnCancelarNovo) {
      this.btnCancelarNovo.addEventListener('click', () => {
        this.showView('dashboard');
      });
    }

    // Validação e auto-slug no campo Nome do Projeto
    if (this.inputNomeProjeto) {
      this.inputNomeProjeto.addEventListener('input', (e) => {
        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
        if (clean !== e.target.value) {
          e.target.value = clean;
        }
      });
    }

    // Contadores dinâmicos no Roteiro
    if (this.textareaRoteiro) {
      const updateCounts = () => {
        const text = this.textareaRoteiro.value || '';
        const charCount = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = text.trim() ? words.length : 0;
        if (this.roteiroCharCount) this.roteiroCharCount.textContent = `${charCount} caracteres`;
        if (this.roteiroWordCount) this.roteiroWordCount.textContent = `${wordCount} palavras`;
      };
      this.textareaRoteiro.addEventListener('input', updateCounts);
      this.textareaRoteiro.addEventListener('keyup', updateCounts);
    }

    // Submissão do Formulário de Criação de Projeto
    if (this.formNovoProjeto) {
      this.formNovoProjeto.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCriarProjeto();
      });
    }

    // Filtros de cenas
    this.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.dataset.filter;
        this.renderSceneList();
      });
    });

    // Botão Salvar
    if (this.btnSave) {
      this.btnSave.addEventListener('click', () => this.saveChanges());
    }

    // Botão Principal "Renderizar Vídeo"
    if (this.btnRender) {
      this.btnRender.addEventListener('click', () => this.promptRenderOptions());
    }

    // Botão "Continuar carregamento"
    if (this.btnContinuar) {
      this.btnContinuar.addEventListener('click', () => this.continuarCarregamento());
    }

    // Botão "Corrigir Mídia"
    if (this.btnLimparMidia) {
      this.btnLimparMidia.addEventListener('click', () => this.iniciarLimpezaMidia());
    }

    // Botão "Custos" (gasto real deste vídeo)
    if (this.btnAbrirCustos) {
      this.btnAbrirCustos.addEventListener('click', () => this.abrirCustos());
    }
    if (this.btnModalCustosClose) {
      this.btnModalCustosClose.addEventListener('click', () => this.fecharCustos());
    }
    if (this.modalCustos) {
      this.modalCustos.addEventListener('click', (e) => {
        if (e.target === this.modalCustos) this.fecharCustos();
      });
    }

    // Modal de Opções de Renderização
    if (this.btnConfirmRender) {
      this.btnConfirmRender.addEventListener('click', () => this.startRenderProcess());
    }
    if (this.btnCancelRender) {
      this.btnCancelRender.addEventListener('click', () => this.closeRenderOptionsModal());
    }
    if (this.btnModalRenderClose) {
      this.btnModalRenderClose.addEventListener('click', () => this.closeRenderOptionsModal());
    }

    // Botão Ver Vídeo Final
    if (this.btnVerFinal) {
      this.btnVerFinal.addEventListener('click', () => this.openFinalVideoModal());
    }
    if (this.btnVerFinalVertical) {
      this.btnVerFinalVertical.addEventListener('click', () => {
        const d = this.currentProjectData || {};
        if (d.final_vertical_url) this.openFinalVideoModal({ video_url: d.final_vertical_url, vertical: true });
      });
    }

    // Ações do Modal Final
    if (this.modalFinalClose) {
      this.modalFinalClose.addEventListener('click', () => this.closeFinalVideoModal());
    }
    if (this.btnCopyCredits) {
      this.btnCopyCredits.addEventListener('click', () => this.copyCreditsToClipboard());
    }

    // Modal Publicar no YouTube
    this.btnAbrirYoutubePublicar?.addEventListener('click', () => this.abrirYoutubePublicar());
    this.btnModalYoutubeClose?.addEventListener('click', () => this.fecharYoutubePublicar());
    this.modalYoutube?.addEventListener('click', (e) => {
      if (e.target === this.modalYoutube) this.fecharYoutubePublicar();
    });
    this.btnYoutubeJaConectei?.addEventListener('click', () => this.carregarStatusYoutube());
    this.btnYoutubeDesconectar?.addEventListener('click', () => this.desconectarYoutube());
    this.btnYoutubePublicarDeNovo?.addEventListener('click', () => {
      if (this.ytJaPublicado) this.ytJaPublicado.style.display = 'none';
      if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = 'flex';
    });
    this.ytInputAgendar?.addEventListener('change', () => {
      if (this.ytAgendarCampo) this.ytAgendarCampo.style.display = this.ytInputAgendar.checked ? 'block' : 'none';
    });
    this.formYoutubePublicar?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.enviarYoutube();
    });

    // Botão Recarregar
    if (this.btnReload) {
      this.btnReload.addEventListener('click', () => this.reloadProject());
    }

    // Botão Excluir Projeto + Modal de Confirmação
    if (this.btnExcluirProjeto) {
      this.btnExcluirProjeto.addEventListener('click', () => this.openExcluirProjetoModal());
    }
    if (this.btnModalExcluirClose) {
      this.btnModalExcluirClose.addEventListener('click', () => this.closeExcluirProjetoModal());
    }
    if (this.btnCancelarExcluir) {
      this.btnCancelarExcluir.addEventListener('click', () => this.closeExcluirProjetoModal());
    }
    if (this.btnConfirmarExcluir) {
      this.btnConfirmarExcluir.addEventListener('click', () => this.confirmarExcluirProjeto());
    }

    // Fechar Terminal Drawer
    if (this.terminalClose) {
      this.terminalClose.addEventListener('click', () => {
        this.terminalDrawer.classList.remove('open');
      });
    }

    if (this.terminalClear) {
      this.terminalClear.addEventListener('click', () => {
        this.terminalBody.textContent = '';
      });
    }

    // Aba fixa: abre/fecha o console a qualquer momento, mesmo sem uma ação em andamento
    if (this.terminalToggle) {
      this.terminalToggle.addEventListener('click', () => {
        this.terminalDrawer.classList.toggle('open');
      });
    }

    // Minimizar / Fechar Stepper
    if (this.btnModalStepperMinimize) {
      this.btnModalStepperMinimize.addEventListener('click', () => this.minimizeStepper());
    }
    if (this.btnModalStepperClose) {
      this.btnModalStepperClose.addEventListener('click', () => this.minimizeStepper());
    }
    if (this.btnFloatingExpand) {
      this.btnFloatingExpand.addEventListener('click', () => this.expandStepper());
    }

    // Fechar / Minimizar modais ao clicar no fundo
    [this.modalRenderOptions, this.modalFinal, this.modalCriacaoStepper, this.modalExcluirProjeto].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            if (modal === this.modalCriacaoStepper) {
              this.minimizeStepper();
            } else {
              modal.classList.remove('open');
              if (modal === this.modalFinal && this.modalFinalVideo) {
                this.modalFinalVideo.pause();
                this.modalFinalVideo.src = '';
              }
            }
          }
        });
      }
    });

    // Atalhos Globais de Teclado
    window.addEventListener('keydown', (e) => {
      // Ignorar atalhos se o foco estiver num campo de texto
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          this.saveChanges();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        window.Player.togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        window.Player.seek(window.Player.currentTime - (e.shiftKey ? 5 : 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        window.Player.seek(window.Player.currentTime + (e.shiftKey ? 5 : 1));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        window.Player.prevScene();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        window.Player.nextScene();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveChanges();
      }
    });
  }

  showView(viewName, updateHash = true) {
    const telas = {
      dashboard: this.viewDashboard,
      novo: this.viewNovoProjeto,
      editor: this.viewEditor,
      nichos: this.viewNichos,
    };
    if (!telas[viewName]) viewName = 'dashboard';

    Object.entries(telas).forEach(([nome, el]) => {
      if (el) el.style.display = nome === viewName ? 'flex' : 'none';
    });
    if (viewName !== 'editor' && this.sceneMonitorInterval) {
      clearInterval(this.sceneMonitorInterval);
      this.sceneMonitorInterval = null;
    }

    // o CSS usa isso para esconder os controles de timeline fora do editor
    document.body.dataset.view = viewName;

    if (viewName === 'dashboard' && this.dashboard) {
      this.dashboard.recarregar();
    }

    if (!updateHash) return;
    if (viewName === 'novo') {
      window.location.hash = '#/novo';
    } else if (viewName === 'nichos') {
      window.location.hash = '#/nichos';
    } else if (viewName === 'editor' && this.currentProjectName) {
      window.location.hash = `#/editor/${this.currentProjectName}`;
    } else {
      window.location.hash = '#/';
    }
  }

  initRouting() {
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  /** Decide a tela pela URL. O padrão é o painel. */
  async handleHashChange() {
    const hash = window.location.hash;

    if (hash === '#/novo') {
      this.showView('novo', false);
      return;
    }

    if (hash === '#/nichos') {
      this.showView('nichos', false);
      return;
    }

    const match = hash.match(/^#\/?editor\/(.+)$/i);
    if (match && match[1]) {
      const nome = decodeURIComponent(match[1]);
      if (nome !== this.currentProjectName) {
        await this.switchProject(nome);
      }
      this.showView('editor', false);
      return;
    }

    this.showView('dashboard', false);
  }

  setImgProvedor(provedor) {
    this.imgProvedor = provedor;
    if (this.btnImgProvedorOpenrouter) this.btnImgProvedorOpenrouter.classList.toggle('active', provedor === 'openrouter');
    if (this.btnImgProvedorKie) this.btnImgProvedorKie.classList.toggle('active', provedor === 'kie');
  }

  async loadVozes() {
    try {
      const vozes = await API.getVozes();

      if (this.selectVoz && vozes.length > 0) {
        this.selectVoz.innerHTML = '';
        vozes.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = v.nome;
          if (v.id === 'pt-BR-AntonioNeural') opt.selected = true;
          this.selectVoz.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar perfis/vozes:', err);
    }
  }

  minimizeStepper() {
    if (this.modalCriacaoStepper) {
      this.modalCriacaoStepper.classList.remove('open');
    }
    if (this.criacaoMinimizedWidget) {
      this.criacaoMinimizedWidget.style.display = 'flex';
    }
    this.notify('Processando em segundo plano. Clique no widget flutuante para reabrir.', 'info');
  }

  expandStepper() {
    if (this.criacaoMinimizedWidget) {
      this.criacaoMinimizedWidget.style.display = 'none';
    }
    if (this.modalCriacaoStepper) {
      this.modalCriacaoStepper.classList.add('open');
    }
  }

  // Mostra o que a conferência achou: quantas cenas foram olhadas, quantas o sistema trocou sozinho
  // e quais ficaram na dúvida esperando a decisão de quem edita.
  mostrarConferencia(conf) {
    if (!conf || !conf.avaliadas) return;
    const partes = [`${conf.avaliadas} cena(s) conferidas`];
    if (conf.trocadas) partes.push(`${conf.trocadas} troca(s) de material feitas de graça`);
    const revisar = conf.para_revisar || [];
    const soIA = conf.precisam_ia || [];
    if (revisar.length) partes.push(`${revisar.length} na dúvida, esperando você`);
    if (soIA.length) partes.push(`${soIA.length} que só uma imagem de IA resolve`);
    this.appendLog(`\nConferência: ${partes.join('. ')}.`);
    for (const c of revisar) {
      this.appendLog(`  cena ${c.cena} (nota ${c.nota}): mostra ${c.legenda}`);
    }
    this.notify(`Conferência: ${partes.join(', ')}.`, revisar.length ? 'info' : 'success');
  }

  updateStepper(passoAtual, progressoPct, mensagem, prontoParaEdicao = false) {
    // 5 passos: narração, cenas, acervo, conferência (Jev) e imagens de IA
    for (let i = 1; i <= 5; i++) {
      const node = document.getElementById(`step-node-${i}`);
      const line = document.getElementById(`step-line-${i}`);

      if (node) {
        node.classList.remove('pending', 'active', 'completed');
        if (prontoParaEdicao || i < passoAtual) {
          node.classList.add('completed');
        } else if (i === passoAtual) {
          node.classList.add('active');
        } else {
          node.classList.add('pending');
        }
      }

      if (line) {
        line.classList.remove('completed');
        if (prontoParaEdicao || i < passoAtual) {
          line.classList.add('completed');
        }
      }
    }

    const pct = Math.min(100, Math.max(0, progressoPct));
    if (this.criacaoProgressPct) this.criacaoProgressPct.textContent = `${pct}%`;
    if (this.criacaoProgressFill) this.criacaoProgressFill.style.width = `${pct}%`;
    if (this.criacaoStatusMsg) this.criacaoStatusMsg.textContent = mensagem || 'Processando etapa...';
    if (this.criacaoStatusPill) {
      if (prontoParaEdicao) {
        this.criacaoStatusPill.textContent = 'Concluído';
        this.criacaoStatusPill.className = 'badge badge-success';
      } else {
        this.criacaoStatusPill.textContent = `Passo ${passoAtual} de 4`;
        this.criacaoStatusPill.className = 'badge badge-warning';
      }
    }

    // Atualiza widget flutuante em tempo real
    if (this.floatingPct) this.floatingPct.textContent = `${pct}%`;
    if (this.floatingStage) this.floatingStage.textContent = mensagem || `Passo ${passoAtual} de 4`;
  }

  /** Mostra o mapa que o agente de roteiro montou: os blocos de assunto e as regras de busca do vídeo. */
  mostrarMapa(mapa) {
    if (!this.criacaoMapa) return;
    this.criacaoMapa.innerHTML = '';
    if (!mapa || !Array.isArray(mapa.blocos)) {
      this.criacaoMapa.style.display = 'none';
      return;
    }
    // tudo por textContent: o mapa vem de um modelo de IA e não pode injetar HTML na página
    const el = (tag, classe, texto) => {
      const n = document.createElement(tag);
      if (classe) n.className = classe;
      if (texto !== undefined) n.textContent = texto;
      return n;
    };
    const secao = (titulo, itens) => {
      if (!itens.length) return;
      this.criacaoMapa.appendChild(el('div', 'mapa-secao', titulo));
      const lista = el('ul', 'mapa-lista');
      itens.forEach(item => lista.appendChild(item));
      this.criacaoMapa.appendChild(lista);
    };

    const cabeca = el('div', 'mapa-cabeca');
    cabeca.appendChild(el('span', 'mapa-titulo', mapa.titulo || 'Mapa do roteiro'));
    cabeca.appendChild(el('span', 'badge', `${mapa.blocos.length} blocos`));
    this.criacaoMapa.appendChild(cabeca);
    // quantas cenas o agente já deixou prontas no JSON (chega enquanto a narração é gravada)
    this.criacaoMapa.appendChild(el('div', 'mapa-secao mapa-cenas-planejadas', ''));

    secao('Blocos de assunto', mapa.blocos.map(b => {
      const li = el('li');
      li.appendChild(el('span', 'mapa-num', String(b.id)));
      li.appendChild(el('span', 'mapa-nome', b.nome || ''));
      li.appendChild(el('span', 'mapa-ancora', b.ancora || ''));
      return li;
    }));
    secao('Armadilhas de busca', (mapa.armadilhas || []).map(a => {
      const li = el('li');
      li.appendChild(el('span', 'mapa-nome', a.termo || ''));
      li.appendChild(el('span', 'mapa-ancora', `buscar "${a.usar || ''}"`));
      li.title = a.problema || '';
      return li;
    }));
    const pessoas = mapa.pessoas_reais || [];
    if (pessoas.length) {
      secao('Pessoas reais (sem rosto gerado por IA)', [el('li', 'mapa-texto', pessoas.join(', '))]);
    }
    const proibidos = mapa.proibidos || [];
    if (proibidos.length) {
      secao('Nunca aparecem', [el('li', 'mapa-texto', proibidos.join(', '))]);
    }
    this.criacaoMapa.style.display = 'flex';
  }

  /** Preenche o seletor de perfil (canal) da tela Novo Vídeo, lendo /api/perfis. */
  async loadPerfis() {
    if (!this.selectPerfilNovo) return;
    try {
      const perfis = await API.getPerfis();
      this.selectPerfilNovo.innerHTML = '';
      perfis.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.caminho;
        opt.textContent = p.titulo;
        this.selectPerfilNovo.appendChild(opt);
      });
      // um perfil genérico primeiro, se existir, senão o primeiro da lista
      const generico = perfis.find(p => /document|padrao|geral/i.test(p.id));
      if (generico) this.selectPerfilNovo.value = generico.caminho;
    } catch (err) {
      this.notify('Não consegui carregar a lista de perfis: ' + err.message, 'error');
    }
  }

  async handleCriarProjeto() {
    const nome = (this.inputNomeProjeto ? this.inputNomeProjeto.value : '').trim().toLowerCase();
    const roteiro = (this.textareaRoteiro ? this.textareaRoteiro.value : '').trim();
    const voz = this.selectVoz ? this.selectVoz.value : 'pt-BR-AntonioNeural';
    const perfil = this.selectPerfilNovo ? this.selectPerfilNovo.value : '';

    if (!nome) {
      this.notify('Por favor, informe o nome do projeto.', 'error');
      if (this.inputNomeProjeto) this.inputNomeProjeto.focus();
      return;
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(nome)) {
      this.notify('Use apenas letras minúsculas, números, hífen e sublinhado no nome.', 'error');
      if (this.inputNomeProjeto) this.inputNomeProjeto.focus();
      return;
    }
    if (!roteiro) {
      this.notify('Por favor, insira o roteiro do vídeo.', 'error');
      if (this.textareaRoteiro) this.textareaRoteiro.focus();
      return;
    }
    if (!perfil) {
      this.notify('Escolha o perfil do canal.', 'error');
      if (this.selectPerfilNovo) this.selectPerfilNovo.focus();
      return;
    }

    if (this.btnCriarProjeto) {
      this.btnCriarProjeto.disabled = true;
      this.btnCriarProjeto.innerHTML = '<span>Iniciando...</span>';
    }

    try {
      if (this.criacaoProjBadge) this.criacaoProjBadge.textContent = nome;
      if (this.floatingProjName) this.floatingProjName.textContent = nome;
      if (this.criacaoSuccessBanner) this.criacaoSuccessBanner.style.display = 'none';
      this.mapaMostrado = false;
      this.mostrarMapa(null);

      if (this.modalCriacaoStepper) {
        this.modalCriacaoStepper.classList.add('open');
        this.updateStepper(1, 5, 'Lendo o roteiro inteiro e montando o mapa do vídeo...');
      }

      const valorVoz = this.voicePicker.getValue();
      // GenAIPro ou Fish Audio (a voz grátis, no lugar do Edge-TTS): os dois vão com voice_id e nome
      const vozGenaipro = (valorVoz.provedor === 'genaipro' || valorVoz.provedor === 'fish') ? valorVoz : null;
      const resp = await API.criarProjeto({ nome, roteiro, perfil, voz, vozGenaipro, imagensProvedor: this.imgProvedor });
      const tarefaId = resp.tarefa_id;

      this.notify('Projeto iniciado! O agente está lendo o roteiro; acompanhe as etapas no Stepper.', 'info');

      // guardado em `this` (não numa variável local) pra dar pra cancelar de fora — por
      // exemplo se o projeto for excluído no meio da criação — e nunca ter dois pollings
      // de criação rodando ao mesmo tempo se o usuário tentar criar de novo
      clearInterval(this.criacaoPollInterval);
      this.criacaoPollNome = nome;
      // sem limite de tempo: vídeo longo, lote do Google e espera de cota levam horas, e a fábrica
      // segue sozinha (inclusive depois de reiniciar). O painel mostra o andamento se esta tela fechar.
      this.criacaoPollInterval = setInterval(async () => {
        try {
          const st = await API.getStatus(nome, tarefaId);
          const passo = st.passo_atual || 1;
          const pct = st.progresso_pct || 15;
          const msg = st.mensagem || st.etapa_atual || 'Processando etapa...';
          const pronto = Boolean(st.pronto_para_edicao || st.etapa === 'concluido');

          this.updateStepper(passo, pct, msg, pronto);

          // o mapa chega logo no começo, antes da narração, e fica à vista até o fim da criação
          if (st.mapa && !this.mapaMostrado) {
            this.mapaMostrado = true;
            this.mostrarMapa(st.mapa);
          }
          const linhaCenas = this.criacaoMapa && this.criacaoMapa.querySelector('.mapa-cenas-planejadas');
          if (linhaCenas && st.cenas_planejadas) {
            linhaCenas.textContent = `JSON de cenas pronto: ${st.cenas_planejadas} cenas planejadas pelo agente`;
          }

          if (pronto) {
            clearInterval(this.criacaoPollInterval);
            this.updateStepper(5, 100, 'Cenas prontas e conferidas!', true);
            this.mostrarConferencia(st.conferencia);

            if (this.criacaoSuccessBanner) {
              this.criacaoSuccessBanner.style.display = 'flex';
            }

            setTimeout(async () => {
              if (this.modalCriacaoStepper) {
                this.modalCriacaoStepper.classList.remove('open');
              }
              if (this.criacaoMinimizedWidget) {
                this.criacaoMinimizedWidget.style.display = 'none';
              }
              if (this.btnCriarProjeto) {
                this.btnCriarProjeto.disabled = false;
                this.btnCriarProjeto.innerHTML = '<span>Criar Projeto e Gerar Cenas</span><span class="cta-arrow">→</span>';
              }

              this.notify('Tudo pronto! Carregando estúdio...', 'success');
              await this.switchProject(nome);
              this.showView('editor');
            }, 900);
          } else if (st.status === 'erro' || st.etapa === 'erro') {
            clearInterval(this.criacaoPollInterval);
            if (this.btnCriarProjeto) {
              this.btnCriarProjeto.disabled = false;
              this.btnCriarProjeto.innerHTML = '<span>Criar Projeto e Gerar Cenas</span><span class="cta-arrow">→</span>';
            }
            this.notify(`${st.mensagem || st.erro} Depois de resolver, use o botão Retomar no painel: continua de onde parou.`, 'error');
          }
        } catch (pollErr) {
          console.warn('Erro transitório no polling:', pollErr);
        }
      }, 2000);

    } catch (err) {
      if (this.modalCriacaoStepper) {
        this.modalCriacaoStepper.classList.remove('open');
      }
      if (this.btnCriarProjeto) {
        this.btnCriarProjeto.disabled = false;
        this.btnCriarProjeto.innerHTML = '<span>Criar Projeto e Gerar Cenas</span><span class="cta-arrow">→</span>';
      }
      this.notify(`Erro ao iniciar projeto: ${err.message}`, 'error');
    }
  }

  /** Vai do painel para a timeline, carregando o projeto se preciso. */
  async abrirNaTimeline(nome) {
    if (nome !== this.currentProjectName) {
      await this.switchProject(nome);
    }
    this.showView('editor');
  }

  async switchProject(name) {
    this.currentProjectName = name;
    this.hasUnsavedChanges = false;
    this.updateSaveButton();

    // se o usuário trocar de projeto de novo antes desta chamada terminar, a resposta desta
    // (mais antiga) chega depois e não pode sobrescrever o projeto que já está na tela
    const meuToken = ++this._switchToken;

    try {
      this.notify(`Carregando projeto ${name}...`, 'info');
      const data = await API.getProject(name);
      if (meuToken !== this._switchToken) return;
      this.currentProjectData = data;

      // Atualizar Badges de Cabeçalho
      const totalDur = data.duracao || (data.cenas.length > 0 ? data.cenas[data.cenas.length - 1].fim : 0);
      const m = Math.floor(totalDur / 60);
      const s = Math.floor(totalDur % 60);
      if (this.badgeDuracao) this.badgeDuracao.textContent = `${m}:${String(s).padStart(2, '0')}`;
      if (this.badgeCenas) this.badgeCenas.textContent = `${data.cenas.length} cenas`;

      const readiness = this.updateRenderReadiness(data);
      this.iniciarMonitoramentoCenas(name, readiness.tudoPronto);

      if (this.btnVerFinal) {
        this.btnVerFinal.style.display = data.tem_final ? 'inline-flex' : 'none';
      }
      if (this.btnVerFinalVertical) {
        this.btnVerFinalVertical.style.display = data.tem_final_vertical ? 'inline-flex' : 'none';
      }

      // Alimentar subsistemas
      window.Player.loadProject(data);
      window.Timeline.loadProject(data);
      window.Inspector.setProject(data);

      // Renderizar lista da esquerda
      this.renderSceneList();

      // Selecionar primeira cena
      if (data.cenas && data.cenas.length > 0) {
        window.Inspector.selectScene(data.cenas[0]);
      }

      this.notify(`Projeto ${name} carregado com sucesso!`, 'success');
    } catch (err) {
      this.notify(`Falha ao carregar projeto: ${err.message}`, 'error');
    }
  }

  /** Depois de trocar a mídia de uma cena: busca só as cenas de novo e redesenha, sem recarregar a narração
   * nem voltar o vídeo para o começo. O recarregamento completo quebrava a reprodução até tudo baixar de novo. */
  async atualizarSoAsCenas() {
    if (!this.currentProjectName) return;
    const nome = this.currentProjectName;
    const data = await API.getProject(nome);
    if (this.currentProjectName !== nome) return;
    const selecionada = window.Inspector && window.Inspector.currentScene ? window.Inspector.currentScene.n : null;
    this.currentProjectData = { ...this.currentProjectData, cenas: data.cenas, motion: data.motion, criacao: data.criacao };
    if (window.Player && typeof window.Player.atualizarCenas === 'function') window.Player.atualizarCenas(data.cenas, data.motion);
    if (window.Timeline && typeof window.Timeline.loadProject === 'function') {
      window.Timeline.loadProject(this.currentProjectData);
      if (selecionada) window.Timeline.selectSceneBlock(selecionada);
    }
    this.renderSceneList();
    this.updateRenderReadiness(this.currentProjectData);
  }

  async reloadProject() {
    if (this.currentProjectName) {
      await this.switchProject(this.currentProjectName);
    }
  }

  openExcluirProjetoModal() {
    if (!this.currentProjectName) {
      this.notify('Nenhum projeto selecionado.', 'error');
      return;
    }
    this.pedirExclusao(this.currentProjectName);
  }

  /** Abre a confirmação para um projeto qualquer, venha do painel ou do editor. */
  pedirExclusao(nome, aoConcluir = null) {
    this.projetoParaExcluir = nome;
    this.aposExcluir = aoConcluir;
    if (this.excluirProjetoNome) {
      this.excluirProjetoNome.textContent = nome;
    }
    if (this.btnConfirmarExcluir) {
      this.btnConfirmarExcluir.disabled = false;
      this.btnConfirmarExcluir.textContent = 'Excluir Projeto';
    }
    if (this.modalExcluirProjeto) {
      this.modalExcluirProjeto.classList.add('open');
    }
  }

  closeExcluirProjetoModal() {
    if (this.modalExcluirProjeto) {
      this.modalExcluirProjeto.classList.remove('open');
    }
  }

  async confirmarExcluirProjeto() {
    const nome = this.projetoParaExcluir || this.currentProjectName;
    if (!nome) return;

    if (this.btnConfirmarExcluir) {
      this.btnConfirmarExcluir.disabled = true;
      this.btnConfirmarExcluir.textContent = 'Excluindo...';
    }

    try {
      // Solta as conexões de áudio/vídeo abertas com o projeto — no Windows o
      // backend não consegue apagar um arquivo que o navegador ainda está
      // transmitindo, mesmo pausado.
      if (window.Player && typeof window.Player.unload === 'function') {
        window.Player.unload();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      // o vídeo pronto também segura o arquivo enquanto estiver tocando no modal
      this.closeFinalVideoModal();

      await API.deleteProject(nome);
      this.closeExcluirProjetoModal();
      this.notify(`Projeto ${nome} excluído.`, 'success');

      if (nome === this.currentProjectName) {
        this.currentProjectName = null;
        this.currentProjectData = null;
      }

      if (typeof this.aposExcluir === 'function') {
        await this.aposExcluir();
      } else if (document.body.dataset.view === 'editor') {
        // o projeto aberto sumiu, então não há timeline para mostrar
        this.showView('dashboard');
      }
    } catch (err) {
      this.notify(`Falha ao excluir projeto: ${err.message}`, 'error');
    } finally {
      this.projetoParaExcluir = null;
      this.aposExcluir = null;
      if (this.btnConfirmarExcluir) {
        this.btnConfirmarExcluir.disabled = false;
        this.btnConfirmarExcluir.textContent = 'Excluir Projeto';
      }
    }
  }

  /* ---------------------------------------------------------
     Modal de Custos Reais (do vídeo aberto no momento)
     --------------------------------------------------------- */
  abrirCustos() {
    if (!this.currentProjectName) return;
    this.modalCustos?.classList.add('open');
    if (this.custosProjetoNome) this.custosProjetoNome.textContent = this.currentProjectName;
    this.carregarCustos();
  }

  fecharCustos() {
    this.modalCustos?.classList.remove('open');
  }

  dinheiro(valor) {
    return 'US$ ' + (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async carregarCustos() {
    if (!this.custosConteudo || !this.currentProjectName) return;
    try {
      const dados = await API.getCustos(this.currentProjectName);
      this.desenharCustos(dados);
    } catch (err) {
      this.notify('Não consegui ler os custos: ' + err.message, 'error');
    }
  }

  /** Uma linha de texto simples dentro de um bloco do modal de custos. */
  linhaCusto(texto, valor) {
    const linha = document.createElement('div');
    linha.className = 'custos-item';
    const topo = document.createElement('div');
    topo.className = 'custos-item-topo';
    const esquerda = document.createElement('span');
    esquerda.className = 'custos-item-motivo';
    esquerda.textContent = texto;
    topo.appendChild(esquerda);
    if (valor !== undefined && valor !== null) {
      const direita = document.createElement('span');
      direita.className = 'custos-item-valor';
      direita.textContent = valor;
      topo.appendChild(direita);
    }
    linha.appendChild(topo);
    return linha;
  }

  desenharCustos(dados) {
    const semNada = !dados || ((!dados.itens || !dados.itens.length) && !(dados.modelos_de_texto || []).length);
    if (this.custosVazio) this.custosVazio.style.display = semNada ? 'block' : 'none';
    if (this.custosConteudo) this.custosConteudo.style.display = semNada ? 'none' : 'block';
    if (semNada) return;

    if (this.custosTotalValor) {
      const partes = [];
      if (dados.por_minuto_usd) partes.push(this.dinheiro(dados.por_minuto_usd) + ' por minuto');
      if (dados.por_cena_usd) partes.push(this.dinheiro(dados.por_cena_usd) + ' por cena');
      this.custosTotalValor.textContent = this.dinheiro(dados.total_usd);
      const rotulo = this.custosTotalValor.parentElement?.querySelector('.custos-total-rotulo');
      if (rotulo) {
        rotulo.textContent = partes.length
          ? 'gasto até agora — ' + partes.join(' · ')
          : 'gasto até agora, neste vídeo';
      }
    }

    const numero = (n) => Math.round(n || 0).toLocaleString('pt-BR');

    // Narração: quanto custou e quanto isso come da franquia mensal da assinatura
    if (this.custosNarracao) {
      this.custosNarracao.innerHTML = '';
      const n = dados.narracao || {};
      if (n.caracteres || n.creditos) {
        // a GenAIPro cobra em créditos, e não é 1 crédito por caractere: o backend mede pelo saldo
        const creditos = n.creditos !== undefined ? n.creditos : n.caracteres;
        this.custosNarracao.appendChild(this.linhaCusto(
          numero(n.caracteres) + ' caracteres narrados = ' + numero(creditos) + ' créditos, cobrados pelo ' +
          n.origem_do_preco,
          n.preco_por_credito ? 'US$ ' + Number(n.preco_por_credito).toFixed(6).replace('.', ',') + ' / crédito'
            : this.dinheiro(n.preco_por_mil) + ' / mil'));
        if (n.incluido_no_mes) {
          this.custosNarracao.appendChild(this.linhaCusto(
            'Plano ' + n.plano + ': ' + this.dinheiro(n.preco_mensal) + ', ' +
            numero(n.incluido_no_mes) + ' créditos',
            String(n.fatia_da_franquia).replace('.', ',') + '% usado'));
          this.custosNarracao.appendChild(this.linhaCusto(
            'O pacote dá para cerca de ' + numero(n.videos_por_mes) + ' vídeos deste tamanho'));
        }
      } else {
        this.custosNarracao.appendChild(this.linhaCusto(
          'Este vídeo usou uma voz gratuita (Fish Audio ou Edge TTS), sem custo de narração.'));
      }
    }

    // Modelos de linguagem, por tarefa: escrever o roteiro, escolher as fotos, descrever as imagens, o Jev...
    // Antes era uma linha por provedor ("OpenRouter — 2.076 chamadas") e não dava para ver em que o dinheiro foi
    if (this.custosModelos) {
      this.custosModelos.innerHTML = '';
      const tarefas = dados.tarefas_dos_modelos || [];
      const modelos = dados.modelos_de_texto || [];
      if (!tarefas.length && !modelos.length) {
        this.custosModelos.appendChild(this.linhaCusto('Nenhuma chamada de modelo de linguagem ainda.'));
      }
      const precoCurto = (v) => v >= 0.01 ? this.dinheiro(v)
        : 'US$ ' + Number(v).toFixed(4).replace('.', ',');
      tarefas.forEach(t => {
        const gratis = t.gratis === t.chamadas ? 'todas grátis' : numero(t.gratis) + ' grátis';
        const linha = this.linhaCusto(
          t.tarefa + ' — ' + numero(t.chamadas) + ' chamadas, ' + gratis,
          t.custo_usd > 0 ? precoCurto(t.custo_usd) : 'grátis');
        const rodape = document.createElement('div');
        rodape.className = 'custos-item-rodape';
        rodape.textContent = (t.modelos || []).map(m =>
          m.modelo + ' ' + numero(m.chamadas) + 'x' + (m.custo_usd > 0 ? ' (' + precoCurto(m.custo_usd) + ')' : ' (grátis)'))
          .join(' · ');
        linha.appendChild(rodape);
        this.custosModelos.appendChild(linha);
      });
      if (modelos.length) {
        // o total de cada provedor, numa linha só, para conferir com o saldo do OpenRouter
        this.custosModelos.appendChild(this.linhaCusto(
          'Por provedor: ' + modelos.map(m => m.provedor + ' ' +
            (m.gratuito ? 'grátis' : precoCurto(m.custo_usd)) + ' (' + numero(m.chamadas) + ' chamadas)').join(' · ')));
      }
    }

    const ROTULOS = dados.rotulos || { narracao: 'Narração', efeito: 'Efeitos sonoros', imagem: 'Imagens de IA' };
    if (this.custosCategorias) {
      this.custosCategorias.innerHTML = '';
      const frag = document.createDocumentFragment();
      Object.entries(dados.por_categoria || {}).forEach(([categoria, valor]) => {
        const card = document.createElement('div');
        card.className = 'custos-categoria';
        const v = document.createElement('span');
        v.className = 'custos-categoria-valor';
        v.textContent = this.dinheiro(valor);
        const r = document.createElement('span');
        r.className = 'custos-categoria-rotulo';
        r.textContent = ROTULOS[categoria] || categoria;
        card.append(v, r);
        frag.appendChild(card);
      });
      this.custosCategorias.appendChild(frag);
    }

    if (this.custosLista) {
      this.custosLista.innerHTML = '';
      const frag = document.createDocumentFragment();
      dados.itens.forEach(item => {
        const linha = document.createElement('div');
        linha.className = 'custos-item';

        const topo = document.createElement('div');
        topo.className = 'custos-item-topo';
        const motivo = document.createElement('span');
        motivo.className = 'custos-item-motivo';
        motivo.textContent = item.motivo;
        const valor = document.createElement('span');
        valor.className = 'custos-item-valor';
        valor.textContent = this.dinheiro(item.valor_usd);
        topo.append(motivo, valor);

        const rodape = document.createElement('div');
        rodape.className = 'custos-item-rodape';
        rodape.textContent = new Date(item.quando).toLocaleString('pt-BR');

        linha.append(topo, rodape);
        frag.appendChild(linha);
      });
      this.custosLista.appendChild(frag);
    }
  }

  /** Abre o vídeo pronto no modal sem precisar do projeto carregado na timeline. */
  abrirVideoPronto({ nome, url, duracao }) {
    if (this.modalFinal) this.modalFinal.classList.add('open');

    if (this.modalFinalVideo) {
      this.modalFinalVideo.src = url;
      this.modalFinalVideo.play().catch(() => {});
    }
    if (this.finalVideoDur) this.finalVideoDur.textContent = duracao || '--:--';
    if (this.finalVideoSize) this.finalVideoSize.textContent = '';
    if (this.btnDownloadFinal) {
      this.btnDownloadFinal.href = API.baixar(url);
      this.btnDownloadFinal.setAttribute('download', `${nome}_final.mp4`);
    }

    // os créditos do projeto ficam no creditos.txt, então não dependem da timeline
    this.creditosUrl = API.midia(`/arquivos/${encodeURIComponent(nome)}/creditos.txt`);
  }

  renderSceneList() {
    if (!this.sceneListContainer || !this.currentProjectData) return;
    this.sceneListContainer.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    const cenas = this.currentProjectData.cenas || [];
    // o clipe do Motion IA entra como vídeo (tipo video_real), mas não é material real: tem aba própria
    const ehMotion = (c) => c.origem_badge === 'Motion IA' || (c.midia && c.midia.fonte === 'motion_ia');
    const FILTROS = {
      all: () => true,
      ia: (c) => c.tipo === 'ia' && !ehMotion(c),
      motion: ehMotion,
      real: (c) => (c.tipo === 'foto_real' || c.tipo === 'video_real') && !ehMotion(c),
      sfx: (c) => !!(c.efeito && c.efeito.descricao),
      sem_arquivo: (c) => !!c.sem_arquivo,
    };
    const filtradas = cenas.filter(FILTROS[this.currentFilter] || FILTROS.all);

    // cada aba mostra quantas cenas tem ("IA 50", "Motion IA 39"); a de sem arquivo acende quando falta alguma
    document.querySelectorAll('.filter-pill[data-filter]').forEach(pilula => {
      const regra = FILTROS[pilula.dataset.filter];
      if (!regra) return;
      if (!pilula.dataset.rotulo) pilula.dataset.rotulo = pilula.textContent.trim();
      const total = cenas.filter(regra).length;
      pilula.textContent = pilula.dataset.rotulo;
      const num = document.createElement('span');
      num.className = 'filter-pill-num';
      num.textContent = total.toLocaleString('pt-BR');
      pilula.appendChild(num);
      if (pilula.dataset.filter === 'sem_arquivo') pilula.classList.toggle('filter-pill-alerta', total > 0);
    });

    filtradas.forEach(c => {
      const card = document.createElement('div');
      card.className = 'scene-card';
      card.dataset.cena = c.n;
      if (c.sem_arquivo) card.classList.add('sem-arquivo');

      if (window.Inspector && window.Inspector.currentScene === c) {
        card.classList.add('selected');
      }

      // Thumbnail
      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'scene-thumb-wrapper';

      let thumbSrc = c.thumb_url || c.capa_url || (c.tipo === "foto_real" ? c.midia_url : null) || (c.img_ia_url || "");
      if (thumbSrc) {
        const img = document.createElement('img');
        img.className = 'scene-thumb';
        img.src = thumbSrc;
        img.loading = 'lazy';
        img.decoding = 'async';
        thumbWrapper.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'thumb-placeholder';
        placeholder.textContent = c.sem_arquivo ? '⚠' : (c.tipo === 'ia' ? '🤖' : '📷');
        thumbWrapper.appendChild(placeholder);
      }

      const numBadge = document.createElement('div');
      numBadge.className = 'scene-card-number';
      numBadge.textContent = `#${c.n}`;
      thumbWrapper.appendChild(numBadge);

      card.appendChild(thumbWrapper);

      // Info
      const info = document.createElement('div');
      info.className = 'scene-card-info';

      const header = document.createElement('div');
      header.className = 'scene-card-header';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'scene-time';
      timeSpan.textContent = `${c.ini.toFixed(1)}s - ${c.fim.toFixed(1)}s`;
      header.appendChild(timeSpan);

      const typePill = document.createElement('span');
      typePill.className = `type-pill ${c.tipo}`;
      typePill.textContent = c.sem_arquivo ? 'SEM ARQUIVO' : (c.origem_badge || (c.tipo === 'ia' ? 'IA' : (c.tipo === 'video_real' ? 'Vídeo Real' : 'Foto Real')));
      if (c.sem_arquivo) typePill.classList.add('sem-arquivo');
      header.appendChild(typePill);

      info.appendChild(header);

      const textSnippet = document.createElement('div');
      textSnippet.className = 'scene-card-text';
      textSnippet.textContent = c.texto || '(Sem texto narrado)';
      info.appendChild(textSnippet);

      // Badges inferiores (SFX, Texto em Tela)
      const badges = document.createElement('div');
      badges.className = 'scene-card-badges';

      if (c.efeito && c.efeito.descricao) {
        const sfxBadge = document.createElement('span');
        sfxBadge.className = 'mini-badge sfx';
        sfxBadge.textContent = `SFX: ${c.efeito.descricao}`;
        badges.appendChild(sfxBadge);
      }

      // a revisão do vídeo pronto apontou algo nesta cena
      const problemas = Array.isArray(c.revisao) ? c.revisao : [];
      if (problemas.length) {
        const grave = problemas.some(p => p.gravidade === 'alta');
        const revBadge = document.createElement('span');
        revBadge.className = 'mini-badge revisao' + (grave ? ' grave' : '');
        revBadge.textContent = grave ? '⚠ revisar' : '⚠ atenção';
        revBadge.title = problemas.map(p => p.descricao).join(' | ');
        badges.appendChild(revBadge);
      }

      if (c.animada) {
        const animBadge = document.createElement('span');
        animBadge.className = 'mini-badge animacao';
        animBadge.textContent = 'animação';
        badges.appendChild(animBadge);
      }

      if (c.texto_tela && c.texto_tela.tipo !== 'nenhum' && !c.animada) {
        const txtBadge = document.createElement('span');
        txtBadge.className = 'mini-badge text';
        txtBadge.textContent = c.texto_tela.tipo;
        badges.appendChild(txtBadge);
      }

      info.appendChild(badges);
      card.appendChild(info);

      card.addEventListener('click', () => {
        window.Player.seek(c.ini);  // a timeline rola até a agulha (Timeline.updatePlayhead)
        window.Inspector.selectScene(c);
        // a cena escolhida na lista fica destacada também na faixa Cenas
        if (window.Timeline && typeof window.Timeline.selectSceneBlock === 'function') window.Timeline.selectSceneBlock(c.n, false);
      });

      fragmento.appendChild(card);
    });

    this.sceneListContainer.appendChild(fragmento);
  }

  markChangesPending() {
    this.hasUnsavedChanges = true;
    this.updateSaveButton();
  }

  updateSaveButton() {
    if (this.btnSave) {
      this.btnSave.classList.toggle('has-changes', this.hasUnsavedChanges);
      this.btnSave.textContent = this.hasUnsavedChanges ? 'Salvar Alterações*' : 'Salvar Alterações';
    }
  }

  async saveChanges() {
    if (!this.currentProjectData) return;

    try {
      this.notify('Salvando cenas...', 'info');
      await API.saveProject(this.currentProjectName, this.currentProjectData.cenas);
      this.hasUnsavedChanges = false;
      this.updateSaveButton();
      this.notify('Alterações salvas com sucesso em cenas.json!', 'success');
      this.renderSceneList();
      window.Timeline.render();
    } catch (err) {
      this.notify('Erro ao salvar cenas: ' + err.message, 'error');
    }
  }

  async refazerCenaIA(cena) {
    if (this.hasUnsavedChanges) await this.saveChanges();
    this.openTerminal(`Gerando nova imagem com IA para Cena #${cena.n}...`);
    // o vídeo da cena pode estar aberto no player; no Windows a fábrica não move arquivo em uso
    if (window.Player && typeof window.Player.soltarVideos === 'function') window.Player.soltarVideos();
    this.statusDot.className = 'status-dot running';
    this.notify(`Gerando nova imagem com IA para cena #${cena.n}...`, 'info');

    try {
      const resp = await API.refazerCena(this.currentProjectName, cena.n, {
        tipo: 'ia',
        prompt: cena.prompt,
        forcar_ia: true
      });
      this.statusDot.className = 'status-dot finished';
      this.appendLog(`\nCena #${cena.n} gerada com sucesso! URL: ${resp.url_midia}\n`);
      this.notify(`Cena #${cena.n} regerada com sucesso!`, 'success');
      await this.atualizarSoAsCenas();
    } catch (err) {
      this.statusDot.className = 'status-dot failed';
      this.appendLog(`[ERRO]: ${err.message}`);
      this.notify(`Erro ao regerar cena: ${err.message}`, 'error');
    }
  }

  async refazerCenaBusca(cena) {
    if (this.hasUnsavedChanges) await this.saveChanges();
    this.openTerminal(`Pesquisando material de acervo para Cena #${cena.n}...`);
    // o vídeo da cena pode estar aberto no player; no Windows a fábrica não move arquivo em uso
    if (window.Player && typeof window.Player.soltarVideos === 'function') window.Player.soltarVideos();
    this.statusDot.className = 'status-dot running';
    this.notify(`Pesquisando acervo para a cena #${cena.n}...`, 'info');

    try {
      const resp = await API.refazerCena(this.currentProjectName, cena.n, {
        tipo: cena.tipo,
        busca: cena.busca
      });
      this.statusDot.className = 'status-dot finished';
      this.appendLog(`\nNovo material de acervo encontrado para Cena #${cena.n}! URL: ${resp.url_midia}\n`);
      this.notify(`Material de acervo atualizado para cena #${cena.n}!`, 'success');
      await this.atualizarSoAsCenas();
    } catch (err) {
      this.statusDot.className = 'status-dot failed';
      this.appendLog(`[ERRO]: ${err.message}`);
      this.notify(`Erro ao pesquisar acervo: ${err.message}`, 'error');
    }
  }

  /** Depois do render a fábrica revisa o vídeo pronto em segundo plano: quando termina, as cenas com problema
   *  ganham o aviso na lista, sem a pessoa precisar recarregar. */
  acompanharRevisaoVideo(nome) {
    clearInterval(this._revisaoPolling);
    let voltas = 0;
    this._revisaoPolling = setInterval(async () => {
      voltas += 1;
      if (voltas > 90 || this.currentProjectName !== nome) { clearInterval(this._revisaoPolling); return; }
      try {
        const r = await API.getRevisaoVideo(nome);
        if (r && !r.rodando && r.revisadas) {
          clearInterval(this._revisaoPolling);
          await this.atualizarSoAsCenas();
          const graves = (r.graves || []).length;
          const total = Object.keys(r.cenas || {}).length;
          this.notify(total ? `Revisão do vídeo: ${total} cena(s) para olhar${graves ? `, ${graves} grave(s)` : ''}. Veja o aviso ⚠ na lista.`
                            : 'Revisão do vídeo: nenhum problema encontrado.', total ? 'info' : 'success');
        }
      } catch (_) { /* tenta de novo na próxima volta */ }
    }, 10000);
  }

  /** Exclui uma animação da faixa Motion (ou todas, com m = null). Gratuito; o vídeo pronto muda no próximo render. */
  async excluirMotion(m) {
    if (!this.currentProjectName) return;
    const todas = !m;
    const quantas = ((this.currentProjectData && this.currentProjectData.motion) || []).length;
    if (todas && !quantas) {
      this.notify('Este vídeo não tem animações.', 'info');
      return;
    }
    const texto = todas
      ? `Excluir as ${quantas} animações deste vídeo? As cenas voltam a mostrar só a imagem.`
      : `Excluir a animação "${(m.texto || '').slice(0, 60)}"? As cenas por baixo voltam a mostrar só a imagem.`;
    const ok = await Dialogo.confirmar({
      titulo: todas ? 'Excluir todas as animações' : 'Excluir animação',
      texto, confirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    // solta a prévia que está tocando: no Windows a fábrica não mexe num arquivo aberto pelo navegador
    if (window.Player && typeof window.Player.soltarMotion === 'function') window.Player.soltarMotion();
    try {
      const r = await API.excluirMotion(this.currentProjectName, todas ? 'todos' : m.id);
      const n = (r.excluidas || []).length;
      this.notify(`${n === 1 ? 'Animação excluída' : `${n} animações excluídas`}. Renderize de novo para sair do vídeo final.`,
                  'success');
      await this.atualizarSoAsCenas();
    } catch (err) {
      this.notify(`Animação: ${err.message}`, 'error');
    }
  }

  /** Gera (ou refaz) a animação da cena, ou faz ela voltar para a foto. Gratuito: roda no PC da fábrica. */
  async animarCena(cena, acao) {
    if (this.hasUnsavedChanges) await this.saveChanges();
    const gerar = acao !== 'remover';
    this.openTerminal(gerar ? `Animando a Cena #${cena.n} no tempo da fala (leva cerca de 1 minuto)...`
                            : `Cena #${cena.n} voltando para a foto...`);
    if (window.Player && typeof window.Player.soltarVideos === 'function') window.Player.soltarVideos();
    this.statusDot.className = 'status-dot running';
    try {
      // "Refazer" numa animação em uso pede uma nova ao modelo; nas outras situações aproveita o que der
      const forcar = gerar && cena.animacao_situacao === 'pronta';
      await API.animarCena(this.currentProjectName, cena.n, { acao: gerar ? 'gerar' : 'remover', forcar });
      this.statusDot.className = 'status-dot finished';
      this.appendLog(gerar ? `\nAnimação da Cena #${cena.n} pronta.\n` : `\nCena #${cena.n} usando a foto.\n`);
      this.notify(gerar ? `Animação da cena #${cena.n} pronta!` : `Cena #${cena.n} voltou para a foto.`, 'success');
      await this.atualizarSoAsCenas();
    } catch (err) {
      this.statusDot.className = 'status-dot failed';
      this.appendLog(`[ERRO]: ${err.message}`);
      this.notify(`Animação: ${err.message}`, 'error');
    }
  }

  async regerarAudio(novoRoteiro, velocidade, voz) {
    this.openTerminal(`Regerando áudio com cache inteligente...`);
    this.statusDot.className = 'status-dot running';
    this.notify('Regerando áudio (processando apenas blocos alterados)...', 'info');

    try {
      const resp = await API.regerarNarracao(this.currentProjectName, {
        roteiro: novoRoteiro,
        velocidade: velocidade,
        voz: voz
      });
      this.statusDot.className = 'status-dot finished';
      this.appendLog(`\nÁudio regerado com sucesso! Nova duração total: ${resp.duracao.toFixed(2)}s\nTempos das cenas sincronizados automaticamente.\n`);
      const p = resp.preenchendo;
      if (p) {
        // a voz nova muda o corte: a fábrica busca, confere e completa as cenas sozinha (Em produção no topo)
        const partes = [];
        if (p.sem_imagem && p.sem_imagem.length) partes.push(`${p.sem_imagem.length} sem imagem`);
        if (p.outra_fala && p.outra_fala.length) partes.push(`${p.outra_fala.length} com outra fala`);
        if (p.repetidas && p.repetidas.length) partes.push(`${p.repetidas.length} com imagem repetida`);
        this.appendLog(`A narração mudou o corte das cenas (${partes.join(', ')}). A fábrica está buscando, conferindo e completando essas cenas sozinha; o botão de renderizar libera quando terminar.\n`);
        this.notify('Narração trocada. A fábrica está completando e conferindo as cenas que mudaram (Em produção no topo).', 'info');
      } else {
        this.notify('Áudio e cortes de cena sincronizados com sucesso!', 'success');
      }
      await this.reloadProject();
    } catch (err) {
      this.statusDot.className = 'status-dot failed';
      this.appendLog(`[ERRO]: ${err.message}`);
      this.notify(`Erro ao regerar áudio: ${err.message}`, 'error');
    }
  }

  async continuarCarregamento() {
    const nome = this.currentProjectName;
    if (!nome || !this.btnContinuar) return;
    this.btnContinuar.disabled = true;
    try {
      // primeiro só pergunta o que falta e quanto custa, sem fazer nada
      const previa = await API.continuarCarregamento(nome, false);
      if (previa.nada_a_fazer) {
        this.notify('Não há nada pendente neste projeto.', 'info');
        this.btnContinuar.disabled = false;
        return;
      }
      const custo = Number(previa.custo_estimado_usd).toFixed(2).replace('.', ',');
      const ok = await Dialogo.confirmar({
        titulo: 'Terminar o carregamento',
        texto: 'As cenas que faltam recebem foto, vídeo ou imagem. O que já está pronto não é pago de novo.',
        itens: [
          { rotulo: 'Cenas esperando acervo', valor: previa.sem_acervo, nota: 'grátis' },
          { rotulo: 'Imagens de IA para gerar', valor: previa.sem_imagem_ia },
        ],
        custo: `US$ ${custo}`,
        confirmar: 'Continuar',
      });
      if (!ok) {
        this.btnContinuar.disabled = false;
        return;
      }

      this.openTerminal('Continuando o carregamento do projeto...');
      this.statusDot.className = 'status-dot running';
      const resp = await API.continuarCarregamento(nome, true);
      const tarefaId = resp.tarefa_id;
      let logsVistos = 0;
      clearInterval(this.continuarPollInterval);
      const encerrar = () => {
        clearInterval(this.continuarPollInterval);
        this.btnContinuar.disabled = false;
      };
      this.continuarPollInterval = setInterval(async () => {
        try {
          const st = await API.getStatus(nome, tarefaId);
          const logs = st.logs || [];
          for (let i = logsVistos; i < logs.length; i++) this.appendLog(logs[i]);
          logsVistos = logs.length;
          if (st.status === 'concluido') {
            encerrar();
            this.statusDot.className = 'status-dot finished';
            const faltam = (st.resultado && st.resultado.ainda_faltam) || [];
            this.notify(faltam.length ? `Carregamento terminado, mas ${faltam.length} cena(s) ainda estão sem imagem.` : 'Carregamento concluído!', faltam.length ? 'warning' : 'success');
            if (this.currentProjectName === nome) await this.reloadProject();
          } else if (st.status === 'erro') {
            encerrar();
            this.statusDot.className = 'status-dot failed';
            this.appendLog(`[ERRO]: ${st.erro}`);
            this.notify(`Erro ao continuar: ${st.erro}`, 'error');
          }
        } catch (e) {
          console.warn('Erro momentâneo ao acompanhar o carregamento:', e);
        }
      }, 2500);
      return;
    } catch (err) {
      this.notify(`Erro ao continuar o carregamento: ${err.message}`, 'error');
    }
    this.btnContinuar.disabled = false;
  }

  async iniciarLimpezaMidia() {
    if (!this.currentProjectName) return;

    if (this.btnLimparMidia) {
      this.btnLimparMidia.disabled = true;
      this.btnLimparMidia.textContent = 'Corrigindo...';
    }

    // Não decide de antemão se "não tem nada pra fazer": além de mídia suspeita (corrompida),
    // o backend também busca material real para cenas reais que ainda estão sem arquivo — e isso
    // não aparece na checagem de corrupção. Deixa o próprio limpar-midia decidir; se genuinamente
    // não houver nada, ele volta rápido e o resumo mostra isso. Ele só olha material real: cenas
    // de IA são ignoradas e nenhuma imagem de IA é gerada por este botão.
    this.openTerminal('Corrigindo mídia do projeto...');
    this.appendLog('Procurando mídia suspeita e cenas reais sem arquivo (grátis), depois uma IA de visão confere se cada foto ou vídeo combina com a narração e o que não combina é trocado por outro material real. Cenas de IA ficam de fora.');
    this.statusDot.className = 'status-dot running';
    this.notify('Corrigindo mídia do projeto...', 'info');

    try {
      const resp = await API.limparMidia(this.currentProjectName);
      const tarefaId = resp.tarefa_id;
      const nomeDoProjeto = this.currentProjectName;
      let logsVistos = 0;

      clearInterval(this.limpezaPollInterval);
      let tentativasLimpeza = 0;
      const MAX_TENTATIVAS_LIMPEZA = 900; // 2s * 900 = 30min: cenas com muitas imagens demoram
      this.limpezaPollInterval = setInterval(async () => {
        tentativasLimpeza++;
        if (tentativasLimpeza > MAX_TENTATIVAS_LIMPEZA) {
          clearInterval(this.limpezaPollInterval);
          this.statusDot.className = 'status-dot failed';
          this.appendLog('\n[ERRO]: a limpeza está demorando demais pra acompanhar por aqui.\n');
          this.notify('A limpeza está demorando demais pra acompanhar por aqui.', 'error');
          if (this.btnLimparMidia) {
            this.btnLimparMidia.disabled = false;
            this.btnLimparMidia.textContent = 'Corrigir Mídia';
          }
          return;
        }
        try {
          const st = await API.getStatus(nomeDoProjeto, tarefaId);
          const logs = st.logs || [];
          for (let i = logsVistos; i < logs.length; i++) this.appendLog(logs[i]);
          logsVistos = logs.length;

          if (st.status === 'concluido') {
            clearInterval(this.limpezaPollInterval);
            this.statusDot.className = 'status-dot finished';
            const r = st.resultado || {};
            const partes = [];
            if (r.cenas_com_problema_no_inicio) {
              partes.push(`${r.cenas_resolvidas_com_material_real || 0} de ${r.cenas_com_problema_no_inicio} cena(s) suspeitas resolvidas com material real`);
            }
            if (r.sem_arquivo_antes) {
              partes.push(`${r.sem_arquivo_resolvidas || 0} de ${r.sem_arquivo_antes} cena(s) sem arquivo preenchidas com foto ou vídeo de acervo, sem IA`);
            }
            if (r.imagens_ia_geradas) {
              partes.push(`${r.imagens_ia_geradas} imagem(ns) de IA geradas`);
            }
            if ((r.imagens_ia_com_falha || []).length) {
              partes.push(`${r.imagens_ia_com_falha.length} imagem(ns) falharam`);
            }
            const nomeConferidor = { jev: 'O Jev', groq: 'O Groq', gemini: 'O Gemini' }[r.provedor] || 'O conferidor';
            if (r.cenas_conteudo_incompativel) {
              partes.push(`${nomeConferidor} achou ${r.cenas_conteudo_incompativel} de ${r.avaliadas || '?'} cena(s) que não combinam com a narração, ${r.cenas_conteudo_corrigidas || 0} resolvidas com outro material real`);
            } else if (r.avaliadas) {
              partes.push(`${nomeConferidor} conferiu ${r.avaliadas} cena(s) de material real e todas combinam com a narração`);
            }
            if ((r.precisam_ia || []).length) {
              partes.push(`${r.precisam_ia.length} cena(s) que só uma imagem nova de IA resolve (${r.precisam_ia.map(i => i.cena).join(', ')}), nada foi gerado`);
            }
            if ((r.para_revisar || []).length) {
              partes.push(`${r.para_revisar.length} cena(s) na dúvida, que não troquei sozinho: ${r.para_revisar.map(i => i.cena).join(', ')}`);
              for (const c of r.para_revisar) this.appendLog(`  cena ${c.cena} (nota ${c.nota}): mostra ${c.legenda}`);
            }
            if (r.custo_usd > 0) {
              partes.push(`custo da conferência: US$ ${Number(r.custo_usd).toFixed(4).replace('.', ',')}`);
            }
            const resumo = partes.length ? partes.join(', ') + '.' : 'Projeto já estava limpo, nada pra corrigir.';
            this.appendLog(`\nLimpeza concluída. ${resumo}\n`);
            this.notify(`Limpeza concluída: ${resumo}`, 'success');
            if (this.btnLimparMidia) {
              this.btnLimparMidia.disabled = false;
              this.btnLimparMidia.textContent = 'Corrigir Mídia';
            }
            if (this.currentProjectName === nomeDoProjeto) await this.reloadProject();
          } else if (st.status === 'erro') {
            clearInterval(this.limpezaPollInterval);
            this.statusDot.className = 'status-dot failed';
            this.appendLog(`[ERRO]: ${st.erro}`);
            this.notify(`Erro na limpeza de mídia: ${st.erro}`, 'error');
            if (this.btnLimparMidia) {
              this.btnLimparMidia.disabled = false;
              this.btnLimparMidia.textContent = 'Corrigir Mídia';
            }
          }
        } catch (pollErr) {
          console.warn('Erro momentâneo no polling da limpeza:', pollErr);
        }
      }, 2500);
    } catch (err) {
      this.notify(`Erro ao verificar mídia: ${err.message}`, 'error');
      if (this.btnLimparMidia) {
        this.btnLimparMidia.disabled = false;
        this.btnLimparMidia.textContent = 'Corrigir Mídia';
      }
    }
  }

  // =========================================================================
  // Fluxo de Aprovação e Renderização Final (Contrato Oficial da API)
  // =========================================================================

  promptRenderOptions() {
    if (!this.currentProjectData) return;
    const criacao = this.currentProjectData.criacao;
    if (criacao && criacao.rodando) {
      this.notify('A fábrica ainda está criando este vídeo (' + (criacao.progresso_pct || 0) + '%). O botão libera sozinho quando terminar.', 'warning');
      return;
    }
    const cenas = this.currentProjectData.cenas || [];
    const total = cenas.length;
    const prontas = cenas.filter(c => !!c.url_midia || c.midia_existe || c.img_ia_existe).length;
    if (total > 0 && prontas < total) {
      const pct = Math.round((prontas / total) * 100);
      this.notify("Não é possível renderizar: " + (total - prontas) + " cena(s) ainda estão sem imagem ou vídeo carregado (" + pct + "% concluído). Aguarde todas as cenas estarem prontas.", "warning");
      return;
    }
    if (this.modalRenderOptions) {
      this.modalRenderOptions.classList.add('open');
    } else {
      this.startRenderProcess();
    }
  }

  updateRenderReadiness(data) {
    if (!data || !data.cenas) return { total: 0, prontas: 0, pct: 0, tudoPronto: false };
    const cenas = data.cenas || [];
    const total = cenas.length;
    const prontas = cenas.filter(c => !!c.url_midia || c.midia_existe || c.img_ia_existe).length;
    const pct = total > 0 ? Math.round((prontas / total) * 100) : 0;
    // a fábrica ainda está criando: a conferência tira e põe imagens por baixo, então nada de renderizar
    // nem de "100% Pronto" até ela terminar, mesmo que neste instante toda cena tenha arquivo
    const emProducao = !!(data.criacao && data.criacao.rodando);
    const tudoPronto = !emProducao && total > 0 && prontas >= total;

    if (this.badgeStatus && emProducao) {
      const pctCriacao = data.criacao.progresso_pct || 0;
      this.badgeStatus.innerHTML = '<span class="badge-dot pulse"></span> Em produção ' + pctCriacao + '%';
      this.badgeStatus.className = 'badge badge-warning';
      this.badgeStatus.title = (data.criacao.mensagem || 'A fábrica ainda está criando este vídeo.') +
        ' O botão de renderizar libera sozinho quando terminar.';
    } else if (this.badgeStatus) {
      if (data.tem_final) {
        this.badgeStatus.innerHTML = '<span class="badge-dot"></span> Renderizado';
        this.badgeStatus.className = 'badge badge-success';
        this.badgeStatus.title = 'Vídeo final renderizado e pronto para assistir.';
      } else if (tudoPronto) {
        this.badgeStatus.innerHTML = '<span class="badge-dot"></span> 100% Pronto';
        this.badgeStatus.className = 'badge badge-success';
        this.badgeStatus.title = 'Todas as cenas estão com mídia carregada. Pronto para renderizar!';
      } else {
        this.badgeStatus.innerHTML = '<span class="badge-dot pulse"></span> ' + pct + '% Carregado (' + prontas + '/' + total + ')';
        this.badgeStatus.className = 'badge badge-warning';
        this.badgeStatus.title = prontas + ' de ' + total + ' cenas com mídia pronta (' + pct + '%). Aguarde todas as cenas carregarem para renderizar.';
      }
    }

    // o carregamento pode ter ficado pela metade (servidor reiniciado, cota, queda): o botão termina o que falta
    if (this.btnContinuar) {
      this.btnContinuar.style.display = (!emProducao && !tudoPronto && !data.tem_final && total > 0) ? '' : 'none';
      this.btnContinuar.textContent = `Continuar carregamento (${total - prontas} faltando)`;
    }

    if (this.btnRender) {
      if (tudoPronto) {
        this.btnRender.disabled = false;
        this.btnRender.classList.remove('disabled');
        this.btnRender.title = 'Renderizar Vídeo Final';
      } else {
        this.btnRender.disabled = true;
        this.btnRender.classList.add('disabled');
        this.btnRender.title = emProducao
          ? 'A fábrica ainda está criando este vídeo. Libera sozinho quando terminar.'
          : 'Aguarde todas as cenas serem carregadas para renderizar (' + prontas + '/' + total + ' prontas - ' + pct + '%)';
      }
    }

    return { total, prontas, pct, tudoPronto };
  }

  iniciarMonitoramentoCenas(name, jaPronto) {
    if (this.sceneMonitorInterval) {
      clearInterval(this.sceneMonitorInterval);
      this.sceneMonitorInterval = null;
    }
    if (jaPronto) return;

    this.sceneMonitorInterval = setInterval(async () => {
      if (this.currentProjectName !== name || document.body.dataset.view !== 'editor') {
        clearInterval(this.sceneMonitorInterval);
        this.sceneMonitorInterval = null;
        return;
      }
      try {
        const freshData = await API.getProject(name);
        if (this.currentProjectName !== name) return;

        const oldProntas = (this.currentProjectData?.cenas || []).filter(c => !!c.url_midia || c.midia_existe || c.img_ia_existe).length;
        const newProntas = (freshData.cenas || []).filter(c => !!c.url_midia || c.midia_existe || c.img_ia_existe).length;

        if (newProntas !== oldProntas) {
          this.currentProjectData = freshData;
          if (window.Player && typeof window.Player.loadProject === 'function') {
            window.Player.loadProject(freshData);
          }
          if (window.Timeline && typeof window.Timeline.loadProject === 'function') {
            window.Timeline.loadProject(freshData);
          }
          this.renderSceneList();
        }

        const res = this.updateRenderReadiness(freshData);
        if (res && res.tudoPronto) {
          clearInterval(this.sceneMonitorInterval);
          this.sceneMonitorInterval = null;
          this.notify("Todas as " + res.total + " cenas foram carregadas com sucesso! Botão de renderizar liberado.", "success");
        }
      } catch (e) {
        // Silencioso em caso de oscilação momentânea
      }
    }, 3500);
  }

  closeRenderOptionsModal() {
    if (this.modalRenderOptions) {
      this.modalRenderOptions.classList.remove('open');
    }
  }

  async startRenderProcess() {
    this.closeRenderOptionsModal();

    if (this.hasUnsavedChanges) {
      await this.saveChanges();
    }

    // 1. Preparar Payload Oficial conforme o Contrato
    const cenasConfirmadas = (this.currentProjectData.cenas || []).map(c => {
      // c.tipo é só a classificação da cena, não garante que exista material real: uma cena
      // "video_real"/"foto_real" sem material encontrado cai pra imagem de IA e continua com
      // esse tipo (ver player.js). O que decide o arquivo de verdade é c.midia existir ou não,
      // nunca o tipo sozinho — senão o render pega um caminho midia/NNNN.jpg que não existe.
      const arquivo = (c.midia && c.midia.arquivo) ? c.midia.arquivo : `imagens/${c.n}.png`;
      return {
        n: c.n,
        tipo: c.tipo || 'ia',
        arquivo: arquivo,
        ini: Number(Number(c.ini).toFixed(2)),
        fim: Number(Number(c.fim).toFixed(2))
      };
    });

    const optFps = document.getElementById('render-opt-fps');
    const optRes = document.getElementById('render-opt-resolucao');
    const optLeg = document.getElementById('render-opt-legenda');
    const optMus = document.getElementById('render-opt-musica');
    const optCam = document.getElementById('render-opt-camera');
    const optFormato = document.getElementById('render-opt-formato');
    const vertical = !!(optFormato && optFormato.value === 'em_pe');

    const opcoes = {
      fps: optFps ? parseInt(optFps.value, 10) : 30,
      resolucao: optRes ? optRes.value : '1080p',
      legenda: optLeg ? optLeg.checked : true,
      musica: optMus ? optMus.checked : true,
      volume_musica_db: -16.0,
      movimento_camera: optCam ? optCam.checked : true
    };

    // 2. Transição para Modo de Progresso
    if (this.btnRender) {
      this.btnRender.disabled = true;
      this.btnRender.textContent = 'Renderizando...';
    }

    if (this.modalRenderProgress) {
      this.modalRenderProgress.classList.add('open');
      if (this.renderProgressPct) this.renderProgressPct.textContent = '0%';
      if (this.renderProgressFill) this.renderProgressFill.style.width = '0%';
      if (this.renderProgressStage) {
        this.renderProgressStage.textContent = vertical ? 'Iniciando a versão em pé (9:16)...' : 'Iniciando a montagem...';
      }
      if (this.renderStatusBadge) {
        this.renderStatusBadge.textContent = 'Renderizando';
        this.renderStatusBadge.className = 'badge badge-warning';
      }
    }

    this.notify('Iniciando montagem do vídeo em segundo plano...', 'info');

    try {
      // POST /api/projetos/{nome}/render -> Retorna 202 Accepted
      const resp = await API.renderVideo(this.currentProjectName, {
        opcoes: opcoes,
        cenas_confirmadas: cenasConfirmadas,
        sem_avatar: true,
        vertical: vertical
      });

      const tarefaId = resp.tarefa_id || resp.task_id;
      const nomeDoProjeto = this.currentProjectName;

      // 3. Polling de Progresso a cada 2.5s (Feedback Visual em Tempo Real)
      clearInterval(this.renderPollingInterval);
      let tentativasRender = 0;
      let falhasSeguidas = 0;
      // vídeo longo com muitas cenas passa fácil de 30min de render; parar de acompanhar não pode
      // parecer que deu errado, porque o ffmpeg continua rodando no servidor até terminar de verdade
      const MAX_TENTATIVAS_RENDER = 3600; // 2.5s * 3600 = 2h30, bem generoso pro pior caso
      this.renderPollingInterval = setInterval(async () => {
        tentativasRender++;
        if (tentativasRender > MAX_TENTATIVAS_RENDER) {
          clearInterval(this.renderPollingInterval);
          if (this.modalRenderProgress) this.modalRenderProgress.classList.remove('open');
          if (this.btnRender) {
            this.btnRender.disabled = false;
            this.btnRender.textContent = 'Renderizar Vídeo';
          }
          this.notify('Parei de acompanhar por aqui, mas a renderização continua no servidor. ' +
            'Volte ao Painel daqui a pouco: o vídeo aparece como "Pronto" assim que terminar de verdade.', 'info');
          return;
        }
        try {
          const st = await API.getStatus(nomeDoProjeto, tarefaId);
          falhasSeguidas = 0;

          if (st.status === 'renderizando') {
            const pct = st.progresso_pct !== undefined ? st.progresso_pct : 15;
            if (this.renderProgressPct) this.renderProgressPct.textContent = `${pct}%`;
            if (this.renderProgressFill) this.renderProgressFill.style.width = `${pct}%`;
            if (this.renderProgressStage) {
              this.renderProgressStage.textContent = st.etapa_atual || 'Processando o vídeo...';
            }
          } else if (st.concluido === true || st.status === 'concluido') {
            clearInterval(this.renderPollingInterval);

            if (this.renderProgressPct) this.renderProgressPct.textContent = '100%';
            if (this.renderProgressFill) this.renderProgressFill.style.width = '100%';
            if (this.renderProgressStage) this.renderProgressStage.textContent = 'Vídeo final renderizado com sucesso!';

            setTimeout(async () => {
              // Fecha a barra de progresso
              if (this.modalRenderProgress) {
                this.modalRenderProgress.classList.remove('open');
              }

              if (this.btnRender) {
                this.btnRender.disabled = false;
                this.btnRender.textContent = 'Renderizar Vídeo';
              }

              this.notify('Montagem concluída! Abrindo vídeo final...', 'success');
              if (this.currentProjectName === nomeDoProjeto) await this.reloadProject();
              // a revisão do modelo olha o vídeo deitado; a versão em pé tem as mesmas cenas
              if (!vertical) this.acompanharRevisaoVideo(nomeDoProjeto);

              // Abre o player final de alta qualidade exibindo final.mp4
              this.openFinalVideoModal({ ...st, vertical: vertical });
            }, 600);

          } else if (st.status === 'erro') {
            clearInterval(this.renderPollingInterval);
            if (this.modalRenderProgress) {
              this.modalRenderProgress.classList.remove('open');
            }
            if (this.btnRender) {
              this.btnRender.disabled = false;
              this.btnRender.textContent = 'Renderizar Vídeo';
            }
            this.notify(`Erro na renderização: ${st.erro || st.etapa_atual}`, 'error');
          }
        } catch (pollErr) {
          console.warn('Erro momentâneo no polling:', pollErr);
          // a barra parada sem aviso parecia travamento: depois de uns 20s sem resposta, diz o que está havendo
          falhasSeguidas++;
          if (falhasSeguidas >= 8 && this.renderProgressStage) {
            this.renderProgressStage.textContent = 'A fábrica não está respondendo. Confira se o computador da fábrica ' +
              'está ligado e com o LIGAR-TIPLABS aberto; esta tela continua tentando sozinha.';
          }
        }
      }, 2500);

    } catch (err) {
      if (this.modalRenderProgress) {
        this.modalRenderProgress.classList.remove('open');
      }
      if (this.btnRender) {
        this.btnRender.disabled = false;
        this.btnRender.textContent = 'Renderizar Vídeo';
      }
      this.notify(`Falha ao disparar render: ${err.message}`, 'error');
    }
  }

  openFinalVideoModal(statusData = null) {
    if (!this.currentProjectData) return;
    const bruto = (statusData && statusData.video_url) ? statusData.video_url : this.currentProjectData.final_url;
    const finalUrl = API.resolverMidia(bruto);
    if (!finalUrl) return;

    if (this.modalFinal) {
      this.modalFinal.classList.add('open');
    }

    if (this.modalFinalVideo) {
      this.modalFinalVideo.src = finalUrl;
      this.modalFinalVideo.play().catch(() => {});
    }

    // Metadados de duração e tamanho
    if (this.finalVideoDur) {
      const dur = (statusData && statusData.duracao) ? statusData.duracao : this.badgeDuracao.textContent;
      this.finalVideoDur.textContent = dur;
    }

    if (this.finalVideoSize) {
      const tam = (statusData && statusData.tamanho_mb) ? `${statusData.tamanho_mb} MB` : '';
      this.finalVideoSize.textContent = tam;
    }

    // Botão de Download Direto
    if (this.btnDownloadFinal) {
      this.btnDownloadFinal.href = API.baixar(finalUrl);
      const emPe = !!(statusData && statusData.vertical);
      this.btnDownloadFinal.setAttribute('download', `${this.currentProjectName}_${emPe ? 'vertical' : 'final'}.mp4`);
    }
  }

  closeFinalVideoModal() {
    if (this.modalFinal) {
      this.modalFinal.classList.remove('open');
    }
    if (this.modalFinalVideo) {
      this.modalFinalVideo.pause();
      this.modalFinalVideo.removeAttribute('src');
      this.modalFinalVideo.load();
    }
    this.creditosUrl = null;
  }

  /* ---------------------------------------------------------
     Modal Publicar no YouTube
     --------------------------------------------------------- */
  async abrirYoutubePublicar() {
    if (!this.currentProjectName) return;
    this.modalYoutube?.classList.add('open');
    if (this.ytInputTitulo && !this.ytInputTitulo.value) {
      this.ytInputTitulo.value = this.currentProjectName.replace(/-/g, ' ');
    }
    if (this.ytProgresso) this.ytProgresso.style.display = 'none';
    if (this.ytStatus) this.ytStatus.textContent = '';
    await this.carregarStatusYoutube();
  }

  fecharYoutubePublicar() {
    this.modalYoutube?.classList.remove('open');
  }

  async carregarStatusYoutube() {
    try {
      const dados = await API.statusYoutube();
      if (this.linkYoutubeConectar) this.linkYoutubeConectar.href = API.urlConectarYoutube();

      if (this.ytNaoConectado) this.ytNaoConectado.style.display = dados.conectado ? 'none' : 'block';
      if (this.ytConectadoInfo) this.ytConectadoInfo.style.display = dados.conectado ? 'flex' : 'none';

      if (dados.conectado && dados.conta) {
        if (this.ytCanalAvatar) this.ytCanalAvatar.src = dados.conta.canal_avatar || '';
        if (this.ytCanalNome) this.ytCanalNome.textContent = dados.conta.canal_nome || '';
      }

      if (dados.conectado) {
        await this.carregarPublicacaoProjeto();
      } else {
        if (this.ytJaPublicado) this.ytJaPublicado.style.display = 'none';
        if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = 'none';
      }
    } catch (err) {
      if (this.ytStatus) this.ytStatus.textContent = err.message;
    }
  }

  async carregarPublicacaoProjeto() {
    try {
      const dados = await API.statusPublicacaoYoutube(this.currentProjectName);
      const pub = dados.publicado;
      const jaTem = pub && (pub.status === 'publicado' || pub.status === 'agendado');
      if (this.ytJaPublicado) this.ytJaPublicado.style.display = jaTem ? 'block' : 'none';
      if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = jaTem ? 'none' : 'flex';
      if (jaTem) {
        if (this.ytJaPublicadoLink) this.ytJaPublicadoLink.href = pub.url;
        if (this.ytJaPublicadoTexto) {
          this.ytJaPublicadoTexto.textContent = pub.status === 'agendado'
            ? `Agendado pra ${new Date(pub.agendado_para).toLocaleString('pt-BR')}. Sobe como privado até lá e a fábrica troca pra visível sozinha na hora.`
            : `Publicado em ${new Date(pub.enviado_em).toLocaleString('pt-BR')}.`;
        }
      }
    } catch (_) {
      // sem youtube.json ainda: segue mostrando o formulário normalmente
      if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = 'flex';
    }
  }

  async desconectarYoutube() {
    try {
      await API.desconectarYoutube();
      await this.carregarStatusYoutube();
    } catch (err) {
      this.notify('Não consegui desconectar: ' + err.message, 'error');
    }
  }

  async enviarYoutube() {
    const titulo = (this.ytInputTitulo?.value || '').trim();
    if (!titulo) {
      if (this.ytStatus) this.ytStatus.textContent = 'Digite um título.';
      return;
    }
    const tags = (this.ytInputTags?.value || '').split(',').map(t => t.trim()).filter(Boolean);
    const agendar = !!this.ytInputAgendar?.checked;
    const dataAgendada = this.ytInputData?.value || '';
    if (agendar && !dataAgendada) {
      if (this.ytStatus) this.ytStatus.textContent = 'Escolha a data e hora do agendamento.';
      return;
    }

    const payload = {
      titulo,
      descricao: this.ytInputDescricao?.value || '',
      tags,
      privacidade: this.ytInputPrivacidade?.value || 'public',
      agendado_para: agendar ? new Date(dataAgendada).toISOString() : null,
    };

    this.btnYoutubeEnviar.disabled = true;
    if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = 'none';
    if (this.ytProgresso) this.ytProgresso.style.display = 'flex';
    if (this.ytProgressoFill) this.ytProgressoFill.style.width = '0%';
    if (this.ytProgressoTexto) this.ytProgressoTexto.textContent = 'Enviando o vídeo pro YouTube...';
    if (this.ytStatus) this.ytStatus.textContent = '';

    try {
      const resp = await API.publicarYoutube(this.currentProjectName, payload);
      await this.acompanharPublicacaoYoutube(resp.tarefa_id);
    } catch (err) {
      if (this.ytProgresso) this.ytProgresso.style.display = 'none';
      if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = 'flex';
      if (this.ytStatus) this.ytStatus.textContent = err.message;
    } finally {
      this.btnYoutubeEnviar.disabled = false;
    }
  }

  acompanharPublicacaoYoutube(taskId) {
    return new Promise((resolve) => {
      const intervalo = setInterval(async () => {
        try {
          const dados = await API.statusPublicacaoYoutube(this.currentProjectName, taskId);
          const tarefa = dados.tarefa;
          if (!tarefa) return;
          if (this.ytProgressoFill) this.ytProgressoFill.style.width = `${tarefa.progresso_pct || 0}%`;
          if (this.ytProgressoTexto) this.ytProgressoTexto.textContent = tarefa.mensagem || 'Enviando...';

          if (tarefa.status === 'concluido') {
            clearInterval(intervalo);
            if (this.ytProgresso) this.ytProgresso.style.display = 'none';
            this.notify(tarefa.mensagem || 'Publicado com sucesso!', 'success');
            await this.carregarPublicacaoProjeto();
            resolve();
          } else if (tarefa.status === 'erro') {
            clearInterval(intervalo);
            if (this.ytProgresso) this.ytProgresso.style.display = 'none';
            if (this.formYoutubePublicar) this.formYoutubePublicar.style.display = 'flex';
            if (this.ytStatus) this.ytStatus.textContent = tarefa.erro || 'Falha ao publicar.';
            resolve();
          }
        } catch (_) {
          // um erro passageiro de rede não deve derrubar o acompanhamento
        }
      }, 2000);
    });
  }

  generateYouTubeCredits() {
    if (!this.currentProjectData || !this.currentProjectData.cenas) {
      return '';
    }

    const lines = [
      '========================================',
      `CRÉDITOS DAS MÍDIAS - ${this.currentProjectData.nome || 'Vídeo'}`,
      '========================================',
      ''
    ];

    let hasMedia = false;
    this.currentProjectData.cenas.forEach(c => {
      if (c.midia && c.midia.fonte) {
        hasMedia = true;
        const fonte = (c.midia.fonte || '').toUpperCase();
        const autor = c.midia.autor || 'Criador';
        const pagina = c.midia.pagina || '';
        const licenca = c.midia.licenca || 'Licença de uso';
        lines.push(`• Cena ${c.n} (${fonte}): Foto/Vídeo por ${autor} (${licenca})`);
        if (pagina) lines.push(`  Link: ${pagina}`);
      } else if (c.tipo === 'ia') {
        lines.push(`• Cena ${c.n} (IA): Imagem gerada via Inteligência Artificial`);
      }
    });

    lines.push('');
    lines.push('Produzido com TipLabs (Editor de Vídeo).');
    return lines.join('\n');
  }

  async copyCreditsToClipboard() {
    // vindo do painel não há projeto carregado, então os créditos saem do
    // creditos.txt que a própria fábrica gravou na pasta do projeto
    let credits = this.generateYouTubeCredits();
    if (!credits && this.creditosUrl) {
      try {
        const res = await fetch(this.creditosUrl);
        if (res.ok) credits = await res.text();
      } catch (_) { /* sem créditos, segue sem avisar */ }
    }
    if (!credits) {
      this.notify('Este projeto ainda não tem créditos salvos.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(credits);
      this.notify('Créditos para o YouTube copiados para a área de transferência!', 'success');
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = credits;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.notify('Créditos copiados com sucesso!', 'success');
    }
  }

  openTerminal(title) {
    this.terminalDrawer.classList.add('open');
    this.terminalTitle.textContent = title;
    this.terminalBody.textContent = `[TipLabs CLI] Inicializando processo...\n`;
  }

  appendLog(line) {
    this.terminalBody.textContent += line + '\n';
    this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
  }

  notify(msg, type = 'info') {
    // o desenho do aviso (ícone, cor do tipo, fechar, barra do tempo) fica em js/dialogo.js
    if (window.Aviso) window.Aviso.mostrar(String(msg), type);
  }
}

// Inicializar aplicação após carregamento da DOM, só depois do portão de
// token confirmar com a própria fábrica que o acesso vale.
window.addEventListener('DOMContentLoaded', () => {
  Gate.exigir(() => {
    window.App = new StudioApp();
  });
});
