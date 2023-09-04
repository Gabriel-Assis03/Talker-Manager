const express = require('express');

const app = express();
const fs = require('fs/promises');
const crypto = require('crypto');
const validator = require('validator'); // biblioteca para validações

app.use(express.json());

const HTTP_OK_STATUS = 200;
const PORT = process.env.PORT || '3001';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

app.get('/talker', async (req, res) => {
  const data = await fs.readFile('./src/talker.json', { encoding: 'utf-8' });
  const talkers = JSON.parse(data);
  if (talkers) {
    res.status(200).json(talkers);
  } else {
    res.status(200).json([]);
  }
});

app.get('/talker/:id', async (req, res) => {
  const data = await fs.readFile('./src/talker.json', { encoding: 'utf-8' });
  const talkers = JSON.parse(data);
  const id = Number(req.params.id);
  const talker = talkers.find((t) => t.id === id);
  if (talker) {
    res.json(talker);
  } else {
    res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }
});

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  if (!password) return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  if (password.length < 6) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  next();
};

app.post('/login', validateLogin, (req, res) => {
  const token = crypto.randomBytes(8).toString('hex');
  res.status(200).json({ token });
});
