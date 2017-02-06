const express = require('express');
const app = express();
const imageservice = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const fs = require('fs');

const errcodes = require("./api/errcodes");//error codes file

//.js files
const dataHandling = require("./api/dataHandling");
const getData = require('./functions/get-data');
const config = require('./config.json');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

imageservice.use(bodyParser.json()); // for parsing application/json
imageservice.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', function(req, res) {
    res.end("API Running");
});

imageservice.get('/', function(req, res) {
    res.end("API Running");
});


app.post('/api/tf2/itemPriceCheck/', upload.array(), function(req, res) {
    let post = req.body;
    if(post.name == undefined || post.name == "" || post.name == null) return err(101,errcodes.itemcheck.code101,null,res);
    if(post.options == undefined) return err(102,errcodes.itemcheck.code102,null,res);
    if(post.options.allqualities == undefined) return err(103,errcodes.itemcheck.code103,null,res);
    if(post.options.allothertypes == undefined) return err(107,errcodes.itemcheck.code107,null,res);
    if(typeof post.options.allqualities != "boolean") return err(104,errcodes.itemcheck.code104,null,res);
    if(typeof post.options.allothertypes != "boolean") return err(108,errcodes.itemcheck.code108,null,res);

    dataHandling.tf2itemCheck(post.name,post.quality,post.options,function(error,result){
        if(error) return err(error.errcode,error.errmsg,null,res);
        res.json(result);
    });
});

app.get('/api/tf2/currencyCheck/', upload.array(), function(req, res) {
    dataHandling.tf2currencyCheck(function(error,result)  {
        if(error) return err(error.errcode,error.errmsg,null,res);
        res.json(result);
    })
});

app.post('/api/tf2/unusualPriceCheck/', upload.array(), function(req, res) {
    let post = req.body;
    if(post.name == undefined || post.name == "" || post.name == null) return err(301,errcodes.tf2unusualcheck.code301,null,res);
    if(post.effect == undefined || post.effect == "" || post.effect == null) return err(302,errcodes.tf2unusualcheck.code302,null,res);
    if(post.options == undefined) return err(303,errcodes.tf2unusualcheck.code303,null,res);
    if(post.options.imageurl == undefined) return err(303,errcodes.tf2unusualcheck.code303,null,res);
    if(typeof post.options.imageurl != "boolean") return err(304,errcodes.tf2unusualcheck.code304,null,res);

    dataHandling.tf2unusualCheck(post.name,post.effect,post.options,function(error,result){
        if(error)   {
            if(error.extra != undefined) return err(error.errcode,error.errmsg,error.extra,res);
            return err(error.errcode,error.errmsg,null,res);
        }
        res.json(result);
    });
});

app.post('/api/opskins/csgo/itemPriceCheck', upload.array(), function(req, res) {
    let post = req.body;
    if(post.name == undefined || post.name == "" || post.name == null) return err(401,errcodes.opcsitemcheck.code401,null,res);

    dataHandling.opcsItemCheck(post.name,function(error,result){
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

imageservice.get('/api/images/unusual/:name', upload.array(), function(req, res) {
    res.contentType('image/png');
    fs.readFile(`./api/data/image_cache/unusual/${req.params.name}`, function(err, data) {
        res.end(data);
    });
});

app.listen(3000);
imageservice.listen(80);

console.log(`API Running`);

setInterval(function(){//update data
    getData.updateTF2PriceData();
    getData.updateTF2ItemSchema();
    getData.updateOPCSGOPriceData();
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