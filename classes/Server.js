const ngrok = require('ngrok');
const qrcode = require("qrcode-terminal");
const fs = require('fs');
const express = require('express');
const os = require("os-utils");
const getos = require('getos')
const os2 = require('os');
const cors = require('cors');
const configFile = 'configuration.json';

module.exports = class Server{
    static server = express();
    static connection;
    static configurationData;

    static createQR = (port, secretKey) => {
        ngrok.connect(port).then((url) => {
            console.log(url);
            qrcode.generate(JSON.stringify({
                serverUrl: url,
                secretKey: secretKey
            }), function (qrcode) {
                console.log(qrcode);
                console.log("[Stater]: Отсканируйте этот QR-код из сервиса для привязки!")
            });
        });
    }

    static init = () => {
        this.server.use(cors());
        console.log("[Stater]: Инициализация...")
        this.server.get('/getLoad', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            os.cpuUsage((cpuUsage) => {
                os.cpuFree((cpuFree) => {
                    getos((e,osData) => {
                        res.send(JSON.stringify({
                            platform: os.platform(),
                            cpuUsage: cpuUsage,
                            cpuCount: os.cpuCount(),
                            cpuFree: cpuFree,
                            totalMem: os.totalmem(),
                            freemem: os.freemem(),
                            freememPercentage: os.freememPercentage(),
                            serverUptime: os.processUptime(),
                            systemUptime: os.sysUptime(),
                            os: osData,
                        }))
                    })
                })
            });
        });
    }

    static start = () => {

        if(fs.existsSync(configFile)){
            this.configurationData = JSON.parse(fs.readFileSync(configFile).toString());
        }else{
            this.configurationData = {
              secretKey:  Math.random().toString(36).substring(2, 15)
            };
            fs.writeFileSync(configFile, JSON.stringify(this.configurationData));
        }
        console.log("[Stater]: Запуск сервера")
        this.connection = this.server.listen(() => {
            let port = this.connection.address().port;
            this.createQR(port, this.configurationData.secretKey);
        })
    }
}