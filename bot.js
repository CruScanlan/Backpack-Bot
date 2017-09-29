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
    owner: config.ownerIDs,
    commandPrefix: config.prefix,
    invite: 'https://discord.gg/YpUkgnS'
});

client.registry
// Registers your custom command groups
    .registerGroups([
        ['general', 'General'],
        ['tf2', 'Team Fortress 2'],
        ['opskins', 'OP Skins'],
        ['stn', 'stn.tf'],
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
        other.discordpw(client);
        //other.discordlist(client);

        DB.DBUpdateGuilds(client);

        setInterval(function(){//update data
            other.setGame(client);
            other.discordpw(client);
        }, config.data.DataUpdateTime);
    })
    .on("guildCreate", guild => {
        logging.logTime(`New guild added : ${guild.name}, owned by ${guild.owner.user.username}`);
        let guildDataItems = (guild.id + '¿' + guild.name + '¿' + client.users.get(guild.ownerID).username + '¿' + guild.ownerID + '¿' + guild.memberCount + '¿' + guild.region + '¿' + guild.joinedAt  + '¿' + guild.channels.array().length).split('¿');
        DB.DBAddGuild(guildDataItems);
        other.setGame(client);
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
        other.setGame(client);
    })
    .on("guildMemberUpdate", (oldMember, newMember) => {
        if (newMember.user.id != newMember.guild.ownerID) return;
        if (newMember.user.username == oldMember.user.username) return;
        DB.DBUpdateGuild(newMember.guild,client);
    })
    .on("channelCreate", channel => {
        if(!channel.guild) return;
        let guildDataItems = (channel.guild.id + '¿' + channel.guild.name + '¿' + channel.guild.owner.username + '¿' + channel.guild.ownerID + '¿' + channel.guild.memberCount + '¿' + channel.guild.region + '¿' + channel.guild.joinedAt  + '¿' + channel.guild.channels.array().length).split('¿');
        DB.DBUpdateGuildGuild(guildDataItems);
    })
    .on("channelDelete", channel =>{
        let guildDataItems = (channel.guild.id + '¿' + channel.guild.name + '¿' + channel.guild.owner.username + '¿' + channel.guild.ownerID + '¿' + channel.guild.memberCount + '¿' + channel.guild.region + '¿' + channel.guild.joinedAt  + '¿' + channel.guild.channels.array().length).split('¿');
        DB.DBUpdateGuildGuild(guildDataItems);
    })
    .on("message", message =>{
        if(!message.guild)  return;
        DB.DBChangeData(message.guild.id,{"guildMessages":1});
    });

//Login
client.login(config.tokens.token);