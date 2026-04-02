
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Configuration basée sur votre google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyA9bKixiHlfIdffn5gzn-I8VJGnmexmttk",
  authDomain: "georestau-13490.firebaseapp.com",
  projectId: "georestau-13490",
  storageBucket: "georestau-13490.firebasestorage.app",
  messagingSenderId: "74494720246",
  appId: "1:74494720246:web:a64b73362b485d5b72d4d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


export const getUserRole = async (uid: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

export { auth, db };
