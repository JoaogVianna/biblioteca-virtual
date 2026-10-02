const Database = require('better-sqlite3');

const db = new Database('biblioteca.db');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS livros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    autor TEXT NOT NULL,
    genero TEXT,
    ano INTEGER,
    disponivel INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS emprestimos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    livro_id INTEGER NOT NULL REFERENCES livros(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    data_saida TEXT NOT NULL DEFAULT (datetime('now')),
    data_devolucao TEXT
  );
`);

// Migração: adiciona colunas novas sem perder os livros já cadastrados
const colunas = db.prepare('PRAGMA table_info(livros)').all().map((c) => c.name);
if (!colunas.includes('descricao')) db.exec('ALTER TABLE livros ADD COLUMN descricao TEXT');
if (!colunas.includes('paginas')) db.exec('ALTER TABLE livros ADD COLUMN paginas INTEGER');
if (!colunas.includes('capa')) db.exec('ALTER TABLE livros ADD COLUMN capa TEXT');

module.exports = db;