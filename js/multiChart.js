var dt = new Date().getTime(),
  cnt = 0,
  lastVal = 6,
  useShift2 = true;
var hour = new Date().getHours();

fetch("../json/mulitChart.json")
  .then((response) => response.json())
  .then((jsonData) => {
    // Process the data and create the series
    var humiditySeries = [];
    var lightSeries = [];
    var temperatureSeries = [];

    jsonData.data.forEach(function (dataPoint) {
      var timestamp = new Date(dataPoint.timestamp).getTime();
      humiditySeries.push([timestamp, dataPoint.humidity]);
      lightSeries.push([timestamp, dataPoint.light]);
      temperatureSeries.push([timestamp, dataPoint.temperature]);
    });
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
          range: {
            min: new Date().setHours(0, 0, 0, 0), // Start from today
            max: new Date().getTime(), // End at the current time
            interval: { unit: "hour", multiplier: 1 }, // 1-hour intervals
          },
        },
        tick_interval: { unit: "hour", multiplier: 1 },
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
  })
  .catch((error) => console.error("Error fetching data:", error));
