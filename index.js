import {Server} from './classes/Server.js';
import os from "os-utils";
import qrcode from 'qrcode-terminal';

//console.log(process.argv);
Server.init();
Server.start();
