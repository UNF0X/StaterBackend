const Server = require('./classes/Server')
const ngrok = require('ngrok');
const os 	= require('os-utils');
const qrcode = require("qrcode-terminal");

Server.init();
Server.start();
