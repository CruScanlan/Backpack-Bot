const { Command } = require('discord.js-commando');
const request = require('request');
const { RichEmbed } = require('discord.js');
const config = require('../../../config.json');
const DB = require('../../functions/db/db');

module.exports = class TFCurrencyCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tfcurrency',
            aliases: ['tfc'],
            group: 'tf2',
            memberName: 'tfcurrency',
            description: 'Get The Current Currency Prices',
            details: 'Check the current currency prices for TF2 such as key price, ear bud price, metal price in USD and the craft hat price',
            guildOnly: true,
            throttling: {
                usages: 1,
                duration: 10
            }
        });
    }

    async run(msg) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response){
            if(response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });
            request('http://localhost:3000/api/currencyCheck',
                function (error, response, body) {
                    if (!error && response.statusCode == 200 && JSON.parse(body).response.success == 1) {
                        let currencyData = JSON.parse(body).response.data;
                        let embed = new RichEmbed();
                        embed.setTitle(`TF2 Currency`);
                        embed.setDescription(`Here Is The Current Currency Prices`);
                        embed.setColor(14938114); //yellow
                        embed.setThumbnail('http://i.imgur.com/H9FZ0yU.png');
                        let changeData = [currencyData.metal.price.difference,currencyData.hat.price.difference,currencyData.keys.price.difference,currencyData.earbuds.price.difference];
                        let priceChange = [];
                        for(let i=0; i<changeData.length;i++) {
                            if(changeData[i] != null)   {
                                if(changeData[i] >= 0)    {
                                    priceChange.push("▲");
                                }   else    {
                                    priceChange.push("▼");
                                }
                            }   else    {
                                priceChange.push("");
                            }
                        }
                        embed.addField(`Metal`,`${priceChange[0]} ${currencyData.metal.price.value} ${currencyData.metal.price.currency}`,true);
                        embed.addField(`Hat`,`${priceChange[1]} ${currencyData.hat.price.value} ${currencyData.hat.price.currency}`,true);
                        embed.addField(`Keys`,`${priceChange[2]} ${currencyData.keys.price.value} ${currencyData.keys.price.currency}`,true);
                        embed.addField(`Ear Buds`,`${priceChange[3]} ${currencyData.earbuds.price.value} ${currencyData.earbuds.price.currency}`,true);
                        embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', 'http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/61/612bfff5e84f0e610e72b424c9fb06a7e72f3914_full.jpg');
                        DB.DBChangeData(msg.guild.id,{"DataCQuery":1});
                        return msg.channel.sendEmbed(embed);
                    } else {
                        return msg.reply(`Data could not be retrieved at this time, sorry for the inconvenience`);
                    }
                })
        });
    };
};