import querystring from 'querystring';
import fetch from "node-fetch";

const REQUEST_URL = 'https://chisa.unf0x.ru/monify/bot/';

class API {

    bindThis = (variable) => {
        this.This = variable;
    }

    async request(apiMethod, params = {}, method='GET') {
        return new Promise((resolve, reject) => {
            let config = {
                method: method,
            };

            let url = REQUEST_URL; /*+ '/' + apiMethod;*/
          //  console.log(url)
          /*  if (method === 'POST') {
                config.body = JSON.stringify(params)
            } else {
                url += '?' + querystring.stringify(params);
            }*/

            url += '?method=' + apiMethod + '&' + querystring.stringify(params);

            fetch(url, config).then(data => {
                data.text().then((text) => {
                    const JsonData = JSON.parse(text);
                    if(JsonData.response){
                        resolve(JsonData);
                    }else if(JsonData.error){
                        reject(JsonData)
                    }else{
                        resolve(JsonData);
                    }

                });
            }).catch((error) => {
                console.log(error)
            });

        })
    }
}

export default new API();
