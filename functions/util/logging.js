const moment = require('moment-timezone');
const config = require('../../config.json');
module.exports = {
    logTime:    function(text){
        console.log(`${moment.tz(config.logTimeZone).format(config.TimeFormat)} | ${text}`)
    }
};