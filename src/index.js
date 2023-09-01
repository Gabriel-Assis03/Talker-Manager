const express = require('express');

const app = express();
const fs = require('fs/promises');

app.use(express.json());

const HTTP_OK_STATUS = 200;
const PORT = process.env.PORT || '3001';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
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

app.listen(PORT, () => {
  console.log('Online');
});
