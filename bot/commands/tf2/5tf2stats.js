const { Command } = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request');
const config = require('../../../config.json');
const logging = require('../../../functions/logging');
const DB = require('../../functions/db/db');

module.exports = class TFStatsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tfstats',
            aliases: ['statistics'],
            group: 'tf2',
            memberName: 'tfstats',
            description: 'Get Stats Relating To TF2 About The Current Guild',
            guildOnly: true,
            throttling: {
                usages: 10,
                duration: 1
            }
        });
    }

    async run(msg) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response) {
            if (response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });
            DB.DBGetStats(msg.guild.id,function(result){
                request('http://localhost:3000/api/stats', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        let embed = new Discord.RichEmbed();
                        embed.setTitle("Statistics");
                        embed.setDescription("This is the Current Statistics For This Guild");
                        embed.setColor(16724564);
                        embed.addField(`TF2 Price Check Querys`,`${result["DataPCQuery"]}`,true);
                        embed.addField(`TF2 Unusual Price Check Querys`,`${result["DataUPCQuery"]}`,true);
                        embed.addField(`TF2 Currency Check Querys`,`${result["DataCQuery"]}`,true);
                        embed.addField(`TF2 Profile Check Querys`,`${result["DataPQuery"]}`,true);
                        embed.addField(`TF2 Items Available For Price Checking`,`${JSON.parse(body).response.data.totalitems}`,true);
                        embed.addField(`Bot Join Date`,`${result["guildJoinDate"]}`,true);
                        embed.addField(`Guild Region`,`${result["guildRegion"]}`,true);
                        embed.addField(`Guild ID`,`${result["guildID"]}`,true);
                        embed.addField(`No. of Guild Members`,`${result["guildMemberCount"]}`,true);
                        embed.addField(`Guild Owner`,`${result["guildOwnerName"]}`,true);
                        embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', 'http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/61/612bfff5e84f0e610e72b424c9fb06a7e72f3914_full.jpg');

                        msg.channel.sendEmbed(embed);
                    }
                });
            });
        });
    };
};