const mysql = require('mysql');
const config = require('../../config.json');
const logging = require('../util/logging');

let mysqlConnection = mysql.createConnection(config.mysql);

let DBConnect = function()  {
    mysqlConnection.connect(function(err) {
        if (err) {
            logging.logTime(`ERROR: Connecting to DB: ${err.stack}`);
            return;
        }
        logging.logTime(`Connected to DB`);
    });
};

let DBUpdateGuilds = async function(client) {
    let guildData = client.guilds.map(r => r.id + '#' + r.name + '#' + r.owner.user.username + '#' + r.owner.id + '#' + r.memberCount + '#' + r.region + '#' + r.joinedAt).join('~').split('~'); //get guild data for all joined guilds
    for (let i = 0; i < guildData.length; i++) {
        let guildDataItems = guildData[i].split('#');
        let sql = "SELECT * FROM ??.`Guilds` WHERE ??.`Guilds`.`guildID` = ?;";
        let inserts = [config.mysql.database,config.mysql.database,guildDataItems[0]];
        sql = mysql.format(sql, inserts);
        mysqlConnection.query(sql,function(err, rows) {
            if (err) throw err;
            if (rows[0] == undefined) {
                DBAddGuild(guildDataItems);
            } else {
                let tempItemKeys = Object.keys(rows[0]);
                for (let i = 0; i < guildDataItems.length; i++) {
                    if (guildDataItems[i] != rows[0][tempItemKeys[i+1]]) {
                        DBUpdateGuildGuild(guildDataItems);
                        break;
                    }
                }
            }
        });
    }
    let sql = "SELECT * FROM ??.`Guilds`;";
    let inserts = [config.mysql.database];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err, rows) {
        if (err) throw err;
        for (let i = 0; i < rows.length; i++) {
            for (var p = 0; p < guildData.length; p++) {
                let guildDataItems = guildData[p].split('#');
                if(rows[i].guildID == guildDataItems[0]) break;
            }
            if(p < guildData.length) continue;
            DBDeleteGuild(rows[i].guildID);
        }
    });
};

let DBUpdateGuild = async function(guildMember,client)   {
    let guildDataItems = (guildMember.guild.id + '#' + guildMember.guild.name + '#' + client.users.get(guildMember.guild.ownerID).username + '#' + guildMember.guild.ownerID + '#' + guildMember.guild.memberCount + '#' + guildMember.guild.region + '#' + guildMember.guild.joinedAt).split('#');
    let sql = "SELECT * FROM ??.`Guilds` WHERE ??.`Guilds`.`guildID` = ?;";
    let inserts = [config.mysql.database,config.mysql.database,guildDataItems[0]];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err, rows) {
        if (err) throw err;
        if (rows[0] == undefined) return DBAddGuild(guildDataItems);
        DBUpdateGuildGuild(guildDataItems);
    });
};

let DBAddGuild = async function(guildData)    {
    let sql = "INSERT INTO ??.`Guilds` (`guildID`, `guildName`, `guildOwnerName`, `guildOwnerID`, `guildMemberCount`, `guildRegion`, `guildJoinDate`, `SettingChannel`, `DataPCQuery`, `DataCQuery`, `DataPQuery`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?);";
    let inserts = [config.mysql.database,guildData[0],guildData[1],guildData[2],guildData[3],guildData[4],guildData[5],guildData[6],'none',0,0,0];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err) {
        if (err) throw err;
        logging.logTime(`Guild Added To DB : Name ${guildData[1]} ID: ${guildData[0]}`);
    });
};

let DBUpdateGuildGuild = async function (guildData) {
    let sql = "UPDATE ??.`Guilds` SET ??.`Guilds`.`guildName` = ?, `guildOwnerName` = ?, `guildOwnerID` = ?, `guildMemberCount` = ?, `guildRegion` = ?, `guildJoinDate` = ? WHERE ??.`Guilds`.`guildID` = ?;";
    let inserts = [config.mysql.database,config.mysql.database,guildData[1],guildData[2],guildData[3],guildData[4],guildData[5],guildData[6],config.mysql.database,guildData[0]];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err) {
        if (err) throw err;
        logging.logTime(`Guild Data Updated To DB : Name ${guildData[1]} ID: ${guildData[0]}`);
    });
};

let DBEntriesCount = async function() {
    let sql = "SELECT COUNT(*) FROM ??.`Guilds`";
    let inserts = [config.mysql.database];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err, rows) {
        if (err) throw err;
        logging.logTime(`Guild Data Entries Got : ${rows[0]['COUNT(*)']}`);
        return rows[0]['COUNT(*)'];
    });
};

let DBDeleteGuild = async function(guildID)   {
    let sql = "DELETE FROM ??.`Guilds` WHERE ??.`Guilds`.`guildID` = ?;";
    let inserts = [config.mysql.database,config.mysql.database,guildID];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err) {
        if (err) throw err;
        logging.logTime(`Guild Deleted From DB : ID ${guildID}`);
    });
};

let DBChangeData = async function(guildID,data)   {
    let tempDataKeys = Object.keys(data);
    for (let i = 0; i < tempDataKeys.length; i++) {
        let sql = "UPDATE ??.`Guilds` SET ??.`Guilds`.?? = ??.`Guilds`.??+? WHERE ??.`Guilds`.`guildID` = ?;";
        let inserts = [config.mysql.database,config.mysql.database,tempDataKeys[i],config.mysql.database,tempDataKeys[i],data[tempDataKeys[i]],config.mysql.database,guildID];
        sql = mysql.format(sql, inserts);
        mysqlConnection.query(sql,function(err) {
            if (err) throw err;
        });
    }
};

let DBSetSetting = async function(guildID,setting,callback)  {
    let tempDataKeys = Object.keys(setting);
    for (let i = 0; i < tempDataKeys.length; i++) {
        let sql = "UPDATE ??.`Guilds` SET ??.`Guilds`.?? = ? WHERE ??.`Guilds`.`guildID` = ?;";
        let inserts = [config.mysql.database,config.mysql.database,tempDataKeys[i],setting[tempDataKeys[i]],config.mysql.database,guildID];
        sql = mysql.format(sql, inserts);
        mysqlConnection.query(sql,function(err) {
            if (err) throw err;
            callback();
            logging.logTime(`Guild Setting Updated On DB : ID ${guildID}`);
        });
    }
};

let DBGetSetting = async function(guildID,setting,callback) {
    let sql = "SELECT * FROM ??.`Guilds` WHERE ??.`Guilds`.`guildID` = ?;";
    let inserts = [config.mysql.database,config.mysql.database,guildID];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err, rows) {
        if (err) throw err;
        callback(rows[0][setting]);
    });
};

let DBGetStats = async function(guildID,callback)   {
    let sql = "SELECT * FROM ??.`Guilds` WHERE ??.`Guilds`.`guildID` = ?;";
    let inserts = [config.mysql.database,config.mysql.database,guildID];
    sql = mysql.format(sql, inserts);
    mysqlConnection.query(sql,function(err, rows) {
        if (err) throw err;
        callback(rows[0]);
    });
};

module.exports.DBConnect = DBConnect;
module.exports.DBUpdateGuilds = DBUpdateGuilds;
module.exports.DBUpdateGuild = DBUpdateGuild;
module.exports.DBAddGuild = DBAddGuild;
module.exports.DBUpdateGuildGuild = DBUpdateGuildGuild;
module.exports.DBEntriesCount = DBEntriesCount;
module.exports.DBDeleteGuild = DBDeleteGuild;
module.exports.DBChangeData = DBChangeData;
module.exports.DBSetSetting = DBSetSetting;
module.exports.DBGetSetting = DBGetSetting;
module.exports.DBGetStats = DBGetStats;