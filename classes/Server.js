
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import express from 'express';
import os from "os-utils";
import getos from 'getos';
import os2 from 'os';
import API from './API.js';
import cors from 'cors';
const configFile = 'configuration.json';
import checkDiskSpace from 'check-disk-space';
import argv from 'yargs';
const isWin = process.platform === "win32";
import psList from 'ps-list';
import ngrok from '@ngrok/ngrok';
import {tunnelmole} from "tunnelmole";


export class Server{
    static server = express();
    static connection;
    static serverURL;
    static port;
    static configurationData;

    static createQR = async (port, secretKey, newServer) => {
        return new Promise((resolve, reject) => {

            tunnelmole({
                port: port
            }).then(url => {
                this.serverURL = url;
                console.log(url);
                /*  if (this.configurationData['user_id']) {*/
                !newServer && console.log('[INFO]: Отправка нового URl для доступа к статистике на сервер...');
                API.request('updateURL', {
                    secretKey: this.configurationData['secretKey'],
                    user_id: this.configurationData['user_id'] || process.argv[2],
                    url: url
                }).then(data => {
                    !newServer && console.log('[INFO]: URL успешно обновлен.');
                    resolve();
                }).catch(error => {
                    console.log('[ERROR]: Не удалось обновить URL. Требуется перепривязка');
                    ngrok.kill();
                    fs.unlinkSync(configFile);
                    process.exit(1)
                })
                //  }
                /*qrcode.generate(JSON.stringify({
                    serverUrl: url,
                    secretKey: secretKey
                }), function (qrcode) {
                    console.log(qrcode);
                    console.log("[Stater]: Отсканируйте этот QR-код из сервиса для привязки!")`
                });*/
            });
        })
    }

    static addServer = (url) => {
        return new Promise((resolve, reject) => {
            os.cpuUsage((cpuUsage) => {
                os.cpuFree((cpuFree) => {
                    getos(async (e,osData) => {
                        //   if (req.query.user_id && !this.configurationData['user_id']) {
                        // this.configurationData['user_id'] = req.query.user_id;
                        //fs.writeFileSync(configFile, JSON.stringify(this.configurationData));
                        // console.log('[INFO]: К серверу привязан пользователь ' + req.query.user_id);
                        console.log(process.argv[2]);
                        API.request('addServer', {
                            os: JSON.stringify(osData),
                            title: os2.hostname(),
                            secretKey: this.configurationData['secretKey'],
                            url: url,
                            user_id: process.argv[2]
                        });

                        console.log('Сервер успешно привязан к пользователю: '+process.argv[2]);
                    //    console.log('[ВАЖНО]: Для привязки сервера необходимо перейти по ссылке и нажать кнопку «Начать»');
                      // console.log('https://t.me/monify_bot?start='+this.configurationData['secretKey']);
                        resolve(true)
                        //   }
                    })
                })
            })
        })
    }

    static init = () => {


     /*   setInterval(async () => {
            await ngrok.disconnect();
            await ngrok.kill();
            Server.createQR(this.port, this.configurationData.secretKey)
        }, ((3600*2)*1000));*/
        this.server.use(cors());
        console.log("[Stater]: Инициализация...")
        this.server.get('/getLoad', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            os.cpuUsage((cpuUsage) => {
                os.cpuFree((cpuFree) => {
                    getos(async (e,osData) => {

                        if(req.query.user_id && !this.configurationData['user_id']){
                            this.configurationData['user_id']=req.query.user_id;
                            fs.writeFileSync(configFile, JSON.stringify(this.configurationData));
                            console.log('[INFO]: К серверу привязан пользователь '+req.query.user_id);
                            API.request('addServer', {
                                user_id: req.query.user_id,
                                os: JSON.stringify(osData),
                                title: os2.hostname(),
                                secretKey: this.configurationData['secretKey'],
                                url: this.serverURL,
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

    static start = async () => {
        let newServer = false;

        if (fs.existsSync(configFile)) {
            this.configurationData = JSON.parse(fs.readFileSync(configFile).toString());
        } else {
            this.configurationData = {
                secretKey: Math.random().toString(36).substring(2, 15)
            };
            fs.writeFileSync(configFile, JSON.stringify(this.configurationData));
            newServer = true;
            const url = await tunnelmole({
                port: this.port
            })
            await this.addServer(url);
        }
        console.log("[Stater]: Запуск сервера");
            if (argv.port) {
                this.connection = this.server.listen(argv.port, () => {
                    this.port = this.connection.address().port;
                    this.createQR(this.port, this.configurationData.secretKey, newServer);
                })
            } else {
                this.connection = this.server.listen(() => {
                    this.port = this.connection.address().port;
                    this.createQR(this.port, this.configurationData.secretKey, newServer);
                })
            }
        }
}
