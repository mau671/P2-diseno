import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCcn9B_WeRlZf_pSCSUHClKaWV4lIPIHis",
  authDomain: "diseno-verano2025.firebaseapp.com",
  projectId: "diseno-verano2025",
  storageBucket: "diseno-verano2025.firebasestorage.app",
  messagingSenderId: "661319432288",
  appId: "1:661319432288:web:3b714d6c08520b45146b05"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
