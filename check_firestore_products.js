import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkProducts() {
  console.log('Fetching products collection from Firestore...');
  try {
    const snapshot = await getDocs(collection(firestore, 'products'));
    console.log(`Found ${snapshot.docs.length} products:`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('========================================');
      console.log(`ID: ${doc.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`Category: ${data.category}`);
      console.log(`Price: ${data.price}`);
      console.log(`Stock: ${data.stock}`);
      console.log(`Image (first 100 chars): ${data.image ? data.image.substring(0, 100) : 'None'}`);
    });
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
  }
}

checkProducts();
