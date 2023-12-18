import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {doc, getDoc, setDoc, collection, getFirestore} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get("uid");

const displayUserProfile = (user) => {
  if (user !== null) {
    // Access the user's display name
    const displayName = user.displayName;
    console.log(displayName);

    if (displayName) {
      const [firstName, lastName] = displayName.split(",");

      // Update the content of the HTML elements
      document.getElementById(
        "new-firstname"
      ).value = `${firstName}`;
      document.getElementById(
        "new-lastname"
      ).value = `${lastName}`;
      document.getElementById(
        "email-user"
      ).value = `${user.email}`;
    } else {
      console.log("User display name not found");
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (uid) {
    onAuthStateChanged(auth, (user) => {
      console.log("User in onAuthStateChanged:", user);
      if (user && user.uid === uid) {
        console.log("User authenticated and UID matches.");
        displayUserProfile(user);
      } else {
        console.log("User not authenticated or UID doesn't match");
      }
    });
  } else {
    console.log("UID not found in the URL");
  }
});

const updateUserProfile = (e) => {
  const newFirstName = document.getElementById("new-firstname").value;
  const newLastName = document.getElementById("new-lastname").value;
  const currentPassword = document.getElementById("current-password").value;
  updateProfileFunc(newFirstName, newLastName, currentPassword);
};

const updateProfileFunc = (
  newFirstName,
  newLastName,
  currentPassword,
) => {
  if (uid) {
    onAuthStateChanged(auth, (user) => {
      console.log(currentPassword);
      if (user.uid === uid) {
        swal.fire({
              title: "Success",
              text: "You updated your information.",
              icon: "success",
              confirmButtonColor: "#38b000",
              timer: 2000
            });
        return updateProfile(user, {
              displayName: `${newFirstName},${newLastName}`,
        });
      } else {
        console.log("User not authenticated or UID doesn't match");
      }
    });
  } else {
    console.log("UID not found in the URL");
  }
};

const updateUserPassword = (e) =>{
  const newPassword = document.getElementById("new-password").value;
  const currentPassword = document.getElementById("current-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  updateUserPasswordFunc(currentPassword, newPassword, confirmPassword);
}

const updateUserPasswordFunc = (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  if (uid) {
    onAuthStateChanged(auth, (user) => {
      if (user.uid === uid) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        reauthenticateWithCredential(user, credential)
          .then(() => {
            // Update the user's profile
            if(newPassword === confirmPassword)
              return updatePassword(user, newPassword);
            console.log("The confirmation password does not match.")
          })
          .then(() => {
            swal.fire({
              title: "Success",
              text: "You have just updated your password.",
              icon: "success",
              allowOutsideClick: "true",
              confirmButtonColor: "#38b000",
              timer: 2000
            });
            // displayUserProfile(user);
            // window.location.href = `profile.html?uid=${uid}`;
          })
          .catch((error) => {
            swal.fire({
              title: "Fail",
              text: "You can not update your password.",
              icon: "error",
              allowOutsideClick: "true"
            });
            console.error("Error updating password: ", error.message);
          });
      } else {
        console.log("User not authenticated or UID doesn't match");
      }
    });
  } else {
    console.log("UID not found in the URL");
  }
};

const fetchChipId = (e) => {
  const docRef = doc(users, uid);
  getDoc(docRef)
    .then((doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const chipId = data.chipID;
        document.getElementById("current-chipId").value = chipId;
        document.getElementById("new-chipId").value = "";
      } else {
        console.log("No such document!");
      }
    })
    .catch((error) => {
      console.error("Error getting document:", error.message);
    });
}

const updateChipId = (e) => {
  const docRef = doc(users, uid);
  const chipId = document.getElementById("new-chipId").value;
 // Set the new chip ID
  setDoc(docRef, { chipID: chipId }, { merge: true })
    .then(() => {
      fetchChipId();
      console.log("Chip ID updated successfully");
      swal.fire({
        title: "Success",
        text: "You have just updated your chip ID.",
        icon: "success",
        allowOutsideClick: "true",
        confirmButtonColor: "#38b000",
        timer: 2000
      });
      // window.location.href = `profile.html?uid=${uid}`;
    })
    .catch((error) => {
      swal.fire({
        title: "Fail",
        text: "You can not update your chip ID.",
        icon: "error",
        allowOutsideClick: "true"
      });
      console.error("Error updating chip ID: ", error.message);
    });
}

fetchChipId();

window.updateUserProfile = updateUserProfile;
window.updateUserPassword = updateUserPassword;
window.updateChipConfig = updateChipId;
