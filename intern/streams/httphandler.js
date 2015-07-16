var icy = require('./icy')

var httpHandler = function(app) {

    if (typeof global.streams === "undefined") {
        global.streams = require("./streams.js")
    }

    if (typeof app === "undefined") {
        return
    }

    app.get("/streams/*", function(req, res) {
        if (typeof req.params[0] === "undefined" || req.params[0] === "") {
            res.status(404).send("Stream not found")
            return
        }
        
        if (req.params[0].split(".").length > 1){
            if (req.params[0].split(".")[1]==="pls"){
                servePLS(req,res)
                return
            }
            if (req.params[0].split(".")[1]==="m3u"){
                serveM3U(req,res)
                return
            }
        }
        
        if (!global.streams.streamExists(req.params[0])){
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
            "X-Begin": "Thu, 30 Jan 2014 20:40:00 GMT",
            "Cache-Control": "no-cache",
            "Expires": "Sun, 9 Feb 2014 15:32:00 GMT"
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
            res.queueMetadata({StreamTitle:meta.song || streamConf.name || streamConf.name,StreamUrl:""});
        }


        var gotChunk = function(chunk) {
            var meta = streamMeta(req.params[0])
            if (req.headers['icy-metadata'] == 1 && typeof meta !== "undefined" && typeof meta.song === "string" && prevMetadata != meta.song) {
                res.queueMetadata({StreamTitle:meta.song || streamConf.name,StreamUrl:""});
                prevMetadata = meta.song;
            }
            res.write(chunk);
        };
        for (var id in global.streams.getPreBuffer(req.params[0])){
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
            if (req !== null){
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
    
    var servePLS=function(req, res) {
        var stream=req.params[0].split(".")[0]
        if (typeof stream === "undefined" || stream === "" || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }
        var pls="[playlist]\n"
        pls+="numberofentries=1\n"
        pls+="File1="+global.config.hostname+"/streams/"+stream+"\n"
        pls+="Title1="+global.streams.getStreamConf(stream).name+"\n"
        pls+="Length1=-1"+"\n"
        pls+="version=2"
        
        res.setHeader("Content-Type","audio/x-scpls")
        res.send(pls)
    }
    
    var serveM3U=function(req, res) {
        var stream=req.params[0].split(".")[0]
        if (typeof stream === "undefined" || stream === "" || !global.streams.streamExists(stream)) {
            res.status(404).send("Stream not found")
            return
        }
        
        res.setHeader("Content-Type","audio/x-mpegurl")
        res.send(global.config.hostname+"/streams/"+stream)
    }

}

module.exports = httpHandler