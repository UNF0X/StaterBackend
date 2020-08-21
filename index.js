const Server = require('./classes/Server')
const ngrok = require('ngrok');
const os 	= require('os-utils');
const qrcode = require("qrcode-terminal");
const localtunnel = require('localtunnel');
(async () => {
    await localtunnel(12321, {}, (tunnel) => {
        console.log(tunnel)
        // the assigned public url for your tunnel
        // i.e. https://abcdefgjhij.localtunnel.me
        console.log(tunnel.url);

        tunnel.on('close', () => {
            // tunnels are closed
        });
    });
})();
Server.init();
Server.start();