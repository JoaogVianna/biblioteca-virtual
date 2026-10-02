const express = require('express');
const db = require('../db');

const router = express.Router();
const HEADERS = { 'User-Agent': 'BibliotecaVirtual/1.0' };
const CAMPOS = 'key,title,author_name,first_publish_year,number_of_pages_median,cover_i';

// Livros que aparecem como sugestão nos Destaques (troque pelos que quiser)
const TITULOS_DESTAQUE = [
  'o pequeno príncipe',
  'sapiens uma breve história da humanidade',
  '1984 george orwell',
  'dom casmurro machado de assis',
  'o hobbit',
  'a revolução dos bichos',
  'orgulho e preconceito',
  'o alquimista',
];

let cacheDestaques = { livros: [], expira: 0 };

async function buscar(q, limite = 10) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limite}&fields=${CAMPOS}`;

  const resposta = await fetch(url, { headers: HEADERS });
  if (!resposta.ok) throw new Error(`status ${resposta.status}`);

  const dados = await resposta.json();

  return dados.docs.map((d) => ({
    chave: d.key,
    titulo: d.title,
    autor: d.author_name ? d.author_name[0] : 'Autor desconhecido',
    ano: d.first_publish_year ?? null,
    paginas: d.number_of_pages_median ?? null,
    capa: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
  }));
}

// Buscar livros reais na Open Library
router.get('/buscar', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ erro: 'Informe o parâmetro q' });
  }

  try {
    res.json(await buscar(q, 10));
  } catch (e) {
    res.status(502).json({ erro: 'Não foi possível consultar a Open Library' });
  }
});

// Sugestões para a seção Destaques (guardadas em memória por 1 hora)
router.get('/destaques', async (req, res) => {
  if (Date.now() < cacheDestaques.expira) {
    return res.json(cacheDestaques.livros);
  }

  const resultados = await Promise.all(
    TITULOS_DESTAQUE.map(async (titulo) => {
      try {
        const lista = await buscar(titulo, 5);
        // pega o primeiro resultado que tenha capa
        return lista.find((l) => l.capa) ?? null;
      } catch (e) {
        return null;
      }
    })
  );

  const livros = resultados.filter(Boolean);

  if (livros.length > 0) {
    cacheDestaques = { livros, expira: Date.now() + 60 * 60 * 1000 };
  }

  res.json(livros);
});

// Importar um livro: busca a descrição e salva no banco
router.post('/importar', async (req, res) => {
  const { chave, titulo, autor, ano, paginas, capa } = req.body;

  if (!chave || !titulo || !autor) {
    return res.status(400).json({ erro: 'chave, titulo e autor são obrigatórios' });
  }

  // a chave tem que ter o formato /works/OL123W
  if (!/^\/works\/OL\d+W$/.test(chave)) {
    return res.status(400).json({ erro: 'chave inválida' });
  }

  let descricao = null;

  try {
    const resposta = await fetch(`https://openlibrary.org${chave}.json`, { headers: HEADERS });

    if (resposta.ok) {
      const obra = await resposta.json();
      const d = obra.description;
      // a descrição pode vir como texto ou como { type, value }
      descricao = typeof d === 'string' ? d : d?.value ?? null;
    }
  } catch (e) {
    // sem descrição, o livro é salvo mesmo assim
  }

  const info = db
    .prepare(
      `INSERT INTO livros (titulo, autor, ano, descricao, paginas, capa)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(titulo, autor, ano ?? null, descricao, paginas ?? null, capa ?? null);

  res.status(201).json({ id: info.lastInsertRowid, titulo, autor, ano, descricao, paginas, capa });
});

module.exports = router;