const express = require('express');
const logger = require('morgan');

const nlpRouter = require('./routes/nlp');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/nlp', nlpRouter);

module.exports = app;
