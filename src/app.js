const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'BarberBook API funcionando correctamente',
  });
});

module.exports = app;