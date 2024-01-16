import {Server} from './classes/Server.js';
import ngrok from 'ngrok';
import os from "os-utils";
import qrcode from 'qrcode-terminal';

//console.log(process.argv);
Server.init();
Server.start();
