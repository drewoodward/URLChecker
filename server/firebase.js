const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// export Firestore database instance
const db = admin.firestore();

module.exports = { admin, db };