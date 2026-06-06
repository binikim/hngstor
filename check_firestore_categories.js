import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkCategories() {
  console.log('Fetching siteContent/categories from Firestore...');
  try {
    const docSnap = await getDoc(doc(firestore, 'siteContent', 'categories'));
    if (docSnap.exists()) {
      console.log('Categories document content:', JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log('Categories document does not exist!');
    }
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
  }
}

checkCategories();
