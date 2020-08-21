const ngrok = require('ngrok');
const qrcode = require("qrcode-terminal");
const fs = require('fs');
const express = require('express');
const os = require("os-utils");
const getos = require('getos')
const os2 = require('os');
const API = require('./API')
const cors = require('cors');
const configFile = 'configuration.json';
const checkDiskSpace = require('check-disk-space')
const {argv} = require('yargs');
const sqlite = require('sqlite');
const isWin = process.platform === "win32";


module.exports = class Server{
    static server = express();
    static connection;
    static serverURL;
    static port;
    static configurationData;

    static createQR = async (port, secretKey) => {

        ngrok.connect(port).then((url) => {
            if (this.configurationData['vk_user_id']) {
                console.log('[INFO]: Отправка нового URl для доступа к статистике на сервер...');
                API.request('updateURL', {
                    secretKey: this.configurationData['secretKey'],
                    vk_user_id: this.configurationData['vk_user_id'],
                    url: url
                }).then(data => {
                    console.log('[INFO]: URL успешно обновлен.');
                })
            }
            console.log(url);
            this.serverURL = url;
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
        setInterval(async () => {
            await ngrok.disconnect();
            await ngrok.kill();
            Server.createQR(this.port, this.configurationData.secretKey)
        }, ((3600*2)*1000));
        this.server.use(cors());
        console.log("[Stater]: Инициализация...")
        this.server.get('/getLoad', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            os.cpuUsage((cpuUsage) => {
                os.cpuFree((cpuFree) => {
                    getos(async (e,osData) => {

                        if(req.query.vk_user_id && !this.configurationData['vk_user_id']){
                            this.configurationData['vk_user_id']=req.query.vk_user_id;
                            fs.writeFileSync(configFile, JSON.stringify(this.configurationData));
                            console.log('[INFO]: К серверу привязан пользователь '+req.query.vk_user_id);
                            API.request('addServer', {
                                vk_user_id: req.query.vk_user_id,
                                os: JSON.stringify(osData),
                                title: 'Server',
                                secretKey: this.configurationData['secretKey'],
                                url: this.serverURL
                            });
                        }

                        let diskSpace = await checkDiskSpace(isWin ? 'C:/' : '/');
                        let totalMem = os.totalmem();
                        let freeMem = os2.freemem();
                        res.send(JSON.stringify({
                            platform: os.platform(),
                            cpuUsage: cpuUsage,
                            cpuUsagePercents:  (cpuUsage * 100).toFixed(0),
                            cpuCount: os.cpuCount(),
                            cpuFree: cpuFree,
                            totalMem: totalMem,
                            freemem: freeMem,
                            freememPercentage: os.freememPercentage(),
                            memUsagePercents: ((1-os.freememPercentage())*100).toFixed(0),
                            serverUptime: os.processUptime(),
                            systemUptime: os.sysUptime(),
                            os: osData,
                            diskSpace: diskSpace,
                            diskSpacePercent: ((100 / diskSpace.size) * diskSpace.free).toFixed(0),
                            processes: await psList()
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
              secretKey: Math.random().toString(36).substring(2, 15)
            };
            fs.writeFileSync(configFile, JSON.stringify(this.configurationData));
        }
        console.log("[Stater]: Запуск сервера");
        if(argv.port){
            this.connection = this.server.listen(argv.port,() => {
                this.port = this.connection.address().port;
                this.createQR(this.port, this.configurationData.secretKey);
            })
        }else{
            this.connection = this.server.listen(() => {
                this.port = this.connection.address().port;
                this.createQR(this.port, this.configurationData.secretKey);
            })
        }
    }
}