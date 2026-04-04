const admin = require('firebase-admin');

if (process.env.NODE_ENV === 'production') {
  // In Google Cloud Run, it automatically authenticates using the built-in service account!
  admin.initializeApp();
} else {
  // For local development, use the downloaded JSON key
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// export Firestore database instance, specifying the databaseId for the new native mode database
const db = admin.firestore();
db.settings({
  databaseId: "urlchecker-db"
});

module.exports = { admin, db };