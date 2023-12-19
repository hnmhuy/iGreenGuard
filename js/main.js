import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const navBar = document.querySelector(".navbar");
  const icon = document.querySelectorAll(".navbar .bi");
  const divPage = document.querySelectorAll(".navbar div");

  const menuBtn = document.querySelector(".bi-list");
  menuBtn.addEventListener("click", () => {
    navBar.classList.add("active");
  });
  window.addEventListener("click", function (event) {
    let flag = false;
    divPage.forEach((div) => {
      if (div.contains(event.target)) {
        flag = true;
      }
    }); // Check if the clicked element is not a descendant of the navbar or the bi-list button
    if (
      !flag &&
      event.target !== menuBtn &&
      event.target !== navBar &&
      navBar.classList.contains("active")
    ) {
      // Close the navbar
      console.log(123);

      navBar.classList.remove("active");
    }
  });
});

const onClickPage = (e) => {
  const uid = sessionStorage.getItem("uid");

  if (e.id === "home-page") {
    window.location.href = `home.html?uid=${uid}`;
  } else if (e.id === "plant-page") {
    window.location.href = `plant.html?uid=${uid}`;
  } else if (e.id === "profile-page") {
    window.location.href = `profile.html?uid=${uid}`;
  }
};

const onClickSignout = (e) => {
  auth
    .signOut()
    .then(() => {
      window.location.href = "/index.html";
      console.log("User signed out successfully.");
      // Perform any additional actions after sign out
    })
    .catch((error) => {
      console.error("Error signing out: ", error.message);
    });
};

window.onClickPage = onClickPage;
window.onClickSignout = onClickSignout;
