var stream = require('stream')
var _ = require("underscore")
if (typeof global.config.geoservices !== "undefined" && global.config.geoservices.enabled && typeof global.maxmind === "undefined") {
    global.maxmind = require("maxmind")
    if (!global.maxmind.init(global.config.geoservices.maxmindDatabase)) {
        console.log("Error loading Maxmind Database")
    }
}

var configFileInfo = {} //{streamname:conf}
var streamID = {} //id:streamname
var inputStreams = {} //{streamname:stream}
var streams = {} //{streamname:stream}
var streamConf = {} //{streamname:{conf}}
var streamPasswords = {} //{pass:Stream}
var streamMetadata = {} //{streamname:{Meta}}
var streamPastMetadata = {} //{streamname:[{Meta}]}
var streamListeners = {} //{stream:[{listener}]}
var streamPreBuffer = {} //{stream:prebuffer}
var rateLimitBuffer = {} //{stream:[buffers]}
var rateLimitingIsEnabled = false
var primaryStream = ""

if (global.config.hls) {
    var hlsBuffer = {} //{stream:[buffers]}
    var hlsPool = {} //{stream:{unixtime:song data}}
    var hlsIndexes = {} //{stream:[indexes]}
}

var streamExists = function(streamname) {
    if (streams.hasOwnProperty(streamname) && stream[streamname] !== null) {
        return true
    } else {
        return false
    }
}


/*
    Conf
    {
        stream: "streamname",
        name: "Stream Name",
        type: "Audio type in file Content-Type format eg. audio/mpeg"
    }
*/
var addStream = function(inputStream, conf) {
    conf.name = conf.name || 'Not available';
    streamPreBuffer[conf.stream] = []

    var throttleStream = stream.PassThrough();
    throttleStream.setMaxListeners(10000); //set soft max to prevent leaks
    streams[conf.stream] = throttleStream
    streamConf[conf.stream] = conf
    inputStreams[conf.stream] = inputStream

    if (typeof global.config.rateLimiting === "undefined" || global.config.rateLimiting) {
        rateLimitingIsEnabled = true

        inputStreams[conf.stream].on("data", function(chunk) {
            if (typeof rateLimitBuffer[conf.stream] === "undefined") {
                rateLimitBuffer[conf.stream] = []
            }
            rateLimitBuffer[conf.stream].push(chunk)
        });

        var rateLimitInterval = setInterval(function() {
            throttleStream.write(Buffer.concat(rateLimitBuffer[conf.stream]))
            rateLimitBuffer[conf.stream] = []
        }, 500)
    } else {
        inputStream.pipe(throttleStream);
    }

    if (global.config.hls){
        inputStreams[conf.stream].on("data", function(chunk) {
            if (typeof hlsBuffer[conf.stream] === "undefined") {
                hlsBuffer[conf.stream] = []
            }
            hlsBuffer[conf.stream].push(chunk)
        });
        var hlsInterval = setInterval(function() {
            var now = new Date().getTime()
            if (!hlsPool[conf.stream]){
                hlsPool[conf.stream] = {}
            }
            if (!hlsIndexes[conf.stream]){
                hlsIndexes[conf.stream] = []
            }
            hlsPool[conf.stream][now]=(Buffer.concat(hlsBuffer[conf.stream]))
            hlsIndexes[conf.stream].push(now)
            if (hlsIndexes[conf.stream].length>4){
                hlsIndexes[conf.stream] = hlsIndexes[conf.stream].slice(0,1)
            }
            hlsBuffer[conf.stream] = []
            for (var id in hlsPool[conf.stream]){
                if (id <= now - (5000*20)){
                    delete hlsPool[conf.stream][id]
                }
            }
        }, 5000)
    }


    throttleStream.on("data", function(chunk) {
        var newPreBuffer = []
        var currentLength = streamPreBuffer[conf.stream].length
        for (var i = (rateLimitingIsEnabled ? 10 : 100); i > 0; i--) {
            if (streamPreBuffer[conf.stream].hasOwnProperty(currentLength - i)) {
                newPreBuffer.push(streamPreBuffer[conf.stream][currentLength - i])
            }
        }
        newPreBuffer.push(chunk)
        streamPreBuffer[conf.stream] = newPreBuffer
    })

    inputStreams[conf.stream].on("end", function(chunk) {
        streamPreBuffer[conf.stream] = ""
        if (rateLimitingIsEnabled) {
            rateLimitBuffer[conf.stream] = []
            clearInterval(rateLimitInterval)
            clearInterval(hlsInterval)
        }
    })

    inputStreams[conf.stream].on("error", function(chunk) {

    })

    global.hooks.runHooks("addStream", conf.stream)

}

var getStream = function(streamname) {
    return streams[streamname]
}

var getStreamConf = function(streamname) {
    return streamConf[streamname]
}

var removeStream = function(stream) {
    streams = _.omit(streams, stream)
    streamConf = _.omit(streamConf, stream)
    streamMetadata = _.omit(streamMetadata, stream)
    streamListeners = _.omit(streamListeners, stream)
    global.hooks.runHooks('removeStream', stream)
}

var isStreamInUse = function(stream) {
    return streams.hasOwnProperty(stream)
}

var getStreamMetadata = function(stream) {
    return streamMetadata[stream] || {}
}

var setStreamMetadata = function(stream, data) {
    data.time = Math.round((new Date()).getTime() / 1000)
    streamMetadata[stream] = data
    if (typeof streamPastMetadata[stream] === "undefined") {
        streamPastMetadata[stream] = [data]
    } else {
        var newMeta = []
        newMeta.push(data)
        for (var i = 0; i < 19; i++) {
            if (streamPastMetadata[stream].hasOwnProperty(i)) {
                newMeta.push(streamPastMetadata[stream][i])
            }
        }
        streamPastMetadata[stream] = newMeta
        newMeta = null
    }
    data.stream = stream
    global.hooks.runHooks("metadata", data)
}

var getActiveStreams = function() {
    var returnStreams = []
    for (var id in streams) {
        if (streams.hasOwnProperty(id)) {
            returnStreams.push(id)
        }
    }
    returnStreams.sort()
    returnStreams.sort(function(a, b) {
        return (a.replace(/\D/g, '')) - (b.replace(/\D/g, ''));
    })
    return returnStreams
}

var listenerTunedIn = function(stream, ip, client, starttime) {
    if (typeof streamListeners[stream] === "undefined") {
        streamListeners[stream] = []
    }

    var info = {
        stream: stream,
        ip: ip,
        client: client,
        starttime: starttime
    }

    if (typeof global.config.geoservices !== "undefined" && global.config.geoservices.enabled) {
        var ipInfo = global.maxmind.getLocation(ip)
        if (ipInfo !== null) {
            info.country = ipInfo.countryName
            info.location = {
                "latitude": ipInfo.latitude,
                "longitude": ipInfo.longitude
            }
        }
    }
    global.hooks.runHooks("listenerTunedIn", info)
    return streamListeners[stream].push(info) - 1
}

var listenerTunedOut = function(stream, id) {
    if (typeof id === "number" && typeof streamListeners[stream] !== "undefined") {
        global.hooks.runHooks("listenerTunedOut", {
            stream: stream,
            ip: streamListeners[stream][id].ip,
            client: streamListeners[stream][id].client,
            starttime: streamListeners[stream][id].starttime
        })
        delete streamListeners[stream][id]
    }
}

var getListeners = function(stream) {
    if (typeof streamListeners[stream] === "undefined") {
        return []
    } else {
        return _.without(streamListeners[stream], undefined)
    }
}

var getUniqueListeners = function(stream) {
    if (typeof streamListeners[stream] === "undefined") {
        return []
    }
    var listeners = getListeners(stream)
    var listenersWithUniqueCriteria = []

    for (var id in listeners) {
        if (listeners.hasOwnProperty(id)) {
            listenersWithUniqueCriteria.push({
                stream: listeners[id].stream,
                client: listeners[id].client,
                ip: listeners[id].ip
            })
        }
    }

    var uniqueListeners = []

    for (var id in listenersWithUniqueCriteria) {
        if (listenersWithUniqueCriteria.hasOwnProperty(id)) {
            if (listenersWithUniqueCriteria.indexOf(listenersWithUniqueCriteria[id]) === id) {
                uniqueListeners.push(listeners[id])
            }
        }
    }

    return uniqueListeners
}

var numberOfListerners = function(stream) {
    return getListeners(stream).length
}

var numberOfUniqueListerners = function(stream) {
    return getListeners(stream).length
}

var getPreBuffer = function(stream) {
    return streamPreBuffer[stream]
}

var getPastMedatada = function(stream) {
    return streamPastMetadata[stream]
}


var endStream = function(stream) {
    if (isStreamInUse(stream)) {
        inputStreams[stream].destroy();
    }
}

module.exports.addStream = addStream
module.exports.streamExists = streamExists
module.exports.getStream = getStream
module.exports.getStreamConf = getStreamConf
module.exports.streamPasswords = streamPasswords
module.exports.removeStream = removeStream
module.exports.isStreamInUse = isStreamInUse
module.exports.getStreamMetadata = getStreamMetadata
module.exports.setStreamMetadata = setStreamMetadata
module.exports.getActiveStreams = getActiveStreams
module.exports.primaryStream = primaryStream
module.exports.listenerTunedIn = listenerTunedIn
module.exports.listenerTunedOut = listenerTunedOut
module.exports.getListeners = getListeners
module.exports.getUniqueListeners = getUniqueListeners
module.exports.numberOfListerners = numberOfListerners
module.exports.numberOfUniqueListerners = numberOfUniqueListerners
module.exports.getPreBuffer = getPreBuffer
module.exports.getPastMedatada = getPastMedatada
module.exports.configFileInfo = configFileInfo
module.exports.streamID = streamID
module.exports.endStream = endStream
module.exports.hlsPool = hlsPool
module.exports.hlsIndexes = hlsIndexes
