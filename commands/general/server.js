const { Command } = require('discord.js-commando');
const config = require('../../config.json');

module.exports = class ServerCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'server',
            aliases: ['support'],
            group: 'general',
            memberName: 'server',
            description: 'Get an invite link to the official Backpack Bot server',
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
                return msg.reply(`This is the official Backpack Bot server : https://discord.gg/YpUkgnS`)
                    .then( promise =>{
                        promise.delete(config.message.deleteTime*1000);
                    })
            });
    };
};