#include <DHT.h>
#include "ESP8266WiFi.h"
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

const char *ssid = "iGGConfig";
const char *pass = "iGGConfig";

// Notifications Config
const char *host = "maker.ifttt.com";
const int port = 80;
String request;

// Define databse
#define API_KEY "AIzaSyBpzBqy_Ia1jVaLchkPdFUe9YifRH2Fnq0"
#define FIREBASE_PROJECT_ID "igg-test-808e9"
#define USER_EMAIL "iggiot2023@gmail.com"
#define USER_PASSWORD "toikobiet"
#define DATABASE_URL "igg-test-808e9-default-rtdb.asia-southeast1.firebasedatabase.app"
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
uint32_t chipId;

// Time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");
String waterTime = "00:00:00";

unsigned long envMillis = 0;
unsigned long dataMillis = 0;
unsigned long envTimeOut = 0;
unsigned long wateringStart = 0;
unsigned long delaytime = 0;
unsigned long wateringTimeout = 30000;
unsigned long lastSentNoti = 0;
unsigned long lastOnLed = 0;

// Define pins
int MUX[2] = {D1, D2};
int LED[3] = {D8, D6, D7};
#define PIN_WATER 3
#define PIN_WATER_TRIGGER 2
#define PIN_DHT D3
#define PIN_LIGHT 0
#define PIN_SOIL 1
#define SIGNAL A0
#define PIN_RELAY D5
int binChannel[2] = {0, 0};

DHT dht11(PIN_DHT, DHT11);

struct IGGConfig
{
    bool pumpStatus;   // true = active; false = off
    bool wateringMode; // auto = false; custome = true
    bool isSelectedPlant;
    bool dataChange;
};

struct PlantData
{
    float humidity_min;
    float humidity_max;
    int light_min;
    int light_max;
    int soilMoisture_min;
    int soilMoisture_max;
    float temperature_min;
    float temperature_max;
};

struct CustomeWatering
{
    bool dates[7];
    int soilMoisture;
    String time;
};

IGGConfig iGGConfig = {false, false, false, true};
PlantData plantData = {0, 0, 0, 0, 0, 0, 0, 0};
CustomeWatering customeWatering;
String root = "";
bool initSucess = false;
bool isWatering = false;

//-------MUX control-----
void decToBin(int decimal, int binChannel[2])
{
    int s = 0;
    for (int i = 1; i >= 0; i--)
    {
        binChannel[s] = decimal % 2;
        decimal /= 2;
        s++;
    }
}

void setChannel(int c)
{
    decToBin(c, binChannel);
    for (int i = 0; i < 2; i++)
    {
        digitalWrite(MUX[i], binChannel[i]);
    }
}

//---- LED control-----
void setupLed(int led[3])
{
    for (int i = 0; i < 3; i++)
    {
        pinMode(led[i], OUTPUT);
    }
    setColorLed(0, 0, 0, led);
}

void offLED(int LED[3])
{
    digitalWrite(LED[0], 0);
    digitalWrite(LED[1], 0);
    digitalWrite(LED[2], 0);
}

void setColorLed(int r, int g, int b, int LED[3])
{
    analogWrite(LED[0], r);
    analogWrite(LED[1], g);
    analogWrite(LED[2], b);
    lastOnLed = millis();
}

void linearFade(int r, int g, int b, int LED[3])
{
    for (int i = 0; i < 255; i++)
    {
        setColorLed(i * r / 255, i * g / 255, i * b / 255, LED);
        delay(10);
    }
}

void linearOut(int r, int g, int b, int LED[3])
{
    for (int i = 255; i >= 0; i--)
    {
        setColorLed(i * r / 255, i * g / 255, i * b / 255, LED);
        delay(10);
    }
}

void connectwf()
{
    WiFiManager wm;
    // wm.resetSettings();
    setColorLed(255, 255, 0, LED);
    // Connecting
    wm.setConnectTimeout(60);
    wm.setTimeout(300); // Waiting for 5 minius
    bool res = wm.autoConnect(ssid, pass);
    if (!res)
    {
        Serial.println("Can't connect");
        Serial.println("Reset the esp");
        for (int i = 0; i < 3; i++)
        {
            setColorLed(255, 0, 0, LED);
            delay(1000);
            setColorLed(255, 0, 0, LED);
            delay(1000);
        }
        ESP.reset();
        delay(60000);
    }
    Serial.println("Connected");
    for (int i = 0; i < 3; i++)
    {
        linearFade(0, 255, 0, LED);
        linearOut(0, 255, 0, LED);
    }
}

// Database
void fcsUploadCallback(CFS_UploadStatusInfo info)
{
    if (info.status == firebase_cfs_upload_status_init)
    {
        Serial.printf("\nUploading data (%d)...\n", info.size);
    }
    else if (info.status == firebase_cfs_upload_status_upload)
    {
        Serial.printf("Uploaded %d%s\n", (int)info.progress, "%");
    }
    else if (info.status == firebase_cfs_upload_status_complete)
    {
        Serial.println("Upload completed ");
    }
    else if (info.status == firebase_cfs_upload_status_process_response)
    {
        Serial.print("Processing the response... ");
    }
    else if (info.status == firebase_cfs_upload_status_error)
    {
        Serial.printf("Upload failed, %s\n", info.errorMsg.c_str());
    }
}

FirebaseJson convertEnvToJson(Enviroment env)
{
    FirebaseJson res;
    res.set("fields/temp/doubleValue", env.temperature);
    res.set("fields/humi/doubleValue", env.humidity);
    res.set("fields/waterLevel/integerValue", env.waterLevel);
    res.set("fields/light/integerValue", env.light);
    res.set("fields/soilMoisture/integerValue", env.soilMoisture);
    res.set("fields/timeStamp/integerValue", timeClient.getEpochTime());
    return res;
}

bool sendEnvData(Enviroment env)
{
    if (Firebase.ready())
    {
        String documentPath = String(chipId) + "/" + String(timeClient.getEpochTime());
        FirebaseJson content = convertEnvToJson(env);
        if (Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw()))
        {
            return true;
        }
        else
        {
            Serial.println(fbdo.errorReason());
            return false;
        }
    }
    else
        return false;
}

bool readDeviceConfig(bool &val, String name, bool defaultVal = false)
{
    String path = "/" + String(chipId) + "/" + name;
    if (!Firebase.RTDB.getBool(&fbdo, path, &val))
    {
        if (fbdo.errorReason().equals("path not exist"))
        {
            if (!Firebase.RTDB.setBool(&fbdo, path, defaultVal))
            {
                Serial.println(name + fbdo.errorReason());
                return false;
            }
            else
            {
                return true;
            }
        }
        else
            return true;
    }
    return true;
}

void readPlantData()
{

    if (!Firebase.RTDB.getDouble(&fbdo, "/" + String(chipId) + "/recommendData/humidity_min"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.humidity_min = fbdo.to<float>();
    if (!Firebase.RTDB.getDouble(&fbdo, "/" + String(chipId) + "/recommendData/humidity_max"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.humidity_max = fbdo.to<float>();
    if (!Firebase.RTDB.getDouble(&fbdo, "/" + String(chipId) + "/recommendData/temperature_min"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.temperature_min = fbdo.to<float>();
    if (!Firebase.RTDB.getDouble(&fbdo, "/" + String(chipId) + "/recommendData/temperature_max"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.temperature_max = fbdo.to<float>();
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/recommendData/soilMoisture_min"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.soilMoisture_min = fbdo.to<float>();
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/recommendData/soilMoisture_max"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.soilMoisture_max = fbdo.to<float>();
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/recommendData/light_min"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.light_min = fbdo.to<float>();
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/recommendData/light_max"))
    {
        Serial.println(fbdo.errorReason());
    }
    else
        plantData.light_max = fbdo.to<float>();
    Serial.printf("Plant data: %f - %f - %f - %f - %d - %d - %d - %d\n", plantData.humidity_min, plantData.humidity_max, plantData.temperature_min, plantData.temperature_max, plantData.soilMoisture_min, plantData.soilMoisture_max, plantData.light_min, plantData.light_max);
}

void readCustomeWatering()
{
    if (!Firebase.RTDB.getString(&fbdo, "/" + String(chipId) + "/customeModeConfig/time", &customeWatering.time))
    {
        Serial.println(fbdo.errorReason());
    }
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/customeModeConfig/targetSoilMoisture", &customeWatering.soilMoisture))
    {
        Serial.println(fbdo.errorReason());
    }

    FirebaseJsonArray temp;
    FirebaseJsonData res;
    if (!Firebase.RTDB.getArray(&fbdo, "/" + String(chipId) + "/customeModeConfig/dates", &temp))
    {
        Serial.println(fbdo.errorReason());
    }
    else
    {
        for (size_t i = 0; i < temp.size(); i++)
        {
            temp.get(res, i);
            customeWatering.dates[i] = res.to<bool>();
        }
    }
    Serial.print("Custome watering: ");
    for (int i = 0; i < 7; i++)
    {
        Serial.print(String(customeWatering.dates[i]) + " ");
    }
    Serial.printf("Time: %s - Target: %d", customeWatering.time.c_str(), customeWatering.soilMoisture);
}

bool readConfig() // Try to read from the real time. If doesn't exist create
{
    setColorLed(0, 0, 123, LED);
    delay(100);
    offLED(LED);
    delay(100);
    setColorLed(0, 0, 123, LED);
    Serial.println("Reading config");
    bool res;
    res = readDeviceConfig(iGGConfig.pumpStatus, "pumpStatus");
    res = res && readDeviceConfig(iGGConfig.isSelectedPlant, "isSelectedPlant");
    res = res && readDeviceConfig(iGGConfig.wateringMode, "wateringMode");
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/envTimeOut", &envTimeOut))
    {
        Serial.println(fbdo.errorReason());
        if (fbdo.errorReason().equals("path not exist"))
        {
            if (!Firebase.RTDB.setInt(&fbdo, "/" + String(chipId) + "/envTimeOut", 60000))
            {
                Serial.println(fbdo.errorReason());
                res = false;
            }
            else
                envTimeOut = 60000;
        }
        else
            res = false;
    }
    if (!Firebase.RTDB.getInt(&fbdo, "/" + String(chipId) + "/soilMoisture", &env.soilMoisture))
    {
        Serial.println(fbdo.errorReason());
        if (fbdo.errorReason().equals("path not exist"))
        {
            if (!Firebase.RTDB.setInt(&fbdo, "/" + String(chipId) + "/soilMoisture", 0))
            {
                Serial.println(fbdo.errorReason());
                res = false;
            }
            else
                env.soilMoisture = 0;
        }
        else
            res = false;
    }
    if (!Firebase.RTDB.getInt(&fbdo, root + "targetSoilMoisture", &soilMoistureImmediate))
    {
        Serial.println(fbdo.errorReason());
        if (fbdo.errorReason().equals("path not exist"))
        {
            if (!Firebase.RTDB.setInt(&fbdo, root + "targetSoilMoisture", 0))
            {
                Serial.println(fbdo.errorReason());
                res = false;
            }
            else
                soilMoistureImmediate = 0;
        }
        else
            res = false;
    }
    // Read the isWatering
    if (iGGConfig.wateringMode)
        readCustomeWatering();
    if (iGGConfig.isSelectedPlant)
        readPlantData();
    iGGConfig.dataChange = false;
    Firebase.RTDB.setBool(&fbdo, root + "dataChange", false);

    // Print the data for testing
    Serial.printf("Config: %d - %d - %d - %d\n", iGGConfig.pumpStatus, iGGConfig.wateringMode, iGGConfig.isSelectedPlant, envTimeOut);
    setColorLed(255, 255, 255, LED);
    delay(100);
    linearFade(0, 0, 0, LED);
    return res;
}

// Time functions
bool isWateringCustome()
{
    String formattedTime = timeClient.getFormattedTime();
    int day = timeClient.getDay();
    // Only checking the hour and minius
    formattedTime = formattedTime.substring(0, 5);
    return customeWatering.time.equals(formattedTime) && customeWatering.dates[day];
}

// Notifications
void sendMessage(String message)
{
    WiFiClient client;
    while (!client.connect(host, port))
    {
        Serial.println("connection fail");
        delay(200);
    }
    request = "/trigger/iGG/with/key/c9lbROwto3XDd8zwbLLjiz?value1=" + message;
    client.print(String("GET ") + request + " HTTP/1.1\r\n" + "Host: " + host + "\r\n" + "Connection: close\r\n\r\n");
    delay(200);
}

void setup()
{
    Serial.begin(115200);
    delay(2000);
    // Get chip id
    chipId = ESP.getChipId();
    Serial.printf("Chip ID: %u\n", chipId);
    root += "/" + String(chipId) + "/";
    WiFi.mode(WIFI_STA);
    Serial.println("iGG starting....");

    // Setup led
    setupLed(LED);
    setColorLed(255, 0, 0, LED);
    delay(200);
    setColorLed(0, 255, 0, LED);
    delay(200);
    setColorLed(0, 0, 255, LED);
    delay(200);
    offLED(LED);
    connectwf();

    Serial.println("Setup pin.....");
    // Setup MUX
    for (int i = 0; i < 2; i++)
    {
        pinMode(MUX[i], OUTPUT);
    }
    // Setup relay
    pinMode(PIN_RELAY, OUTPUT);
    digitalWrite(PIN_RELAY, HIGH);
    // Setup dht
    dht11.begin();

    Serial.println("Finished setting up pin");
    Serial.println("Setup database....");
    // Set up database
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;
    config.token_status_callback = tokenStatusCallback;
    fbdo.setBSSLBufferSize(4096, 1024);
    fbdo.setResponseSize(2048);
    Firebase.begin(&config, &auth);

    config.timeout.serverResponse = 10 * 1000;

    timeClient.setTimeOffset(25200);
    timeClient.begin();

    readDeviceConfig(iGGConfig.dataChange, "dataChange", true);
    initSucess = readConfig();
}

void loop() {
     if (WiFi.status() != WL_CONNECTED) {
    setColorLed(255, 0, 0, LED);
    delay(1500);
    connectwf();
  } else if (millis() - delaytime > 1000) {
    delaytime = millis();
    timeClient.update();
  }
}