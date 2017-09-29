const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const request = require('request');
const HTMLParser = require('fast-html-parser');
const config = require('../../../config.json');
const DB = require('../../functions/db/db');

module.exports = class stnCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'stn',
            aliases: [],
            group: 'stn',
            memberName: 'stn',
            description: 'Get the current price for an item listed on stn.tf',
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

            request('https://stntrading.eu/backend/search?query='+args, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let root = HTMLParser.parse(body);

                    if(root.querySelector('span.media-body') == null) return msg.reply(`Item Not Found :slight_frown:`);

                    let itemurlhtml = root.querySelector('li').childNodes[1].rawAttrs;
                    let itemurl = "https://stntrading.eu"+itemurlhtml.substring(itemurlhtml.indexOf("href=")+6,itemurlhtml.length-1);

                    let imagehtml = root.querySelector('span.media-left').childNodes[1].rawAttrs;
                    let imageurl = imagehtml.substring(imagehtml.indexOf("src=")+5,imagehtml.length-1);

                    let itemname = root.querySelector('span.media-body').childNodes[0].rawText.trim();
                    let itemprices = root.querySelector('span.media-body').childNodes[2].rawText.trim();

                    let embed = new RichEmbed();
                    embed.setTitle(`STN.tf Price Check - ${itemname}`);
                    embed.setDescription(`[${itemprices}](${itemurl})`);
                    embed.setColor(16761088); //set colour to blue
                    embed.setImage(imageurl);

                    DB.DBChangeData(msg.guild.id,{"DataSTNQuery":1});
                    return msg.channel.sendEmbed(embed);
                }
                return msg.reply(`Could not connect to stn.tf's API`);
            })

        });
    };
};
