var express = require('express');
var router = express.Router();

var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");

client.execute("OPEN Colenso");

client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
    "//name[@type = 'place' and position() = 1 and . = 'Manawarakau']",
    function(err,res) { if(!err) console.log(res.result)} );

router.get("/",function(req,res) {
    res.render('index', {title: 'Some Letters?'});
});

router.get("/browse",function(req,res) {

    var queries = req.query;
    console.log(queries.path);

    var path = "";

    if (queries.path != undefined) {
        path = queries.path;
    }

    client.execute("XQUERY for $p in collection('Colenso/" + path + "') return db:path($p)",
        function (error, result) {
            if (error) {
                console.error(error);
            } else {
                var results = result.result.split('\n');
                var folders = [];
                var files = [];

                for (var i = 0; i < results.length; i += 1) {
                    if (results[i].split('/')[0].indexOf('.xml') < 0) {
                        folders.push(results[i].split('/')[0]);
                    } else {
                        files.push(results[i].split('/')[0]);
                    }
                }

                console.log(folders);
                var unique_folders = [];

                for (var i = 0; i < folders.length; i += 1) {
                    if (unique_folders.indexOf(folders[i]) < 0) {
                        unique_folders.push(folders[i]);
                    }
                }

                console.log(unique_folders);
                res.render('browse', {title: 'Some Letters?', path: path, folders: unique_folders, files: files});
            }
    })
});

//search for a string ay
router.get('/search1', function(req, res) {
    var queries = req.query;
    var result_paths;

    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "for $p in //TEI[. contains text '" + queries.query + "'] return db:path($p)",
        function(error, result) {
            result_paths = result.result.split('\n');
        });

    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "//TEI[. contains text '" + queries.query + "']",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                var $ = cheerio.load(result.result);
                var search_result = [];
                //place is the position to find the next ten to be returned
                var place = parseInt(queries.place);
                $('TEI').each(function(index, element){
                    if(index >= place - 1 && index < place + 9) {
                        var elem = cheerio(element);
                        search_result.push({
                            title: elem.find('title').first().text(),
                            author: elem.find('author').first().text(),
                            date: elem.find('date').first().text(),
                            path: result_paths[index]
                        });
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
router.get('/view', function(req, res) {
    var queries = req.query;
    client.execute("XQUERY doc ('Colenso/" + queries.path + "')",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                res.render('view', {title: 'found a thing', search_result: result.result, path: queries.path});
            }
        }
    )
});

router.get('/edit', function(req,res) {
    var queries = req.query;
    client.execute("XQUERY doc ('Colenso/" + queries.path + "')",
        function(error, result) {
            if(error) {
                console.error(error);
            } else {
                res.render('edit', {title: 'found a thing', search_result: result.result, path: queries.path});
            }
        }
    )
});

router.post("/submit",function(req,res){
    var params = req.params;
    var queries = req.query;
    console.log('Colenso/' + queries.path);
    console.log(req.body.text);
    client.replace(queries.path, req.body.text,
        function(error, result) {
            if(error) {
                console.error(error);
            } else {
                res.render('edit', {title: 'changes saved', search_result: req.body.text, path: queries.path});
            }
        }
    )
});


module.exports = router;
