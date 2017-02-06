const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const config = require('../../../config.json');
const request = require('request');
const DB = require('../../functions/db/db');

module.exports = class opcsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'opcs',
            aliases: ['opskinscsgo','opcsgo'],
            group: 'opskins',
            memberName: 'opcs',
            description: 'Price Check a CSGO Item From OP Skins',
            guildOnly: false,
            throttling: {
                usages: 6,
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
                url: 'http://localhost:3000/api/opskins/csgo/itemPriceCheck',
                json: true,
                body: {
                    "name": args
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let bodyparsed = body.response;
                    if (bodyparsed.success != 1) {
                        if (bodyparsed.error.errorcode == 401)   return msg.reply(`Please Supply An Item To Price Check`);
                        if (bodyparsed.error.errorcode == 402)   return msg.reply(`Item Not Found :slight_frown:`);
                        return msg.reply(`Error Code: ${bodyparsed.error.errorcode}, Error: ${bodyparsed.error.errormessage}`);
                    }

                    let embed = new RichEmbed();
                    embed.setTitle(`OPSkins Price Check - ${bodyparsed.item}`);
                    embed.setDescription(`\n[• Price: $${bodyparsed.data.price/100} USD\n
                    • Quantity Available: ${bodyparsed.data.quantity}](${bodyparsed.itemurl})`);
                    embed.setColor(161616); //set colour to black
                    embed.setFooter('Data from opskins.com');

                    DB.DBChangeData(msg.guild.id,{"DataOPCS-PCQuery":1});
                    return msg.channel.sendEmbed(embed);
                }
            });
        });
    };
};