var SHOUTcast=require("./shoutcast.js")
var metadata=require("./metadata.js")

var SHOUTcastListener=function(port){
    metadata.listenOn(port)
    SHOUTcast.listenOn(port+1)
}

module.exports.SHOUTcastListener=SHOUTcastListener