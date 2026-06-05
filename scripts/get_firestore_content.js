import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkFirestoreContent() {
  console.log('Fetching siteContent collection from Firestore...');
  try {
    const snapshot = await getDocs(collection(firestore, 'siteContent'));
    console.log(`Found ${snapshot.docs.length} documents:`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('='*40);
      console.log(`Document ID: ${doc.id}`);
      console.log(`Title: ${data.title}`);
      console.log(`Content length: ${data.content ? (typeof data.content === 'string' ? data.content.length : JSON.stringify(data.content).length) : 0}`);
      const contentStr = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
      console.log(`Content preview: ${contentStr ? contentStr.substring(0, 150) : 'N/A'}`);
    });
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
  }
}

checkFirestoreContent();
