import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let email = document.getElementById("email");
let password = document.getElementById("password");
let signinForm = document.getElementById("sign-in");
let registrationToast = document.getElementById("registrationToast");
let strong = document.querySelector(".me-auto");
let body = document
  .getElementById("registrationToast")
  .querySelector(".toast-body");

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const users = collection(db, "users");

// const dbRef = ref(db);

let singInUser = (e) => {
  e.preventDefault();

  signInWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
      // Wait for a short delay before checking email verification
      setTimeout(() => {
        checkEmailVerification(userCredential.user);
      }, 20); // Adjust the delay as needed
    })
    .catch((error) => {
      strong.textContent = "Error";
      strong.style.color = "red";
      body.textContent = `${error.message}`;
      registrationToast.classList.add("show");
    });
};
let checkEmailVerification = async (user) => {
  if (user.emailVerified) {
    await storeUID(user.uid);
    // sessionStorage.setItem("uid", user.uid);
    // window.location.href = `index.html?uid=${user.uid}`;
    checkChipIDAndRedicrect(user.uid);
  } else {
    strong.textContent = "Error";
    strong.style.color = "red";
    body.textContent = "Email not verified. Please verify your email.";
    registrationToast.classList.add("show");
  }
};

let storeUID = async (uid) => {
  const userDoc = doc(users, uid);
  try {
    const snapshot = await getDoc(userDoc);
    if (snapshot.exists()) {
      console.log("User document already exists");
    } else {
      const userData = {
        chipID: null,
        plantID: null,
      };
      try {
        await setDoc(userDoc, userData);
        console.log("User data stored in Firestore");
      } catch (error) {
        console.error("Error storing user data in Firestore: ", error);
      }
    }
  } catch (error) {
    console.error("Error checking user document: ", error);
  }
};

let checkChipIDAndRedicrect = async (uid) => {
  const userDoc = doc(users, uid);
  try {
    const snapshot = await getDoc(userDoc);
    if (snapshot.exists()) {
      const userData = snapshot.data();
      if (userData && userData.chipID !== null) {
        sessionStorage.setItem("uid", uid);
        window.location.href = `/html/home.html?uid=${uid}`;
      } else {
        sessionStorage.setItem("uid", uid);
        window.location.href = `/html/chipID.html?uid=${uid}`;
      }
    } else {
      console.log("User document does not exist");
    }
  } catch (error) {
    console.error("Error checking chipID and redirecting: ", error);
  }
};

signinForm.addEventListener("submit", singInUser);
