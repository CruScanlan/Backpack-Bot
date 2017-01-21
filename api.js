const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();

//.js files
const dataHandling = require("./api/dataHandling");
const errcodes = require("./api/errcodes");
const getData = require('./functions/get-data');
const config = require('./config.json');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', function(req, res) {
    res.end("API Running");
});

app.post('/api/itemPriceCheck/', upload.array(), function(req, res) {
    let post = req.body;
    if(post.name == undefined || post.name == "" || post.name == null) return err(101,errcodes.itemcheck.code101,null,res);
    if(post.options == undefined) return err(102,errcodes.itemcheck.code102,null,res);
    if(post.options.allqualities == undefined) return err(103,errcodes.itemcheck.code103,null,res);
    if(post.options.allothertypes == undefined) return err(107,errcodes.itemcheck.code107,null,res);
    if(typeof post.options.allqualities != "boolean") return err(104,errcodes.itemcheck.code104,null,res);
    if(typeof post.options.allothertypes != "boolean") return err(108,errcodes.itemcheck.code108,null,res);

    dataHandling.itemCheck(post.name,post.quality,post.options,function(error,result){
        if(error) return err(error.errcode,error.errmsg,null,res);
        res.json(result);
    });
});

app.get('/api/currencyCheck/', upload.array(), function(req, res) {
    dataHandling.currencyCheck(function(error,result)  {
        if(error) return err(error.errcode,error.errmsg,null,res);
        res.json(result);
    })
});

app.post('/api/unusualPriceCheck/', upload.array(), function(req, res) {
    let post = req.body;
    if(post.name == undefined || post.name == "" || post.name == null) return err(301,errcodes.unusualcheck.code301,null,res);
    if(post.effect == undefined || post.effect == "" || post.effect == null) return err(302,errcodes.unusualcheck.code302,null,res);
    if(post.options == undefined) return err(303,errcodes.unusualcheck.code303,null,res);
    if(post.options.imageurl == undefined) return err(303,errcodes.unusualcheck.code303,null,res);
    if(typeof post.options.imageurl != "boolean") return err(304,errcodes.unusualcheck.code304,null,res);

    dataHandling.unusualCheck(post.name,post.effect,post.options,function(error,result){
        if(error)   {
            if(error.extra != undefined) return err(error.errcode,error.errmsg,error.extra,res);
            return err(error.errcode,error.errmsg,null,res);
        }
        res.json(result);
    });
});

app.get('/api/stats/', upload.array(), function(req, res) {
    dataHandling.stats(function(error,result)  {
        if(error) return err(error.errcode,error.errmsg,null,res);
        res.json(result);
    })
});

app.listen(3434);
console.log(`API Running`);

setInterval(function(){//update data
    getData.updatePriceData();
    getData.updateItemSchema();
}, config.data.DataUpdateTime);

function err(errcode, errmsg, extra, res)   {
    let response = {};
    if(extra == null)  {
        response = {response:{success:false,error:{errorcode:errcode,errormessage:errmsg}}};
    }   else    {
        response = {response:{success:false,error:{errorcode:errcode,errormessage:errmsg,errorextra:extra}}};
    }
    res.json(response);
}