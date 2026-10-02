# 📚 Biblioteca Virtual

Projeto de estudo: uma biblioteca virtual com banco de dados, API REST e front-end em React.
Dá pra cadastrar livros e usuários, buscar livros reais na Open Library (com capa, páginas e descrição), emprestar, devolver e ver o histórico de empréstimos.

## Tecnologias

- **Back-end:** Node.js, Express, SQLite (better-sqlite3)
- **Front-end:** React (Vite)
- **Dados de livros:** [Open Library API](https://openlibrary.org/dev/docs/api/search) (gratuita, sem chave)

## Estrutura

```
biblioteca-virtual/
├── backend/     API Express + banco SQLite
└── frontend/    Interface em React
```

## Como rodar

Precisa do Node.js 18 ou superior.

```bash
# 1. instalar as dependências (uma vez só)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. rodar back-end e front-end juntos
npm run dev
```

- API: http://localhost:3000
- Front-end: http://localhost:5173

O arquivo `backend/biblioteca.db` é criado automaticamente na primeira execução.

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/livros` | Lista livros (aceita `?busca=`) |
| GET | `/livros/:id` | Busca um livro |
| POST | `/livros` | Cadastra um livro |
| PUT | `/livros/:id` | Edita um livro |
| DELETE | `/livros/:id` | Exclui um livro (não pode estar emprestado) |
| GET | `/usuarios` | Lista usuários |
| POST | `/usuarios` | Cadastra um usuário |
| GET | `/emprestimos` | Lista empréstimos (histórico) |
| POST | `/emprestimos` | Registra um empréstimo |
| PUT | `/emprestimos/:id/devolver` | Registra a devolução |
| GET | `/openlibrary/buscar?q=` | Busca livros na Open Library |
| POST | `/openlibrary/importar` | Importa um livro (com descrição) pro banco |

## Regras do sistema

- Um livro emprestado não pode ser emprestado de novo até ser devolvido.
- Um livro emprestado não pode ser excluído. Ao excluir um livro, o histórico de empréstimos dele também é apagado.
- Os dados da Open Library são colaborativos, então descrições e autores podem ter erros ou faltar.

## Ideias para evoluir

- Login de usuários
- Multa por atraso
- Paginação da lista de livros
- Trocar o SQLite por PostgreSQL