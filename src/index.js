const express = require('express');

const app = express();
const fs = require('fs/promises');
const crypto = require('crypto');
const validator = require('validator'); // biblioteca para validações

app.use(express.json());

const HTTP_OK_STATUS = 200;
const PORT = process.env.PORT || '3001';
let talkers1 = '';

const getTalkers = async () => {
  const data = await fs.readFile('./src/talker.json', { encoding: 'utf-8' });
  talkers1 = JSON.parse(data);
  return talkers1;
};

const validToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json(
      { message: 'Token não encontrado' },
    ); 
  }
  if (req.headers.authorization.length !== 16) {
    return res.status(401).json(
      { message: 'Token inválido' },
    ); 
  }
  next();
};

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

app.get('/talker', async (req, res) => {
  const talkers = await getTalkers();
  if (talkers) {
    res.status(200).json(talkers);
  } else {
    res.status(200).json([]);
  }
});

app.get('/talker/search', validToken, async (req, res) => {
  const talkers = await getTalkers();
  const sea = req.query.q;
  const talker = talkers.filter((t) => t.name.includes(sea));
  if (talker) {
    res.status(200).json(talker);
  } else {
    res.sendStatus(404);
  }
});

app.get('/talker/:id', async (req, res) => {
  const talkers = await getTalkers();
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

const validName = (req, res, next) => {
  if (!req.body.name) return res.status(400).json({ message: 'O campo "name" é obrigatório' });
  if (req.body.name.length < 3) {
    return res.status(400).json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }
  next();
};

function isInteger(value) {
  return typeof value === 'number' && Math.floor(value) === value;
}

const validAge = (req, res, next) => {
  if (!req.body.age) return res.status(400).json({ message: 'O campo "age" é obrigatório' });
  if (req.body.age < 18 || !isInteger(req.body.age)) {
    return res.status(400).json(
      { message: 'O campo "age" deve ser um número inteiro igual ou maior que 18' },
    );
  }
  next();
};

function isValidDateFormat(dateString) {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  return regex.test(dateString);
}

const validWatchedAt = (req, res, next) => {
  if (!req.body.talk.watchedAt) {
 return res.status(400).json(
    { message: 'O campo "watchedAt" é obrigatório' },
  ); 
}
  if (!isValidDateFormat(req.body.talk.watchedAt)) {
    return res.status(400).json(
      { message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' },
    );
  }
  next();
};

const validRate = (req, res, next) => {
  if (!req.body.talk.rate) return res.status(400).json({ message: 'O campo "rate" é obrigatório' });
  if (req.body.talk.rate > 5 || req.body.talk.rate < 1 || !isInteger(req.body.talk.rate)) {
    return res.status(400).json(
      { message: 'O campo "rate" deve ser um número inteiro entre 1 e 5' },
    );
  }
  next();
};

const validateTalker = (req, res, next) => {
  const { talk } = req.body;
  if (!talk) return res.status(400).json({ message: 'O campo "talk" é obrigatório' });
  const { rate } = talk;
  if (rate === 0) { 
    return res.status(400).json(
      { message: 'O campo "rate" deve ser um número inteiro entre 1 e 5' },
    ); 
  }
  next();
};

app.post('/talker', validToken, validateTalker, validName, validAge, validRate, 
validWatchedAt, async (req, res) => {
  await getTalkers();
  const id = talkers1.length + 1;
  const talker = { id, ...req.body };
  talkers1.push(talker);
  const talk = JSON.stringify(talkers1, null, 2);
  await fs.writeFile('./src/talker.json', talk);
  res.status(201).json(talker);
});

app.put('/talker/:id', validToken, validateTalker, validName, validAge, validRate, 
validWatchedAt, async (req, res) => {
  const id = Number(req.params.id);
  const talker = talkers1.find((t) => t.id === id);
  if (talker) {
    const index = talkers1.indexOf(talker);
    const updated = { id, ...req.body };
    talkers1.splice(index, 1, updated);
    const talk = JSON.stringify(talkers1, null, 2);
    await fs.writeFile('./src/talker.json', talk);
    res.status(200).json(updated);
  } else {
    res.status(404).json(
      { message: 'Pessoa palestrante não encontrada' },
    );
  }
});

app.delete('/talker/:id', validToken, async (req, res) => {
  getTalkers();
  const id = Number(req.params.id);
  const talker = talkers1.find((t) => t.id === id);
  if (talker) {
    const index = talkers1.indexOf(talker);
    talkers1.splice(index, 1);
    const talk = JSON.stringify(talkers1, null, 2);
    await fs.writeFile('./src/talker.json', talk);
  }
  res.sendStatus(204);
});
