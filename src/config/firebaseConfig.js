// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDMsifX8ITUpRLt0CETS7O2oxTy60pg6fU",
  authDomain: "homefind-phone-otp.firebaseapp.com",
  projectId: "homefind-phone-otp",
  storageBucket: "homefind-phone-otp.appspot.com",
  messagingSenderId: "242634936743",
  appId: "1:242634936743:web:b9b9e627cd33e2717ce682",
  measurementId: "G-KTFPENBFBZ",
};

// Initialize Firebase
const firebaseAdmin = initializeApp(firebaseConfig);
export const authfirebase = getAuth(firebaseAdmin);
// const analytics = getAnalytics(firebaseAdmin);

export default firebaseAdmin;
