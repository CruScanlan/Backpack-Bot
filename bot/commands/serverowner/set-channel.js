const { Command } = require('discord.js-commando');
const config = require('../../../config.json');
const DB = require('../../functions/db/db');

module.exports = class SetChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setchannel',
            aliases: ['set'],
            group: 'serverowner',
            memberName: 'setchannel',
            description: 'Set A Channel That The Bot Commands Can Only Be Used In ',
            details: `Set a channel for commands to be used in. To disable command white listing, ${client.commandPrefix}setchannel none`,
            examples: [`${client.commandPrefix}setchannel`,`${client.commandPrefix}setchannel none`],
            guildOnly: true,
            throttling: {
                usages: 1,
                duration: 20
            }
        });
    }

    async run(msg,args) {
        if(msg.author.id != msg.guild.ownerID)  return msg.channel.sendMessage(`Only The Server Owner Can Use This Command`);
        let channel = args.split(' ').slice(0,1).join('');
        if(channel == 'none') {
            DB.DBSetSetting(msg.guild.id,{"SettingChannel":"none"},function () {
                return msg.channel.sendMessage(`Commands Can Now Be Used In Any Channel`)
                    .then( promise =>{
                        promise.delete(5000);
                    });
            });
        }
        else {
            DB.DBSetSetting(msg.guild.id,{"SettingChannel":msg.channel.id},function () {
                return msg.channel.sendMessage(`Commands Are Now Limited To ${msg.channel}`)
                    .then( promise =>{
                        promise.delete(5000);
                    });
            });
        }
    };
};