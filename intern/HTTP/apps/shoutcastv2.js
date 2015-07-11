var xml = require('xml');

module.exports = function(app) {

    app.get("/currentsong", function(req, res) {
        var stream = sidToStream(req.query.sid)

        if (global.streams.isStreamInUse(stream)) {
            res.send(global.streams.getStreamMetadata(stream).song || "")
        } else {
            res.send('')
        }

    })

    app.get("/statistics", function(req, res) {
        var mode = 'xml'
        if (req.query.json == 1) {
            mode = 'json'
        }
        var generalInfo = {
            "totalstreams": global.config.streams.length,
            "activestreams": global.streams.getActiveStreams().length,
            "currentlisteners": 0, //TO DO: Calculate this
            "peaklisteners": 0, //Currently not recorded
            "maxlisteners": 999999, //Max??? Why limit that?
            "uniquelisteners": 0, //TO DO: calculate this
            "averagetime": 0, //Any idea what this means?
            "version": global.cast.version+" (V8 (Node.JS))",
        }
        var streamInfo = []
        var streams = global.streams.getActiveStreams()
        for (var id in streams) {
            if (streams.hasOwnProperty(id)) {
                streamInfo.push({
                    "id": id, // again we should assign numbers
                    "currentlisteners": global.streams.numberOfListerners(streams[id]),
                    "peaklisteners": global.streams.numberOfListerners(streams[id]), //Shall we record this?
                    "maxlisteners": 9999999, //not again...
                    "uniquelisteners": global.streams.numberOfListerners(streams[id]), //Maybe we should perfect this a bit, fingerprinting?
                    "averagetime": 0, //Again, what is this?
                    "servergenre": global.streams.getStreamConf(streams[id]).genre,
                    "servergenre2": "", //We'll probably never support this
                    "servergenre3": "",
                    "servergenre4": "",
                    "servergenre5": "",
                    "serverurl": global.streams.getStreamConf(streams[id]).url || "",
                    "servertitle": global.streams.getStreamConf(streams[id]).name || "",
                    "songtitle": global.streams.getStreamMetadata(streams[id]).song || "",
                    "streamhits": 0, //What if my server is top 40?? got it?
                    "streamstatus": 1, //Yeah DUH
                    "backupstatus": 0, //We got no fallback
                    "streamlisted": 1, //Unable to tell with our YP mechanism
                    "streamlistederror": 200, //idem
                    "streampath": "/streams/" + streams[id],
                    "streamuptime": 0, //not logged
                    "bitrate": global.streams.getStreamConf(streams[id]).bitrate || 0,
                    "samplerate": 44100, //not logged
                    "content": global.streams.getStreamConf(streams[id]).type || "audio/mpeg"
                })
            }
        }

        if (mode === 'json') {
            generalInfo.streams = streamInfo
            res.json(generalInfo)
            return
        }

        var streamInfoXML = []

        for (var id in generalInfo) {
            if (generalInfo.hasOwnProperty(id)) {
                var obj = {}
                obj[id.toUpperCase()] = generalInfo[id]
                streamInfoXML.push(obj)
            }
        }

        for (var id in streamInfo) {
            var strInfo = [{
                        _attr: {
                            id: id
                        }}]
            for (var objid in streamInfo[id]) {
                var obj = {}
                obj[objid.toUpperCase()] = streamInfo[id][objid]
                strInfo.push(obj)
            }
            streamInfoXML.push({
                STREAM: strInfo
            })
        }

        //TO DO: look up how we can add multiple stream tags here
        res.setHeader("Content-Type", "text/xml")
        res.send(xml({
            SHOUTCASTSERVER: [{
                STREAMSTATS: streamInfoXML
            }]

        }))

    })

    app.get("/7.html", function(req, res) { //Personal option: WHY USE THIS????
        var stream = sidToStream(req.query.sid)
            //CURRENTLISTENERS,STREAMSTATUS,PEAKLISTENERS,MAXLISTENERS,UNIQUELISTENERS,BITRATE,SONGTITLE
        if (global.streams.isStreamInUse(stream)) {
            res.send(global.streams.numberOfListerners(stream).toString() + ",1," + global.streams.numberOfListerners(stream).toString() + ",99999," + global.streams.numberOfListerners(stream).toString() + "," + (global.streams.getStreamConf(stream).bitrate || "0") + "," + (global.streams.getStreamMetadata(stream).song || ""))
        } else {
            res.send("0,0,0,99999,0,0,")
        }
    })

}


var sidToStream = function(sid) {
    var stream
    if (typeof sid === "undefined") {
        stream = global.streams.primaryStream
    } else if (!isNaN(parseInt(sid))) {
        stream = global.streamID[parseInt(sid)]
    } else {
        stream = sid
    }
    return stream
}