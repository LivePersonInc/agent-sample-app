
"use strict";
var config={
    "lesession" : {
        "csdsDomain" : "https://adminlogin.liveperson.net",
        "refreshDelay" : 5 * 60 * 1000 // 5 minutes
    },
    "chat" : {
        pingInterval : 2, // chat ping interval in seconds
        minLineWaitTime : 1 //minimum time to type a line in ms
    }
};

module.exports = config;

