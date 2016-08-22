events.on("metadata", (meta) => {
    if (!meta) {
        return
    }
    io.emit("metadata", meta);
});

events.on("listenerTunedIn", (list) => {
    if (!list) {
        return
    }
    setTimeout(() => {
        io.emit("listenerCountChange", {
            stream: list.stream,
            count: streams.numberOfListerners(list.stream),
        });
    }, 100);
});

events.on("listenerTunedOut", (list) => {
    if (!list) {
        return
    }
    setTimeout(() => {
        io.emit("listenerCountChange", {
            stream: list.stream,
            count: streams.numberOfListerners(list.stream),
        });
    }, 100);
});
