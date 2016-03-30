var express = require('express');
var multer = require('multer');
var router = express.Router();

var uploading = multer();
router.use(uploading.single('file'));

var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");

var total_search_result = [];
var search_result = [];

client.execute("OPEN Colenso");

router.get("/",function(req,res) {
    res.render('index', {title: 'Colenso Search'});
});

router.get("/browse",function(req,res) {

    var queries = req.query;

    var path = "";

    var depth = 0;

    if (queries.path != undefined) {
        path = queries.path;
        depth = path.split('/').length;
        path = path + '/';
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
                    if (results[i].split('/')[depth].indexOf('.xml') < 0) {
                        folders.push(path + results[i].split('/')[depth]);
                    } else {
                        files.push(results[i].split('/')[depth]);
                    }
                }

                var unique_folders = [];

                for (var i = 0; i < folders.length; i += 1) {
                    if (unique_folders.indexOf(folders[i]) < 0) {
                        unique_folders.push(folders[i]);
                    }
                }
                res.render('browse', {title: 'Browse', path: path, folders: unique_folders, files: files});
            }
    })
});

router.post('/upload', function(req, res){
    var queries = req.query;

    if(req.file){
        var path = queries.path + req.file.originalname;

        var file = req.file.buffer.toString();
        client.execute('ADD TO ' + path + ' "' + file + '"', function(error, result){
            if(error){
                console.error(error);
            }
        });
    } else {
        console.log('no file?');
    }

    if (queries.path) {
        res.redirect('browse/?path=' + queries.path.substring(0, queries.path.length - 1));
    } else {
        res.redirect('browse');
    }
});

//search for a string ay
router.get('/textsearch', function(req, res) {
    var queries = req.query;
    var result_paths;

    var query = queries.query.replace(/ and /g, "' ftand '");
    query = query.replace(/ AND /g, "' ftand '");
    query = query.replace(/ or /g, "' ftor '");
    query = query.replace(/ OR /g, "' ftor '");
    query = query.replace(/ not /g, "' ftnot '");
    query = query.replace(/ NOT /g, "' ftnot '");

    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "for $p in *[. contains text '" + query + "' using wildcards] return db:path($p)",
        function(error, result) {
            result_paths = result.result.split('\n');
        });

    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "*[. contains text '" + query + "' using wildcards]",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                var $ = cheerio.load(result.result);
                //place is the position to find the next ten to be returned
                var place = parseInt(queries.place);
                search_result = [];
                total_search_result = [];
                $('TEI').each(function(index, element){
                    var elem = cheerio(element);
                    total_search_result.push({
                        title: elem.find('title').first().text(),
                        author: elem.find('author').first().text(),
                        date: elem.find('date').first().text(),
                        path: result_paths[index],
                        data: elem.html()
                    });
                    if(index >= place - 1 && index < place + 9) {
                        search_result.push({
                            title: elem.find('title').first().text(),
                            author: elem.find('author').first().text(),
                            date: elem.find('date').first().text(),
                            path: result_paths[index],
                        });
                    }
                });
                var last = place + 9 < $('TEI').length ? place + 9 : $('TEI').length;
                res.render('search', {title: 'Text Search', search: queries.query, search_result: search_result,
                    first: place, prev: place - 10,
                    last: last, next: place + 10, total: $('TEI').length});
            }
        }
    )
});

router.get('/markupsearch', function(req, res) {
    var query = req.query.query;

    client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
        "for $p in " + query + " return db:path($p)",
        function(error, result) {
            all_result_paths = result.result.split('\n');
            var result_paths = [];

            for (var i = 0; i < all_result_paths.length; i += 1) {
                if (result_paths.indexOf(all_result_paths[i]) < 0) {
                    result_paths.push(all_result_paths[i]);
                }
            }

            client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
                "*[" + query + "]",
                function(error, result) {
                    if(error){
                        console.error(error);
                    } else {
                        var $ = cheerio.load(result.result);
                        search_result = [];
                        total_search_result = [];
                        $('TEI').each(function(index, element){
                            var elem = cheerio(element);
                            total_search_result.push({
                                title: elem.find('title').first().text(),
                                author: elem.find('author').first().text(),
                                date: elem.find('date').first().text(),
                                path: result_paths[index],
                                data: elem.html()
                            });
                            search_result.push({
                                title: elem.find('title').first().text(),
                                author: elem.find('author').first().text(),
                                date: elem.find('date').first().text(),
                                path: result_paths[index]
                            });
                        });
                        res.render('markupsearch', {title: 'Markup Search',
                            search: req.query.query, search_result: search_result, total: search_result.length});
                    }
                }
            );
        }
    );
});

// search within a search!
router.get('/subsearch', function(req, res){
    var queries = req.query;

    var temp_search_result = [];

    for (var i = 0; i < total_search_result.length; i+= 1) {
        if (total_search_result[i].data.indexOf(queries.query) > 0) {
            temp_search_result.push(total_search_result[i]);
        }
    }

    total_search_result = temp_search_result;
    search_result = [];

    var place = parseInt(queries.place);

    for (var i = place - 1; i < place + 9; i += 1) {
        if (i < total_search_result.length) {
            search_result.push({
                title: total_search_result[i].title,
                author: total_search_result[i].author,
                date: total_search_result[i].date,
                path: total_search_result[i].path
            });
        }
    }

    var last = place + 9 < total_search_result.length ? place + 9 : total_search_result.length;
    res.render('subsearch', {title: 'Subsearch', search: queries.query, search_result: search_result,
        first: place, prev: place - 10,
        last: last, next: place + 10, total: total_search_result.length});

});

//return a file based on address, eg 'Colenso/private_letters/PrL-0024.xml'
router.get('/view', function(req, res) {
    var queries = req.query;
    client.execute("XQUERY doc ('Colenso/" + queries.path + "')",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                res.render('view', {title: 'Document View', search_result: result.result, path: queries.path});
            }
        }
    )
});

router.get('/download', function(req, res) {
    var queries = req.query;
    var fullpath  = queries.path.split('/');
    var filename = fullpath[fullpath.length - 1];
    client.execute("XQUERY doc ('Colenso/" + queries.path + "')",
        function(error, result) {
            if(error){
                console.error(error);
            } else {
                var doc = result.result;
                res.writeHead(200, {
                    'Content-Disposition': 'attachment; filename=' + filename
                });
                res.write(doc);
                res.end();
            }
        }
    )
});

router.get('/downloadall', function(req, res) {
    for (var i = 0; i < total_search_result.length; i += 1) {
        res.redirect('/download?path=' + total_search_result[i].path);
    }
});

router.get('/edit', function(req,res) {
    var queries = req.query;
    client.execute("XQUERY doc ('Colenso/" + queries.path + "')",
        function(error, result) {
            if(error) {
                console.error(error);
            } else {
                res.render('edit', {title: 'Document Edit', search_result: result.result, path: queries.path});
            }
        }
    )
});

router.post("/submit",function(req,res){
    var queries = req.query;
    client.replace(queries.path, req.body.text,
        function(error, result) {
            if(error) {
                console.error(error);
            } else {
                res.render('edit', {title: 'Document Edit', status: 'changes saved', search_result: req.body.text, path: queries.path});
            }
        }
    )
});


module.exports = router;
