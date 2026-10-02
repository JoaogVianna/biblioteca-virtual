import { useEffect, useState } from 'react';
import {
  BookOpen,
  BookMarked,
  Clock,
  FileText,
  Heart,
  History,
  Laptop,
  Library,
  Search,
  Skull,
  Star,
  User,
  Users,
  X,
} from 'lucide-react';
import './App.css';

const CATEGORIAS = [
  { nome: 'Ficção', consulta: 'subject:fiction', icone: BookOpen },
  { nome: 'Não Ficção', consulta: 'subject:nonfiction', icone: FileText },
  { nome: 'Romance', consulta: 'subject:romance', icone: Heart },
  { nome: 'Terror', consulta: 'subject:horror', icone: Skull },
  { nome: 'Suspense', consulta: 'subject:thriller', icone: Search },
  { nome: 'Fantasia', consulta: 'subject:fantasy', icone: Star },
  { nome: 'Biografia', consulta: 'subject:biography', icone: User },
  { nome: 'Tecnologia', consulta: 'subject:technology', icone: Laptop },
];

const NAV = [
  { id: 'inicio', nome: 'Início', icone: BookOpen },
  { id: 'livros', nome: 'Livros', icone: Library },
  { id: 'meus', nome: 'Meus empréstimos', icone: BookMarked },
  { id: 'historico', nome: 'Histórico', icone: History },
];

function limpar(texto) {
  return texto ? texto.replace(/\*\*/g, '') : '';
}

function formatarData(data) {
  if (!data) return '—';
  // o SQLite guarda em UTC; convertemos para o horário local
  return new Date(data.replace(' ', 'T') + 'Z').toLocaleString('pt-BR');
}

function Cartao({ capa, titulo, autor, detalhe, children }) {
  return (
    <div className="cartao">
      <div className="cartao-capa">
        {capa ? (
          <img src={capa} alt={titulo} />
        ) : (
          <div className="capa-vazia">
            <BookOpen size={36} />
          </div>
        )}
      </div>
      <div className="cartao-corpo">
        <strong className="cartao-titulo">{titulo}</strong>
        <span className="cartao-autor">{autor}</span>
        {detalhe}
        {children}
      </div>
    </div>
  );
}

function App() {
  const [pagina, setPagina] = useState('inicio');
  const [livros, setLivros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');

  const [termoOL, setTermoOL] = useState('');
  const [resultadosOL, setResultadosOL] = useState([]);
  const [rotuloResultados, setRotuloResultados] = useState('');
  const [buscandoOL, setBuscandoOL] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  const [filtro, setFiltro] = useState('');
  const [detalheId, setDetalheId] = useState(null);
  const [editando, setEditando] = useState(false);
  const [edicao, setEdicao] = useState({
    titulo: '',
    autor: '',
    ano: '',
    paginas: '',
    descricao: '',
  });

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');

  async function carregarLivros() {
    const resposta = await fetch('/livros');
    setLivros(await resposta.json());
  }

  async function carregarUsuarios() {
    const resposta = await fetch('/usuarios');
    setUsuarios(await resposta.json());
  }

  async function carregarEmprestimos() {
    const resposta = await fetch('/emprestimos');
    setEmprestimos(await resposta.json());
  }

  async function carregarSugestoes() {
    try {
      const resposta = await fetch('/openlibrary/destaques');
      if (resposta.ok) setSugestoes(await resposta.json());
    } catch (e) {
      // sem sugestões, a seção mostra só os livros da biblioteca
    }
  }

  function atualizar() {
    carregarLivros();
    carregarEmprestimos();
  }

  useEffect(() => {
    carregarLivros();
    carregarUsuarios();
    carregarEmprestimos();
    carregarSugestoes();
  }, []);

  // ---------- dados derivados ----------
  const usuarioAtual = usuarios.find((u) => String(u.id) === usuarioId);
  const emprestadosAgora = livros.filter((l) => !l.disponivel).length;
  const recentes = [...livros]
    .reverse()
    .slice(0, 4)
    .map((l) => ({ tipo: 'biblioteca', livro: l }));
  const sugeridos = sugestoes
    .filter((s) => !jaNaBiblioteca(s))
    .map((s) => ({ tipo: 'sugestao', livro: s }));
  const destaques = [...recentes, ...sugeridos].slice(0, 8);
  const livrosFiltrados = livros.filter((l) =>
    `${l.titulo} ${l.autor}`.toLowerCase().includes(filtro.toLowerCase())
  );
  const meusLivros = usuarioAtual
    ? emprestimos
        .filter((e) => e.usuario_id === usuarioAtual.id && !e.data_devolucao)
        .map((e) => livros.find((l) => l.id === e.livro_id))
        .filter(Boolean)
    : [];
  const detalhe = livros.find((l) => l.id === detalheId);

  function quemPegou(livroId) {
    const emprestimo = emprestimos.find(
      (e) => e.livro_id === livroId && !e.data_devolucao
    );
    return emprestimo ? emprestimo.usuario : '';
  }

  function jaNaBiblioteca(r) {
    return livros.some(
      (l) =>
        l.titulo.trim().toLowerCase() === r.titulo.trim().toLowerCase() &&
        l.autor.trim().toLowerCase() === r.autor.trim().toLowerCase()
    );
  }

  // ---------- Open Library ----------
  async function buscarOpenLibrary(termo, rotulo) {
    if (!termo.trim()) return;

    setPagina('inicio');
    setBuscandoOL(true);
    setRotuloResultados(rotulo ?? `Resultados para "${termo}"`);

    try {
      const resposta = await fetch(`/openlibrary/buscar?q=${encodeURIComponent(termo)}`);

      if (!resposta.ok) {
        const erro = await resposta.json();
        alert(erro.erro);
        return;
      }

      setResultadosOL(await resposta.json());
    } finally {
      setBuscandoOL(false);
    }
  }

  function limparResultados() {
    setResultadosOL([]);
    setRotuloResultados('');
  }

  async function importarLivro(livro) {
    const resposta = await fetch('/openlibrary/importar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(livro),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      alert(erro.erro);
      return;
    }

    atualizar();
  }

  // ---------- livros ----------
  async function cadastrarLivro(e) {
    e.preventDefault();

    await fetch('/livros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, autor }),
    });

    setTitulo('');
    setAutor('');
    atualizar();
  }

  function abrirDetalhe(id) {
    setDetalheId(id);
    setEditando(false);
  }

  function fecharDetalhe() {
    setDetalheId(null);
    setEditando(false);
  }

  function iniciarEdicao(l) {
    setEdicao({
      titulo: l.titulo,
      autor: l.autor,
      ano: l.ano ?? '',
      paginas: l.paginas ?? '',
      descricao: l.descricao ?? '',
    });
    setEditando(true);
  }

  async function salvarEdicao(e) {
    e.preventDefault();

    const resposta = await fetch(`/livros/${detalheId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: edicao.titulo,
        autor: edicao.autor,
        ano: edicao.ano === '' ? null : Number(edicao.ano),
        paginas: edicao.paginas === '' ? null : Number(edicao.paginas),
        descricao: edicao.descricao,
      }),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      alert(erro.erro);
      return;
    }

    setEditando(false);
    atualizar();
  }

  async function excluirLivro(livro) {
    const confirmou = window.confirm(
      `Excluir "${livro.titulo}"? O histórico de empréstimos dele também será apagado.`
    );
    if (!confirmou) return;

    const resposta = await fetch(`/livros/${livro.id}`, { method: 'DELETE' });

    if (!resposta.ok) {
      const erro = await resposta.json();
      alert(erro.erro);
      return;
    }

    fecharDetalhe();
    atualizar();
  }

  // ---------- usuários ----------
  async function cadastrarUsuario(e) {
    e.preventDefault();

    const resposta = await fetch('/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email }),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      alert(erro.erro);
      return;
    }

    const novo = await resposta.json();
    await carregarUsuarios();
    setUsuarioId(String(novo.id));
    setNome('');
    setEmail('');
    setMostrarCadastro(false);
  }

  // ---------- empréstimos ----------
  async function emprestar(livroId) {
    if (!usuarioId) {
      alert('Escolha um usuário no painel ao lado primeiro');
      return;
    }

    const resposta = await fetch('/emprestimos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livro_id: livroId, usuario_id: Number(usuarioId) }),
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      alert(erro.erro);
    }

    atualizar();
  }

  async function devolver(livroId) {
    const emprestimo = emprestimos.find(
      (e) => e.livro_id === livroId && !e.data_devolucao
    );

    if (!emprestimo) return;

    await fetch(`/emprestimos/${emprestimo.id}/devolver`, { method: 'PUT' });
    atualizar();
  }

  // ---------- navegação ----------
  function irParaBusca() {
    setPagina('inicio');
    setTimeout(() => document.getElementById('busca-hero')?.focus(), 0);
  }

  function irParaPainel() {
    document.getElementById('painel-usuario')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="app">
      {/* ---------- topo ---------- */}
      <header className="topo">
        <div className="logo" onClick={() => setPagina('inicio')}>
          <BookOpen size={30} />
          <span>Biblioteca Virtual</span>
        </div>

        <nav className="nav-topo">
          {NAV.filter((n) => n.id !== 'meus').map((n) => (
            <button
              key={n.id}
              className={pagina === n.id ? 'nav-link ativo' : 'nav-link'}
              onClick={() => setPagina(n.id)}
            >
              {n.nome}
            </button>
          ))}
        </nav>

        <div className="topo-direita">
          <button className="icone-btn" onClick={irParaBusca} aria-label="Buscar">
            <Search size={20} />
          </button>
          <button className="btn-usuario" onClick={irParaPainel}>
            <User size={16} />
            {usuarioAtual ? usuarioAtual.nome : 'Entrar / Cadastrar'}
          </button>
        </div>
      </header>

      <div className="layout">
        {/* ---------- conteúdo principal ---------- */}
        <main className="principal">
          {pagina === 'inicio' && (
            <>
              <section className="hero">
                <span className="eyebrow">CONHECIMENTO AO SEU ALCANCE</span>
                <h1>Livros que te acompanham em todos os momentos.</h1>
                <p>
                  Explore nossa biblioteca virtual e descubra novos mundos, ideias e
                  histórias.
                </p>
                <form
                  className="hero-busca"
                  onSubmit={(e) => {
                    e.preventDefault();
                    buscarOpenLibrary(termoOL);
                  }}
                >
                  <Search size={18} />
                  <input
                    id="busca-hero"
                    placeholder="Buscar por título, autor ou categoria..."
                    value={termoOL}
                    onChange={(e) => setTermoOL(e.target.value)}
                  />
                  <button type="submit" className="btn-escuro" disabled={buscandoOL}>
                    {buscandoOL ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>
              </section>

              {rotuloResultados && (
                <section>
                  <div className="secao-cabecalho">
                    <h2>{rotuloResultados}</h2>
                    <button className="link" onClick={limparResultados}>
                      Limpar
                    </button>
                  </div>

                  {!buscandoOL && resultadosOL.length === 0 && (
                    <p className="vazio">Nenhum resultado encontrado.</p>
                  )}

                  <div className="grade">
                    {resultadosOL.map((r) => (
                      <Cartao
                        key={r.chave}
                        capa={r.capa}
                        titulo={r.titulo}
                        autor={r.autor}
                        detalhe={
                          <span className="meta">
                            {[r.ano, r.paginas && `${r.paginas} páginas`]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        }
                      >
                        <button
                          className="btn-escuro"
                          disabled={jaNaBiblioteca(r)}
                          onClick={() => importarLivro(r)}
                        >
                          {jaNaBiblioteca(r) ? 'Na biblioteca' : 'Adicionar'}
                        </button>
                      </Cartao>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="secao-cabecalho">
                  <h2>Categorias</h2>
                </div>
                <div className="categorias">
                  {CATEGORIAS.map((c) => {
                    const Icone = c.icone;
                    return (
                      <button
                        key={c.nome}
                        className="categoria"
                        onClick={() => buscarOpenLibrary(c.consulta, `Categoria: ${c.nome}`)}
                      >
                        <Icone size={26} strokeWidth={1.5} />
                        <span>{c.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="secao-cabecalho">
                  <h2>Destaques</h2>
                  <button className="link" onClick={() => setPagina('livros')}>
                    Ver todas →
                  </button>
                </div>

                {destaques.length === 0 ? (
                  <p className="vazio">Nenhum destaque disponível no momento.</p>
                ) : (
                  <div className="grade">
                    {destaques.map((d) =>
                      d.tipo === 'biblioteca' ? (
                        <Cartao
                          key={`b-${d.livro.id}`}
                          capa={d.livro.capa}
                          titulo={d.livro.titulo}
                          autor={d.livro.autor}
                        >
                          <button
                            className="btn-escuro"
                            onClick={() => abrirDetalhe(d.livro.id)}
                          >
                            Ver detalhes
                          </button>
                        </Cartao>
                      ) : (
                        <Cartao
                          key={`s-${d.livro.chave}`}
                          capa={d.livro.capa}
                          titulo={d.livro.titulo}
                          autor={d.livro.autor}
                        >
                          <button
                            className="btn-escuro"
                            onClick={() => importarLivro(d.livro)}
                          >
                            Adicionar
                          </button>
                        </Cartao>
                      )
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {pagina === 'livros' && (
            <section>
              <div className="secao-cabecalho">
                <h2>Livros</h2>
              </div>

              <input
                className="filtro"
                placeholder="Filtrar por título ou autor..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />

              {livrosFiltrados.length === 0 ? (
                <p className="vazio">Nenhum livro encontrado.</p>
              ) : (
                <div className="grade">
                  {livrosFiltrados.map((l) => (
                    <Cartao
                      key={l.id}
                      capa={l.capa}
                      titulo={l.titulo}
                      autor={l.autor}
                      detalhe={
                        <span className={l.disponivel ? 'selo ok' : 'selo indisponivel'}>
                          {l.disponivel ? 'Disponível' : 'Emprestado'}
                        </span>
                      }
                    >
                      <button className="btn-escuro" onClick={() => abrirDetalhe(l.id)}>
                        Ver detalhes
                      </button>
                    </Cartao>
                  ))}
                </div>
              )}

              <details className="manual">
                <summary>Cadastrar livro manualmente</summary>
                <form className="form-linha" onSubmit={cadastrarLivro}>
                  <input
                    placeholder="Título"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                  <input
                    placeholder="Autor"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-escuro">
                    Cadastrar
                  </button>
                </form>
              </details>
            </section>
          )}

          {pagina === 'meus' && (
            <section>
              <div className="secao-cabecalho">
                <h2>Meus empréstimos</h2>
              </div>

              {!usuarioAtual ? (
                <p className="vazio">Escolha um usuário no painel ao lado.</p>
              ) : meusLivros.length === 0 ? (
                <p className="vazio">{usuarioAtual.nome} não está com nenhum livro.</p>
              ) : (
                <div className="grade">
                  {meusLivros.map((l) => (
                    <Cartao key={l.id} capa={l.capa} titulo={l.titulo} autor={l.autor}>
                      <button className="btn-escuro" onClick={() => abrirDetalhe(l.id)}>
                        Ver detalhes
                      </button>
                    </Cartao>
                  ))}
                </div>
              )}
            </section>
          )}

          {pagina === 'historico' && (
            <section>
              <div className="secao-cabecalho">
                <h2>Histórico de empréstimos</h2>
              </div>

              {emprestimos.length === 0 ? (
                <p className="vazio">Nenhum empréstimo registrado ainda.</p>
              ) : (
                <table className="historico">
                  <thead>
                    <tr>
                      <th>Livro</th>
                      <th>Usuário</th>
                      <th>Saída</th>
                      <th>Devolução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emprestimos.map((e) => (
                      <tr key={e.id}>
                        <td>{e.titulo}</td>
                        <td>{e.usuario}</td>
                        <td>{formatarData(e.data_saida)}</td>
                        <td>
                          {e.data_devolucao ? (
                            formatarData(e.data_devolucao)
                          ) : (
                            <span className="indisponivel">Em aberto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </main>

        {/* ---------- barra lateral ---------- */}
        <aside className="lateral">
          <div className="painel" id="painel-usuario">
            <div className="perfil">
              <div className="avatar">
                <User size={30} />
              </div>
              <div>
                <strong>Olá, {usuarioAtual ? usuarioAtual.nome : 'visitante'}!</strong>
                <p>
                  {usuarioAtual
                    ? 'Você pode emprestar e devolver livros.'
                    : 'Escolha um usuário para emprestar livros.'}
                </p>
              </div>
            </div>

            <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              <option value="">Selecione um usuário</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>

            <button
              className="btn-contorno"
              onClick={() => setMostrarCadastro(!mostrarCadastro)}
            >
              {mostrarCadastro ? 'Cancelar' : 'Cadastrar usuário'}
            </button>

            {mostrarCadastro && (
              <form className="form-coluna" onSubmit={cadastrarUsuario}>
                <input
                  placeholder="Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-escuro">
                  Salvar
                </button>
              </form>
            )}

            <nav className="menu-lateral">
              {NAV.map((n) => {
                const Icone = n.icone;
                return (
                  <button
                    key={n.id}
                    className={pagina === n.id ? 'menu-item ativo' : 'menu-item'}
                    onClick={() => setPagina(n.id)}
                  >
                    <Icone size={18} />
                    {n.nome}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="painel">
            <h3>Sua biblioteca</h3>
            <div className="stat">
              <BookOpen size={26} strokeWidth={1.5} />
              <span>
                <strong>{livros.length}</strong> livros na biblioteca
              </span>
            </div>
            <div className="stat">
              <Users size={26} strokeWidth={1.5} />
              <span>
                <strong>{usuarios.length}</strong> leitores cadastrados
              </span>
            </div>
            <div className="stat">
              <Clock size={26} strokeWidth={1.5} />
              <span>
                <strong>{emprestadosAgora}</strong> livros emprestados agora
              </span>
            </div>
          </div>

          <div className="painel citacao">
            <span className="aspas">“</span>
            <p>Um livro é um sonho que você segura nas mãos.</p>
          </div>
        </aside>
      </div>

      {/* ---------- detalhes do livro ---------- */}
      {detalhe && (
        <div className="fundo-modal" onClick={fecharDetalhe}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="fechar" onClick={fecharDetalhe} aria-label="Fechar">
              <X size={20} />
            </button>

            {editando ? (
              <form className="form-coluna" onSubmit={salvarEdicao}>
                <h2>Editar livro</h2>
                <input
                  placeholder="Título"
                  value={edicao.titulo}
                  onChange={(e) => setEdicao({ ...edicao, titulo: e.target.value })}
                  required
                />
                <input
                  placeholder="Autor"
                  value={edicao.autor}
                  onChange={(e) => setEdicao({ ...edicao, autor: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Ano"
                  value={edicao.ano}
                  onChange={(e) => setEdicao({ ...edicao, ano: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Páginas"
                  value={edicao.paginas}
                  onChange={(e) => setEdicao({ ...edicao, paginas: e.target.value })}
                />
                <textarea
                  rows="5"
                  placeholder="Descrição"
                  value={edicao.descricao}
                  onChange={(e) => setEdicao({ ...edicao, descricao: e.target.value })}
                />
                <div className="acoes">
                  <button type="submit" className="btn-escuro">
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="btn-contorno"
                    onClick={() => setEditando(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="modal-conteudo">
                <div className="modal-capa">
                  {detalhe.capa ? (
                    <img src={detalhe.capa} alt={detalhe.titulo} />
                  ) : (
                    <div className="capa-vazia">
                      <BookOpen size={48} />
                    </div>
                  )}
                </div>

                <div className="modal-info">
                  <h2>{detalhe.titulo}</h2>
                  <p className="cartao-autor">{detalhe.autor}</p>
                  <p className="meta">
                    {[detalhe.ano, detalhe.paginas && `${detalhe.paginas} páginas`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  <p className="descricao-completa">
                    {detalhe.descricao ? limpar(detalhe.descricao) : 'Sem descrição.'}
                  </p>

                  <p>
                    {detalhe.disponivel ? (
                      <span className="selo ok">Disponível</span>
                    ) : (
                      <span className="selo indisponivel">
                        Emprestado para {quemPegou(detalhe.id)}
                      </span>
                    )}
                  </p>

                  <div className="acoes">
                    {detalhe.disponivel ? (
                      <button className="btn-escuro" onClick={() => emprestar(detalhe.id)}>
                        Emprestar
                      </button>
                    ) : (
                      <button className="btn-escuro" onClick={() => devolver(detalhe.id)}>
                        Devolver
                      </button>
                    )}
                    <button className="btn-contorno" onClick={() => iniciarEdicao(detalhe)}>
                      Editar
                    </button>
                    <button className="btn-perigo" onClick={() => excluirLivro(detalhe)}>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;