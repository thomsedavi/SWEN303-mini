var express = require('express');
var router = express.Router();

var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");

client.execute("OPEN Colenso");

client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
    "//name[@type = 'place' and position() = 1 and . = 'Manawarakau']",
    function(err,res) { if(!err) console.log(res.result)} );

router.get("/",function(req,res){
    res.render('index', {title: 'ECS Video Rental'});
});

router.get('/search', function(req, res) {
    var queries = req.query;
    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "for $letter in //name[@type = 'place' and position() = 1 and . = '" + queries.query + "'] " +
        "return <letter> {$letter} </letter>",
        function(error, result) {
            if(error){ console.error(error);}
            else {
                var $ = cheerio.load(result.result);
                $('letter').each(
                    function (i, elem) {
                        console.log('success');
                        console.log(result.result);
                        console.log(elem);
                    }
                );
                res.render('search', {title: queries.query, letter: result.result});
            }
        });
});

module.exports = router;
