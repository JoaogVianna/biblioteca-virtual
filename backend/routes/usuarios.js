const express = require('express');
const db = require('../db');

const router = express.Router();

// Listar usuários
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM usuarios').all());
});

// Buscar um usuário pelo id
router.get('/:id', (req, res) => {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  res.json(usuario);
});

// Cadastrar usuário
router.post('/', (req, res) => {
  const { nome, email } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ erro: 'nome e email são obrigatórios' });
  }

  try {
    const info = db
      .prepare('INSERT INTO usuarios (nome, email) VALUES (?, ?)')
      .run(nome, email);

    res.status(201).json({ id: info.lastInsertRowid, nome, email });
  } catch (e) {
    res.status(409).json({ erro: 'Email já cadastrado' });
  }
});

module.exports = router;