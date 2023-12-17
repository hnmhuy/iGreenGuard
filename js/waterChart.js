import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

import {
  getFirestore,
  doc,
  setDoc,
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
const db = getDatabase();
const fireStore = getFirestore(app);
const waterLevelRef = ref(db, "10492445/waterLevel");

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
