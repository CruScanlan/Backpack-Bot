const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const bs = require('binarysearch');
const config = require('../../config.json');
const DB = require('../../functions/db/db');
const fs = require('fs');

const itemQualities = {0:"Normal",1:"Genuine",3:"Vintage",5:"Unusual",6:'Unique',7:"Community",8:"Developer",9:"Self-Made",11:"Strange",12:"Strange",13:"Haunted",14:"Collector's"};

fs.readFile('./data/tf2pricedata.json', 'utf8', (err, data) => {
    if (err) throw err;
    global.pricedata = JSON.parse(data).response.items;
    global.itemnames = Object.keys(pricedata);
});

fs.readFile('./data/tf2itemschema.json', 'utf8', (err, data) => {
    if (err) throw err;
    global.itemschema = JSON.parse(data);
});

module.exports = class TFPriceCheckCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tfpc',
            aliases: ['teamfortresspricecheck','tfpricecheck','teamfortresspc'],
            group: 'tf2',
            memberName: 'tfpc',
            description: 'Get The Current Price For A TF2 Item',
            details: 'Check the price of any item in TF2 that is not an unusual.',
            examples: [`${client.commandPrefix}tfpc hat to kill`,`${client.commandPrefix}tfpc scattergun`],
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 10
            }
        });
        setInterval(function(){//update price data
            fs.readFile('./data/tf2pricedata.json', 'utf8', (err, data) => {
                if (err) throw err;
                pricedata = JSON.parse(data).response.items;
                itemnames = Object.keys(pricedata);
            });
            fs.readFile('./data/tf2itemschema.json', 'utf8', (err, data) => {
                if (err) throw err;
                global.itemschema = JSON.parse(data);
            });
        }, 1000*config.data.DataUpdateTime+10);
    }

    async run(msg,args) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response){
            if(response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });

            if(!args) return msg.reply(`Please Supply An Item To Price Check`);

            let priceNameMatches = [];
            for (let i = 0; i < itemnames.length; i++) {
                if (itemnames[i].toLowerCase().replace(':','').includes(args.toLowerCase())) {
                    priceNameMatches.push(itemnames[i]);
                }
            }
            if(priceNameMatches.length<1) return msg.channel.sendMessage(`Item Not Found :slight_frown:\nTry Removing Any Quality Names Or The Word 'The'`);
            let priceNameFinal = priceNameMatches[bs.closest(priceNameMatches.join("~").toLowerCase().split("~"),args.toLowerCase())];

            let embed = new RichEmbed();
            embed.setTitle(priceNameFinal);
            embed.setDescription("This Is The Current Price(s) For '"+priceNameFinal+"'");
            embed.setColor(675276); //set colour to blue
            embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', 'http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/61/612bfff5e84f0e610e72b424c9fb06a7e72f3914_full.jpg');

            for (let i = 0; i < Object.keys(itemschema.result.items).length; i++) {
                if (itemschema.result.items[i].defindex == pricedata[priceNameFinal].defindex[0]) {
                    embed.setImage(itemschema.result.items[i].image_url);
                    break;
                }
            }

            let priceItemData = pricedata[priceNameFinal].prices;
            let pricesItemQualities = Object.keys(priceItemData);
            for (let i = 0; i < Object.keys(priceItemData).length; i++) {
                if (priceItemData[pricesItemQualities[i]] != undefined && pricesItemQualities[i] != 5) {
                    let tempItemTypeTrade = Object.keys(priceItemData[pricesItemQualities[i]]);
                    for (let p = 0; p < tempItemTypeTrade.length; p++) {
                        let tempItemTypeCraft = Object.keys(priceItemData[pricesItemQualities[i]][tempItemTypeTrade[p]]);
                        for (let q = 0; q < tempItemTypeCraft.length; q++) {
                            let tempItemData = priceItemData[pricesItemQualities[i]][tempItemTypeTrade[p]][tempItemTypeCraft[q]][0];
                            embed.addField(tempItemTypeTrade[p]+" - "+tempItemTypeCraft[q]+" - "+itemQualities[pricesItemQualities[i]], tempItemData.value+" "+tempItemData.currency,false);
                        }
                    }
                }
            }

            priceNameMatches = [];
            DB.DBChangeData(msg.guild.id,{"DataPCQuery":1});
            return msg.channel.sendEmbed(embed);
        });
    };
};