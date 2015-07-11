module.exports = function(app) {

    app.get("/status-json.xsl", function(req, res) {
        var streams = global.streams.getActiveStreams()
        var iceStreams = []
        for (var id in streams) {
            if (streams.hasOwnProperty(id)) {
                iceStreams.push({
                    "audio_info": "bitrate=" + (global.streams.getStreamConf(streams[id]).bitrate || 0) + ";",
                    "bitrate": global.streams.getStreamConf(streams[id]).bitrate || 0,
                    "channels": 2, //we guess so
                    "genre": global.streams.getStreamConf(streams[id]).genre,
                    "listener_peak": global.streams.numberOfListerners(streams[id]),
                    "listeners": global.streams.numberOfListerners(streams[id]),
                    "listenurl": global.config.hostname + "/streams/" + streams[id],
                    "samplerate": 44100, //we guess
                    "server_description": "",
                    "server_name": global.streams.getStreamConf(streams[id]).name || "",
                    "server_type": global.streams.getStreamConf(streams[id]).type || "",
                    "server_url": global.streams.getStreamConf(streams[id]).url || "",
                    "stream_start": "Fri, 03 Jul 2015 13:13:18 -0400", //leaving that for now
                    "stream_start_iso8601": "2015-07-03T13:13:18-0400", //leaving that for now
                    "title": global.streams.getStreamMetadata(streams[id]).song || "",
                    "dummy": null
                })
            }
        }

        if (iceStreams.length === 1) {
            iceStreams = iceStreams[0]
        }

        res.json({
            "icestats": {
                "admin": "cast@shoutca.st",
                "host": global.config.hostname.replace("http://", "").replace("https://", ""),
                "location": "Cloud", //Why?
                "server_id": "Cast 1.0",
                "server_start": "Fri, 03 Jul 2015 09:09:19 -0400", //leaving that for now
                "server_start_iso8601": "2015-07-03T09:09:19-0400", //leaving that for now
                "source": iceStreams
            }
        })

    })
}