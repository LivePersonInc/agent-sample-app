"use strict";
let config = {
  "lesession" : {
    "csdsDomain"   : "https://adminlogin.liveperson.net",
    "refreshDelay" : 5 * 60 * 1000 // 5 minutes
  },
  "chat"      : {
    pingInterval    : 2, // chat ping interval in seconds
    minLineWaitTime : 1 //minimum time to type a line in ms
  },
  "account" : "51007909",
  "alpha"   : "72740529",
  "support" : "34466921",
  "users"   : {
    "bastion" : {
      "login_name" : "Bastion",
      "email"      : "bastion@yourmercymain.com",
      "username"   : "Bastion",
      "name"       : "Bastion Turret",
      "password"   : "Munitioned1157!"
    }
  }
};

module.exports = config;

