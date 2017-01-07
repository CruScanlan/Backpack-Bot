const config = require('../../config.json');
module.exports = {
    setGame:    function(client){
        client.user.setGame(`${config.prefix}help | ${client.guilds.size} servers`);
    }
};