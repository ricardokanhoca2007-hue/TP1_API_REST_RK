const express = require('express');
const app = express();

const PORT = 3000;

app.use(express.json());


// FUNÇÃO PARA CRIAR ERROS NO FORMATO DO TP1

function problem(res, status, title, detail) {
    return res.status(status).type('application/problem+json').json({
        status,
        title,
        detail
    });
}


// VALIDAÇÃO DO ID

function parseId(idParam) {

    // Só aceitamos números inteiros escritos apenas com dígitos.

    if (!/^[0-9]+$/.test(idParam)) {
        return null;
    }

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}


// DADOS EM MEMÓRIA

const items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
];


// GET /api/items
// GET /api/items?name=...

app.get('/api/items', (req, res) => {

    const { name } = req.query;

    let result = [...items];

    // Filtro por nome
    if (name !== undefined) {

        if (typeof name !== 'string') {
            return problem(
                res,
                400,
                'Pedido inválido',
                'O parâmetro name é inválido'
            );
        }

        const term = name.trim().toLowerCase();

        result = result.filter(item =>
            item.name.toLowerCase().includes(term)
        );
    }

    return res.status(200).json(result);
});


// GET /api/items/:id

app.get('/api/items/:id', (req, res) => {

    const id = parseId(req.params.id);

    // Validação primeiro
    if (id === null) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O id deve ser um inteiro positivo'
        );
    }

    // Depois procuramos o recurso
    const item = items.find(item => item.id === id);

    if (!item) {
        return problem(
            res,
            404,
            'Não encontrado',
            `Não existe item com id ${id}`
        );
    }

    return res.status(200).json(item);
});


// POST /api/items


app.post('/api/items', (req, res) => {

    const { name } = req.body || {};

    // Validação do corpo
    if (typeof name !== 'string' || name.trim() === '') {
        return problem(
            res,
            400,
            'Pedido inválido',
            'name é obrigatório e deve ser texto não vazio'
        );
    }

    // Gerar novo ID no servidor
    const newItem = {
        id: items.length
            ? Math.max(...items.map(item => item.id)) + 1
            : 1,

        name: name.trim()
    };

    items.push(newItem);

    // Header Location exigido pelo enunciado
    res.location(`/api/items/${newItem.id}`);

    return res.status(201).json(newItem);
});


// PUT /api/items/:id

app.put('/api/items/:id', (req, res) => {

    const id = parseId(req.params.id);

    // 1. Validar ID
    if (id === null) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O id deve ser um inteiro positivo'
        );
    }

    // 2. Procurar recurso
    const item = items.find(item => item.id === id);

    if (!item) {
        return problem(
            res,
            404,
            'Não encontrado',
            `Não existe item com id ${id}`
        );
    }

    // 3. Validar corpo
    const { name } = req.body || {};

    if (typeof name !== 'string' || name.trim() === '') {
        return problem(
            res,
            400,
            'Pedido inválido',
            'name é obrigatório e deve ser texto não vazio'
        );
    }

    // 4. Atualizar
    item.name = name.trim();

    return res.status(200).json(item);
});


// DELETE /api/items/:id

app.delete('/api/items/:id', (req, res) => {

    const id = parseId(req.params.id);

    if (id === null) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O id deve ser um inteiro positivo'
        );
    }

    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
        return problem(
            res,
            404,
            'Não encontrado',
            `Não existe item com id ${id}`
        );
    }

    // Remover
    items.splice(index, 1);

    // 204 SEM corpo
    return res.status(204).send();
});

// RECURSO ADICIONAL — BOOKS
const books = [
    {
        id: 1,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        status: 'disponivel',
        createdEm: new Date().toISOString()
    },
    {
        id: 2,
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt',
        status: 'emprestado',
        createdEm: new Date().toISOString()
    }
];

const allowedBookStatuses = ['disponivel', 'emprestado'];

// GET /api/books

app.get('/api/books', (req, res) => {

    return res.status(200).json(books);
});


// GET /api/books/:id

app.get('/api/books/:id', (req, res) => {

    const id = parseId(req.params.id);

    if (id === null) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O id deve ser um inteiro positivo'
        );
    }

    const book = books.find(book => book.id === id);

    if (!book) {
        return problem(
            res,
            404,
            'Não encontrado',
            `Não existe livro com id ${id}`
        );
    }

    return res.status(200).json(book);
});

// =====================================================
// POST /api/books
// =====================================================

app.post('/api/books', (req, res) => {

    const { title, author, status } = req.body || {};

    // Validar dados obrigatórios
    if (
        typeof title !== 'string' ||
        title.trim() === '' ||
        typeof author !== 'string' ||
        author.trim() === '' ||
        typeof status !== 'string'
    ) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'title, author e status são obrigatórios'
        );
    }

    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanStatus = status.trim().toLowerCase();

    // Validar valores permitidos para status
    if (!allowedBookStatuses.includes(cleanStatus)) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'status deve ser "disponivel" ou "emprestado"'
        );
    }

    // Verificar título duplicado
    const duplicate = books.some(book =>
        book.title.toLowerCase() === cleanTitle.toLowerCase()
    );

    if (duplicate) {
        return problem(
            res,
            409,
            'Conflito',
            `Já existe um livro com o título "${cleanTitle}"`
        );
    }

    // Gerar ID no servidor
    const newBook = {
        id: books.length
            ? Math.max(...books.map(book => book.id)) + 1
            : 1,

        title: cleanTitle,
        author: cleanAuthor,
        status: cleanStatus,

        // Gerado pelo servidor
        createdEm: new Date().toISOString()
    };

    books.push(newBook);

    // Location
    res.location(`/api/books/${newBook.id}`);

    return res.status(201).json(newBook);
});


// PUT /api/books/:id

app.put('/api/books/:id', (req, res) => {

    const id = parseId(req.params.id);

    if (id === null) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O id deve ser um inteiro positivo'
        );
    }

    const book = books.find(book => book.id === id);
    if (!book) {
        return problem(
            res,
            404,
            'Não encontrado',
            `Não existe livro com id ${id}`
        );
    }

    const { title, author, status } = req.body || {};
    if (
        typeof title !== 'string' ||
        title.trim() === '' ||
        typeof author !== 'string' ||
        author.trim() === '' ||
        typeof status !== 'string'
    ) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'title, author e status são obrigatórios'
        );
    }

    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanStatus = status.trim().toLowerCase();

    if (!allowedBookStatuses.includes(cleanStatus)) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'status deve ser "disponivel" ou "emprestado"'
        );
    }

    // Não pode existir outro livro com o mesmo título
    const duplicate = books.some(otherBook =>
        otherBook.id !== id &&
        otherBook.title.toLowerCase() === cleanTitle.toLowerCase()
    );

    if (duplicate) {
        return problem(
            res,
            409,
            'Conflito',
            `Já existe um livro com o título "${cleanTitle}"`
        );
    }

    // Atualizar os campos permitidos
    book.title = cleanTitle;
    book.author = cleanAuthor;
    book.status = cleanStatus;

    // createdEm NÃO é alterado

    return res.status(200).json(book);
});


// DELETE /api/books/:id

app.delete('/api/books/:id', (req, res) => {

    const id = parseId(req.params.id);

    if (id === null) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O id deve ser um inteiro positivo'
        );
    }

    const index = books.findIndex(book => book.id === id);

    if (index === -1) {
        return problem(
            res,
            404,
            'Não encontrado',
            `Não existe livro com id ${id}`
        );
    }

    books.splice(index, 1);

    return res.status(204).send();
});


// ROTA DESCONHECIDA

app.use((req, res) => {

    return problem(
        res,
        404,
        'Não encontrado',
        `A rota ${req.method} ${req.originalUrl} não existe`
    );
});


// TRATAMENTO DE ERROS

// JSON malformado ou outros erros do Express
app.use((err, req, res, next) => {

    // JSON malformado
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return problem(
            res,
            400,
            'Pedido inválido',
            'O corpo contém JSON malformado'
        );
    }

    // Erro inesperado
    console.error(err);

    return problem(
        res,
        500,
        'Erro interno',
        'O servidor encontrou um erro inesperado'
    );
});


// ARRANQUE DA API

app.listen(PORT, () => {
    console.log(`API a executar em http://localhost:${PORT}`);
});