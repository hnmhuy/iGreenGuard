import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getDatabase,
  set,
  get,
  ref,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import {
  getFirestore,
  collection,
  getDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

// get the uid from the current url
const url = new URLSearchParams(window.location.search);
const uid = url.get("uid");
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const fireStore = getFirestore(app);

// Get the user config from user/uid
const userRef = collection(fireStore, "users");
const userDoc = doc(userRef, uid);
const userConfig = await getDoc(userDoc);
selectPlant(userConfig.data().plantID);
const isSelectedPlant = ref(db, `${userConfig.data().chipID}/isSelectedPlant`);
// Reference to the realtime device store
const dataChangeRef = ref(db, `${userConfig.data().chipID}/dataChange`);
const recommendRef = [
  ref(db, `${userConfig.data().chipID}/recommendData/humidity_min`),
  ref(db, `${userConfig.data().chipID}/recommendData/humidity_max`),
  ref(db, `${userConfig.data().chipID}/recommendData/light_min`),
  ref(db, `${userConfig.data().chipID}/recommendData/light_max`),
  ref(db, `${userConfig.data().chipID}/recommendData/temperature_min`),
  ref(db, `${userConfig.data().chipID}/recommendData/temperature_max`),
  ref(db, `${userConfig.data().chipID}/recommendData/soilMoisture_min`),
  ref(db, `${userConfig.data().chipID}/recommendData/soilMoisture_max`),
];

const customeModeConfigRef = [
  ref(db, `${userConfig.data().chipID}/customeModeConfig/dates`),
  ref(db, `${userConfig.data().chipID}/customeModeConfig/time`),
  ref(db, `${userConfig.data().chipID}/customeModeConfig/targetSoilMoisture`),
];

const wateringModeRef = ref(db, `${userConfig.data().chipID}/wateringMode`);

let target = new Vue({
  el: "#target",
  data: {
    maxAngle: 30,
  },
  computed: {
    sliderMax: {
      get: function () {
        var val = parseInt(this.maxAngle);
        return val;
      },
      set: function (val) {
        val = parseInt(val);
        if (val < this.minAngle) {
          this.minAngle = val;
        }
        this.maxAngle = val;
      },
    },
  },
});
let wateringMode = false;
let select = [0, 0, 0, 0, 0, 0, 0];
window.onClickDates = function (e) {
  e.classList.toggle("active");
  let dateSelected = document.querySelectorAll(".date");
  dateSelected.forEach((date) => {
    if (date.classList.contains("active")) {
      select[date.id] = 1;
    }
  });
};

window.onClickMode = function (e) {
  let custom = document.querySelector(".custom-container");
  wateringMode = false;
  if (e.id === "custom-mode") {
    wateringMode = true;
    custom.classList.remove("collapse");
  } else {
    custom.classList.add("collapse");
  }
};

let finalSelectDate;
const vueList = [];

window.closeSidepeek = function () {
  let sidepeek = document.querySelector(".sidepeek-container");
  let overlay = document.querySelector(".overlay");
  overlay.classList.add("collapse");
  sidepeek.classList.add("collapse");
};

window.onClickSelect = function (e) {
  finalSelectDate = select;
  setDeviceConfig();
  closeSidepeek();
};

window.onClickCancel = function (e) {
  closeSidepeek();
};
//---------------- Fectch data ------------------
window.fetchData = function () {
  return fetch("../json/data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
};

let plantId;

window.onClickPlant = function (e) {
  let sidepeek = document.querySelector(".sidepeek-container");
  let overlay = document.querySelector(".overlay");
  sidepeek.classList.remove("collapse");
  overlay.classList.remove("collapse");
  plantId = e.parentNode.parentNode.id;
  console.log(plantId);

  fetchData().then((data) => {
    const selectedPlant = data.plants.find((plant) => plant.id === plantId);
    if (selectedPlant) {
      const components = selectedPlant.components;
      components.forEach((component, index) => {
        let instance = vueList[index];
        if (!instance) {
          instance = new Vue({
            el: `#${component.componentName}`,
            data: {
              minAngle: component.minAngle,
              maxAngle: component.maxAngle,
            },
            computed: {
              sliderMin: {
                get: function () {
                  var val = parseInt(this.minAngle);
                  return val;
                },
                set: function (val) {
                  val = parseInt(val);
                  if (val > this.maxAngle) {
                    this.maxAngle = val;
                  }
                  this.minAngle = val;
                },
              },
              sliderMax: {
                get: function () {
                  var val = parseInt(this.maxAngle);
                  return val;
                },
                set: function (val) {
                  val = parseInt(val);
                  if (val < this.minAngle) {
                    this.minAngle = val;
                  }
                  this.maxAngle = val;
                },
              },
            },
          });
          vueList.push(instance);
        } else {
          instance.minAngle = component.minAngle;
          instance.maxAngle = component.maxAngle;
        }
      });
    } else {
      console.error("Selected plant not found.");
    }
  });
};

function onStateCancel(plantId) {
  const cancelPlant = document.querySelector(".cancel-plant");
  if (plantId) {
    cancelPlant.removeAttribute("disabled");
  } else {
    cancelPlant.setAttribute("disabled", true);
  }
}

function selectPlant(plantId) {
  console.log(plantId);
  document.querySelectorAll(".image-card").forEach((card) => {
    const selectedPlant = card.children[0];
    selectedPlant.classList.add("collapse");
  });
  if (plantId) {
    document
      .querySelector(`#${plantId} .plant-selected`)
      .classList.remove("collapse");
    onStateCancel(plantId);
  }
}

function setDeviceConfig() {
  // Get the data from the form
  const humidity = vueList[0];
  const light = vueList[1];
  const temperature = vueList[2];
  const soilMoisture = vueList[3];

  // Set the data for the device
  set(recommendRef[0], humidity.minAngle);
  set(recommendRef[1], humidity.maxAngle);
  set(recommendRef[2], light.minAngle);
  set(recommendRef[3], light.maxAngle);
  set(recommendRef[4], temperature.minAngle);
  set(recommendRef[5], temperature.maxAngle);
  set(recommendRef[6], soilMoisture.minAngle);
  set(recommendRef[7], soilMoisture.maxAngle);

  if (wateringMode) {
    set(customeModeConfigRef[0], finalSelectDate);
    let time = document.querySelector("#time").value;
    set(customeModeConfigRef[1], time);
    set(customeModeConfigRef[2], target.maxAngle);
    // Set wateringMode = trie
    set(wateringModeRef, true);
  } else {
    set(wateringModeRef, false);
  }

  set(isSelectedPlant, true);
  // Update plant id in user config
  setDoc(
    userDoc,
    {
      plantId: plantId,
    },
    { merge: true }
  );

  set(dataChangeRef, true);
  selectPlant(plantId);
}

window.selectWithDefault = function (e) {
  plantId = e.parentNode.parentNode.parentNode.id;
  fetchData().then((data) => {
    // Find the plan
    const selectedPlant = data.plants.find((plant) => plant.id === plantId);
    set(recommendRef[0], selectedPlant.components[1].minAngle);
    set(recommendRef[1], selectedPlant.components[1].maxAngle);
    set(recommendRef[2], selectedPlant.components[2].minAngle);
    set(recommendRef[3], selectedPlant.components[2].maxAngle);
    set(recommendRef[4], selectedPlant.components[0].minAngle);
    set(recommendRef[5], selectedPlant.components[0].maxAngle);
    set(recommendRef[6], selectedPlant.components[3].minAngle);
    set(recommendRef[7], selectedPlant.components[3].maxAngle);
    setDoc(
      userDoc,
      {
        plantId: plantId,
      },
      { merge: true }
    );
    set(isSelectedPlant, true);
    set(dataChangeRef, true);
    set(wateringModeRef, false);
    selectPlant(plantId);
  });
};

window.onClickCancelPlant = (e) => {
  if (e.getAttribute("disabled") === null) {
    document.querySelectorAll(".image-card").forEach((card) => {
      const selectedPlant = card.children[0];
      selectedPlant.classList.add("collapse");
    });
    e.setAttribute("disabled", true);
    fetchData().then((data) => {
      set(isSelectedPlant, false);
    });
    plantId = null;
    setDoc(
      userDoc,
      {
        plantID: plantId,
      },
      { merge: true }
    );
  }
};
