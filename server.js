var colors = require('colors'),
    wait = require("wait.for")

console.log("Cast 1.0 ".rainbow + "Beta 1".inverse);
global.localdir = __dirname
global.cast = {
        version: '1.0'
    } //defining build specific info

var fs = require('fs');
global.config = JSON.parse(fs.readFileSync(global.localdir + '/config.json', 'utf8'));

var loadCast = function() {
    global.app = require("./intern/HTTP/server.js");
    global.hooks = require("./hooks/hooks.js")
    global.hooks.loadModules()
}


if (global.config.startUpScript) { //run a script before going on eg. to load the configuration from a network disk
    wait.launchFiber(function() {
        var start = require(global.localdir + "/start.js")
        wait.for(start)
        loadCast()
    })
}else{
    loadCast()
}


