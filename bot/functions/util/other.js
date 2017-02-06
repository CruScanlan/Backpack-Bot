const config = require('../../../config.json');
const request = require('request');
module.exports = {
    setGame:    function(client){
        client.user.setGame(`${config.prefix}help | ${client.guilds.size} servers`);
    },
    discordpw:  function(client)    {
        request.post({
            url: 'https://bots.discord.pw/api/bots/'+client.user.id+'/stats',
            json: true,
            headers: {
                Authorization: config.tokens.discordpw
            },
            body: {
                "server_count": client.guilds.size
            }
        }, function (error, response, body) {
        });
    },
    discordlist: function(client)   {
        request.post({
            url: 'https://bots.discordlist.net/api',
            json: true,
            body: {
                "token": config.tokens.discordlist,
                "servers": client.guilds.size
            }
        }, function (error, response, body) {
            console.log(body)
        });
    }
};