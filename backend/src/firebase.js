const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const projectId = process.env.FIREBASE_PROJECT_ID;
process.env.DATA_MODE ||= 'local';
if (process.env.DATA_MODE === 'local') {
  require('../scripts/import-local').importLocal();
  module.exports = { ...require('./local-db'), auth: null };
} else {
if (!projectId) throw new Error('Configure FIREBASE_PROJECT_ID em backend/.env.');
if (projectId.startsWith('demo-') && !process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Projetos demo exigem os emuladores.');
if (!getApps().length) initializeApp({ projectId, ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : { credential: applicationDefault() }) });
module.exports = { db: getFirestore(), auth: getAuth(), timestamp: () => FieldValue.serverTimestamp() };
}

