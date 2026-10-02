const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.use('/livros', require('./routes/livros'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/emprestimos', require('./routes/emprestimos'));
app.use('/openlibrary', require('./routes/openlibrary'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});