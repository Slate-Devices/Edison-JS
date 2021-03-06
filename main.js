// Init stuff
var http = require('http');
var mraa = require('mraa');
var jsUpmI2cLcd  = require ('jsupm_i2clcd'); // LED
var lcd = new jsUpmI2cLcd.Jhd1313m1(0, 0x3E, 0x62); // Init the LCD
var groveSensor = require('jsupm_grove'); // grove sensors
var light = new groveSensor.GroveLight(1); // light sensor
var temp = new groveSensor.GroveTemp(2); // temperature
var upmMicrophone = require("jsupm_mic"); // gimme the mic calls
var myMic = new upmMicrophone.Microphone(0);
var threshContext = new upmMicrophone.thresholdContext();
var Parse = require('parse/node').Parse;

Parse.initialize("Few1XXtjnoqhyNLOqgEz63H4GOg2IonFIlLEXVKy", "K0JVKCTYrWMuG3Qszg2jsV4TjlXwxDvLi7gksyJt");

// store last values that we sent to API to reduce
// amount of duplicate date to be sent again
var apiCache = {
    "light": 0,
    "noise": 0,
    "temp": 0
};


// Log the plate's launch
notifyAPI("launch", 1);


// Inform the API that the thing is working
setInterval(function(){
    notifyAPI("keepalive", 1);
}, 60*1000);


// Ask sensors once per 1 second if anything is wrong
setInterval(function(){
    // light
    var light = getLight();
    notifyAPI("light", light);
    writeOnLED(0, "Light: " + light);
    
    // temperature
    var temp = getTemp();
    notifyAPI("temp", temp);
    
    // noise
    var noise = getNoise(10);
    if (noise) {
        notifyAPI("noise", noise);
        writeOnLED(1, "Noise: " + noise);
    }
    else {
        writeOnLED(1, "Zzzzzz...");
    }
}, 1*1000);


// returns amount of light
function getLight() {
    return light.value();
}

// returns average amount of noise during a 200 ms interval
// volume threshold should be specified (30-40 in a room seems legit)
function getNoise(threshold) {
    threshContext.averageReading = 0;
    threshContext.runningAverage = 0;
    threshContext.averagedOver = 2;
    
    // listen to the music (and noise) for 2*100 ms
    var buffer = new upmMicrophone.uint16Array(5000);
    
    var len = myMic.getSampledWindow(2, 5000, buffer);
    
    if (len) {
        return myMic.findThreshold(threshContext, threshold, buffer, len);
    }
}

// returns temperature in celsium
function getTemp() {
    return temp.value();
}

// notifies REST API with a set of predefined messages
function notifyAPI(msgType, value) {
    // skip the call if the value to be sent is very close
    // to the value that we already sent recently
    if (msgType in apiCache) {
        if (Math.abs(apiCache[msgType] - value) < 5)
            return;
        // update cache
        apiCache[msgType] = value;
    }
    
    var Alert = Parse.Object.extend("Alert");
    var alert = new Alert();

    alert.set("device_id", 1);
    alert.set("event_type", msgType);
    alert.set("amount", value);

    alert.save(null, {
      success: function(alert) {
        // Execute any logic that should take place after the object is saved.
        alert('New object created with objectId: ' + alert.id);
      },
      error: function(alert, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        alert('Failed to create new object, with error code: ' + error.message);
      }
    });
}

// Handling async HTTP errors
// http://stackoverflow.com/questions/4328540/how-to-catch-http-client-request-exceptions-in-node-js
process.on('uncaughtException', function (err) {
    console.log(err);
});

// Writes text on the 0 or 1 rows of LED
function writeOnLED(row, text) {
    lcd.setCursor(row, 0);
    
    // A lazy way to clear old text that may be still
    // on the screen
    if (text.length < 16) {
        text+="         ";
    }
    
    lcd.write(text);
}
