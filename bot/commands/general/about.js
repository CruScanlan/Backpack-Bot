const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const config = require('../../../config.json');
const DB = require('../../functions/db/db');

module.exports = class AboutCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'about',
            aliases: [],
            group: 'general',
            memberName: 'about',
            description: 'Get information about me',
            guildOnly: false,
            throttling: {
                usages: 1,
                duration: 10
            }
        });
    }

    async run(msg) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response) {
            if (response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });
            let embed = new RichEmbed();
            embed.setTitle("About");
            embed.setColor(3939721);
            embed.setDescription("I am written in `node.js` using the `discord.js` library and the `Commando` framework");
            embed.addField("Developer","Cruzercru (http://bit.do/cruzercru , Cruzercru#8940)");
            embed.addField("Website","https://backpackbot.com");
            embed.addField("Github","https://github.com/Cruzercru/Backpack-Bot");

            return msg.channel.sendEmbed(embed);
        });
    };
};