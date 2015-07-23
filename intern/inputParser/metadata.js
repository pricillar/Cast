var app = require("express")(),
    http
    
var listenOn = function(port) {
    http = require('http').createServer(app).listen(port)
}

app.get('/admin.cgi', function(req, res) {
    if (typeof req.query === "undefined" || req.query.mode !== "updinfo") {
        res.status(400).send("Not supported")
        return
    }
    if (!global.streams.streamPasswords.hasOwnProperty(req.query.pass)) {
        res.status(401).send("Invalid password")
        return
    }

    var stream = global.streams.streamPasswords[req.query.pass]

    if (req.query.mode === "updinfo") {
        
        if (req.query.song === "Advert: - Advert:"){
            //Never mind... SHOUTcast is better for this
        }
        var meta={
            genre: req.query.genre,
            title: req.query.title,
            artist: req.query.artist,
            song: req.query.song,
            date: req.query.date,
            album: req.query.album,
            djname: req.query.djname,
        }
        global.streams.setStreamMetadata(stream, meta)
        res.send("ok")
        meta.stream=stream
        return
    }
})

app.get('/',function(req, res) {
    res.send("You hit the Cast metadata input server. If you are looking for good music try to remove the port from the URL")
})

app.get('/7.html',function(req, res) {
    res.send("0,0,0,99999,0,0,")
})

module.exports.listenOn = listenOn