const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const request = require('request');
const config = require('../../../config.json');
const DB = require('../../functions/db/db');

module.exports = class TFUnusualPriceCheckCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tfupc',
            aliases: ['teamfortressunusualpricecheck','tfunusualpricecheck','teamfortressunusualpc'],
            group: 'tf2',
            memberName: 'tfupc',
            description: 'Get The Current Price For A Unusual TF2 Item',
            details: 'Check the price of any item in TF2 that is unusual.',
            examples: [`${client.commandPrefix}tfpc hat to kill`,`${client.commandPrefix}tfpc scattergun`],
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 10
            }
        });
    }

    async run(msg,args) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response){
            if(response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });

            let userEffectName = args.split(';').slice(0,1).join('').trim().toLowerCase();
            let userItemName = args.split(';').slice(1,2).join('').trim().toLowerCase();

            if(!userEffectName) return msg.reply(`Please Supply An Unusual Effect Name To Price Check,\nExample: ${msg.client.commandPrefix}tfupc Aces High ; Hat Of Cards`);
            if(!userItemName) return msg.reply(`Please Supply An Item Name To Price Check,\nExample: ${msg.client.commandPrefix}tfupc Aces High ; Hat Of Cards`);

            request.post({
                url: 'http://localhost:3000/api/unusualPriceCheck',
                json: true,
                body: {
                    "name":	userItemName,
                    "effect":	userEffectName,
                    "options":	{
                        "imageurl": true
                    }
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let bodyparsed = body.response;
                    if(bodyparsed.success != 1) {
                        if(bodyparsed.error.errorcode == 301)   return msg.reply(`Please Supply An Unusual Effect Name To Price Check,\nExample: ${msg.client.commandPrefix}tfupc Aces High ; Hat Of Cards`);
                        if(bodyparsed.error.errorcode == 302)   return msg.reply(`Please Supply An Item Name To Price Check,\nExample: ${msg.client.commandPrefix}tfupc Aces High ; Hat Of Cards`);
                        if(bodyparsed.error.errorcode == 305)   return msg.reply(`Item Not Found :confused:\nTry Removing Any Quality Names Or The Word 'The'`);
                        if(bodyparsed.error.errorcode == 306)   return msg.reply(`Unusual Effect Not Found :confused:\nTry Removing Any Quality Names Or The Word 'The'`);
                        if(bodyparsed.error.errorcode == 307)   return msg.reply(`There is no such thing as a '${bodyparsed.error.errorextra.effect} ${bodyparsed.error.errorextra.item}'. YOU FOOL!`);
                        if(bodyparsed.error.errorcode == 308)   return msg.reply(`There is no such thing as an unusual '${bodyparsed.error.errorextra.item}'`);
                        return msg.reply(`Error Code: ${bodyparsed.error.errorcode}, Error: ${bodyparsed.error.errormessage}`);
                    }


                    let embed = new RichEmbed();
                    embed.setTitle(`${bodyparsed.effect} ${bodyparsed.item}`);
                    embed.setDescription(`This Is The Price For The '${bodyparsed.effect} ${bodyparsed.item}',`);
                    embed.setColor(675276); //set colour to blue
                    embed.setImage(bodyparsed.itemurl);
                    embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', 'http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/61/612bfff5e84f0e610e72b424c9fb06a7e72f3914_full.jpg');

                    for(let i=0; i<bodyparsed.data.length; i++) {
                        let difference = "";
                        if(bodyparsed.data[i].difference != null)   {
                            if(bodyparsed.data[i].difference == true)   {
                                difference = "▲ "
                            }   else    [
                                difference = "▼ "
                            ]
                        }
                        embed.addField(`${bodyparsed.data[i].tradetype} - ${bodyparsed.data[i].crafttype} - ${bodyparsed.data[i].qualitytype}`,`${difference}${bodyparsed.data[i].value.value} ${bodyparsed.data[i].value.valuecurrency}`)
                    }
                    DB.DBChangeData(msg.guild.id,{"DataUPCQuery":1});
                    return msg.channel.sendEmbed(embed);
                }   else    {
                    return msg.reply(`Data could not be retrieved at this time, sorry for the inconvenience`);
                }
            });
        });
    };
};
