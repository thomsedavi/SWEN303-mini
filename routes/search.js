var express = require('express');
var router = express.Router();

var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");

client.execute("OPEN Colenso");
/* GET users listing. */
router.get('/', function(req, res, next) {
    var query = req.originalUrl.split('?');
    var queries = query[1].split('&');
    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "for $letter in //name[@type = 'place' and position() = 1 and . = '" + queries[0].split('=')[1] +"'] " +
        "return <letter> {$letter} </letter>",
        function(aaa, bbb) {
            var $ = cheerio.load(bbb.result);
            $('letter').each(
                function(i, elem) {
                    console.log('success');
                }
            );
            res.render('index', {title: queries[1]});
        });
});

module.exports = router;
