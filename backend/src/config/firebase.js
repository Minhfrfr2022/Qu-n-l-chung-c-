const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isFirebaseConfigured = false;
let firebaseAdmin = null;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../../serviceAccountKey.json');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

  if (projectId && clientEmail && privateKey) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isFirebaseConfigured = true;
    console.log('Firebase Admin SDK initialized via Environment Variables.');
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseConfigured = true;
    console.log('Firebase Admin SDK initialized via serviceAccountKey.json.');
  } else {
    console.warn('Firebase credentials not found. FCM Push notifications will operate in Simulated Mode.');
  }
} catch (error) {
  console.warn('Firebase initialization warning:', error.message);
}

module.exports = { admin, firebaseAdmin, isFirebaseConfigured };
