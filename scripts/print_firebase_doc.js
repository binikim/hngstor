import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function printDoc(id) {
  const docRef = doc(firestore, 'siteContent', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log(`\n=================== FIRESTORE DOCUMENT: ${id} ===================`);
    const data = docSnap.data();
    console.log("Title:", data.title);
    console.log("Content:");
    console.log(data.content);
  } else {
    console.log(`Firestore document ${id} does not exist.`);
  }
}

async function run() {
  await printDoc('about');
  await printDoc('terms');
  await printDoc('privacy');
}

run();
