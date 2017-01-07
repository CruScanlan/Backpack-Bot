//Require Core Modules
const Commando = require('discord.js-commando');
const path = require('path');

//Require Modules
const logging = require('./functions/util/logging');
const DB = require('./functions/db/db');
const dataUpdate = require('./functions/util/dataUpdate');

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

    // Registers all of your commands in the ./commands/ directory
    .registerCommandsIn(path.join(__dirname, 'commands'));

//Events
client.on('ready', () => {
        logging.logTime(`Client ready... Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
        DB.DBConnect();

        setTimeout(function () {
            DB.DBUpdateGuilds(client);
        }, 4000);

        setInterval(function(){//update data
            dataUpdate.updatePriceData();
            dataUpdate.updateItemSchema();
        }, 1000*config.data.DataUpdateTime+10);
    })
    .on("guildCreate", guild => {
        logging.logTime(`New guild added : ${guild.name}, owned by ${guild.owner.user.username}`);
        let guildDataItems = (guild.id + '#' + guild.name + '#' + client.users.get(guild.ownerID).username + '#' + guild.ownerID + '#' + guild.memberCount + '#' + guild.region + '#' + guild.joinedAt).split('#');
        DB.DBAddGuild(guildDataItems);
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
    })
    .on("guildMemberUpdate", (oldMember, newMember) => {
        if (newMember.user.id != newMember.guild.ownerID) return;
        if (newMember.user.username == oldMember.user.username) return;
        DB.DBUpdateGuild(newMember.guild,client);
    });

//Login
client.login(config.tokens.token);