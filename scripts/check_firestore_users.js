import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkUsers() {
  console.log('Fetching users from Firestore...');
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    console.log(`Found ${snapshot.docs.length} users:`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`UID: ${doc.id}, Email: ${data.email}, Role: ${data.role}, Name: ${data.displayName}`);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

checkUsers();
