const { Command } = require('discord.js-commando');
const request = require('request');
const { RichEmbed } = require('discord.js');
const config = require('../../config.json');
const logging = require('../../functions/util/logging');
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
            request('https://backpack.tf/api/IGetCurrencies/v1/?key='+config.tokens.backpackapi,
                function (error, response, body) {
                    if (!error && response.statusCode == 200 && JSON.parse(body).response.success == 1) {
                        let currencyData = JSON.parse(body).response.currencies;
                        let embed = new RichEmbed();
                        embed.setTitle(`TF2 Currency`);
                        embed.setDescription(`Here Is The Current Currency Prices`);
                        embed.setColor(14938114); //yellow
                        embed.setThumbnail('http://i.imgur.com/H9FZ0yU.png');
                        embed.addField(`Metal`,`${currencyData.metal.price.value} ${currencyData.metal.price.currency}`,true);
                        embed.addField(`Hat`,`${currencyData.hat.price.value} ${currencyData.hat.price.currency}`,true);
                        embed.addField(`Keys`,`${currencyData.keys.price.value} ${currencyData.keys.price.currency}`,true);
                        embed.addField(`Ear Buds`,`${currencyData.earbuds.price.value} ${currencyData.earbuds.price.currency}`,true);
                        embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', 'http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/61/612bfff5e84f0e610e72b424c9fb06a7e72f3914_full.jpg');
                        DB.DBChangeData(msg.guild.id,{"DataCQuery":1});
                        return msg.channel.sendEmbed(embed);
                    } else {
                        logging.logTime(`ERROR: Could Not Connnect To backpack.tf API`);
                        return msg.reply(`ERROR: Could Not Connnect To backpack.tf API`);
                    }
                })
        });
    };
};