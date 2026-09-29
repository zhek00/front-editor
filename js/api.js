/**
 * TipLabs - API Client
 * Integração direta com a API HTTP REST (FastAPI) do fabrica-de videos.
 */

const API = {
  // Onde mora a fábrica. Três origens, nesta ordem:
  //   1. o que o usuário digitou no painel (fica só neste navegador)
  //   2. config.js, gravado no deploy (a URL do túnel, por exemplo)
  //   3. o palpite local de sempre
  getBaseUrl() {
    const salvo = this.normalizarUrl(this.getConexao().url);
    if (salvo) return salvo;
    if (window.location.port === '8080') return '';
    return this.normalizarUrl(window.FABRICA_API_URL) || (window.location.port === '5173' ? 'http://localhost:8080' : '');
  },

  /** Aceita o endereço do jeito que a pessoa digitar.
   *  Sem "https://" na frente o navegador entenderia como caminho relativo e
   *  procuraria a fábrica dentro do próprio site, que não é o que ela quis dizer.
   *  localhost fica em http, porque é o que a fábrica fala na própria máquina. */
  normalizarUrl(url) {
    const u = (url || '').trim().replace(/\/+$/, '');
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(u)) return 'http://' + u;
    return 'https://' + u;
  },

  /** URL e token guardados neste navegador. O token nunca vai para o deploy:
   *  o site publicado é público, então qualquer segredo embutido nele vazaria. */
  getConexao() {
    try {
      return JSON.parse(localStorage.getItem('tiplabs.conexao') || '{}');
    } catch (_) {
      return {};
    }
  },

  setConexao({ url, token }) {
    const atual = this.getConexao();
    const novo = {
      // guarda já arrumado, para o campo mostrar depois o endereço que vale
      url: url !== undefined ? this.normalizarUrl(url) : atual.url,
      token: token !== undefined ? token.trim() : atual.token,
    };
    try {
      localStorage.setItem('tiplabs.conexao', JSON.stringify(novo));
    } catch (_) { /* navegador sem armazenamento: vale só nesta sessão */ }
    return novo;
  },

  getToken() {
    return this.getConexao().token || window.FABRICA_TOKEN || '';
  },

  /** Toda conversa com a fábrica passa por aqui, para o token ir junto sempre. */
  req(caminho, opcoes = {}) {
    const token = this.getToken();
    const headers = { ...(opcoes.headers || {}) };
    if (token) headers['X-Fabrica-Token'] = token;
    return fetch(`${this.getBaseUrl()}${caminho}`, { ...opcoes, headers });
  },

  /** Traduz a falha para algo que diga o que fazer, em vez de "deu erro". */
  async explicar(res, oQue) {
    if (res.status === 401) {
      return new Error('esse código de acesso não confere.');
    }
    if (res.status === 404) {
      return new Error(`o endereço ${this.getBaseUrl()} respondeu, mas não parece ser a fábrica.`);
    }
    const corpo = await res.json().catch(() => ({}));
    return new Error(corpo.detail || `${oQue} (erro ${res.status})`);
  },

  /** Endereço de mídia para <img>, <video> e download. Esses são carregados
   *  pelo próprio navegador, que não manda cabeçalho, então o token vai na URL. */
  midia(caminho) {
    const url = `${this.getBaseUrl()}${caminho}`;
    const token = this.getToken();
    if (!token) return url;
    return url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
  },

  /** Aceita tanto um caminho relativo (/arquivos/...) quanto uma URL já pronta
   *  e devolve sempre uma URL completa, com o token quando faltar. */
  resolverMidia(url) {
    if (!url) return url;
    return (url.startsWith('http://') || url.startsWith('https://')) ? url : this.midia(url);
  },

  /** O mesmo endereço de mídia, mas pedindo pro navegador baixar o arquivo em
   *  vez de só tocar. O atributo `download` do HTML é ignorado pelo navegador
   *  sempre que o arquivo vem de um endereço diferente do painel (ex: painel
   *  na Vercel, fábrica no túnel) — então quem força o download é o próprio
   *  servidor, através deste parâmetro. */
  baixar(url) {
    const completa = this.resolverMidia(url);
    return completa + (completa.includes('?') ? '&' : '?') + 'baixar=1';
  },

  /** Confere se a fábrica responde e se o token serve. */
  async testarConexao() {
    let res;
    try {
      res = await this.req('/api/projetos');
    } catch (_) {
      // fetch só estoura assim quando nem chegou a falar com o servidor
      throw new Error(`não consegui alcançar ${this.getBaseUrl()}. Confira se a fábrica está rodando e se o endereço está certo.`);
    }
    if (!res.ok) throw await this.explicar(res, 'a fábrica respondeu com erro');
    const dados = await res.json();
    return { projetos: (dados.projetos || []).length };
  },

  // 1. Lista todos os projetos disponíveis
  async getProjects() {
    const res = await this.req(`/api/projetos`);
    if (!res.ok) throw await this.explicar(res, 'falha ao listar projetos');
    const data = await res.json();
    return { projects: data.projetos || [] };
  },

  // 1b. Estado das chaves de API. O servidor nunca devolve a chave inteira,
  // só diz se está configurada e mostra as pontas dela.
  async getChaves() {
    const res = await this.req(`/api/config/chaves`);
    if (!res.ok) throw await this.explicar(res, 'falha ao ler as chaves');
    return res.json();
  },

  // 1c. Grava chaves no .env. Campo em branco não é enviado, então não apaga
  // o que já está guardado.
  async salvarChaves(chaves) {
    const res = await this.req(`/api/config/chaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chaves })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Falha ao salvar as chaves');
    }
    return res.json();
  },

  // 1d. Gasto real (já cobrado) neste vídeo, com o motivo de cada linha.
  async getCustos(nome) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/custos`);
    if (!res.ok) throw await this.explicar(res, 'falha ao ler os custos');
    return res.json();
  },

  // 1e. Procurar Nichos: vídeos recentes com visualização muito acima do
  // tamanho do canal, só com dados públicos do YouTube.
  async buscarNichos(termo, dias = 30) {
    const res = await this.req(`/api/nichos/buscar?q=${encodeURIComponent(termo)}&dias=${dias}`);
    if (!res.ok) throw await this.explicar(res, 'falha ao buscar nichos');
    return res.json();
  },

  // 1f. Vídeos de um canal, paginado (usado no modal "ver todos os vídeos do canal").
  async videosDoCanal(canalId, pagina) {
    const url = `/api/nichos/canal/${encodeURIComponent(canalId)}/videos` + (pagina ? `?pagina=${encodeURIComponent(pagina)}` : '');
    const res = await this.req(url);
    if (!res.ok) throw await this.explicar(res, 'falha ao listar vídeos do canal');
    return res.json();
  },

  // 1g. Publicar no YouTube: conta conectada, link pra conectar, envio e status.
  urlConectarYoutube() {
    const token = this.getToken();
    return `${this.getBaseUrl()}/api/youtube/conectar` + (token ? `?token=${encodeURIComponent(token)}` : '');
  },

  async statusYoutube() {
    const res = await this.req('/api/youtube/status');
    if (!res.ok) throw await this.explicar(res, 'falha ao conferir a conta do YouTube');
    return res.json();
  },

  async desconectarYoutube() {
    const res = await this.req('/api/youtube/desconectar', { method: 'POST' });
    if (!res.ok) throw await this.explicar(res, 'falha ao desconectar');
    return res.json();
  },

  async publicarYoutube(nome, payload) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/youtube/publicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Falha ao iniciar a publicação');
    }
    return res.json();
  },

  async statusPublicacaoYoutube(nome, taskId) {
    const url = `/api/projetos/${encodeURIComponent(nome)}/youtube/status` + (taskId ? `?task_id=${encodeURIComponent(taskId)}` : '');
    const res = await this.req(url);
    if (!res.ok) throw await this.explicar(res, 'falha ao conferir o status da publicação');
    return res.json();
  },

  // 2b. Apaga um projeto (e toda a sua pasta) permanentemente
  async deleteProject(nome) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      let detail = 'Falha ao excluir projeto';
      try {
        const data = await res.json();
        detail = data.detail || detail;
      } catch (e) { /* ignora */ }
      throw new Error(detail);
    }
    return res.json();
  },

  // 2. Obtém detalhes gerais do projeto
  async getProject(nome) {
    const [resProj, resCenas] = await Promise.all([
      this.req(`/api/projetos/${encodeURIComponent(nome)}`),
      this.req(`/api/projetos/${encodeURIComponent(nome)}/cenas`)
    ]);

    if (!resProj.ok) throw new Error(`Falha ao carregar projeto ${nome}`);
    const projData = await resProj.json();
    const cenasData = resCenas.ok ? await resCenas.json() : { cenas: [] };

    // Endereço completo da mídia, já com o token, porque <img> e <video>
    // carregam sozinhos e não mandam cabeçalho. URL externa passa direto.
    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return this.midia(url);
    };

    const cenas = (cenasData.cenas || []).map(c => ({
      ...c,
      url_midia: fixUrl(c.url_midia),
      img_ia_url: fixUrl(c.img_ia_url),
      midia_url: fixUrl(c.midia_url),
      capa_url: fixUrl(c.capa_url),
      efeito_url: fixUrl(c.efeito_url),
      thumb_url: fixUrl(c.thumb_url),
      previa_url: fixUrl(c.previa_url),
    }));

    return {
      name: projData.nome,
      perfil: projData.perfil,
      offline: projData.offline,
      duracao: projData.duracao,
      roteiro: projData.roteiro,
      tem_final: projData.tem_final,
      tem_narracao: projData.tem_narracao,
      // o MP3 leve toca o vídeo inteiro pelo túnel; o WAV original tinha mais de 140 MB num vídeo de 28 min
      narracao_url: fixUrl(projData.url_narracao_leve || projData.url_narracao),
      final_url: fixUrl(projData.url_final),
      cenas: cenas,
      legendas: projData.legendas || [],
      alinhamento: projData.alinhamento || null,
      voz: projData.voz || {},
      imagens: projData.imagens || {},
      criacao: projData.criacao || null,
    };
  },

  // 3. Regerar cena com IA ou Acervo
  async refazerCena(nome, n, { tipo, prompt, busca, forcar_ia }) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/cenas/${n}/refazer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, prompt, busca, forcar_ia: !!forcar_ia })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || 'Falha ao refazer cena');
    }
    return await res.json();
  },

  // 4. Upload manual de imagem ou vídeo (Drag-and-Drop)
  async uploadSceneMedia(nome, n, file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/cenas/${n}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || 'Falha no upload');
    }
    return await res.json();
  },

  // 5. Refazer narração (regera áudio e atualiza tempos das cenas)
  async regerarNarracao(nome, { roteiro, velocidade, nova_voz, voz }) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/narracao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roteiro, velocidade, nova_voz: !!nova_voz, voz: voz || undefined })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || 'Falha ao regerar áudio');
    }
    return await res.json();
  },

  // 6. Salvar modificações diretas de cenas em cenas.json
  async saveProject(nome, cenas) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/cenas/salvar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cenas })
    });
    if (!res.ok) throw new Error('Falha ao salvar cenas');
    return await res.json();
  },

  // 7. Disparar renderização do vídeo em segundo plano (Contrato Oficial)
  async renderVideo(nome, { opcoes, cenas_confirmadas, sem_avatar } = {}) {
    const payload = {
      projeto: nome,
      opcoes: opcoes || {
        fps: 30,
        resolucao: '1080p',
        legenda: true,
        musica: true,
        volume_musica_db: -16,
        movimento_camera: true
      },
      cenas_confirmadas: cenas_confirmadas || [],
      sem_avatar: sem_avatar !== undefined ? sem_avatar : true
    };

    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok && res.status !== 202) {
      const err = await res.json().catch(() => ({ detail: 'Falha ao iniciar renderização' }));
      throw new Error(err.detail || err.message || 'Falha ao iniciar renderização');
    }
    return await res.json();
  },

  // 8. Consultar status da tarefa de renderização
  async getStatus(nome, taskId = null) {
    const caminho = taskId
      ? `/api/projetos/${encodeURIComponent(nome)}/status?task_id=${encodeURIComponent(taskId)}`
      : `/api/projetos/${encodeURIComponent(nome)}/status`;
    const res = await this.req(caminho);
    if (!res.ok) throw new Error('Falha ao consultar status');
    return await res.json();
  },

  // 8b. Mapa do roteiro: blocos, âncoras, armadilhas de busca, pessoas reais e proibidos
  async getMapa(nome) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/mapa`);
    if (res.status === 404) return null;  // o projeto ainda não tem mapa (ou é de antes do agente)
    if (!res.ok) throw await this.explicar(res, 'falha ao ler o mapa do roteiro');
    return await res.json();
  },

  // 9. Lista versões antigas salvas em antigas/
  async getAntigas(nome, n) {
    try {
      const res = await this.req(`/api/project/scene/antigas?name=${encodeURIComponent(nome)}&n=${n}`);
      if (res.ok) {
        const data = await res.json();
        const fixUrl = (u) => (u && !u.startsWith('http') ? this.midia(u) : u);
        return { antigas: (data.antigas || []).map(a => ({ ...a, url: fixUrl(a.url) })) };
      }
    } catch (_) {}
    return { antigas: [] };
  },

  // 10. Restaura uma versão antiga
  async restoreAntiga(nome, n, filename) {
    const res = await this.req(`/api/project/scene/restore-antiga`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nome, n, filename })
    });
    if (!res.ok) throw new Error('Falha ao restaurar versão');
    return await res.json();
  },

  // 11. Biblioteca de SFX
  async getSfxLibrary() {
    const res = await this.req(`/api/sfx-library`);
    if (!res.ok) return { sfx: [] };
    const data = await res.json();
    const fixUrl = (u) => (u && !u.startsWith('http') ? this.midia(u) : u);
    return {
      sfx: (data.sfx || []).map(s => ({
        ...s,
        url: fixUrl(s.url),
        path: s.caminho,
        name: s.nome,
        description: s.descricao
      }))
    };
  },

  // 12. Biblioteca de Músicas
  async getMusicLibrary() {
    const res = await this.req(`/api/music-library`);
    if (!res.ok) return { music: [] };
    const data = await res.json();
    const fixUrl = (u) => (u && !u.startsWith('http') ? this.midia(u) : u);
    return {
      music: (data.musicas || []).map(m => ({
        ...m,
        url: fixUrl(m.url),
        path: m.caminho,
        name: m.nome,
        category: m.categoria
      }))
    };
  },

  // 13. Criar Novo Projeto (Contrato Oficial)
  // Sem campo de perfil: o estilo de vídeo é fixo no backend (perfis/padrao.yaml), a pessoa só
  // escolhe roteiro, voz e provedor de imagem.
  async criarProjeto({ nome, roteiro, perfil, voz, vozElevenlabs, imagensProvedor }) {
    const payload = {
      nome: nome.trim().toLowerCase(),
      roteiro: roteiro.trim(),
      voz: voz || 'pt-BR-AntonioNeural'
    };
    if (perfil) {
      payload.perfil = perfil;
    }
    if (vozElevenlabs) {
      payload.voz_provedor = 'elevenlabs';
      payload.voz_elevenlabs_id = vozElevenlabs.voice_id;
      payload.voz_elevenlabs_modelo = vozElevenlabs.modelo;
      payload.voz_elevenlabs_idioma = vozElevenlabs.idioma;
      payload.voz_estabilidade = vozElevenlabs.estabilidade;
      payload.voz_similaridade = vozElevenlabs.similaridade;
      payload.voz_estilo = vozElevenlabs.estilo;
      payload.voz_velocidade = vozElevenlabs.velocidade;
    }
    if (imagensProvedor) {
      payload.imagens_provedor = imagensProvedor;
    }

    const res = await this.req(`/api/projetos/criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok && res.status !== 202) {
      const err = await res.json().catch(() => ({ detail: 'Falha ao criar projeto' }));
      throw new Error(err.detail || err.message || 'Falha ao criar projeto');
    }
    return await res.json();
  },

  // 14. Listar Perfis Disponíveis
  async getPerfis() {
    try {
      const res = await this.req(`/api/perfis`);
      if (res.ok) {
        const data = await res.json();
        return data.perfis || [];
      }
    } catch (_) {}
    return [
      { id: 'animais-exoticos', caminho: 'perfis/animais-exoticos.yaml', titulo: 'Animais Exóticos (90% Acervo / 10% Grok)' },
      { id: 'asteroide', caminho: 'perfis/asteroide.yaml', titulo: 'Ciência, Espaço & Documentário' },
      { id: 'livro-de-enoque', caminho: 'perfis/livro-de-enoque.yaml', titulo: 'História Antiga & Mistérios Bíblicos' },
      { id: 'apresentacao', caminho: 'perfis/apresentacao.yaml', titulo: 'Apresentação e Corporativo' },
      { id: 'meditacao', caminho: 'perfis/meditacao.yaml', titulo: 'Meditação & Relaxamento Guiado' }
    ];
  },

  // 15. Listar Vozes Disponíveis
  async getVozes() {
    try {
      const res = await this.req(`/api/vozes`);
      if (res.ok) {
        const data = await res.json();
        return data.vozes || [];
      }
    } catch (_) {}
    return [
      { id: 'pt-BR-AntonioNeural', nome: 'Antônio - pt-BR (Voz Masculina Natural)' },
      { id: 'pt-BR-FranciscaNeural', nome: 'Francisca - pt-BR (Voz Feminina Expressiva)' },
      { id: 'pt-BR-ThalitaMultilingualNeural', nome: 'Thalita - pt-BR (Voz Feminina Suave)' },
      { id: 'pt-PT-DuarteNeural', nome: 'Duarte - pt-PT (Voz Masculina Portugal)' },
      { id: 'pt-PT-RaquelNeural', nome: 'Raquel - pt-PT (Voz Feminina Portugal)' }
    ];
  },

  // 16. Lista curada de vozes ElevenLabs pra documentário (3 por idioma) + modelos com custo relativo
  async getVozesElevenLabs(idioma = 'pt') {
    try {
      const res = await this.req(`/api/vozes/elevenlabs?idioma=${encodeURIComponent(idioma)}`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return { vozes: [], modelos: [], idiomas: [] };
  },

  // 17b. Aponta mídia suspeita nas cenas, sem mudar nada
  async verificarMidia(nome) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/verificar`);
    if (!res.ok) throw new Error('Falha ao verificar mídia');
    return await res.json();
  },

  // 17c. Varre e corrige mídia suspeita (busca real de graça, IA só se precisar) em segundo plano
  /** Termina o carregamento do projeto. Sem confirmar só devolve o que falta e o custo. */
  async continuarCarregamento(nome, confirmar = false) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/continuar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmar })
    });
    if (!res.ok && res.status !== 202) {
      const err = await res.json().catch(() => ({ detail: 'Falha ao continuar o carregamento' }));
      throw new Error(err.detail || 'Falha ao continuar o carregamento');
    }
    return await res.json();
  },

  /** Faz a criação de um vídeo parado andar de novo de onde parou. Sem confirmar só devolve o custo. */
  async retomarCriacao(nome, confirmar = false) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/retomar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmar })
    });
    if (!res.ok && res.status !== 202) {
      const err = await res.json().catch(() => ({ detail: 'Falha ao retomar a criação' }));
      throw new Error(err.detail || 'Falha ao retomar a criação');
    }
    return await res.json();
  },

  async limparMidia(nome) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/limpar-midia`, {
      method: 'POST'
    });
    if (!res.ok && res.status !== 202) {
      const err = await res.json().catch(() => ({ detail: 'Falha ao iniciar limpeza' }));
      throw new Error(err.detail || 'Falha ao iniciar limpeza de mídia');
    }
    return await res.json();
  },

  // 17. Troca o provedor de imagem de IA (Google/Nano Banana 2 ou Kie.ai) de um projeto
  async setImagensProvedor(nome, provedor) {
    const res = await this.req(`/api/projetos/${encodeURIComponent(nome)}/imagens/provedor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provedor })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || 'Falha ao trocar o provedor de imagem');
    }
    return await res.json();
  }
};

window.API = API;
