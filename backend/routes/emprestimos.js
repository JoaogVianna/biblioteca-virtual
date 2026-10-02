const express = require('express');
const db = require('../db');

const router = express.Router();

// Listar empréstimos (com título do livro e nome do usuário)
router.get('/', (req, res) => {
  const emprestimos = db
    .prepare(
      `SELECT e.*, l.titulo, u.nome AS usuario
       FROM emprestimos e
       JOIN livros l ON l.id = e.livro_id
       JOIN usuarios u ON u.id = e.usuario_id
       ORDER BY e.id DESC`
    )
    .all();

  res.json(emprestimos);
});

// Regra do empréstimo dentro de uma transação
const emprestar = db.transaction((livro_id, usuario_id) => {
  const livro = db.prepare('SELECT * FROM livros WHERE id = ?').get(livro_id);
  if (!livro) return { status: 404, erro: 'Livro não encontrado' };
  if (!livro.disponivel) return { status: 409, erro: 'Livro já está emprestado' };

  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(usuario_id);
  if (!usuario) return { status: 404, erro: 'Usuário não encontrado' };

  const info = db
    .prepare('INSERT INTO emprestimos (livro_id, usuario_id) VALUES (?, ?)')
    .run(livro_id, usuario_id);

  db.prepare('UPDATE livros SET disponivel = 0 WHERE id = ?').run(livro_id);

  return { status: 201, id: info.lastInsertRowid };
});

// Registrar empréstimo
router.post('/', (req, res) => {
  const { livro_id, usuario_id } = req.body;

  if (!livro_id || !usuario_id) {
    return res.status(400).json({ erro: 'livro_id e usuario_id são obrigatórios' });
  }

  const r = emprestar(livro_id, usuario_id);

  if (r.erro) {
    return res.status(r.status).json({ erro: r.erro });
  }

  res.status(201).json({ id: r.id, livro_id, usuario_id });
});

// Regra da devolução dentro de uma transação
const devolver = db.transaction((id) => {
  const emp = db.prepare('SELECT * FROM emprestimos WHERE id = ?').get(id);
  if (!emp) return { status: 404, erro: 'Empréstimo não encontrado' };
  if (emp.data_devolucao) return { status: 409, erro: 'Livro já foi devolvido' };

  db.prepare("UPDATE emprestimos SET data_devolucao = datetime('now') WHERE id = ?").run(id);
  db.prepare('UPDATE livros SET disponivel = 1 WHERE id = ?').run(emp.livro_id);

  return { status: 200 };
});

// Registrar devolução
router.put('/:id/devolver', (req, res) => {
  const r = devolver(req.params.id);

  if (r.erro) {
    return res.status(r.status).json({ erro: r.erro });
  }

  res.json({ mensagem: 'Livro devolvido com sucesso' });
});

module.exports = router;