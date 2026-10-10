/**
 * TipLabs - Painel inicial
 * Lista os vídeos, mostra os números gerais, deixa assistir ao vídeo pronto sem
 * abrir a timeline e guarda as chaves de API. Quem manda na navegação continua
 * sendo o StudioApp: aqui só cuidamos do conteúdo do painel. A conexão com a
 * fábrica (endereço + token) é resolvida antes disso tudo, pelo Gate.
 */

class StudioDashboard {
  constructor(app) {
    this.app = app;
    this.projetos = [];
    this.filtro = 'todos';
    this.chaves = [];
    this.chavesCarregadas = false;

    this.grade = document.getElementById('dash-grade');
    this.vazio = document.getElementById('dash-vazio');
    this.filtros = document.querySelectorAll('.dash-filtro');
    this.listaChaves = document.getElementById('dash-chaves');
    this.chavesStatus = document.getElementById('dash-chaves-status');
    this.btnSalvarChaves = document.getElementById('btn-salvar-chaves');
    this.modalChaves = document.getElementById('modal-chaves');

    this.bind();
  }

  bind() {
    document.getElementById('btn-dash-novo')?.addEventListener('click', () => this.app.showView('novo'));
    document.getElementById('btn-vazio-novo')?.addEventListener('click', () => this.app.showView('novo'));
    document.getElementById('btn-dash-atualizar')?.addEventListener('click', () => this.recarregar());
    document.getElementById('btn-voltar-painel')?.addEventListener('click', () => this.app.showView('dashboard'));

    this.filtros.forEach(f => {
      f.addEventListener('click', () => {
        this.filtros.forEach(o => o.classList.remove('active'));
        f.classList.add('active');
        this.filtro = f.dataset.estado;
        this.desenharGrade();
      });
    });

    this.btnSalvarChaves?.addEventListener('click', () => this.salvarChaves());

    document.getElementById('btn-abrir-chaves')?.addEventListener('click', () => this.abrirChaves());
    document.getElementById('btn-modal-chaves-close')?.addEventListener('click', () => this.fecharChaves());
    this.modalChaves?.addEventListener('click', (e) => {
      if (e.target === this.modalChaves) this.fecharChaves();
    });
  }

  /* ---------------------------------------------------------
     Modal de Chaves de API
     --------------------------------------------------------- */
  abrirChaves() {
    this.modalChaves?.classList.add('open');
    if (!this.chavesCarregadas) this.carregarChaves();
  }

  fecharChaves() {
    this.modalChaves?.classList.remove('open');
  }

  /** Chamado toda vez que o painel entra em cena.
   *
   * Entrar no painel dispara isto por dois caminhos (a troca de tela e o
   * hashchange que ela provoca), então uma busca já em andamento é
   * reaproveitada em vez de virar uma segunda ida ao servidor. */
  async recarregar() {
    if (this.buscando) return this.buscando;

    this.buscando = (async () => {
      try {
        const data = await API.getProjects();
        this.projetos = data.projects || [];
        this.desenharNumeros();
        this.desenharGrade();
        this.vigiarProducao();
      } catch (err) {
        this.app.notify('Não consegui carregar a lista de vídeos: ' + err.message, 'error');
      } finally {
        this.buscando = null;
      }
    })();

    return this.buscando;
  }

  desenharNumeros() {
    const total = this.projetos.length;
    const prontos = this.projetos.filter(p => p.tem_final).length;
    const segundos = this.projetos.reduce((s, p) => s + (p.duracao || 0), 0);
    const cenas = this.projetos.reduce((s, p) => s + (p.cenas_count || 0), 0);

    const põe = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };
    põe('stat-total', total);
    põe('stat-prontos', prontos);
    põe('stat-minutos', Math.round(segundos / 60));
    põe('stat-cenas', cenas);
  }

  filtrados() {
    if (this.filtro === 'prontos') return this.projetos.filter(p => p.tem_final);
    if (this.filtro === 'producao') return this.projetos.filter(p => !p.tem_final);
    return this.projetos;
  }

  desenharGrade() {
    if (!this.grade) return;
    const lista = this.filtrados();

    // o convite para criar o primeiro vídeo só aparece quando não há nenhum
    // projeto mesmo, não quando um filtro deixou a tela vazia
    const semNenhum = this.projetos.length === 0;
    if (this.vazio) this.vazio.style.display = semNenhum ? 'block' : 'none';
    this.grade.style.display = semNenhum ? 'none' : 'grid';
    if (semNenhum) {
      this.grade.innerHTML = '';
      return;
    }

    if (lista.length === 0) {
      this.grade.style.display = 'block';
      this.grade.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 28px 0;">Nenhum vídeo neste filtro.</p>';
      return;
    }

    this.grade.innerHTML = '';
    const frag = document.createDocumentFragment();
    lista.forEach(p => frag.appendChild(this.montarCard(p)));
    this.grade.appendChild(frag);
  }

  montarCard(p) {
    const nome = p.nome || p.name;
    const pronto = !!p.tem_final;
    // cenas_completas: toda cena real já tem arquivo (ou virou imagem de IA) — nenhuma cena vazia no meio.
    // Só a partir daqui o vídeo pode ser editado/renderizado; até lá, ainda está em produção automática.
    const cenasCompletas = !!p.cenas_completas;
    const editavel = pronto || cenasCompletas;
    // criacao.rodando: a fábrica está trabalhando neste vídeo agora. Sem isso e sem cenas completas,
    // o vídeo está parado (erro, fábrica reiniciada antes da esteira nova) e precisa do botão Retomar
    const criacao = p.criacao || {};
    const rodando = !editavel && !!criacao.rodando;
    const parado = !editavel && !rodando;
    const card = document.createElement('article');
    card.className = 'dash-card';

    const capa = p.capa ? API.midia(p.capa) : null;
    const selo = pronto
      ? '<span class="dash-card-selo pronto">PRONTO</span>'
      : cenasCompletas
        ? '<span class="dash-card-selo editavel">PRONTO PARA EDITAR</span>'
        : parado
          ? '<span class="dash-card-selo parado">PARADO</span>'
          : '<span class="dash-card-selo producao">EM PRODUÇÃO</span>';

    const meta = [];
    if (p.duracao) meta.push(`<span>${this.mmss(p.duracao)}</span>`);
    if (p.cenas_count) meta.push(`<span>${p.cenas_count} cenas</span>`);
    if (p.criado) meta.push(`<span>${this.dataCurta(p.criado)}</span>`);

    // enquanto ainda está montando as cenas, o tempo decorrido substitui a miniatura vazia —
    // dá pra saber que está andando sem precisar abrir o console
    let tempoOverlay = '';
    if (rodando) {
      const pct = criacao.progresso_pct ? ` · ${criacao.progresso_pct}%` : '';
      tempoOverlay = `<div class="dash-card-tempo">Processando${pct}</div>`;
    } else if (parado) {
      tempoOverlay = '<div class="dash-card-tempo">Parado. Clique em Retomar</div>';
    }

    card.innerHTML = `
      <div class="dash-card-capa">
        ${capa
          ? `<img src="${capa}" alt="" loading="lazy">`
          : '<div class="dash-card-capa-vazia"><img src="/img/logo-tiplabs.svg" alt=""></div>'}
        ${tempoOverlay}
        ${selo}
      </div>
      <div class="dash-card-corpo">
        <div class="dash-card-nome"></div>
        <div class="dash-card-meta">${meta.join('')}</div>
        <div class="dash-card-acoes"></div>
      </div>`;

    // o nome vem do disco, então entra como texto e nunca como HTML
    card.querySelector('.dash-card-nome').textContent = nome;

    const acoes = card.querySelector('.dash-card-acoes');

    if (pronto) {
      const assistir = document.createElement('button');
      assistir.className = 'btn btn-cta btn-sm';
      assistir.textContent = 'Assistir';
      assistir.addEventListener('click', () => this.assistir(p));
      acoes.appendChild(assistir);
    }

    if (editavel) {
      const editar = document.createElement('button');
      editar.className = pronto ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';
      editar.textContent = 'Editar';
      editar.addEventListener('click', () => this.app.abrirNaTimeline(nome));
      acoes.appendChild(editar);
    } else if (rodando) {
      // ainda sem todas as cenas preenchidas: nada pra editar de verdade, então o botão fica
      // só informativo em vez de abrir a timeline pela metade
      const processando = document.createElement('button');
      processando.className = 'btn btn-secondary btn-sm';
      processando.textContent = 'Processando…';
      processando.disabled = true;
      processando.title = criacao.mensagem || 'Libera quando todas as cenas tiverem imagem';
      acoes.appendChild(processando);
    } else {
      const retomar = document.createElement('button');
      retomar.className = 'btn btn-primary btn-sm';
      retomar.textContent = 'Retomar';
      retomar.title = criacao.mensagem || 'Continua a criação de onde parou, sem pagar de novo o que já foi feito';
      retomar.addEventListener('click', () => this.retomar(nome, retomar));
      acoes.appendChild(retomar);
    }

    const excluir = document.createElement('button');
    excluir.className = 'btn btn-danger btn-sm btn-icone';
    excluir.title = `Excluir ${nome}`;
    excluir.textContent = '✕';
    excluir.addEventListener('click', () => this.app.pedirExclusao(nome, () => this.recarregar()));
    acoes.appendChild(excluir);

    return card;
  }

  /** Mostra o que falta e quanto pode custar, e só então põe a criação para andar de novo. */
  async retomar(nome, botao) {
    const p = this.projetos.find(x => (x.nome || x.name) === nome) || {};
    // "Parado, precisa de você: OpenRouter: acabou o crédito..." vira o quadro de aviso, sem o prefixo repetido
    const motivo = ((p.criacao && p.criacao.mensagem) || '').replace(/^\s*Parado[^:]*:\s*/i, '').trim();
    botao.disabled = true;
    try {
      const est = await API.retomarCriacao(nome, false);
      const itens = [];
      if (est.sem_imagem_ia || est.sem_acervo) {
        itens.push({ rotulo: 'Cenas de acervo', valor: est.sem_acervo || 0, nota: 'grátis' });
        itens.push({ rotulo: 'Imagens de IA', valor: est.sem_imagem_ia || 0 });
      }
      const ok = await Dialogo.confirmar({
        titulo: 'Retomar a criação',
        aviso: motivo ? { tipo: 'parado', titulo: 'Onde parou', texto: motivo } : null,
        texto: `"${nome}" continua de onde parou, sem pagar de novo o que já foi feito.`,
        itens,
        custo: est.custo_estimado_usd ? `até US$ ${est.custo_estimado_usd.toFixed(2).replace('.', ',')}` : null,
        confirmar: 'Retomar',
      });
      if (!ok) return;
      await API.retomarCriacao(nome, true);
      this.app.notify(`Criação de ${nome} retomada. O painel se atualiza sozinho.`, 'success');
      await this.recarregar();
    } catch (err) {
      this.app.notify('Não consegui retomar: ' + err.message, 'error');
    } finally {
      botao.disabled = false;
    }
  }

  /** Enquanto algum vídeo estiver sendo criado, o painel se atualiza sozinho. */
  vigiarProducao() {
    const algumRodando = this.projetos.some(p => p.criacao && p.criacao.rodando);
    clearTimeout(this.vigia);
    if (!algumRodando) return;
    this.vigia = setTimeout(() => {
      const painelVisivel = this.grade && this.grade.offsetParent !== null;
      if (painelVisivel) this.recarregar();
      else this.vigiarProducao();
    }, 15000);
  }

  /** Abre o vídeo pronto num modal, sem carregar o projeto na timeline. */
  assistir(p) {
    const nome = p.nome || p.name;
    this.app.abrirVideoPronto({
      nome,
      url: API.midia(`/arquivos/${encodeURIComponent(nome)}/final.mp4`),
      duracao: this.mmss(p.duracao),
    });
  }

  /* ---------------------------------------------------------
     Chaves de API
     --------------------------------------------------------- */
  async carregarChaves() {
    if (!this.listaChaves) return;
    this.listaChaves.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Carregando…</p>';
    try {
      const data = await API.getChaves();
      this.chaves = data.chaves || [];
      this.chavesCarregadas = true;
      this.desenharChaves();
    } catch (err) {
      this.listaChaves.innerHTML = '';
      this.app.notify('Não consegui ler o estado das chaves: ' + err.message, 'error');
    }
  }

  desenharChaves() {
    this.listaChaves.innerHTML = '';
    const frag = document.createDocumentFragment();

    this.chaves.forEach(c => {
      const bloco = document.createElement('div');
      bloco.className = 'dash-chave';

      const estadoTexto = c.configurada ? 'CONFIGURADA' : (c.obrigatoria ? 'FALTANDO' : 'OPCIONAL');
      const estadoClasse = c.configurada
        ? 'ok'
        : `falta${c.obrigatoria ? ' obrigatoria' : ''}`;

      bloco.innerHTML = `
        <div class="dash-chave-topo">
          <span class="dash-chave-nome"></span>
          <span class="dash-chave-estado ${estadoClasse}">${estadoTexto}</span>
        </div>
        <div class="dash-chave-desc">
          <span class="chave-para-que"></span>
          ${c.configurada ? '' : '<em class="chave-sem-ela"></em>'}
        </div>
        <div class="dash-chave-campo">
          <input type="password" autocomplete="off" spellcheck="false" data-env="${c.env}">
          <span class="dash-chave-onde"></span>
        </div>`;

      bloco.querySelector('.dash-chave-nome').textContent = c.nome;
      bloco.querySelector('.chave-para-que').textContent = c.para_que;
      const semEla = bloco.querySelector('.chave-sem-ela');
      if (semEla) semEla.textContent = ' ' + c.sem_ela;

      const campo = bloco.querySelector('input');
      campo.placeholder = c.configurada
        ? `Guardada (${c.previa}) — cole outra para trocar`
        : 'Cole a chave aqui';

      const onde = bloco.querySelector('.dash-chave-onde');
      onde.append('pegue em ');
      const link = document.createElement('a');
      link.href = `https://${c.onde}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = c.onde;
      onde.append(link);

      frag.appendChild(bloco);
    });

    this.listaChaves.appendChild(frag);
  }

  async salvarChaves() {
    const campos = this.listaChaves.querySelectorAll('input[data-env]');
    const novas = {};
    campos.forEach(c => {
      const valor = c.value.trim();
      if (valor) novas[c.dataset.env] = valor;
    });

    if (Object.keys(novas).length === 0) {
      this.mostrarStatus('Nada para salvar: os campos em branco não mexem nas chaves guardadas.');
      return;
    }

    this.btnSalvarChaves.disabled = true;
    this.btnSalvarChaves.textContent = 'Salvando…';
    try {
      const r = await API.salvarChaves(novas);
      // os campos são limpos na hora: a chave já foi para o .env e não fica na tela
      campos.forEach(c => { c.value = ''; });
      this.chavesCarregadas = false;
      await this.carregarChaves();
      const qtd = (r.atualizadas || []).length;
      this.mostrarStatus(`${qtd} ${qtd === 1 ? 'chave salva' : 'chaves salvas'} no .env.`);
      this.app.notify('Chaves atualizadas.', 'success');
    } catch (err) {
      this.app.notify('Falha ao salvar as chaves: ' + err.message, 'error');
      this.mostrarStatus('');
    } finally {
      this.btnSalvarChaves.disabled = false;
      this.btnSalvarChaves.textContent = 'Salvar chaves';
    }
  }

  mostrarStatus(texto) {
    if (!this.chavesStatus) return;
    this.chavesStatus.textContent = texto;
    if (texto) setTimeout(() => { this.chavesStatus.textContent = ''; }, 6000);
  }

  /* ---------------------------------------------------------
     Formatação
     --------------------------------------------------------- */
  mmss(segundos) {
    const s = Math.max(0, Math.round(segundos || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  dataCurta(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  tempoDecorrido(iso) {
    const inicio = new Date(iso);
    if (isNaN(inicio)) return '';
    const min = Math.max(0, Math.round((Date.now() - inicio.getTime()) / 60000));
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const resto = min % 60;
    return resto ? `${h}h${resto}min` : `${h}h`;
  }
}

window.StudioDashboard = StudioDashboard;
