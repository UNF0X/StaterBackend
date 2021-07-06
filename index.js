const Server = require('./classes/Server')
const ngrok = require('ngrok');
const os 	= require('os-utils');
const qrcode = require("qrcode-terminal");

//console.log(process.argv);
Server.init();
Server.start();
