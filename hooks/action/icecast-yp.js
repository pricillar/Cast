var rest = require("restler")

var directories = ["http://dir.xiph.org/cgi-bin/yp-cgi", "http://yp.shoutcast.com"]
    //var directories = []
var dirInfo = {} //{stream:{"dirurl":{info}}}

var sendRequest = function(host, data, callback) {
    rest.post(host, {
        headers: {
            "User-Agent": "Icecast 2.4.1" //Lie about your identity to let you in
        },
        timeout: 10000,
        data: data
    }).on('complete', function(body, response) {
        callback(null, response.headers)
    }).on('timeout', function() {
        callback("timed out")
    });
}

var addToDir = function(stream) {
    var info = global.streams.getStreamConf(stream)
    var hostname;

    if (global.config.hostname.split(":") === 3) { //if a non standard port is used
        hostname = global.config.hostname
    } else {
        if (global.config.hostname.indexOf("https://") === -1) {
            hostname = global.config.hostname + ":80"
        } else {
            hostname = global.config.hostname + ":443"
        }
    }
    for (var id in directories) {
        if (directories.hasOwnProperty(id)) {

            sendRequest(directories[id], {
                action: "add",
                sn: info.name,
                type: info.type,
                genre: info.genre,
                b: info.bitrate.toString(), //This is serious, see https://wiki.xiph.org/Icecast_Server/YP-protocol-v2
                listenurl: hostname + "/streams/" + stream,
                url: info.url
            }, function(err, res) {
                if (err) {
                    return
                }
                if (res.ypresponse === '1') {
                    if (typeof dirInfo[stream] === "undefined") {
                        dirInfo[stream] = {}
                    }
                    var touchfreq = parseInt(res.touchfreq)
                    if (isNaN(touchfreq)) {
                        return
                    }
                    dirInfo[stream][directories[id]] = {
                        sid: res.sid,
                        TouchFreq: touchfreq
                    }
                    touchDir(stream, directories[id])
                    setInterval(function() {
                        touchDir(stream, directories[id])
                    }, touchfreq * 1000)
                }
            })
        }
    }
}

var touchDir = function(stream, dir) {
    if (typeof dirInfo[stream] === "undefined" || typeof dirInfo[stream][dir] === "undefined") {
        return
    }
    sendRequest(dir, {
        action: "touch",
        sid: dirInfo[stream][dir].sid,
        st: global.streams.getStreamMetadata(stream).song || "",
        listeners: global.streams.numberOfListerners(stream)
    }, function(err, res) {
        if (err){
            console.log(err)
            return
        }
        if (res.ypresponse === '0') {
            console.log({
                action: "touch",
                sid: dirInfo[stream][dir].sid,
                st: global.streams.getStreamMetadata(stream).song || "",
                listeners: global.streams.numberOfListerners(stream)
            })
            console.log(res)
        }
    })
}

var touchDirForStream = function(stream) {
    if (typeof dirInfo[stream] === "undefined") {
        return
    }

    for (var dir in dirInfo[stream]) {
        if (dirInfo[stream].hasOwnProperty(dir)) {
            touchDir(stream, dir)
        }
    }
}

var removeFromDir = function(stream) {
    if (typeof dirInfo[stream] === "undefined") {
        return
    }

    for (var dir in dirInfo[stream]) {
        if (dirInfo[stream].hasOwnProperty(dir)) {
            sendRequest(dir, {
                action: "remove",
                sid: dirInfo[stream][dir].sid,
            }, function(err, res) {})
        }
    }
}


global.hooks.add("addStream", function(stream) {
    addToDir(stream)
})

global.hooks.add("removeStream",function(stream) {
    removeFromDir(stream)
})

global.hooks.add("metadata", function(meta) {
    touchDirForStream(meta.stream)
})

global.hooks.add("listenerTunedIn", function(list) {
    touchDirForStream(list.stream)
})

global.hooks.add("listenerTunedOut", function(list) {
    touchDirForStream(list.stream)
})