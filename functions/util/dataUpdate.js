const tf2profile = require(`../../commands/tf2/tf2profile`);
const config = require('../../config.json');
const logging = require('../../functions/util/logging');
const request = require('request');
const fs = require('fs');

module.exports = {
    updatePriceData:    function()  {
        request(`http://backpack.tf/api/IGetPrices/v4/?key=${config.tokens.backpackapi}&appid=440`, function (error, response, body) {
            if (!error && response.statusCode == 200 || 429) {
                if(JSON.parse(body).response.success != 1)  return logging.logTime(`ERROR: Price Data Can Not Be Requested At This Time`);
                fs.writeFile('data/tf2pricedata.json', 'utf8',body, (err) => {
                    if (err) throw err;
                    return logging.logTime(`Price Data Saved`);
                });
                return;
            }
            return logging.logTime(`ERROR: Could Not Connect To Backpack.tf API`);
        })
    },
    updateItemSchema:   function() {
        request(`http://api.steampowered.com/IEconItems_440/GetSchema/v0001/?key=${config.tokens.steamtoken}`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                fs.writeFile('data/tf2itemschema.json', 'utf8',body, (err) => {
                    if (err) throw err;
                    return logging.logTime(`Item Schema Data Saved`);
                });
                return;
            }
            return logging.logTime(`ERROR: Could Not Connect To Steam API`);
        })
    }
};