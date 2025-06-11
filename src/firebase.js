import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBN0HQJmI4HWnVbPnf0fjwSpGTjQ-BWWGM",
  authDomain: "hiinventorypro.firebaseapp.com",
  databaseURL: "https://hiinventorypro-default-rtdb.firebaseio.com",
  projectId: "hiinventorypro",
  storageBucket: "hiinventorypro.appspot.com",  
  messagingSenderId: "589853116398",
  appId: "1:589853116398:web:c626fda619aa7dd03330ff",
  measurementId: "G-T5R0GZYF49"
};


export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export {
  
  storage,
  
  signInWithPopup
};
