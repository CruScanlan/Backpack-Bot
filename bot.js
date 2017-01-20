//Require Core Modules
const Commando = require('discord.js-commando');
const path = require('path');

//Require Modules
const logging = require('./functions/logging');
const DB = require('./bot/functions/db/db');
const other = require('./bot/functions/util/other');

//Require Files
const config = require('./config.json');

//Init Client
const client = new Commando.Client({
    owner: config.ownerID,
    commandPrefix: config.prefix,
    invite: 'https://discord.gg/YpUkgnS'
});

client.registry
// Registers your custom command groups
    .registerGroups([
        ['general', 'General'],
        ['tf2', 'Team Fortress 2'],
        ['info', 'Info'],
        ['serverowner', 'Server Owner Only']
    ])

    // Registers all built-in groups, commands, and argument types
    .registerDefaults()

    // Registers all of your commands in the ./bot/commands/ directory
    .registerCommandsIn(path.join(__dirname, 'bot/commands'))

    .registerEvalObjects({
        biggestGuild:   function()  {
            return Math.max(...client.guilds.map(r => r.memberCount));
        },
        broadcastToOwners: function(text)    {
            let guilds = client.guilds.map(r=>r.owner);
            let sent = 0;
            for(let i=0; i<guilds.length;i++)   {
                guilds[i].sendMessage(text).then(sent++);
            }
            return `${sent} Messages Sent`
        }
    });

//Events
client.on('ready', () => {
        logging.logTime(`Client ready... Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
        DB.DBConnect();

        other.setGame(client);

        setTimeout(function () {
            DB.DBUpdateGuilds(client);
        }, 4000);

        setInterval(function(){//update data
            other.setGame(client);
        }, config.data.DataUpdateTime);
    })
    .on("guildCreate", guild => {
        logging.logTime(`New guild added : ${guild.name}, owned by ${guild.owner.user.username}`);
        let guildDataItems = (guild.id + '#' + guild.name + '#' + client.users.get(guild.ownerID).username + '#' + guild.ownerID + '#' + guild.memberCount + '#' + guild.region + '#' + guild.joinedAt).split('#');
        DB.DBAddGuild(guildDataItems);
        simple.setGame(client);
    })
    .on("guildMemberAdd", guildMember => {
        DB.DBUpdateGuild(guildMember,client);
    })
    .on("guildMemberRemove", guildMember => {
        if(guildMember.user.id == client.user.id) return;
        DB.DBUpdateGuild(guildMember,client);
    })
    .on("guildDelete", guild => {
        logging.logTime(`Guild Left : ${guild.name}, owned by ${guild.owner.user.username}`);
        DB.DBDeleteGuild(guild.id);
        simple.setGame(client);
    })
    .on("guildMemberUpdate", (oldMember, newMember) => {
        if (newMember.user.id != newMember.guild.ownerID) return;
        if (newMember.user.username == oldMember.user.username) return;
        DB.DBUpdateGuild(newMember.guild,client);
    });

//Login
client.login(config.tokens.token);