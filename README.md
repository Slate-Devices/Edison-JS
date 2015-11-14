Plate. Test App
============================
A simple node.js application supposed to be cool to show up on the Intel's IoT hackathon in Tomsk.

API documentation
=======
The thing may notify REST API with following messages:

http://example.com/api/123/launch/1
http://example.com/api/123/noise/26
http://example.com/api/123/light/20
http://example.com/api/123/temp/24
http://example.com/api/123/keepalive/1

where format is
http://example.com/api/{DEVICE_ID}/{EVENT_TYPE}/{AMOUNT}

events:
- launch - the thing was powered on
- noise - some noise about the threshold
- light - amount of light
- temp - temperature
- keepalive - let the server know that the thing is alive, once per minute(!)

noise, light and temp events are occured only if the value received from a corresponding sensor has changed.
