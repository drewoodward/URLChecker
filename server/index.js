const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.post('/check', (req, res) => {
  const { url } = req.body || {};


  if (!url || !url.trim()) {
    return res.status(400).json({
      error: 'URL is required'
    });
  }

  const cleanUrl = url.trim();

  //bs temp testing
  const is_malicious = cleanUrl.includes('bad');

  let confidence;

  //bs temp testing
  if (is_malicious) {
    confidence = 0.9;
  } else {
    confidence = 0.1;
  }


  res.json({
    is_malicious,
    confidence
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});