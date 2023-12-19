import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

let email = document.getElementById("email");

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
// const dbRef = ref(db);

window.forgotPassword = (e) => {
  e.preventDefault();

  let registrationToast = document.getElementById("registrationToast");
  let strong = document.querySelector(".me-auto");
  let body = document
    .getElementById("registrationToast")
    .querySelector(".toast-body");

  sendPasswordResetEmail(auth, email.value)
    .then(() => {
      console.log(123);
      strong.textContent = "Password reset email sent!.";
      strong.style.color = "green";
      body.textContent =
        "Please check your email for reset password. You will be directed to sign in page in 5 seconds";
      registrationToast.classList.add("show");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 5000); // 5000 milliseconds (5 seconds) delay
    })
    .catch((error) => {
      strong.textContent = "Error";
      strong.style.color = "salmon";
      body.textContent = `${error.message}`;
      registrationToast.classList.add("show");
    });
};

document
  .querySelector(".submit-button")
  .addEventListener("click", forgotPassword);
