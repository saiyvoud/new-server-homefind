// Import the functions you need from the SDKs
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
const firebaseApp = initializeApp(firebaseConfig);
export const authFirebase = getAuth(firebaseApp);
// Optional: Uncomment if you plan to use Analytics
// const analytics = getAnalytics(firebaseApp);

export default firebaseApp;
