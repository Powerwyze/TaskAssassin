import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdHwC9TAjeQBHNJDf2Bd5yx5jzL5sCPuo",
  authDomain: "gen-lang-client-0549725206.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0549725206-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0549725206",
  storageBucket: "gen-lang-client-0549725206.firebasestorage.app",
  messagingSenderId: "889525001358",
  appId: "1:889525001358:web:01734050980294e8bbbddf",
  measurementId: "G-LDFE5LFSMQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
