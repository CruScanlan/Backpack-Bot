const { Command } = require('discord.js-commando');
const Discord = require('discord.js');
const config = require('../../config.json');
const logging = require('../../functions/util/logging');
const DB = require('../../functions/db/db');
const fs = require('fs');

fs.readFile('./data/tf2pricedata.json', 'utf8', (err, data) => {
    if (err) throw err;
    global.itemsnumber = Object.keys(JSON.parse(data).response.items).length;
});

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
        setInterval(function(){
            fs.readFile('./data/tf2pricedata.json', 'utf8', (err, data) => {
                if (err) throw err;
                global.itemsnumber = Object.keys(JSON.parse(data).response.items).length;
            });
        }, 1000*config.data.DataUpdateTime+10);
    }

    async run(msg) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response) {
            if (response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });
            DB.DBGetStats(msg.guild.id,function(response){
                let embed = new Discord.RichEmbed();
                embed.setTitle("Statistics");
                embed.setDescription("This is the Current Statistics For This Guild");
                embed.setColor(16724564);
                embed.addField(`Total TF2 Price Check Querys`,`${response["DataPCQuery"]}`,true);
                embed.addField(`Total TF2 Currency Check Querys`,`${response["DataCQuery"]}`,true);
                embed.addField(`Total TF2 Profile Check Querys`,`${response["DataPQuery"]}`,true);
                embed.addField(`Total TF2 Items Available For Price Checking`,`${itemsnumber}`,true);
                embed.addField(`Bot Join Date`,`${response["guildJoinDate"]}`,true);
                embed.addField(`Guild Region`,`${response["guildRegion"]}`,true);
                embed.addField(`Guild ID`,`${response["guildID"]}`,true);
                embed.addField(`No. of Guild Members`,`${response["guildMemberCount"]}`,true);
                embed.addField(`Guild Owner`,`${response["guildOwnerName"]}`,true);
                embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', config.message.footerIcon);

                msg.channel.sendEmbed(embed);
            });
        });
    };
};