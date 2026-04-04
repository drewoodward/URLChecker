const express = require('express');
const cors = require('cors');
const { admin, db } = require('./firebase');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.post('/check', async (req, res) => {
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

  let scanId = null;
  try {
    const scanRef = await db.collection('scans').add({
      url: cleanUrl,
      is_malicious: is_malicious,
      confidence: confidence,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    scanId = scanRef.id;
    console.log(`Scan logged to Firebase with ID: ${scanId}`);
  } catch (error) {
    console.error('Failed to log scan to Firebase:', error);
    // Continuing to send the response even if logging fails, to prevent client disruption
  }

  res.json({
    is_malicious,
    confidence,
    scanId
  });
});

app.get('/history', async (req, res) => {
  try {
    const historySnapshot = await db.collection('scans')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
      
    const history = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(history);
  } catch (error) {
    console.error('Failed to fetch scan history:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});