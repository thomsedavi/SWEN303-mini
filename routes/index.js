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
              console.log('meh');
            }
        );
        res.render('index', {title: 'ECS Video Rental'});
      });
});

module.exports = router;
