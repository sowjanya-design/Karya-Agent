import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const configPath = './firebase-applet-config.json';
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const adminLogin = {
  email: "karya.ai.admin@gmail.com",
  password: "Karya-ai.administrative01"
};

async function run() {
  try {
    console.log(`Attempting login for ${adminLogin.email}...`);
    await signInWithEmailAndPassword(auth, adminLogin.email, adminLogin.password);
    console.log(`SUCCESS: Logged in as ${adminLogin.email}`);
  } catch (err) {
    console.error(`Login failed: ${err.message}`);
    process.exit(1);
  }

  const collections = ['users', 'clients', 'pre_registrations', 'resumeHistory'];
  const exportData = {};

  for (const colName of collections) {
    console.log(`Fetching collection: ${colName}`);
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      exportData[colName] = data;
      console.log(`Exported ${data.length} docs from ${colName}`);
    } catch (err) {
      console.error(`Error fetching collection ${colName}:`, err.message);
    }
  }

  fs.writeFileSync('firebase_backup.json', JSON.stringify(exportData, null, 2));
  console.log('Successfully saved to firebase_backup.json');
  process.exit(0);
}

run();
