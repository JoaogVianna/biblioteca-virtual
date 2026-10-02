const express = require('express');
const db = require('../db');

const router = express.Router();

// Listar livros (com busca opcional: /livros?busca=casmurro)
router.get('/', (req, res) => {
  const { busca } = req.query;

  if (busca) {
    const livros = db
      .prepare('SELECT * FROM livros WHERE titulo LIKE ? OR autor LIKE ?')
      .all(`%${busca}%`, `%${busca}%`);
    return res.json(livros);
  }

  res.json(db.prepare('SELECT * FROM livros').all());
});

// Cadastrar livro
// Cadastrar livro
router.post('/', (req, res) => {
  const { titulo, autor, genero, ano, descricao, paginas, capa } = req.body;

  if (!titulo || !autor) {
    return res.status(400).json({ erro: 'titulo e autor são obrigatórios' });
  }

  const info = db
    .prepare(
      `INSERT INTO livros (titulo, autor, genero, ano, descricao, paginas, capa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(titulo, autor, genero ?? null, ano ?? null, descricao ?? null, paginas ?? null, capa ?? null);

  res.status(201).json({ id: info.lastInsertRowid, titulo, autor, genero, ano, descricao, paginas, capa });
});

module.exports = router;

// Buscar um livro pelo id
router.get('/:id', (req, res) => {
  const livro = db.prepare('SELECT * FROM livros WHERE id = ?').get(req.params.id);

  if (!livro) {
    return res.status(404).json({ erro: 'Livro não encontrado' });
  }

  res.json(livro);
});

// Editar livro (só atualiza os campos enviados)
router.put('/:id', (req, res) => {
  const { titulo, autor, genero, ano, descricao, paginas, capa } = req.body;

  const info = db
    .prepare(
      `UPDATE livros
       SET titulo = COALESCE(?, titulo),
           autor = COALESCE(?, autor),
           genero = COALESCE(?, genero),
           ano = COALESCE(?, ano),
           descricao = COALESCE(?, descricao),
           paginas = COALESCE(?, paginas),
           capa = COALESCE(?, capa)
       WHERE id = ?`
    )
    .run(
      titulo ?? null,
      autor ?? null,
      genero ?? null,
      ano ?? null,
      descricao ?? null,
      paginas ?? null,
      capa ?? null,
      req.params.id
    );

  if (info.changes === 0) {
    return res.status(404).json({ erro: 'Livro não encontrado' });
  }

  res.json(db.prepare('SELECT * FROM livros WHERE id = ?').get(req.params.id));
});

// Regra de exclusão dentro de uma transação
const excluirLivro = db.transaction((id) => {
  const livro = db.prepare('SELECT id FROM livros WHERE id = ?').get(id);
  if (!livro) return { status: 404, erro: 'Livro não encontrado' };

  const aberto = db
    .prepare('SELECT id FROM emprestimos WHERE livro_id = ? AND data_devolucao IS NULL')
    .get(id);
  if (aberto) {
    return { status: 409, erro: 'Livro está emprestado. Devolva antes de excluir.' };
  }

  db.prepare('DELETE FROM emprestimos WHERE livro_id = ?').run(id);
  db.prepare('DELETE FROM livros WHERE id = ?').run(id);
  return { status: 204 };
});

// Deletar livro
router.delete('/:id', (req, res) => {
  const r = excluirLivro(req.params.id);

  if (r.erro) {
    return res.status(r.status).json({ erro: r.erro });
  }

  res.status(204).end();
});