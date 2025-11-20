// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAB1IhCqYs8zZV4vPfE34V88_fu-foesyA",
  authDomain: "aqua-lab-2c75e.firebaseapp.com",
  projectId: "aqua-lab-2c75e",
  storageBucket: "aqua-lab-2c75e.firebasestorage.app",
  messagingSenderId: "910132131648",
  appId: "1:910132131648:web:0b1c0a9c36c9262f71eca5",
  measurementId: "G-FJ0NWL82Q0"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);