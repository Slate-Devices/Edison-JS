// Init stuff
var http = require('http');

// Log the plate's launch
notifyAPI("launch", 1);


function notifyAPI(msgType, value) {
    // Yes, it is hardcoded, baby!
    var deviceId = "123";
    var url = "http://example.com/api/" + deviceId + "/" + msgType + "/" + value;

    http.get(url, function(res) {
      console.log("Response from API: " + res.statusCode);
    }).on('error', function(e) {
      console.log("Error from API: " + e.message);
    });
}
