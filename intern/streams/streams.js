var http = require('http'),
    stream = require('stream'),
    _ = require("underscore"),
    exec = require("exec-stream"),
    spawn = require("child_process").spawn

var configFileInfo = {} //{streamname:conf}
var streamID = {} //id:streamname
var streams = {} //{streamname:stream}
var streamConf = {} //{streamname:{conf}}
var streamPasswords = {} //{pass:Stream}
var streamMetadata = {} //{streamname:{Meta}}
var streamPastMetadata = {} //{streamname:[{Meta}]}
var streamListeners = {} //{stream:[{listener}]}
var streamPreBuffer = {} //{stream:prebuffer}
var primaryStream = ""

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
    inputStream.pipe(throttleStream);
    streams[conf.stream] = throttleStream
    streamConf[conf.stream] = conf

    streams[conf.stream].on("data", function(chunk) {
        var newPreBuffer = []
        var currentLength = streamPreBuffer[conf.stream].length
        for (var i = 100; i > 0; i--) {
            if (streamPreBuffer[conf.stream].hasOwnProperty(currentLength - i)) {
                newPreBuffer.push(streamPreBuffer[conf.stream][currentLength - i])
            }
        }
        newPreBuffer.push(chunk)
        streamPreBuffer[conf.stream] = newPreBuffer
    });

    streams[conf.stream].on("end", function(chunk) {
        streamPreBuffer[conf.stream] = ""
    })

    streams[conf.stream].on("error", function(chunk) {

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
        return (a.replace(/\D/g,'')) - (b.replace(/\D/g,''));
    })
    return returnStreams
}

var listenerTunedIn = function(stream, ip, client, starttime) {
    if (typeof streamListeners[stream] === "undefined") {
        streamListeners[stream] = []
    }
    global.hooks.runHooks("listenerTunedIn", {
        stream: stream,
        ip: ip,
        client: client,
        starttime: starttime
    })
    return streamListeners[stream].push({
        ip: ip,
        client: client,
        starttime: starttime
    }) - 1
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

var numberOfListerners = function(stream) {
    return getListeners(stream).length
}

var getPreBuffer = function(stream) {
    return streamPreBuffer[stream]
}

var getPastMedatada = function(stream) {
    return streamPastMetadata[stream]
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
module.exports.numberOfListerners = numberOfListerners
module.exports.getPreBuffer = getPreBuffer
module.exports.getPastMedatada = getPastMedatada
module.exports.configFileInfo = configFileInfo
module.exports.streamID = streamID