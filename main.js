// Init stuff
var http = require('http');
var mraa = require('mraa');
var jsUpmI2cLcd  = require ('jsupm_i2clcd'); // LED
var lcd = new jsUpmI2cLcd.Jhd1313m1(0, 0x3E, 0x62); // Init the LCD
var groveSensor = require('jsupm_grove'); // grove sensors
var light = new groveSensor.GroveLight(1); // light sensor
var upmMicrophone = require("jsupm_mic"); // gimme the mic calls
var myMic = new upmMicrophone.Microphone(0);
var threshContext = new upmMicrophone.thresholdContext();

// store last values that we sent to API to reduce
// amount of duplicate date to be sent again
var apiCache = {
    "light": 0,
    "noise": 0
};


// Log the plate's launch
notifyAPI("launch", 1);


// Inform the API that the thing is working
setInterval(function(){
    notifyAPI("keepalive", 1);
}, 60*1000);


// Ask sensors once per 1 second if anything is wrong
setInterval(function(){
    // test light
    var light = getLight();
    notifyAPI("light", light);
    writeOnLED(0, "Light: " + light);
    
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
    var buffer = new upmMicrophone.uint16Array(100);
    var len = myMic.getSampledWindow(2, 100, buffer);
    
    if (len) {
        return myMic.findThreshold(threshContext, threshold, buffer, len);
    }
}

function notifyAPI(msgType, value) {
    // skip the call if the value to be sent is very close
    // to the value that we already sent recently
    if (msgType in apiCache) {
        if (Math.abs(apiCache[msgType] - value) < 5)
            return;
        // update cache
        apiCache[msgType] = value;
    }
    
    // Yes, it is hardcoded, baby!
    var deviceId = "123";
    var url = "http://example.com/api/" + deviceId + "/" + msgType + "/" + value;

    console.log(url);
    http.get(url, function(res) {
      console.log("Response from API: " + res.statusCode);
    }).on('error', function(e) {
      console.log("Error from API: " + e.message);
    });
}

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
