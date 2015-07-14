global.hooks.add("metadata", function(meta) {
    global.io.emit("metadata",meta)
})

global.hooks.add("listenerTunedIn", function(list) {
    setTimeout(function(){
        global.io.emit("listenerCountChange",{stream:list.stream,count:global.streams.numberOfListerners(list.stream)})
    },100)
})

global.hooks.add("listenerTunedOut", function(list) {
    setTimeout(function(){
        global.io.emit("listenerCountChange",{stream:list.stream,count:global.streams.numberOfListerners(list.stream)})
    },100)
})