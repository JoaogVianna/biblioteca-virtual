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
router.post('/', (req, res) => {
  const { titulo, autor, genero, ano } = req.body;

  if (!titulo || !autor) {
    return res.status(400).json({ erro: 'titulo e autor são obrigatórios' });
  }

  const info = db
    .prepare('INSERT INTO livros (titulo, autor, genero, ano) VALUES (?, ?, ?, ?)')
    .run(titulo, autor, genero ?? null, ano ?? null);

  res.status(201).json({ id: info.lastInsertRowid, titulo, autor, genero, ano });
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
  const { titulo, autor, genero, ano } = req.body;

  const info = db
    .prepare(
      `UPDATE livros
       SET titulo = COALESCE(?, titulo),
           autor = COALESCE(?, autor),
           genero = COALESCE(?, genero),
           ano = COALESCE(?, ano)
       WHERE id = ?`
    )
    .run(titulo ?? null, autor ?? null, genero ?? null, ano ?? null, req.params.id);

  if (info.changes === 0) {
    return res.status(404).json({ erro: 'Livro não encontrado' });
  }

  res.json(db.prepare('SELECT * FROM livros WHERE id = ?').get(req.params.id));
});

// Deletar livro
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM livros WHERE id = ?').run(req.params.id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado' });
    }

    res.status(204).end();
  } catch (e) {
    res.status(409).json({ erro: 'Livro possui empréstimos registrados' });
  }
});
