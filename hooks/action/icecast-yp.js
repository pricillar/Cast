var rest = require('restler');

var directories = global.config.directories.Icecast;

var dirInfo = {}; // { stream: { dirurl: info } }

var sendRequest = function sendRequest (host, data, callback) {
    rest.post(host, {
        headers: {
            'User-Agent': 'Icecast 2.4.1' // Lie about your identity to let you in
        },
        timeout: 10000,
        data: data
    }).on('complete', function (body, response) {
        if (response === null) {
            return callback(new Error('Got an invalid response'));
        }
        callback(null, response.headers);
    }).on('timeout', function() {
        callback(new Error('Request timed out'));
    });
};

var addToDir = function addToDirectory (stream) {
    var info = global.streams.getStreamConf(stream);
    var hostname;

    if (global.config.hostname.split(':') === 3) { // if a non standard port is used
        hostname = global.config.hostname;
    } else {
        var port = (global.config.hostname.indexOf('https://') !== -1) ? 443 : 80;
        hostname = global.config.hostname + ':' + port;
    }

    var sendRequestToDirectory = function sendRequestToDirectory (directory) {
        sendRequest(directory, {
            action: 'add',
            sn: info.name,
            type: info.type,
            genre: info.genre,
            b: info.bitrate.toString(), //This is serious, see https://wiki.xiph.org/Icecast_Server/YP-protocol-v2
            listenurl: hostname + '/streams/' + stream,
            url: info.url
        }, function (err, res) {
            if (err) {
                return;
            }
            if (res.ypresponse === '1') {
                if (typeof dirInfo[stream] === 'undefined') {
                    dirInfo[stream] = {};
                }
                var touchfreq = parseInt(res.touchfreq);
                if (isNaN(touchfreq)) {
                    return;
                }
                dirInfo[stream][directory] = {
                    sid: res.sid,
                    TouchFreq: touchfreq
                };
                touchDir(stream, directory);
                setInterval(function () {
                    touchDir(stream, directory);
                }, touchfreq * 1000);
            }
        });
    };

    for (var i = 0; i < directories.length; i++) {
        sendRequestToDirectory(directories[i]);
    }

};

var touchDir = function touchDirectory (stream, dir) {
    if (typeof dirInfo[stream] === 'undefined' || typeof dirInfo[stream][dir] === 'undefined') {
        return;
    }

    sendRequest(dir, {
        action: 'touch',
        sid: dirInfo[stream][dir].sid,
        st: global.streams.getStreamMetadata(stream).song || '',
        listeners: global.streams.numberOfListerners(stream)
    }, function (err, res) {
        if (err) {
            return console.error(err);
        }
        if (res.ypresponse === '0') {
            console.log({
                action: 'touch',
                sid: dirInfo[stream][dir].sid,
                st: global.streams.getStreamMetadata(stream).song || '',
                listeners: global.streams.numberOfListerners(stream)
            });
            console.log(res);
        }
    });
};

var touchDirForStream = function touchDirectoryForStream (stream) {
    if (typeof dirInfo[stream] === 'undefined') {
        return;
    }

    for (var i = 0; i < dirInfo[stream].length; i++) {
        touchDir(stream, dirInfo[stream][i]);
    }
};

var removeFromDir = function removeFromDirectory (stream) {
    if (typeof dirInfo[stream] === 'undefined') {
        return;
    }

    for (var dir in dirInfo[stream]) {
        if (dirInfo[stream].hasOwnProperty(dir)) {
            sendRequest(dir, {
                action: 'remove',
                sid: dirInfo[stream][dir].sid,
            }, function () {});
        }
    }
};


global.hooks.add('addStream', function onStreamAdded (stream) {
    addToDir(stream);
});

global.hooks.add('removeStream', function onStreamRemoved (stream) {
    removeFromDir(stream);
});

global.hooks.add('metadata', function onMetadataChange (meta) {
    touchDirForStream(meta.stream);
});

global.hooks.add('listenerTunedIn', function onTunein (list) {
    touchDirForStream(list.stream);
});

global.hooks.add('listenerTunedOut', function onTuneout (list) {
    touchDirForStream(list.stream);
});
