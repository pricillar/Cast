global.hooks.add("metadata",function(meta){
    console.log("Debug hook: metadata update")
    console.log(meta.song+" on "+meta.stream)
})

global.hooks.add("addStream",function(stream) {
    console.log(stream+" started sending input")
})

global.hooks.add("listenerTunedIn",function(list) {
    console.log(list.ip+" tuned in")
})
global.hooks.add("listenerTunedOut",function(list) {
    console.log(list.ip+" tuned out")
})