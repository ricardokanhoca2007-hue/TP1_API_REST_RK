const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;

const items = [
    { id: 1, name: 'Item 1'},
    { id: 2, name: 'Item 2'}
];

app.get('/api/items', (req, res) => {
  const { name, sort, order, page, limit } = req.query;

  let result = [...items];

  if (name !== undefined) {
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Parâmetro name inválido' });
    }
    const term = name.trim().toLowerCase();
    result = result.filter(item =>
      item.name.toLowerCase().includes(term)
    );
  }

  if (sort) {
    if (sort !== 'id' && sort !== 'name') {
      return res.status(400).json({ error: 'Parâmetro sort inválido. Utilize "id" ou "name"' });
    }
    const orderDir = (order && order.toLowerCase() === 'desc') ? -1 : 1;
    result.sort((a, b) => {
      if (a[sort] < b[sort]) return -1 * orderDir;
      if (a[sort] > b[sort]) return 1 * orderDir;
      return 0;
    });
  }

  if (page !== undefined || limit !== undefined) {
    const pageNum = Number(page || 1);
    const limitNum = Number(limit || 10);

    if (!Number.isInteger(pageNum) || pageNum < 1 || 
    !Number.isInteger(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Parâmetros de paginação inválidos. Use inteiros positivos.' });
    }
    const total = result.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = result.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      page: pageNum,
      limit: limitNum,
      total,
      items: paginatedItems
    });
  }

  res.status(200).json(result);
});

app.get(`/api/items/:id`, (req, res) => {
    const id = Number(req.params.id);
   
    if (!Number.isInteger(id) || id <= 0) {
     return res.status(400).json({
       error: 'id inválido'
     });
    }

    const item = items.find(item => item.id === id);

    if (!item) {
     return res.status(404).json({
       error: 'Item não encontrado'
     });
    }

    res.status(200).json(item);
});

app.post('/api/items', (req, res) => {
    const { name} = req.body || {};

    if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
        error: 'name é obrigatório e deve ser texto não vazio'
        });
    }

    const newItem = {
        id: items.length
        ? Math.max(...items.map(item => item.id)) + 1
        : 1,
        name: name.trim()
    };
    items.push(newItem);

    res.status(201).json(newItem);
})

app.put('/api/items/:id', (req, res) => {
    const id = Number(req.params.id);
  
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'id inválido' });
    }
    const item = items.find(item => item.id === id);

    if(!item){
        return res.status(404).json({ error: 'Item não encontrado' });
    }
    const { name } = req.body || {};  
    if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
        error: 'name é obrigatório e deve ser texto não vazio'
        });
    }
    item.name = name.trim();
    res.status(200).json(item);
});
app.delete('/api/items/:id', (req,res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'id inválido' });
    }
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Item não encontrado' });
    }
    items.splice(index, 1);
    res.status(204).send();
});
app.listen(PORT, () => {
    console.log(`API a executar em http://localhost:${PORT}`);
});