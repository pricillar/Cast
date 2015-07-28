global.hooks.add('metadata', function onMetadataChange (meta) {
    global.io.emit('metadata', meta);
});

global.hooks.add('listenerTunedIn', function onTunein (list) {
    setTimeout(function () {
        global.io.emit('listenerCountChange', {
            stream: list.stream,
            count: global.streams.numberOfListerners(list.stream)
        });
    }, 100);
});

global.hooks.add('listenerTunedOut', function onTuneout (list) {
    setTimeout(function () {
        global.io.emit('listenerCountChange', {
            stream: list.stream,
            count: global.streams.numberOfListerners(list.stream)
        });
    }, 100);
});
