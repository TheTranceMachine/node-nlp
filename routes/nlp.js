const express = require('express');
const aposToLexForm = require('apos-to-lex-form');
const natural = require('natural');
const stopWords = require('stopword');
const dictionary = require('dictionary-en');
const nspell = require('nspell');
const cors = require('cors');
const helmet = require('helmet');

const router = express.Router();

router.use(cors());
router.use(helmet());

router.post('/s-analyzer', (req, res, next) => {
  const { review } = req.body;
  // convert contractions (e.g., I’m) to standard lexicon (i.e., I am)
  const lexedReview = aposToLexForm(review);
  const casedReview = lexedReview.toLowerCase();
  // remove special characters and numerical tokens. 
  // text data with only alphabetical characters.
  const alphaOnlyReview = casedReview.replace(/[^a-zA-Z\s]+/g, '');
  // process of splitting text into its individual meaningful units
  const { WordTokenizer } = natural;
  const tokenizer = new WordTokenizer();
  const tokenizedReview = tokenizer.tokenize(alphaOnlyReview);
  // use the nspell and dictionary to correct misspelled words
  tokenizedReview.forEach((word, index) => {
    const ondictionary = (err, dict) => {
      if (err) throw err;

      const spell = nspell(dict);
      const isCorrect = spell.correct(word);
      if (!isCorrect) tokenizedReview[index] = spell.suggest(word);
    }
    dictionary(ondictionary);
  });
  // remove stop words include 'but, a, or, and what'
  const filteredReview = stopWords.removeStopwords(tokenizedReview);

  /* For example, the word “good” has a polarity of 3, while “bad” has a polarity of -3. 
  The algorithm does its sentiment calculation by summing the polarity of each word in a piece of text 
  and normalizing with the length of a sentence
  */
  const { SentimentAnalyzer, PorterStemmer } = natural;
  const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
  const analysis = analyzer.getSentiment(filteredReview);

  res.status(200).json({ analysis });
});

module.exports = router;