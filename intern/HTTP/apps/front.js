var jade = require('jade');
var fs=require("fs")
var express=require("express")

var indexPage=jade.compile(fs.readFileSync(global.localdir+"/public/index.jade"));

module.exports=function(app){
    app.get("/",function(req, res) {
        //Index page
        var streams=global.streams.getActiveStreams()
        if (streams.length>0){
            var stream;
            if (global.streams.isStreamInUse(global.streams.primaryStream)){
                stream=global.streams.primaryStream
            }else{
                stream=streams[0]
            }
            
            var meta=global.streams.getStreamMetadata(stream)
            if (typeof meta ==="undefined"){
                meta={}
            }
            
            res.send(indexPage({isStreaming:true,streamInfo:global.streams.getStreamConf(stream),meta:meta,streams:streams,currentStream:stream,listencount:global.streams.numberOfListerners(stream),hostname:global.config.hostname}))
        }else{
            res.send(indexPage({isStreaming:false}))
        }
        
    })
    
    app.get('/pub/*',function(req, res) {
        if (typeof req.params[0] === "undefined" || !global.streams.isStreamInUse(req.params[0])){
            res.send(indexPage({isStreaming:false,streams:global.streams.getActiveStreams()}))
        }else{
            var meta=global.streams.getStreamMetadata(req.params[0])
            if (typeof meta ==="undefined"){
                meta={}
            }
            res.send(indexPage({isStreaming:true,streamInfo:global.streams.getStreamConf(req.params[0]),meta:meta,streams:global.streams.getActiveStreams(),currentStream:req.params[0],listencount:global.streams.numberOfListerners(req.params[0]),hostname:global.config.hostname}))
        }
    })
    
    //serve static
    app.use('/static', express.static(global.localdir + '/public/static'));
}