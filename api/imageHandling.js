const request = require('request');
const fs = require('fs');
const jimp = require("jimp");

const config = require('../config.json');

module.exports = {
    getUnusualImage: function(baseImageURL,baseID,effectID,callback) {
        getBaseImage();

        function getBaseImage() {
            if(!fs.existsSync(`./api/data/image_cache/base/base_${baseID}_128x128.png`)) {
                request(baseImageURL, {encoding: 'binary'}, function(error, response, body) {
                    fs.writeFile(`./api/data/image_cache/base/base_${baseID}_128x128.png`, body, 'binary', function (err) {
                        if(err) throw err;
                        getEffectImage()
                    });
                });
            }   else    {
                getEffectImage()
            }
        }

        function getEffectImage()   {
            if(!fs.existsSync(`./api/data/image_cache/effect/effect_${effectID}_188x188.png`)) {
                request(`http://backpack.tf/images/440/particles/${effectID}_188x188.png`, {encoding: 'binary'}, function(error, response, body) {
                    fs.writeFile(`./api/data/image_cache/effect/effect_${effectID}_188x188.png`, body, 'binary', function (err) {
                        if(err) throw err;
                        getUnusualImage()
                    });
                });
            }   else    {
                getUnusualImage()
            }
        }

        function getUnusualImage()  {
            if(!fs.existsSync(`./api/data/image_cache/unusual/unusual_${baseID}_${effectID}_128x128.png`)) {
                createUnusualImage();
            }   else    {
                return callback(`http://${config.ip}/api/images/unusual/unusual_${baseID}_${effectID}_128x128.png`);
            }
        }

        function createUnusualImage()   {
            jimp.read(`./api/data/image_cache/base/base_${baseID}_128x128.png`, function (err, base) {
                if (err) throw err;
                jimp.read(`./api/data/image_cache/effect/effect_${effectID}_188x188.png`, function (error, effect) {
                    if (error) throw error;
                    base.quality(100);
                    effect.resize(128, 128).quality(100).composite(base,0,0);
                    effect.write(`./api/data/image_cache/unusual/unusual_${baseID}_${effectID}_128x128.png`);
                    return callback(`http://${config.ip}/api/images/unusual/unusual_${baseID}_${effectID}_128x128.png`);
                });
            });
        }
    }
};