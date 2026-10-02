const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API da Biblioteca Virtual funcionando!' });
});

app.use('/livros', require('./routes/livros'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/emprestimos', require('./routes/emprestimos'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});