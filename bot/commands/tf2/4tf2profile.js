const { Command } = require('discord.js-commando');
const request = require('request');
const async = require('async');
const { RichEmbed } = require('discord.js');
const config = require('../../../config.json');
const logging = require('../../../functions/logging');
const DB = require('../../functions/db/db');

module.exports = class TFProfileCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tfprofile',
            aliases: ['tfp','teamfortressprofile','teamfortressp'],
            group: 'tf2',
            memberName: 'tfprofile',
            description: 'Get TF2 Related Info About Someones Profile',
            details: 'Get TF2 Related Info About Someones Profile',
            guildOnly: true,
            throttling: {
                usages: 1,
                duration: 10
            }
        });
    }

    async run(msg,args) {
        DB.DBGetSetting(msg.guild.id,"SettingChannel",function(response){
            if(response != 'none' && response != msg.channel.id)  return msg.channel.sendMessage(`This Command Can Only Be Used In ${msg.client.channels.get(response)}`)
                .then(message => { message.delete(5000) });

            if(!args) return msg.channel.sendMessage(`Please Supply A Steam Profile URL`);

            let steamURL = args.split(' ').slice(0,1).join('');
            let ID64 = '';

            if(steamURL.includes('steamcommunity.com/id/'))   {
                let steamVanity = steamURL.substring(steamURL.search('/id/')+4,steamURL.length).replace('/','');
                request(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${config.tokens.steamtoken}&vanityurl=${steamVanity}`, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        let bodyParsed = JSON.parse(body);
                        if(bodyParsed.response.success != 1){
                            logging.logTime(`ERROR: Could Not Connect To Steam API Or The URL Provided Is Invalid`);
                            return msg.channel.sendMessage(`ERROR: Could Not Connect To Steam API Or The URL Provided Is Invalid`);
                        }
                        ID64 = bodyParsed.response.steamid;
                        getProfileData();
                    }
                });
            }   else{
                ID64 = steamURL.substring(steamURL.search('/profiles/')+10,steamURL.length).replace('/','');
                getProfileData();
            }

            function getProfileData()   {
                let embed = new RichEmbed();
                embed.setTitle(`TF2 Profile`);
                embed.setColor(16711680);

                request(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.tokens.steamtoken}&steamids=${ID64}`, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        let bodyParsed = JSON.parse(body);
                        if(!bodyParsed.response.players[0]) return msg.channel.sendMessage(`ERROR: The URL Provided Is Invalid`);
                        embed.setDescription(`Here Is ${bodyParsed.response.players[0].personaname}'s Profile Details,`);
                        embed.setImage(bodyParsed.response.players[0].avatarmedium);
                        embed.setFooter('Made by Cruzercru (http://bit.do/cruzercru , Cruzercru#8940) - Using backpack.tf Data', 'http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/61/612bfff5e84f0e610e72b424c9fb06a7e72f3914_full.jpg');

                        async.parallel([
                            function(callback) {
                                request(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${config.tokens.steamtoken}&steamids=${ID64}`, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        callback(null,JSON.parse(body));
                                        return;
                                    }
                                    callback(`ERROR: Could Not Connect To Steam API`,null);
                                })
                            },
                            function(callback) {
                                request(`http://steamrep.com/api/beta4/reputation/${ID64}?json=1`, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        callback(null,JSON.parse(body));
                                        return;
                                    }
                                    callback(`ERROR: Could Not Connect To SteamRep API`,null);
                                })
                            },
                            function(callback) {
                                request(`http://backpack.tf/api/IGetUsers/v3/?steamids=${ID64}`, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        callback(null,JSON.parse(body));
                                        return;
                                    }
                                    callback(`ERROR: Could Not Connect To Backpack.tf API`,null);
                                })
                            },
                            function(callback) {
                                request(`http://localhost:3000/api/currencyCheck`, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        callback(null,JSON.parse(body));
                                        return;
                                    }
                                    callback(`ERROR: Could Not Connect To Backpack.tf API`,null);
                                })
                            }
                        ], function(err, results) {
                            if(err) {
                                logging.logTime(err);
                                return msg.channel.sendMessage(err);
                            }
                            let banned = {"true":"Banned","false":"Not Banned"};

                            embed.addField(`❯ Steam Bans`,`• Vac Ban Status: ${banned[results[0].players[0].VACBanned]}\n• No. Of Vac Bans: ${results[0].players[0].NumberOfVACBans}\n• Economy Bans: ${results[0].players[0].EconomyBan}\n• Community Ban Status: ${banned[results[0].players[0].CommunityBanned]}`,true);
                            embed.addField(`❯ SteamRep`,`• Profile URL: ${results[1].steamrep.steamrepurl}\n• Profile Summary: ${results[1].steamrep.reputation.summary}`,true);

                            let backpackStart = "";
                            if(isNaN(results[2].response.players[ID64].backpack_value['440']) || isNaN(results[2].response.players[ID64].backpack_value['440']*results[3].response.data.metal.price.value))   {
                                backpackStart = `• Profile URL: http://backpack.tf/profiles/${ID64}\n• Backpack Value: Error \n• Trust: ${results[2].response.players[ID64].backpack_tf_trust.for} Positive | ${results[2].response.players[ID64].backpack_tf_trust.against} Negative`;
                            }   else    {
                                backpackStart = `• Profile URL: http://backpack.tf/profiles/${ID64}\n• Backpack Value: ${results[2].response.players[ID64].backpack_value['440'].toFixed(0)} Refined Metal | $${(results[2].response.players[ID64].backpack_value['440']*results[3].response.data.metal.price.value).toFixed(0)} USD\n• Trust: ${results[2].response.players[ID64].backpack_tf_trust.for} Positive | ${results[2].response.players[ID64].backpack_tf_trust.against} Negative`;
                            }

                            if(!results[2].response.players[ID64].backpack_tf_banned && !results[2].response.players[ID64].backpack_tf_bans)   { //no bans
                                embed.addField(`❯ Backpack.tf`,`${backpackStart}\n• Backpack.tf Bans: None\n• Backpack.tf Site Wide Ban Status: Not Banned`,false);
                            } else if(!results[2].response.players[ID64].backpack_tf_banned)    { //has bans
                                embed.addField(`❯ Backpack.tf`,`${backpackStart}\n• Backpack.tf Bans: ${Object.keys(results[2].response.players[ID64].backpack_tf_bans).join(', ')}\n• Backpack.tf Site Wide Ban Status: Not Banned`,false);
                            } else if(!results[2].response.players[ID64].backpack_tf_bans)     { //has site wide ban
                                embed.addField(`❯ Backpack.tf`,`${backpackStart}\n• Backpack.tf Bans: None\n• Backpack.tf Site Wide Ban Status: ${results[2].response.players[ID64].backpack_tf_banned.reason}`,false);
                            }   else    { //has both bans
                                embed.addField(`❯ Backpack.tf`,`${backpackStart}\n• Backpack.tf Bans: ${Object.keys(results[2].response.players[ID64].backpack_tf_bans).join(', ')}\n• Backpack.tf Site Wide Ban Status: ${results[2].response.players[ID64].backpack_tf_banned.reason}`,false);
                            }
                            DB.DBChangeData(msg.guild.id,{"DataPQuery":1});
                            return msg.channel.sendEmbed(embed);
                        });
                        return;
                    }
                    logging.logTime(`ERROR: Could Not Connect To Steam API`);
                    return msg.channel.sendMessage(`ERROR: Could Not Connect To Steam API`)
                });
            }
        });
    };
};