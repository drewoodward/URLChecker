const express = require('express');
const cors = require('cors');
const { admin, db } = require('./firebase');

const app = express();
const PORT = process.env.PORT || 8000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://urlchecker-ml-758639415294.us-east4.run.app';
const URLHAUS_API_KEY = process.env.URLHAUS_API_KEY;

app.use(cors());
app.use(express.json());

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function checkURLhaus(url) {
  try {
    const params = new URLSearchParams({ url });
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: {
        'Auth-Key': URLHAUS_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.query_status !== 'ok') {
      return { found: false, queryStatus: data.query_status };
    }

    return {
      found: true,
      status: data.url_status,
      threat: data.threat,
      tags: data.tags || [],
      dateAdded: data.date_added,
      blacklists: data.blacklists,
      payloads: data.payloads || [],
      reference: data.urlhaus_reference,
    };
  } catch (err) {
    console.error('URLhaus lookup failed:', err.message);
    return null;
  }
}

app.post('/check', async (req, res) => {
  const { url } = req.body || {};


  if (!url || !url.trim()) {
    return res.status(400).json({
      error: 'URL is required'
    });
  }

  const cleanUrl = url.trim();

  if (!isValidUrl(cleanUrl)) {
    return res.status(400).json({
      error: 'Invalid URL'
    });
  }

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

  const urlhausData = await checkURLhaus(cleanUrl);

  let scanId = null;
  try {
    const scanRef = await db.collection('scans').add({
      url: cleanUrl,
      is_malicious: is_malicious,
      confidence: confidence,
      urlhaus: urlhausData,
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
    scanId,
    urlhaus: urlhausData,
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