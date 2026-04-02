// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "url-checker-d9947.firebaseapp.com",
  projectId: "url-checker-d9947",
  storageBucket: "url-checker-d9947.firebasestorage.app",
  messagingSenderId: "126720103588",
  appId: "1:126720103588:web:3cb188b940b6f16eac4231",
  measurementId: "G-X30QRTCKGC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);