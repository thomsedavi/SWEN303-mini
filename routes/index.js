var express = require('express');
var router = express.Router();

var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");

client.execute("OPEN Colenso");

client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
    "//name[@type = 'place' and position() = 1 and . = 'Manawarakau']",
    function(err,res) { if(!err) console.log(res.result)} );

router.get("/",function(req,res,next){
  client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
      "for $letter in //name[@type = 'place' and position() = 1 and . = 'Manawarakau'] " +
      "return <letter> {$letter} </letter>",
      function(aaa, bbb) {
        var $ = cheerio.load(bbb.result);
        $('letter').each(
            function(i, elem) {
              console.log('success');
            }
        );
        res.render('index', {title: 'ECS Video Rental'});
      });
});

router.get('/search', function(req, res, next) {
    console.log('params are ' + req.query.query1);
    var queries = req.query;
    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "for $letter in //name[@type = 'place' and position() = 1 and . = '" + queries.query2 + "'] " +
        "return <letter> {$letter} </letter>",
        function(aaa, bbb) {
            var $ = cheerio.load(bbb.result);
            $('letter').each(
                function(i, elem) {
                    console.log('success');
                }
            );
            res.render('index', {title: queries.query2});
        });
});

module.exports = router;
