var icy = require("./icy")
var geolock = require("../geolock/geolock.js")

var httpHandler = function(app) {

    if (typeof global.streams === "undefined") {
        global.streams = require("./streams.js")
    }

    if (typeof app === "undefined") {
        return
    }

    app.head("/streams/*", function(req, res) {
        if (!geolock.isAllowed(req.ip)) {
            return res.status(401).send()
        }
        if (typeof req.params[0] === "undefined" || req.params[0] === "") {
            return res.status(404).send()
        }
        if (req.params[0].split(".").length > 1) {
            if (req.params[0].split(".")[1] === "pls") {
                res.setHeader("Content-Type", "audio/x-scpls")
                return res.send()
            }
            if (req.params[0].split(".")[1] === "m3u") {
                res.setHeader("Content-Type", "audio/x-mpegurl")
                return res.send()
            }
            if (req.params[0].split(".")[1] === "asx") {
                res.setHeader("Content-Type", "video/x-ms-asf")
                return res.send()
            }
        }

        if (!global.streams.streamExists(req.params[0])) {
            return res.status(404).send()
        }

        var streamConf = global.streams.getStreamConf(req.params[0])

        var headers = {
            "Content-Type": streamConf.type || "audio/mpeg",
            "Connection": 'close',
            "icy-name": streamConf.name || "Unknown stream",
            "icy-genre": streamConf.genre || "unknown",
            "icy-br": streamConf.bitrate || 0,
            "Access-Control-Allow-Origin": "*",
            "X-Begin": "Thu, 30 Jan 2014 17:20:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT"
        }

        if (req.headers['user-agent'].indexOf("RealMedia") > -1) {
            //RealMedia players can't read the ICY metadata properly
            req.headers['icy-metadata'] = 0
        }

        //send icy header
        if (req.headers['icy-metadata'] == 1) {
            headers['icy-metaint'] = 8192;
        }

        res.writeHead(200, headers);
        res.send()

    })

    app.get("/hls/:stream/:segment", function(req, res){
        if (!geolock.isAllowed(req.ip)) {
            return res.status(401).send("Your country is not allowed to tune in to the stream")
        }
        if (!global.streams.streamExists(req.params.stream)) {
            res.status(404).send("Stream not found")
            return
        }
        if (!req.query.id || !global.streams.listenerIdExists(req.params.stream, req.query.id, req.ip, req.headers["user-agent"])){
            return res.status(401).send("Invalid id")
        }

        if (!global.streams.hlsLastHit[req.params.stream]){
            global.streams.hlsLastHit[req.params.stream] = {}
        }

        global.streams.hlsLastHit[req.params.stream][req.query.id] = Math.round((new Date()).getTime() / 1000)

        var streamConf = global.streams.getStreamConf(req.params.stream)

        // generate response header
        var headers = {
            "Content-Type": streamConf.type || "audio/mpeg",
            "Connection": 'close',
            "Access-Control-Allow-Origin": "*",
            "X-Begin": "Thu, 30 Jan 2014 17:20:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT"
        }
        if (!global.streams.hlsPool[req.params.stream][req.params.segment]){
                return res.status(404).send("Segment not found")
        }
        res.writeHead(200, headers);
        res.write(global.streams.hlsPool[req.params.stream][req.params.segment])
        res.end()
    })

    app.get("/streams/*", function(req, res) {

        if (!geolock.isAllowed(req.ip)) {
            return res.status(401).send("Your country is not allowed to tune in to the stream")
        }

        if (typeof req.params[0] === "undefined" || req.params[0] === "") {
            res.status(404).send("Stream not found")
            return
        }

        if (req.params[0].split(".").length > 1) {
            if (req.params[0].split(".")[1] === "pls") {
                servePLS(req, res)
                return
            }
            if (req.params[0].split(".")[1] === "m3u") {
                serveM3U(req, res)
                return
            }
            if (req.params[0].split(".")[1] === "asx") {
                serveASX(req, res)
                return
            }
            if (req.params[0].split(".")[1] === "m3u8" && global.config.hls) {
                serveM3U8(req, res)
                return
            }
        }

        if (!global.streams.streamExists(req.params[0])) {
            res.status(404).send("Stream not found")
            return
        }

        //get stream

        var stream = global.streams.getStream(req.params[0])
        var streamConf = global.streams.getStreamConf(req.params[0])
        var streamMeta = global.streams.getStreamMetadata

        /*handle output*/

        var prevMetadata = "";

        // generate response header
        var headers = {
            "Content-Type": streamConf.type || "audio/mpeg",
            "Connection": 'close',
            "icy-name": streamConf.name || "Unknown stream",
            "icy-genre": streamConf.genre || "unknown",
            "icy-br": streamConf.bitrate || 0,
            "Access-Control-Allow-Origin": "*",
            "X-Begin": "Thu, 30 Jan 2014 17:20:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT"
        }

        if (req.headers['user-agent'].indexOf("RealMedia") > -1) {
            //RealMedia players can't read the ICY metadata properly
            req.headers['icy-metadata'] = 0
        }

        //send icy header
        if (req.headers['icy-metadata'] == 1) {
            headers['icy-metaint'] = 8192;
        }

        res.writeHead(200, headers);

        // setup icy

        if (req.headers['icy-metadata'] == 1) {
            res = new icy.IcecastWriteStack(res, 8192); //DISCLAIMER: ICY is not Icecast
            var meta = streamMeta(req.params[0])
            res.queueMetadata({
                StreamTitle: meta.song || streamConf.name || streamConf.name,
                StreamUrl: ""
            });
        }


        var gotChunk = function(chunk) {
            var meta = streamMeta(req.params[0])
            if (req.headers['icy-metadata'] == 1 && typeof meta !== "undefined" && typeof meta.song === "string" && prevMetadata != meta.song) {
                res.queueMetadata({
                    StreamTitle: meta.song || streamConf.name,
                    StreamUrl: ""
                });
                prevMetadata = meta.song;
            }
            res.write(chunk);
        };
        for (var id in global.streams.getPreBuffer(req.params[0])) {
            res.write(global.streams.getPreBuffer(req.params[0])[id])
        }


        stream.on("data", gotChunk);

        stream.on("end", function(chunk) {
            if (res !== null) {
                res.end()
                stream.removeListener("data", gotChunk);
                global.streams.listenerTunedOut(req.params[0], listenerID)
                stream = null
                streamConf = null
                streamMeta = null
                req = null
                res = null
            }
        })

        stream.on("error", function(chunk) {
            //leave it unhandled for now
        })

        var listenerID = global.streams.listenerTunedIn(req.params[0], req.ip, req.headers["user-agent"], Math.round((new Date()).getTime() / 1000))

        req.connection.on("close", function() {
            if (req !== null) {
                global.streams.listenerTunedOut(req.params[0], listenerID)
                stream.removeListener("data", gotChunk);
                stream = null
                streamConf = null
                streamMeta = null
                req = null
                res = null
            }
        });

    })

    var servePLS = function(req, res) {
        var stream = req.params[0].split(".")[0]
        if (typeof stream === "undefined" || stream === "" || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }
        var pls = "[playlist]\n"
        pls += "numberofentries=1\n"
        pls += "File1=" + global.config.hostname + "/streams/" + stream + "\n"
        pls += "Title1=" + global.streams.getStreamConf(stream).name + "\n"
        pls += "Length1=-1" + "\n"
        pls += "version=2"

        res.setHeader("Content-Type", "audio/x-scpls")
        res.send(pls)
    }

    var serveM3U = function(req, res) {
        var stream = req.params[0].split(".")[0]
        if (typeof stream === "undefined" || stream === "" || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }

        res.setHeader("Content-Type", "audio/x-mpegurl")
        res.send(global.config.hostname + "/streams/" + stream)
    }

    var serveASX = function(req, res) {
        var stream = req.params[0].split(".")[0]
        if (typeof stream === "undefined" || stream === "" || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }
        var streamConf = global.streams.getStreamConf(stream)
        res.setHeader("Content-Type", "video/x-ms-asf")
        res.send("<asx version=\"3.0\"><title>"+ (streamConf.name || "Unknown stream") +"</title><entry><title>"+ (streamConf.name || "Unknown stream") +"</title><ref href=\""+global.config.hostname + "/streams/" + stream+"\" /></entry></asx>")
    }

    var serveM3U8 = function(req, res) {
        var stream = req.params[0].split(".")[0]
        if (typeof stream === "undefined" || stream === "" || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }

        if (!req.query.id || !global.streams.listenerIdExists(stream, req.query.id, req.ip, req.headers["user-agent"])){
            var listenerID = global.streams.listenerTunedIn(stream, req.ip, req.headers["user-agent"], Math.round((new Date()).getTime() / 1000), true)
            if (!global.streams.hlsLastHit[req.params.stream]){
                global.streams.hlsLastHit[stream] = {}
            }
            global.streams.hlsLastHit[stream][listenerID] = Math.round((new Date()).getTime() / 1000)
            return res.redirect("/streams/" + stream + ".m3u8?id=" + listenerID);
        }

        global.streams.hlsLastHit[stream][req.query.id] = Math.round((new Date()).getTime() / 1000)
        res.setHeader("Content-Type", "audio/x-mpegurl")
        var response = "#EXTM3U\n#EXT-X-VERSION:5\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:"+global.streams.hlsDeleteCount[stream]+"\n"
        for (var id in global.streams.hlsIndexes[stream]){
            response+="#EXTINF:2.0,\n" + global.config.hostname + "/hls/"+stream+"/"+global.streams.hlsIndexes[stream][id]+"?id=" + req.query.id + "\n"
        }
        res.send(response)
    }

}

module.exports = httpHandler
