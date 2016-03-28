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
    res.render('index', {title: 'Some Letters?'});
});

//search for a string ay
router.get('/search1', function(req, res) {
    var queries = req.query;
    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "//TEI[. contains text '" + queries.query + "']",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                var $ = cheerio.load(result.result);
                var search_result = [];
                var place = parseInt(queries.place);
                $('TEI').each(function(index, element){
                    if(index >= place - 1 && index < place + 9) {
                        var elem = cheerio(element);
                        search_result.push({
                            title: elem.find('title').first().text(),
                            author: elem.find('author').first().text(),
                            date: elem.find('date').first().text(),
                            id: elem.attr('xml:id')
                        })
                    }
                });
                var last = place + 9 < $('TEI').length ? place + 9 : $('TEI').length;
                res.render('search', {title: 'search', search: queries.query, search_result: search_result,
                    first: place, prev: place - 10,
                    last: last, next: place + 10, total: $('TEI').length});
            }
        }
    )
});

//return a file based on address, eg 'Colenso/private_letters/PrL-0024.xml'
router.get('/view/:id', function(req, res) {
    var params = req.params;
    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "//TEI[@xml:id='" + params.id + "']",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                res.render('view', {title: 'found a thing', search_result: result.result, id: params.id});
            }
        }
    )
});

router.get('/edit/:id', function(req,res) {
    var params = req.params;
    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "//TEI[@xml:id='" + params.id + "']",
        function(error, result) {
            if(error) {
                console.error(error);
            } else {
                res.render('edit', {title: 'found a thing', search_result: result.result});
            }
        }
    )
});

router.post("/submit",function(req,res){
    console.log(req.body.text);
    res.render('index', {title: 'Some Letters?'});
});


module.exports = router;
