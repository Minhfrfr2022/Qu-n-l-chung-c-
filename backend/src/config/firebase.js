const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isFirebaseConfigured = false;
let firebaseAdmin = null;

try {
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(__dirname, '../../../serviceAccountKey.json'),
    path.resolve(__dirname, '../../serviceAccountKey.json'),
    path.resolve(__dirname, '../serviceAccountKey.json'),
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), '../serviceAccountKey.json'),
  ].filter(Boolean);

  const foundPath = candidatePaths.find((p) => fs.existsSync(p));

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

  const createCert = (certData) => {
    return admin.cert ? admin.cert(certData) : admin.credential.cert(certData);
  };

  if (projectId && clientEmail && privateKey) {
    firebaseAdmin = admin.initializeApp({
      credential: createCert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isFirebaseConfigured = true;
    console.log('Firebase Admin SDK initialized via Environment Variables.');
  } else if (foundPath) {
    const serviceAccount = require(foundPath);
    firebaseAdmin = admin.initializeApp({
      credential: createCert(serviceAccount),
    });
    isFirebaseConfigured = true;
    console.log(`Firebase Admin SDK initialized successfully via service account at: ${foundPath}`);
  } else {
    console.warn('Firebase credentials not found. FCM Push notifications will operate in Simulated Mode.');
  }
} catch (error) {
  console.warn('Firebase initialization warning:', error.message);
}

module.exports = { admin, firebaseAdmin, isFirebaseConfigured };
