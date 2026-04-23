const express = require('express');
const cors = require('cors');
const { admin, db } = require('./firebase');

const app = express();
const PORT = process.env.PORT || 8000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://urlchecker-ml-758639415294.us-east4.run.app';

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

  let is_malicious;
  let confidence;
  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl })
    });
    if (!mlRes.ok) throw new Error(`ML service returned ${mlRes.status}`);
    const prediction = await mlRes.json();
    is_malicious = prediction.is_malicious;
    confidence = prediction.confidence;
  } catch (err) {
    console.error('ML service call failed:', err);
    return res.status(502).json({ error: 'Prediction service unavailable' });
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