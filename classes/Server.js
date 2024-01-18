import fs from 'fs';
import express from 'express';
import os from "os-utils";
import getos from 'getos';
import os2 from 'os';
import API from './API.js';
import cors from 'cors';
import checkDiskSpace from 'check-disk-space';
import argv from 'yargs';
import psList from 'ps-list';
import {tunnelmole} from "tunnelmole";

const configFile = 'configuration.json';
const isWin = process.platform === "win32";


const VERSION = '1.0.0';

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
                        console.log(process.argv[3]);
                        API.request('addServer', {
                            os: JSON.stringify(osData),
                            title: os2.hostname(),
                            secretKey: this.configurationData['secretKey'],
                            url: url,
                            user_id: process.argv[3]
                        });

                        console.log('Сервер успешно привязан к пользователю: '+process.argv[3]);
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
                            title: os2.hostname(),
                            diskSpace: diskSpace,
                            diskSpacePercent: ((100 / diskSpace.size) * diskSpace.free).toFixed(0),
                            processes: await psList(),
                            version: VERSION
                        }))
                    })
                })
            });
        });

        function getDirectories(path) {
            return fs.readdirSync(path).filter(function (file) {
                return fs.statSync(path+'/'+file).isDirectory();
            });
        }

        this.server.get('/getLogs', async (req, res) => {
            const dirs = getDirectories('/var/log');

            res.setHeader('Content-Type', 'application/json');
            const files = {};
            dirs.map(item => {
                files[item] = {};
                files[item]['file'] = [];
                files[item]['strings'] = [];
                const filesList = fs.readdirSync('/var/log/' + item, {withFileTypes: true})
                    .filter(item => !item.isDirectory())
                    .map(item => item.name)
                filesList.forEach(file => {
                    files[item]['file'][file] = [];
                    try {
                       /* const array = fs.readFileSync('/var/log/' + item + '/' + file).toString().split("\n");
                        files[item][file] = array.slice(-10);*/

                        var lineReader = require('readline').createInterface({
                            input: require('fs').createReadStream('/var/log/' + item + '/' + file)
                        });

                        let lines = []
                        lineReader.on('line', function (line) {
                            lines.push(line.split(","));
                            if (lines.length == 50) {
                                files[item][file] = lines;
                                lines = []
                            }
                        });
                    } catch (e) {
                        console.log(e)
                    }
                });
            })
            res.send(JSON.stringify({
                files
            }));
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
