import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

import {
  getFirestore,
  collection,
  where,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
const db = getDatabase(app);
const fireStore = getFirestore(app);

const url = new URLSearchParams(window.location.search);
const uid = url.get("uid");

const userRef = collection(fireStore, "users");
const userDoc = doc(userRef, uid);
const userConfig = await getDoc(userDoc);
const chipID = userConfig.data().chipID;
const waterLevelRef = ref(db, `${chipID}/waterLevel`);
const pumpSatatusRef = ref(db, `${chipID}/pumpStatus`);
const soilMoistureRef = ref(db, `${chipID}/soilMoisture`);
const soilMoistureTargetRef = ref(db, `${chipID}/targetSoilMoisture`);
const sensorDb = collection(fireStore, `${chipID}`);
const q = query(sensorDb, orderBy("timeStamp", "desc"), limit(50));

var humiditySeries = [];
var lightSeries = [];
var temperatureSeries = [];
var waterLevelSeries = [];
var soilMoistureSeries = [];
const todayData = [];

function addDataPoint(data) {
  var timeStamp = data.timeStamp * 1000 - 25200000;
  humiditySeries.push([timeStamp, data.humi]);
  lightSeries.push([timeStamp, data.light]);
  temperatureSeries.push([timeStamp, data.temp]);
  waterLevelSeries.push([timeStamp, data.waterLevel]);
  soilMoistureSeries.push([timeStamp, data.soilMoisture]);
}
var chart2 = JSC.chart("chartDiv2", {
  debug: true,
  type: "line spline",
  animation_duration: 200,
  legend: {
    position: "top right",
    template: "%icon %name",
  },
  axisToZoom: "x",
  xAxis_scale_type: "time",
  xAxis: {
    scale: {
      type: "time",
    },
    crosshair_enabled: true,
  },
  yAxis: {
    id: "ax1",
    scale: { interval: 20, minorInterval: 10, range: [0, 100] },
  },
  defaultSeries: {
    defaultPoint_marker: {
      type: "circle",
      size: 8,
      fill: "white",
      outline: { width: 2, color: "currentColor" },
    },
  },
  title_label_text: "Evironment Information",
  series: [
    {
      id: "s1",
      type: "line",
      name: "Humidity",
      points: humiditySeries,
    },
    {
      id: "s2",
      type: "line",
      name: "Temperature",
      points: temperatureSeries,
    },
    {
      id: "s3",
      type: "line",
      name: "Light Intensity",
      points: lightSeries,
    },
  ],
});

onSnapshot(q, (querySnapshot) => {
  querySnapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      addDataPoint(change.doc.data());
    }
  });
  todayData.push(`${humiditySeries[0][1]} %`);
  todayData.push(`${soilMoistureSeries[0][1]}`);
  todayData.push(`${lightSeries[0][1]} %`);
  todayData.push(`${temperatureSeries[0][1]} °C`);
  // Update the chart with the new data
  chart2.series(0).options({ points: humiditySeries });
  chart2.series(1).options({ points: temperatureSeries });
  chart2.series(2).options({ points: lightSeries });
});

var chart = JSC.chart("chartDiv", {
  debug: true,
  type: "gauge",
  animation_duration: 1000,
  legend_visible: false,
  xAxis: { spacingPercentage: 0.25 },
  yAxis: {
    defaultTick: {
      padding: -5,
      label_style_fontSize: "12px",
    },
    line: {
      width: 6,
      color: "smartPalette",
      breaks_gap: 0.06,
    },
    scale_range: [0, 5],
  },
  palette: {
    pointValue: "{%value/5}",
    colors: ["#7d8597", "#0466c8", "#03045e"],
  },
  defaultTooltip_enabled: false,
  defaultSeries: {
    angle: { sweep: 180 },
    shape: {
      innerSize: "70%",

      label: {
        text: '<img src="/images/chart.png" alt="not found" style="width: 65px; height: 65px"><br/><span color="%color">{%sum:n1}</span> <hr/>',
        style_fontSize: "50px",
        verticalAlign: "middle",
      },
    },
  },
  series: [
    {
      type: "column roundcaps",
      points: [{ id: "1", x: "speed", y: 0 }],
    },
  ],
});

function setGauge(max, y) {
  // Update the chart with the new value
  chart.series(0).options({ points: [{ id: "1", x: "speed", y: y }] });
}

// Listen for changes to waterLevel
onValue(waterLevelRef, (snapshot) => {
  const data = snapshot.val();
  console.log(data);

  const waterLevel = data;
  console.log("Water Level:", waterLevel);
  // Update your gauge chart or perform other actions with the water level data
  setGauge(5, waterLevel);
});

// Water now function

const toast = document.getElementById("liveToast");
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);

window.waterNow = function () {
  // Get the soil moisture and calculate the target soil moisture
  let soilMoisture = 0;
  onValue(soilMoistureRef, (snapshot) => {
    soilMoisture = snapshot.val();
    console.log("Soil Moisture:", soilMoisture);
  });
  let targetSoilMoisture = soilMoisture + 10;
  if (targetSoilMoisture > 100) {
    targetSoilMoisture = 100;
  }

  // Update the target soil moisture in the database
  set(soilMoistureTargetRef, targetSoilMoisture);
  set(pumpSatatusRef, true);

  toast.querySelector(".toast-body").innerHTML =
    "Sent water request to the device";
  toastBootstrap.show();
};

// Query environment data yesterday from firestore
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
// Convert to timestamp range
const start = yesterday.getTime() / 1000;
const end = Date.now() / 1000;

const q2 = query(
  sensorDb,
  where("timeStamp", ">=", start),
  where("timeStamp", "<=", end)
);
// Get data and calaulate average
const avgs = [0, 0, 0, 0];

onSnapshot(q2, (querySnapshot) => {
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    avgs[0] += data.humi;
    avgs[1] += data.soilMoisture;
    avgs[2] += data.light;
    avgs[3] += data.temp;
  });
  avgs[0] /= querySnapshot.size;
  avgs[1] /= querySnapshot.size;
  avgs[2] /= querySnapshot.size;
  avgs[3] /= querySnapshot.size;
  let i = 0;

  document.querySelectorAll(".status").forEach((status) => {
    status.querySelector("p:last-child").innerHTML = `Yesterday: ${avgs[
      i
    ].toFixed(2)}`;
    status.querySelector("p:first-child").innerHTML = todayData[i];
    i++;
  });
});
