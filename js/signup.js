// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpzBqy_Ia1jVaLchkPdFUe9YifRH2Fnq0",
  authDomain: "igg-test-808e9.firebaseapp.com",
  databaseURL:
    "https://igg-test-808e9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "igg-test-808e9",
  storageBucket: "igg-test-808e9.appspot.com",
  messagingSenderId: "674969957277",
  appId: "1:674969957277:web:31d4d5c40c844b50083574",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth(app);

let fname = document.getElementById("first-name");
let lname = document.getElementById("last-name");
let emailInp = document.getElementById("email-ip");
let passwordInp = document.getElementById("password-ip");
let signupForm = document.getElementById("sign-up");
let confirmPasswordInp = document.getElementById("confirm-password-ip");

let registerUser = (e) => {
  e.preventDefault();
  let registrationToast = document.getElementById("registrationToast");
  let strong = document.querySelector(".me-auto");
  let body = document
    .getElementById("registrationToast")
    .querySelector(".toast-body");
  console.log(passwordInp.value);
  console.log(confirmPasswordInp.value);
  if(passwordInp.value === confirmPasswordInp.value){
    createUserWithEmailAndPassword(auth, emailInp.value, passwordInp.value)
      .then(async (credentials) => {
        await updateProfile(auth.currentUser, {
          displayName: `${fname.value},${lname.value}`,
        });
        sendEmailVerification(auth.currentUser).then(() => {
          strong.textContent = " Registration was successful.";
          strong.style.color = "green";
          body.textContent =
            "Hello, world! Please check your email for verification. You will be directed to sign in page in 5 seconds";
          registrationToast.classList.add("show");
        });
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 5000); // 5000 milliseconds (5 seconds) delay
  
        displayUserProfile(auth.currentUser);
        // console.log(credentials);
      })
      .catch((error) => {
        // alert(error.message);
        // console.log(error.code);
        // console.log(error.message);
        strong.textContent = "Error";
        strong.style.color = "red";
        body.textContent = `${error.message}`;
        registrationToast.classList.add("show");
      });
  }
  else{
    strong.textContent = "Error";
    strong.style.color = "red";
    body.textContent = `Confirm password does not match.`;
    registrationToast.classList.add("show");
  }
};

const displayUserProfile = (user) => {
  if (user !== null) {
    // The user object has basic properties such as display name, email, etc.
    const displayName = user.displayName.split(",");
    const email = user.email;
    const emailVerified = user.emailVerified;
    console.log("name: ", displayName);
    console.log("email", email);
    console.log("emailVerified", email);

    // The user's ID, unique to the Firebase project. Do NOT use
    // this value to authenticate with your backend server, if
    // you have one. Use User.getToken() instead.
    const uid = user.uid;
    console.log("uid", uid);
    return displayName[0], displayName[1];
  }
};
signupForm.addEventListener("submit", registerUser);
