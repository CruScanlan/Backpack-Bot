const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const request = require('request');
const config = require('../../../config.json');
const DB = require('../../functions/db/db');

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
    }

    async run(msg,args) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response){
            if(response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });

            if(!args) return msg.reply(`Please Supply An Item To Price Check`);

            request.post({
                url: 'http://localhost:3000/api/itemPriceCheck',
                json: true,
                body: {
                    "name": args,
                    "quality": "",
                    "options": {
                        "allqualities": true,
                        "allothertypes": true
                    }
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let bodyparsed = body.response;
                    if (bodyparsed.success != 1) {
                        if (bodyparsed.error.errorcode == 101)   return msg.reply(`Please Supply An Item To Price Check`);
                        if (bodyparsed.error.errorcode == 106)   return msg.reply(`Item Not Found :slight_frown:\nTry Removing Any Quality Names Or The Word 'The'`);
                        return msg.reply(`Error Code: ${bodyparsed.error.errorcode}, Error: ${bodyparsed.error.errormessage}`);
                    }

                    let embed = new RichEmbed();
                    embed.setTitle(`${bodyparsed.item}`);
                    embed.setDescription(`This Is The Current Price(s) For ${bodyparsed.item}`);
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
                        embed.addField(`${bodyparsed.data[i].tradetype} - ${bodyparsed.data[i].crafttype} - ${bodyparsed.data[i].qualitytype}`,`${difference}${bodyparsed.data[i].value.value} ${bodyparsed.data[i].value.valuecurrency} - [Link](http://backpack.tf/stats/${bodyparsed.data[i].qualitytype}/${bodyparsed.item.split(" ").join("%20")}/${bodyparsed.data[i].tradetype}/${bodyparsed.data[i].crafttype}/0)`)
                    }

                    DB.DBChangeData(msg.guild.id,{"DataPCQuery":1});
                    return msg.channel.sendEmbed(embed);
                }
            });
        });
    };
};