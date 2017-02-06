const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const request = require('request');
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
                        let embed = new RichEmbed();
                        embed.setTitle("Server Statistics");
                        embed.setDescription("This is the Current Statistics For This Server");
                        embed.setColor(16724564);
                        embed.addField("❯ TF2","• Price Check Searches: "+result["DataPCQuery"]+"\n" +
                            "• Unusual Price Check Searches: "+result["DataUPCQuery"]+"\n" +
                            "• Currency Check Searches: "+result["DataCQuery"]+"\n" +
                            "• Profile Check Searches: "+result["DataPQuery"]+"\n" +
                            "• Items Available For Price Checking: "+JSON.parse(body).response.data.totaltf2items,
                            true);
                        embed.addField("❯ OPSkins","• CSGO Item Searches: "+result["DataOPCS-PCQuery"],true);
                        embed.addField("❯ STN.tf","• Price Check Searches: "+result["DataSTNQuery"],true);
                        embed.addField("❯ Server","• Bot Join Date: "+result["guildJoinDate"]+"\n"+
                            "• No. of Guild Members: "+result["guildMemberCount"]+"\n" +
                            "• Guild Region: "+result["guildRegion"]+"\n" +
                            "• Guild Owner: "+result["guildOwnerName"]+"\n",
                            true);

                        msg.channel.sendEmbed(embed);
                    }
                });
            });
        });
    };
};