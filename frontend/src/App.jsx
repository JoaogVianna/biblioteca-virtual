import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [livros, setLivros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [busca, setBusca] = useState('');
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');

  async function carregarLivros() {
    const url = busca ? `/livros?busca=${encodeURIComponent(busca)}` : '/livros';
    const resposta = await fetch(url);
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

  function atualizar() {
    carregarLivros();
    carregarEmprestimos();
  }

  useEffect(() => {
    carregarLivros();
    carregarUsuarios();
    carregarEmprestimos();
  }, []);

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

  async function emprestar(livroId) {
    if (!usuarioId) {
      alert('Escolha um usuário primeiro');
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

  function quemPegou(livroId) {
    const emprestimo = emprestimos.find(
      (e) => e.livro_id === livroId && !e.data_devolucao
    );
    return emprestimo ? emprestimo.usuario : '';
  }

  return (
    <div className="container">
      <h1>📚 Biblioteca Virtual</h1>

      <div className="busca">
        <input
          placeholder="Buscar por título ou autor"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button onClick={carregarLivros}>Buscar</button>
      </div>

      <h3>Quem está pegando emprestado?</h3>
      <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
        <option value="">Selecione um usuário</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>

      <h3>Novo livro</h3>
      <form onSubmit={cadastrarLivro}>
        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <input
          placeholder="Autor"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
        />
        <button type="submit">Cadastrar</button>
      </form>

      {livros.map((l) => (
        <div key={l.id} className="livro">
          <strong>{l.titulo}</strong> — {l.autor}
          <br />
          {l.disponivel ? (
            <>
              <span className="ok">Disponível</span>
              <button onClick={() => emprestar(l.id)}>Emprestar</button>
            </>
          ) : (
            <>
              <span className="indisponivel">
                Emprestado para {quemPegou(l.id)}
              </span>
              <button onClick={() => devolver(l.id)}>Devolver</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;