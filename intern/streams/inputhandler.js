var input=require("../inputParser/input.js")

var Server=function(conf){
    for (var id in conf.streams){
        if (conf.streams.hasOwnProperty(id)){
            global.streams.configFileInfo[conf.streams[id].stream]=conf.streams[id]
            global.streams.streamPasswords[conf.streams[id].password]=conf.streams[id].stream
            global.streams.streamID[id]=conf.streams[id].stream
            if (conf.streams[id].primary){
                global.streams.primaryStream=conf.streams[id].stream
            }
        }
    }
    input.SHOUTcastListener(conf.input.SHOUTcast)
}

module.exports=Server