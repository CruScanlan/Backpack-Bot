const config = require('../config.json');
const logging = require('./logging');
const request = require('request');
const fs = require('fs');

module.exports = {
    updatePriceData:    function()  {
        request(`http://backpack.tf/api/IGetPrices/v4/?key=${config.tokens.backpackapi}&appid=440`, function (error, response, body) {
            if (!error && response.statusCode == 200 && response.statusCode != 429) {
                let itemBodyParsed = JSON.parse(body);
                if(JSON.parse(body).response.success != 1)  return logging.logTime(`ERROR: Price Data Can Not Be Requested At This Time`);
                request('https://backpack.tf/api/IGetCurrencies/v1/?key='+config.tokens.backpackapi, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        let currencies = JSON.parse(body).response.currencies;
                        let data = {items:itemBodyParsed.response.items,currencies:currencies};
                        fs.writeFile('api/data/tf2pricedata.json', JSON.stringify(data), (err) => {
                            if (err) throw err;
                            return logging.logTime(`Price Data Saved`);
                        });
                        return;
                    }
                    return logging.logTime(`ERROR: Could Not Connect To Backpack.tf API`);
                });
            }   else    {
                return logging.logTime(`ERROR: Could Not Connect To Backpack.tf API`);
            }
        })
    },
    updateItemSchema:   function() {
        request(`http://api.steampowered.com/IEconItems_440/GetSchema/v0001/?key=${config.tokens.steamtoken}`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let bodyParsed = JSON.parse(body);
                let items = [];
                for(let i=0; i< bodyParsed.result.items.length; i++)    {
                    items.push({defindex: bodyParsed.result.items[i].defindex,image_url: bodyParsed.result.items[i].image_url});
                }
                let qualities = swap(bodyParsed.result.qualities);
                qualities["1"] = "Genuine";

                let qualityKeys = Object.keys(qualities);
                for(let i=0;i<qualityKeys.length;i++)   {
                    qualities[qualityKeys[i]] = qualities[qualityKeys[i]].substring(0,1).toUpperCase()+qualities[qualityKeys[i]].substring(1,qualities[qualityKeys[i]].length);
                }

                let itemData = {items:items,qualities:qualities};

                fs.writeFile('api/data/tf2itemschema.json', JSON.stringify(itemData), (err) => {
                    if (err) throw err;
                    return logging.logTime(`Item Schema Images Data Saved`);
                });

                return;
            }
            return logging.logTime(`ERROR: Could Not Connect To Steam API`);
        })
    }
};

function swap(json){
    let ret = {};
    for(let key in json){
        ret[json[key]] = key;
    }
    return ret;
}