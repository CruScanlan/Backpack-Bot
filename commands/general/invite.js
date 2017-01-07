const { Command } = require('discord.js-commando');
const config = require('../../config.json');

module.exports = class InviteCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'invite',
            aliases: ['link'],
            group: 'general',
            memberName: 'invite',
            description: 'Get an invite link so you can add me to your server',
            guildOnly: false,
            throttling: {
                usages: 1,
                duration: 10
            }
        });
    }

    async run(msg) {
        this.client.fetchApplication()
            .then(app => {
            let clientID = app.id;
            return msg.reply(`You can invite me to your server here: https://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=0`)
                .then( promise =>{
                    promise.delete(config.message.deleteTime*1000);
                })
        });
    };
};