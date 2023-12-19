import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
const db = getFirestore(app);
const users = collection(db, "users");

let chipIDForm = document.getElementById("chip-id");

const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get("uid");
// const dbRef = ref(db);

let submitChipID = async (e) => {
  e.preventDefault();
  let chipID = document.getElementById("chipID").value;
  await storeChipID(uid, chipID);
  setTimeout(() => {
    window.location.href = `home.html?uid=${uid}`;
  }, 2000); // 5000 milliseconds (5 seconds) delay
  //   window.location.href = `index.html?uid=${uid}`;
};

let storeChipID = async (uid, chipID) => {
  const userDocRef = doc(users, uid);
  try {
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Update the chipID field
      await updateDoc(userDocRef, { chipID: chipID });
      strong.textContent = "Successful Stored!";
      strong.style.color = "green";
      body.textContent = "ChipID stored in Firestore";
      registrationToast.classList.add("show");
    } else {
      // Handle the case when the user document doesn't exist
      strong.textContent = "Error";
      strong.style.color = "red";
      body.textContent = `"Error storing chipID in Firestore`;
      registrationToast.classList.add("show");
    }
  } catch (error) {
    strong.textContent = "Error";
    strong.style.color = "red";
    body.textContent = `"Error storing chipID in Firestore: ${error}`;
    registrationToast.classList.add("show");
  }
};

chipIDForm.addEventListener("submit", submitChipID);
