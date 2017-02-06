const fs = require('fs');
const bs = require('binarysearch');
const didyoumean = require('didyoumean');
const config = require('../config.json');
const errcodes = require("./errcodes");
const imageHandling = require('./imageHandling');

getLocalData();
setInterval(function(){
    getLocalData();
}, config.data.DataUpdateTime+10000);

module.exports = {
    tf2itemCheck: function(name,quality,options,callback)  { //ITEM CHECKING
        let data = [];
        let priceNameMatches = getPriceNameMatches(name.trim().replace( /  +/g, ' ' ));
        if(priceNameMatches.length<1)   return callback({errcode:106,errmsg:errcodes.tf2itemcheck.code106},null);
        let priceNameFinal = priceNameMatches[bs.closest(priceNameMatches.join("~").toLowerCase().split("~"),name.trim().toLowerCase().replace( /  +/g, ' ' ))];
        let imageURL = getImageURL(priceNameFinal);

        if(options.allqualities == true) {
            let priceItemData = pricedata[priceNameFinal].prices;
            let pricesItemQualities = Object.keys(priceItemData);
            for(let i=0; i<pricesItemQualities.length; i++)    {
                if(pricesItemQualities[i] == 5) continue;
                if(priceItemData[pricesItemQualities[i]] != undefined)  {
                    let tempItemTypeTrade = Object.keys(priceItemData[pricesItemQualities[i]]);
                    for(let p=0; p<tempItemTypeTrade.length; p++)  {
                        let tempItemTypeCraft = Object.keys(priceItemData[pricesItemQualities[i]][tempItemTypeTrade[p]]);
                        for (let q = 0; q < tempItemTypeCraft.length; q++) {
                            let tempItemData = priceItemData[pricesItemQualities[i]][tempItemTypeTrade[p]][tempItemTypeCraft[q]][0];
                            let changeData = tempItemData.difference;
                            let priceChange = "";
                            if(changeData == null)  {
                                priceChange = null;
                            }   else if(changeData >= 0)    {
                                priceChange = true;
                            }   else    {
                                priceChange = false;
                            }
                            data.push({tradetype:tempItemTypeTrade[p],
                                crafttype:tempItemTypeCraft[q],
                                qualitytype:itemQualities[pricesItemQualities[i]],
                                backpacktflink: `http://backpack.tf/stats/${itemQualities[pricesItemQualities[i]]}/${priceNameFinal.split(" ").join("%20")}/${tempItemTypeTrade[p]}/${tempItemTypeCraft[q]}/0`,
                                difference:priceChange,
                                value:{
                                    value:tempItemData.value,
                                    valuecurrency: tempItemData.currency
                                }
                            });
                        }
                    }
                }
            }
            return callback(null,{response:{success:true,item:priceNameFinal,itemurl:imageURL,data}});
        }   else    {
            if(quality == undefined) return callback({errcode:105,errmsg:errcodes.tf2itemcheck.code105},null);
            let priceItemData = pricedata[priceNameFinal].prices;

            let finalQuality = "";
            if(quality == "")   {
                finalQuality = "6";
            }   else    {
                let itemQualitiesSwapped = swap(itemQualities);
                finalQuality = bs.closest(Object.keys(itemQualitiesSwapped).join("~").toLowerCase().split("~"),quality.trim().toLowerCase().replace( /  +/g, ' ' ));
            }
            if(priceItemData[finalQuality] == undefined)    return callback({errcode:110,errmsg:errcodes.code110},null);

            if(options.allothertypes == true) {
                let tempItemTypeTrade = Object.keys(priceItemData[finalQuality]);
                if(tempItemTypeTrade.length<1) return callback({errcode:110,errmsg:errcodes.code110},null);
                for (let p = 0; p < tempItemTypeTrade.length; p++) {
                    let tempItemTypeCraft = Object.keys(priceItemData[finalQuality][tempItemTypeTrade[p]]);
                    for (let q = 0; q < tempItemTypeCraft.length; q++) {
                        let tempItemData = priceItemData[finalQuality][tempItemTypeTrade[p]][tempItemTypeCraft[q]][0];
                        let changeData = tempItemData.difference;
                        let priceChange = "";
                        if (changeData == null) {
                            priceChange = null;
                        } else if (changeData >= 0) {
                            priceChange = true;
                        } else {
                            priceChange = false;
                        }
                        data.push({
                            tradetype: tempItemTypeTrade[p],
                            crafttype: tempItemTypeCraft[q],
                            qualitytype: itemQualities[finalQuality],
                            backpacktflink: `http://backpack.tf/stats/${itemQualities[finalQuality]}/${priceNameFinal.split(" ").join("%20")}/${tempItemTypeTrade[p]}/${tempItemTypeCraft[q]}/0`,
                            difference: priceChange,
                            value: {
                                value:tempItemData.value,
                                valuecurrency: tempItemData.currency
                            }
                        });
                    }
                }
            }   else    {
                if(priceItemData[finalQuality]["Tradable"] == undefined)    return callback({errcode:109,errmsg:errcodes.code109},null);
                if(priceItemData[finalQuality]["Tradable"]["Craftable"] == undefined)    return callback({errcode:109,errmsg:errcodes.code109},null);
                let changeData = priceItemData[finalQuality]["Tradable"]["Craftable"][0].difference;
                let priceChange = "";
                if (changeData == null) {
                    priceChange = null;
                } else if (changeData >= 0) {
                    priceChange = true;
                } else {
                    priceChange = false;
                }

                data.push({
                    tradetype: "Tradable",
                    crafttype: "Craftable",
                    qualitytype: itemQualities[finalQuality],
                    backpacktflink: `http://backpack.tf/stats/${itemQualities[finalQuality]}/${priceNameFinal.split(" ").join("%20")}/Tradable/Craftable/0`,
                    difference: priceChange,
                    value: {
                        value: priceItemData[finalQuality]["Tradable"]["Craftable"][0].value,
                        valuecurrency: priceItemData[finalQuality]["Tradable"]["Craftable"][0].currency
                    }
                });
            }
        }
        return callback(null,{response:{success:true,item:priceNameFinal,itemurl:imageURL,data}});
    },//END ITEM CHECK FUNCTION
    tf2currencyCheck:  function(callback)  {
        if(currencydata == undefined)   return callback({errcode:201,errmsg:errcodes.tf2currencycheck.code201},null);
        return callback(null,{response:{success:true,data:currencydata}});
    },//END CURRENCY CHECK FUNCTION
    tf2unusualCheck:   function(name,effect,options,callback)  {
        let priceNameMatches = getPriceNameMatches(name.trim().replace( /  +/g, ' ' ));
        let effectNameMatches = getEffectNameMatches(effect.trim().replace( /  +/g, ' ' ));

        if(priceNameMatches.length<1) return callback({errcode:305,errmsg:errcodes.tf2unusualcheck.code305},null);
        if(effectNameMatches.length<1) return callback({errcode:306,errmsg:errcodes.tf2unusualcheck.code306},null);

        let priceNameFinal = priceNameMatches[bs.closest(priceNameMatches.join("~").toLowerCase().split("~"),name.toLowerCase().trim().replace( /  +/g, ' ' ))];
        let effectNameFinal = effectNameMatches[bs.closest(effectNameMatches.join("~").toLowerCase().split("~"),effect.toLowerCase().trim().replace( /  +/g, ' ' ))];

        let priceItemData = pricedata[priceNameFinal].prices["5"];

        if(priceItemData == undefined)  return callback({errcode:308,errmsg:errcodes.tf2unusualcheck.code308,extra:{item:priceNameFinal,effect:effectNameFinal}},null);

        let itemdata = [];
        let effectID = 0;
        for(let i=0; i< Object.keys(priceItemData).length; i++) {
            let tempItemTypeTrade = priceItemData[Object.keys(priceItemData)[i]];
            for (let p = 0; p < Object.keys(tempItemTypeTrade).length; p++) {
                effectID = effectids[effectnames.indexOf(effectNameFinal)];
                let itemData = tempItemTypeTrade[Object.keys(tempItemTypeTrade)[p]][effectID];
                if(itemData == undefined) return callback({errcode:307,errmsg:errcodes.tf2unusualcheck.code307,extra:{item:priceNameFinal,effect:effectNameFinal}},null);
                let changeData = itemData.difference;
                let priceChange = "";
                if (changeData == null) {
                    priceChange = null;
                } else if (changeData >= 0) {
                    priceChange = true;
                } else {
                    priceChange = false;
                }
                itemdata.push({
                    tradetype: Object.keys(priceItemData)[i],
                    crafttype: Object.keys(tempItemTypeTrade)[p],
                    qualitytype: "Unusual",
                    effectid: effectID,
                    backpacktflink: `http://backpack.tf/stats/Unusual/${priceNameFinal.split(" ").join("%20")}/${Object.keys(priceItemData)[i]}/${Object.keys(tempItemTypeTrade)[p]}/${effectID}`,
                    difference: priceChange,
                    value:  {
                        value: itemData.value,
                        valuecurrency: itemData.currency
                    }
                });
            }
        }
        let baseImage = "";
        let baseImageID = "";
        for (let i = 0; i < itemschemaimages.length; i++) {
            if (itemschemaimages[i].defindex == pricedata[priceNameFinal].defindex[0]) {
                baseImage = itemschemaimages[i].image_url;
                baseImageID = itemschemaimages[i].defindex;
                break;
            }
        }
        priceNameMatches = [];

        if(options.imageurl == true)    {
            imageHandling.getUnusualImage(baseImage,baseImageID,effectID,function(imageurl){
                console.log(imageurl);
                return callback(null,{response:{success:true,item:priceNameFinal,effect:effectNameFinal,effectid:effectID,itemurl:imageurl,data:itemdata}});
            });
        }   else    {
            return callback(null,{response:{success:true,item:priceNameFinal,effect:effectNameFinal,effectid:effectID,data:itemdata}});
        }

    },//END UNUSUAL PRICE CHECK
    stats:  function(callback) {
        return callback(null,{response:{success:true,data:{totaltf2items:Object.keys(pricedata).length}}});
    },//END STATS
    opcsItemCheck:  function(name,callback)  {
        let itemname = didyoumean(name.trim().replace( /  +/g, ' ' ),opcsitemnames);
        if(itemname == null) return callback({errcode:402,errmsg:errcodes.opcsitemcheck.code402},null);

        let data = {};
        for(let i=0; i<opcsitemnames.length;i++)    {
            if(opcsitemdata[i][itemname] != undefined) {
                data = opcsitemdata[i][itemname];
                break;
            }
        }

        return callback(null,{response:{success:true,item:data.name,itemurl:data.itemurl,data:data.data}});
    }
};

function getPriceNameMatches(name)  {
    let finalNames = [];
    for (let i = 0; i < itemnames.length; i++) {
        if (itemnames[i].toLowerCase().replace(/:|'/,'').includes(name.trim().toLowerCase()) || itemnames[i].toLowerCase().replace(/:/,'').includes(name.trim().toLowerCase()) || itemnames[i].toLowerCase().includes(name.trim().toLowerCase())) {
            finalNames.push(itemnames[i]);
        }
    }
    return finalNames;
}

function getEffectNameMatches(effectname)   {
    let finalEffects = [];
    for (let i = 0; i < effectnames.length; i++) {
        if (effectnames[i].toLowerCase().includes(effectname.trim().toLowerCase()) || effectnames[i].toLowerCase().replace("'","").includes(effectname.trim().toLowerCase())) {
            finalEffects.push(effectnames[i]);
        }
    }
    return finalEffects;
}

function getImageURL(name)  {
    for (let i = 0; i < itemschemaimages.length; i++) {
        if (itemschemaimages[i].defindex == pricedata[name].defindex[0]) {
            return itemschemaimages[i].image_url;
        }
    }
}

function swap(json){
    let ret = {};
    for(let key in json){
        ret[json[key]] = key;
    }
    return ret;
}

function getLocalData() {
    fs.readFile('./api/data/tf2pricedata.json', 'utf8', (err, data) => {
        if (err) throw err;
        global.pricedata = JSON.parse(data).items;
        global.itemnames = Object.keys(pricedata);
        global.currencydata = JSON.parse(data).currencies;
    });

    fs.readFile('./api/data/tf2itemschema.json', 'utf8', (err, data) => {
        if (err) throw err;
        let jsonParsed = JSON.parse(data);
        global.itemschemaimages = jsonParsed.items;
        global.itemQualities = jsonParsed.qualities;
    });

    fs.readFile('./api/data/opskinscsgo.json', 'utf8', (err, data) => {
        if (err) throw err;
        let jsonParsed = JSON.parse(data).items;
        global.opcsitemnames = [];
        global.opcsitemdata = jsonParsed;
        for(let i=0; i<opcsitemdata.length;i++) {
            opcsitemnames.push(Object.keys(opcsitemdata[i])[0])
        }
    });

    fs.readFile('./api/data/tf2itemeffects.json', 'utf8', (err, data) => {
        if (err) throw err;
        let itemschemaeffects = JSON.parse(data);
        global.effectnames = [];
        global.effectids = [];
        for(let i=0; i<itemschemaeffects.items.length; i++) {
            effectnames.push(itemschemaeffects.items[i].name);
            effectids.push(itemschemaeffects.items[i].id);
        }
    });
}